from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.service import Product
from app.models.permission import PermissionAssignment
from app.models.payment import PaymentInfo
from app.schemas.service import ProductCreate, ProductUpdate
import uuid


class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def get_products_for_user(
        self, db: Session, *, user_id: uuid.UUID, is_admin: bool = False
    ) -> List[Product]:
        """Get products filtered by user permissions."""
        if is_admin:
            return db.query(Product).all()
        else:
            return db.query(Product).join(
                PermissionAssignment,
                Product.id == PermissionAssignment.product_id
            ).filter(
                PermissionAssignment.user_id == user_id
            ).all()

    def get_by_service(
        self, db: Session, *, service_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False
    ) -> List[Product]:
        """Get products by service, filtered by user permissions."""
        if is_admin:
            return db.query(Product).filter(Product.service_id == service_id).all()
        else:
            return db.query(Product).join(
                PermissionAssignment,
                Product.id == PermissionAssignment.product_id
            ).filter(
                Product.service_id == service_id,
                PermissionAssignment.user_id == user_id
            ).all()

    def user_can_access(
        self, db: Session, *, product_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False
    ) -> bool:
        """Check if user can access a specific product."""
        if is_admin:
            return True

        permission = db.query(PermissionAssignment).filter(
            PermissionAssignment.product_id == product_id,
            PermissionAssignment.user_id == user_id
        ).first()

        return permission is not None

    def create_with_payment_info(self, db: Session, *, obj_in: ProductCreate) -> Product:
        """
        Create a new product and a corresponding incomplete payment_info record.
        """
        # Create the product object
        db_obj = Product(
            name=obj_in.name,
            url=obj_in.url,
            description=obj_in.description,
            service_id=obj_in.service_id
        )
        db.add(db_obj)
        db.flush()  # Use flush to get the ID before committing

        # Create the corresponding incomplete payment_info record
        payment_info_obj = PaymentInfo(
            product_id=db_obj.id,
            status="incomplete"
        )
        db.add(payment_info_obj)

        db.commit()
        db.refresh(db_obj)
        return db_obj


product = CRUDProduct(Product)
