from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, desc
from datetime import datetime
from typing import Optional
from app.db.database import get_db
from app.core.deps import get_current_active_user, get_user_roles
from app.models.user import User
from app.models.service import Service, Product
from app.models.user import User as UserModel
from app.models.payment import PaymentInfo, Currency
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
    Get dashboard statistics - now only returns incomplete payments count.
    Services, products, and users counts have been removed.
    Use /currency-stats endpoint for currency-specific payment amounts.
    """
    user_roles = get_user_roles(current_user.id, db)  # type: ignore
    is_admin = "Admin" in user_roles

    # Get incomplete payment count (only for Admin)
    incomplete_payments = 0
    if is_admin:
        incomplete_payments = payment_info.get_incomplete_count(db)

    return {
        "totalServices": 0,  # Deprecated - kept for backward compatibility
        "totalProducts": 0,  # Deprecated - kept for backward compatibility
        "totalUsers": 0,  # Deprecated - kept for backward compatibility
        "totalAmount": 0,  # Deprecated - kept for backward compatibility
        "incompletePayments": incomplete_payments,
        "currencyAmounts": {}  # Deprecated - use /currency-stats endpoint instead
    }


@router.get("/currency-stats")
def get_currency_stats(
    currency_code: str = Query(..., description="Currency code (e.g., HKD, USD, EUR)"),
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get total amount for a specific currency with optional date range filtering.
    Date range is applied to payment_date field.
    """
    user_roles = get_user_roles(current_user.id, db)  # type: ignore
    is_admin = "Admin" in user_roles

    if not is_admin:
        return {"totalAmount": 0, "currencyCode": currency_code, "currencySymbol": None}

    # Get currency by code
    currency = db.query(Currency).filter(Currency.code == currency_code).first()
    if not currency:
        return {"totalAmount": 0, "currencyCode": currency_code, "currencySymbol": None}

    # Build query
    query = db.query(func.sum(PaymentInfo.amount)).filter(
        PaymentInfo.amount.isnot(None),
        PaymentInfo.currency_id == currency.id
    )

    # Apply date filters if provided
    if start_date:
        try:
            start = datetime.strptime(start_date, "%Y-%m-%d").date()
            query = query.filter(PaymentInfo.payment_date >= start)
        except ValueError:
            pass  # Ignore invalid date format

    if end_date:
        try:
            end = datetime.strptime(end_date, "%Y-%m-%d").date()
            query = query.filter(PaymentInfo.payment_date <= end)
        except ValueError:
            pass  # Ignore invalid date format

    amount_sum = query.scalar()
    total_amount = float(amount_sum) if amount_sum else 0

    return {
        "totalAmount": total_amount,
        "currencyCode": currency.code,
        "currencySymbol": currency.symbol
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
    Get upcoming payment renewals - products with usage end dates closest to expiring.
    Returns products sorted by usage_end_date (earliest first).
    Uses the latest payment record WITH usage_end_date for each product.
    """
    from app.models.payment import PaymentMethod

    # Get all products with their services
    products_query = db.query(Product, Service).join(
        Service, Product.service_id == Service.id
    ).all()

    renewals_list = []
    for product, service in products_query:
        # Get the latest payment WITH usage_end_date for this product
        # Priority: payment_date DESC, then created_at DESC
        latest_payment_with_end_date = db.query(PaymentInfo).filter(
            PaymentInfo.product_id == product.id,
            PaymentInfo.usage_end_date.isnot(None)
        ).order_by(
            desc(PaymentInfo.payment_date).nulls_last(),
            desc(PaymentInfo.created_at)
        ).first()

        if latest_payment_with_end_date:
            # Get payment method name if available
            payment_method_name = None
            if latest_payment_with_end_date.payment_method_id:
                payment_method = db.query(PaymentMethod).filter(
                    PaymentMethod.id == latest_payment_with_end_date.payment_method_id
                ).first()
                if payment_method:
                    payment_method_name = payment_method.name

            renewals_list.append({
                "productId": str(product.id),
                "productName": product.name,
                "serviceName": service.name,
                "expiryDate": latest_payment_with_end_date.usage_end_date.strftime("%m/%d/%Y"),
                "amount": float(latest_payment_with_end_date.amount) if latest_payment_with_end_date.amount else None,
                "cardholderName": latest_payment_with_end_date.cardholder_name,
                "paymentMethod": payment_method_name,
                "usage_end_date_sort": latest_payment_with_end_date.usage_end_date  # For sorting
            })

    # Sort by usage end date (earliest first) and limit
    renewals_list.sort(key=lambda x: x["usage_end_date_sort"])
    result = [
        {k: v for k, v in item.items() if k != "usage_end_date_sort"}
        for item in renewals_list[:limit]
    ]

    return result


@router.get("/pending-tasks-count")
def get_pending_tasks_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get count of pending workflow tasks (onboarding/offboarding).
    For admin users, returns the total count of all pending tasks (visible to all admins).
    For non-admin users, returns 0.
    """
    from app.core.deps import get_user_roles

    # Check if user is admin
    user_roles = get_user_roles(current_user.id, db)
    if "Admin" not in user_roles:
        return {"pendingCount": 0}

    # For admins, return total pending count (all admins see all tasks)
    pending_count = db.query(func.count(WorkflowTask.id)).filter(
        WorkflowTask.status == 'pending'
    ).scalar()

    return {
        "pendingCount": pending_count or 0
    }
