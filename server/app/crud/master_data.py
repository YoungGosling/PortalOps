from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.crud.base import CRUDBase
from app.models.payment import ProductStatus, PaymentMethod, Currency
from app.schemas.payment import (
    ProductStatusCreate, ProductStatusUpdate,
    PaymentMethodCreate, PaymentMethodUpdate,
    CurrencyCreate, CurrencyUpdate
)


class CRUDProductStatus(CRUDBase[ProductStatus, ProductStatusCreate, ProductStatusUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[ProductStatus]:
        """Get product status by name."""
        return db.query(ProductStatus).filter(ProductStatus.name == name).first()

    def is_in_use(self, db: Session, *, status_id: int) -> bool:
        """Check if product status is currently assigned to any product."""
        from app.models.service import Product
        return db.query(Product).filter(Product.status_id == status_id).count() > 0


class CRUDPaymentMethod(CRUDBase[PaymentMethod, PaymentMethodCreate, PaymentMethodUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[PaymentMethod]:
        """Get payment method by name."""
        return db.query(PaymentMethod).filter(PaymentMethod.name == name).first()

    def is_in_use(self, db: Session, *, method_id: int) -> bool:
        """Check if payment method is currently assigned to any payment record."""
        from app.models.payment import PaymentInfo
        return db.query(PaymentInfo).filter(PaymentInfo.payment_method_id == method_id).count() > 0


class CRUDCurrency(CRUDBase[Currency, CurrencyCreate, CurrencyUpdate]):
    def get_by_code(self, db: Session, *, code: str) -> Optional[Currency]:
        """Get currency by code."""
        return db.query(Currency).filter(Currency.code == code).first()

    def get_by_name(self, db: Session, *, name: str) -> Optional[Currency]:
        """Get currency by name."""
        return db.query(Currency).filter(Currency.name == name).first()

    def is_in_use(self, db: Session, *, currency_id: int) -> bool:
        """Check if currency is currently assigned to any payment record."""
        from app.models.payment import PaymentInfo
        return db.query(PaymentInfo).filter(PaymentInfo.currency_id == currency_id).count() > 0


product_status = CRUDProductStatus(ProductStatus)
payment_method = CRUDPaymentMethod(PaymentMethod)
currency = CRUDCurrency(Currency)
