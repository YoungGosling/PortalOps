from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from app.db.database import get_db
from app.core.deps import get_current_active_user, get_user_roles
from app.models.user import User
from app.models.service import Service, Product
from app.models.user import User as UserModel
from app.models.payment import PaymentInfo
from app.models.audit import AuditLog
from app.models.workflow import WorkflowTask
from app.crud.payment import payment_info

router = APIRouter()


@router.get("/stats")
def get_dashboard_stats(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get dashboard statistics including total services, products, users, total amount, and incomplete payments.
    """
    user_roles = get_user_roles(current_user.id, db)  # type: ignore
    is_admin = "Admin" in user_roles

    # Get counts based on user role
    if is_admin:
        # Admin sees all data
        total_services = db.query(Service).count()
        total_products = db.query(Product).count()
        total_users = db.query(UserModel).count()
    else:
        # ServiceAdmin sees only their assigned services and products
        from app.models.permission import PermissionAssignment

        # Get assigned service IDs
        service_assignments = db.query(PermissionAssignment).filter(
            PermissionAssignment.user_id == current_user.id,
            PermissionAssignment.service_id.isnot(None)
        ).all()
        assigned_service_ids = [a.service_id for a in service_assignments]

        # Count services user has access to
        total_services = len(assigned_service_ids)

        # Count products under those services
        total_products = db.query(Product).filter(
            Product.service_id.in_(assigned_service_ids)
        ).count() if assigned_service_ids else 0

        # ServiceAdmin doesn't see user count
        total_users = 0

    # Get incomplete payment count and total amount (only for Admin)
    incomplete_payments = 0
    total_amount = 0
    if is_admin:
        incomplete_payments = payment_info.get_incomplete_count(db)
        # Calculate total amount from all payment records
        amount_sum = db.query(func.sum(PaymentInfo.amount)).filter(
            PaymentInfo.amount.isnot(None)
        ).scalar()
        total_amount = float(amount_sum) if amount_sum else 0

    return {
        "totalServices": total_services,
        "totalProducts": total_products,
        "totalUsers": total_users,
        "totalAmount": total_amount,
        "incompletePayments": incomplete_payments
    }


@router.get("/recent-activities")
def get_recent_activities(
    limit: int = Query(default=10, ge=1, le=100),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get recent activity logs from audit_logs table.
    Returns recent activities like user creation, workflow tasks, payment/product updates, etc.
    """
    # Query audit logs with actor information
    activities = db.query(AuditLog, UserModel.name).join(
        UserModel, AuditLog.actor_user_id == UserModel.id
    ).order_by(desc(AuditLog.created_at)).limit(limit).all()

    result = []
    for audit_log, actor_name in activities:
        result.append({
            "id": str(audit_log.id),
            "action": audit_log.action,
            "actorName": actor_name,
            "targetId": audit_log.target_id,
            "details": audit_log.details,
            "createdAt": audit_log.created_at.isoformat()
        })

    return result


@router.get("/upcoming-renewals")
def get_upcoming_renewals(
    limit: int = Query(default=3, ge=1, le=10),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get upcoming payment renewals - products with expiry dates closest to today.
    Returns products sorted by expiry_date (earliest first).
    """
    # Query products with payment info that have expiry dates
    renewals = db.query(
        Product, Service, PaymentInfo
    ).join(
        Service, Product.service_id == Service.id
    ).join(
        PaymentInfo, Product.id == PaymentInfo.product_id
    ).filter(
        PaymentInfo.expiry_date.isnot(None)
    ).order_by(
        PaymentInfo.expiry_date.asc()
    ).limit(limit).all()

    result = []
    for product, service, payment_info_record in renewals:
        result.append({
            "productId": str(product.id),
            "productName": product.name,
            "serviceName": service.name,
            "expiryDate": payment_info_record.expiry_date.strftime("%m/%d/%Y") if payment_info_record.expiry_date else None,
            "amount": float(payment_info_record.amount) if payment_info_record.amount else None,
            "cardholderName": payment_info_record.cardholder_name,
            "paymentMethod": payment_info_record.payment_method
        })

    return result


@router.get("/pending-tasks-count")
def get_pending_tasks_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get count of pending workflow tasks (onboarding/offboarding).
    Returns the count of tasks with status='pending'.
    """
    pending_count = db.query(func.count(WorkflowTask.id)).filter(
        WorkflowTask.status == 'pending'
    ).scalar()

    return {
        "pendingCount": pending_count or 0
    }
