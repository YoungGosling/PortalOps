from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from app.crud.base import CRUDBase
from app.models.payment import PaymentInfo
from app.models.service import Product, Service
from app.schemas.payment import PaymentInfoCreate, PaymentInfoUpdate
import uuid


class CRUDPaymentInfo(CRUDBase[PaymentInfo, PaymentInfoCreate, PaymentInfoUpdate]):
    def get(self, db: Session, id: uuid.UUID) -> Optional[PaymentInfo]:
        """Get payment info by product_id (since product_id is the primary key)."""
        return db.query(PaymentInfo).filter(PaymentInfo.product_id == id).first()

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

    def get_payment_register(self, db: Session) -> List[dict]:
        """Get all products with their payment info for the payment register."""
        # Use a different approach - query products and their payment info separately
        results = db.query(Product, Service, PaymentInfo).join(
            Service, Product.service_id == Service.id
        ).outerjoin(
            PaymentInfo, Product.id == PaymentInfo.product_id
        ).order_by(
            # Sort incomplete first: NULL and 'incomplete' first, then 'complete'
            case(
                (PaymentInfo.status.is_(None), 0),
                (PaymentInfo.status == 'incomplete', 0),
                (PaymentInfo.status == 'complete', 1),
                else_=2
            ),
            Product.name
        ).all()

        payment_register = []
        for product, service, payment_info in results:
            # Format expiry_date for frontend display (MM/DD/YYYY)
            formatted_expiry_date = None
            if payment_info and payment_info.expiry_date:
                formatted_expiry_date = payment_info.expiry_date.strftime(
                    "%m/%d/%Y")

            payment_info_dict = {
                "status": payment_info.status if payment_info else "incomplete",
                "amount": payment_info.amount if payment_info else None,
                "cardholderName": payment_info.cardholder_name if payment_info else None,
                "expiryDate": formatted_expiry_date,
                "paymentMethod": payment_info.payment_method if payment_info else None
            }

            payment_register.append({
                "productId": product.id,
                "productName": product.name,
                "serviceName": service.name,
                "paymentInfo": payment_info_dict
            })

        return payment_register

    def get_incomplete_count(self, db: Session) -> int:
        """Get count of products with incomplete payment info."""
        return db.query(func.count(Product.id)).outerjoin(
            PaymentInfo, Product.id == PaymentInfo.product_id
        ).filter(
            (PaymentInfo.status == 'incomplete') | (
                PaymentInfo.status.is_(None))
        ).scalar()

    def get_expiring_soon(self, db: Session, *, days_ahead: int = 30) -> List[PaymentInfo]:
        """Get payment info for products expiring within specified days."""
        # This would need more complex date parsing logic for MM/YYYY format
        # For now, return empty list - can be implemented later
        return []


payment_info = CRUDPaymentInfo(PaymentInfo)
