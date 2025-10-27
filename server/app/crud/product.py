from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.crud.base import CRUDBase
from app.models.service import Product
from app.models.permission import PermissionAssignment
from app.models.department import DepartmentProductAssignment
from app.models.payment import PaymentInfo
from app.schemas.service import ProductCreate, ProductUpdate
import uuid
from datetime import date


class CRUDProduct(CRUDBase[Product, ProductCreate, ProductUpdate]):
    def get_products_for_user(
        self, db: Session, *, user_id: uuid.UUID, is_admin: bool = False, skip: int = 0, limit: int = 100
    ) -> tuple[List[Product], int]:
        """Get products filtered by user permissions.

        Returns:
            tuple: (list of products, total count)
        """
        if is_admin:
            query = db.query(Product).options(joinedload(Product.service))
            total = query.count()
            products = query.offset(skip).limit(limit).all()
        else:
            query = db.query(Product).options(
                joinedload(Product.service)
            ).join(
                PermissionAssignment,
                Product.id == PermissionAssignment.product_id
            ).filter(
                PermissionAssignment.user_id == user_id
            )
            total = query.count()
            products = query.offset(skip).limit(limit).all()

        return products, total

    def get_by_service(
        self, db: Session, *, service_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False, skip: int = 0, limit: int = 100
    ) -> tuple[List[Product], int]:
        """Get products by service, filtered by user permissions.

        Returns:
            tuple: (list of products, total count)
        """
        if is_admin:
            query = db.query(Product).options(
                joinedload(Product.service)
            ).filter(Product.service_id == service_id)
            total = query.count()
            products = query.offset(skip).limit(limit).all()
        else:
            query = db.query(Product).options(
                joinedload(Product.service)
            ).join(
                PermissionAssignment,
                Product.id == PermissionAssignment.product_id
            ).filter(
                Product.service_id == service_id,
                PermissionAssignment.user_id == user_id
            )
            total = query.count()
            products = query.offset(skip).limit(limit).all()

        return products, total

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

    def create_with_payment_info(
        self, db: Session, *, obj_in: ProductCreate, reporter: str = "System"
    ) -> Product:
        """
        Create a new product with an associated incomplete payment record.

        Args:
            db: Database session
            obj_in: Product creation data
            reporter: Name of the user creating the product

        Returns:
            The newly created Product instance with payment_info relationship loaded
        """
        # Create the product first
        product = self.create(db, obj_in=obj_in)

        # Create an incomplete payment record linked to this product
        today = date.today()
        payment_record = PaymentInfo(
            product_id=product.id,
            status="incomplete",
            payment_date=today,
            usage_start_date=today,
            usage_end_date=today,
            reporter=reporter
        )

        db.add(payment_record)
        db.commit()
        db.refresh(product)

        return product

    def remove(self, db: Session, *, id: uuid.UUID) -> Product:
        """
        Override remove to properly handle cascading deletes.
        Explicitly delete related records before deleting the product.

        Deletion behavior:
        - permission_assignments: CASCADE deleted
        - department_product_assignments: CASCADE deleted
        - payment_info: product_id set to NULL, status set to 'error' (preserved)
        """
        obj = db.query(self.model).filter(self.model.id == id).first()
        if not obj:
            return None

        # Explicitly delete permission assignments (CASCADE)
        db.query(PermissionAssignment).filter(
            PermissionAssignment.product_id == id
        ).delete(synchronize_session=False)

        # Explicitly delete department product assignments (CASCADE)
        db.query(DepartmentProductAssignment).filter(
            DepartmentProductAssignment.product_id == id
        ).delete(synchronize_session=False)

        # Now delete the product
        # payment_info will have product_id set to NULL by database trigger
        db.delete(obj)
        db.commit()
        return obj


product = CRUDProduct(Product)
