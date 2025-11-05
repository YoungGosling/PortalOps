from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case, desc
from app.crud.base import CRUDBase
from app.models.payment import PaymentInfo, PaymentMethod
from app.models.service import Product, Service
from app.schemas.payment import PaymentInfoCreate, PaymentInfoUpdate
import uuid


class CRUDPaymentInfo(CRUDBase[PaymentInfo, PaymentInfoCreate, PaymentInfoUpdate]):
    def get(self, db: Session, id: uuid.UUID) -> Optional[PaymentInfo]:
        """Get payment info by payment id."""
        return db.query(PaymentInfo).filter(PaymentInfo.id == id).first()

    def get_by_product(self, db: Session, product_id: uuid.UUID) -> List[PaymentInfo]:
        """Get all payment records for a specific product, ordered by payment_date desc."""
        return db.query(PaymentInfo).filter(
            PaymentInfo.product_id == product_id
        ).order_by(desc(PaymentInfo.payment_date), desc(PaymentInfo.created_at)).all()

    def get_latest_by_product(self, db: Session, product_id: uuid.UUID) -> Optional[PaymentInfo]:
        """Get the latest payment record for a specific product."""
        return db.query(PaymentInfo).filter(
            PaymentInfo.product_id == product_id
        ).order_by(desc(PaymentInfo.payment_date), desc(PaymentInfo.created_at)).first()

    def create(self, db: Session, *, obj_in: PaymentInfoCreate) -> PaymentInfo:
        """Create payment info."""
        db_obj = PaymentInfo(**obj_in.dict())
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update(self, db: Session, *, db_obj: PaymentInfo, obj_in) -> PaymentInfo:
        """Update payment info."""
        if isinstance(obj_in, dict):
            update_data = obj_in
        else:
            update_data = obj_in.dict(exclude_unset=True)

        for field, value in update_data.items():
            setattr(db_obj, field, value)
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def get_payment_register(self, db: Session, skip: int = 0, limit: int = 100, search: Optional[str] = None) -> tuple[List[dict], int]:
        """Get all payment records for all products for the payment register (one-to-many).

        Returns a flat list where each payment record is a separate item.
        Multiple payments for the same product will appear as multiple items.
        Includes orphaned payment records (where product_id is NULL due to product deletion).

        Args:
            search: Optional search string to filter by product name (case-insensitive)

        Returns:
            tuple: (list of payment records, total count)
        """
        from app.models.payment import ProductStatus

        # Query all payments with their products and services
        # Use LEFT OUTER JOIN to include orphaned payments (product_id = NULL)
        base_query = db.query(PaymentInfo, Product, Service, ProductStatus).outerjoin(
            Product, PaymentInfo.product_id == Product.id
        ).outerjoin(
            Service, Product.service_id == Service.id
        ).outerjoin(
            ProductStatus, Product.status_id == ProductStatus.id
        )

        # Apply search filter if provided
        if search:
            base_query = base_query.filter(Product.name.ilike(f"%{search}%"))

        # Get total count
        total = base_query.count()

        # Apply ordering and pagination
        # Sort by status priority first (error=0, incomplete=1, complete=2),
        # then by payment_date (newest first), then by created_at (newest first)
        status_order = case(
            (PaymentInfo.status == 'error', 0),
            (PaymentInfo.status == 'incomplete', 1),
            (PaymentInfo.status == 'complete', 2),
            else_=3
        )

        payments_query = base_query.order_by(
            status_order,
            PaymentInfo.payment_date.desc().nulls_last(),
            PaymentInfo.created_at.desc()
        ).offset(skip).limit(limit).all()

        payment_register = []
        for payment, product, service, product_status in payments_query:
            # Get payment method name if available
            payment_method_name = None
            payment_method_description = None
            if payment.payment_method_id:
                payment_method = db.query(PaymentMethod).filter(
                    PaymentMethod.id == payment.payment_method_id
                ).first()
                if payment_method:
                    payment_method_name = payment_method.name
                    payment_method_description = payment_method.description

            # Format dates for frontend display (MM/DD/YYYY)
            formatted_expiry_date = None
            formatted_payment_date = None
            formatted_usage_start = None
            formatted_usage_end = None

            if payment.expiry_date:
                formatted_expiry_date = payment.expiry_date.strftime(
                    "%m/%d/%Y")
            if payment.payment_date:
                formatted_payment_date = payment.payment_date.strftime(
                    "%m/%d/%Y")
            if payment.usage_start_date:
                formatted_usage_start = payment.usage_start_date.strftime(
                    "%m/%d/%Y")
            if payment.usage_end_date:
                formatted_usage_end = payment.usage_end_date.strftime(
                    "%m/%d/%Y")

            payment_info_dict = {
                "id": str(payment.id),
                "status": payment.status,
                "amount": float(payment.amount) if payment.amount else None,
                "cardholderName": payment.cardholder_name,
                "expiryDate": formatted_expiry_date,
                "paymentMethod": payment_method_name,
                "paymentMethodId": payment.payment_method_id,
                "paymentMethodDescription": payment_method_description,
                "paymentDate": formatted_payment_date,
                "usageStartDate": formatted_usage_start,
                "usageEndDate": formatted_usage_end,
                "reporter": payment.reporter,
                "createdAt": payment.created_at.isoformat() if payment.created_at else None,
                "updatedAt": payment.updated_at.isoformat() if payment.updated_at else None
            }

            # Handle orphaned payments (product deleted)
            payment_register.append({
                "paymentId": str(payment.id),
                "productId": str(product.id) if product else None,
                "productName": product.name if product else None,
                "productDescription": product.description if product else None,
                "productStatus": product_status.name if product_status else None,
                "serviceName": service.name if service else None,
                "serviceVendor": service.vendor if service else None,
                "paymentInfo": payment_info_dict
            })

        # No need to sort here anymore - sorting is done at database level
        return payment_register, total

    def get_incomplete_count(self, db: Session) -> int:
        """Get count of incomplete payment records."""
        # Count actual incomplete payment records (not products)
        return db.query(func.count(PaymentInfo.id)).filter(
            PaymentInfo.status == 'incomplete'
        ).scalar() or 0

    def get_expiring_soon(self, db: Session, *, days_ahead: int = 30) -> List[PaymentInfo]:
        """Get payment info for products expiring within specified days."""
        from datetime import datetime, timedelta
        future_date = datetime.now().date() + timedelta(days=days_ahead)

        return db.query(PaymentInfo).filter(
            PaymentInfo.expiry_date.isnot(None),
            PaymentInfo.expiry_date <= future_date,
            PaymentInfo.expiry_date >= datetime.now().date()
        ).order_by(PaymentInfo.expiry_date).all()


payment_info = CRUDPaymentInfo(PaymentInfo)
