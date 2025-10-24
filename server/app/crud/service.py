from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.crud.base import CRUDBase
from app.models.service import Service, Product
from app.models.permission import PermissionAssignment
from app.schemas.service import ServiceCreate, ServiceUpdate
import uuid


class CRUDService(CRUDBase[Service, ServiceCreate, ServiceUpdate]):
    def create_with_products(self, db: Session, *, obj_in: ServiceCreate) -> Service:
        """Create a service and optionally associate products and admins."""
        # Create service without productIds and adminUserIds
        service_data = obj_in.model_dump(
            exclude={'productIds', 'adminUserIds'})
        db_obj = Service(**service_data)
        db.add(db_obj)
        db.flush()

        # Associate products if provided
        if obj_in.productIds:
            for product_id in obj_in.productIds:
                product = db.query(Product).filter(
                    Product.id == product_id).first()
                if product:
                    product.service_id = db_obj.id

        # Associate admin users if provided
        if obj_in.adminUserIds:
            from app.models.user import User
            for user_id in obj_in.adminUserIds:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    db_obj.admins.append(user)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def update_with_products(self, db: Session, *, db_obj: Service, obj_in: ServiceUpdate) -> Service:
        """Update service and manage product associations and admin assignments."""
        # Update basic fields
        update_data = obj_in.model_dump(
            exclude={'associateProductIds', 'disassociateProductIds', 'adminUserIds'}, exclude_unset=True)
        for field, value in update_data.items():
            setattr(db_obj, field, value)

        # Associate products
        if obj_in.associateProductIds:
            for product_id in obj_in.associateProductIds:
                product = db.query(Product).filter(
                    Product.id == product_id).first()
                if product:
                    product.service_id = db_obj.id

        # Disassociate products
        if obj_in.disassociateProductIds:
            for product_id in obj_in.disassociateProductIds:
                product = db.query(Product).filter(
                    Product.id == product_id).first()
                if product and product.service_id == db_obj.id:
                    product.service_id = None

        # Update admin assignments if provided
        if obj_in.adminUserIds is not None:
            from app.models.user import User
            # Clear existing admins
            db_obj.admins = []
            # Add new admins
            for user_id in obj_in.adminUserIds:
                user = db.query(User).filter(User.id == user_id).first()
                if user:
                    db_obj.admins.append(user)

        db.commit()
        db.refresh(db_obj)
        return db_obj

    def remove_non_destructive(self, db: Session, *, id: uuid.UUID) -> bool:
        """Remove service without deleting associated products (set service_id to NULL)."""
        # Set all products' service_id to NULL
        db.query(Product).filter(Product.service_id ==
                                 id).update({"service_id": None})

        # Delete the service
        obj = db.query(Service).filter(Service.id == id).first()
        if obj:
            db.delete(obj)
            db.commit()
            return True
        return False

    def get_services_for_user(
        self, db: Session, *, user_id: uuid.UUID, is_admin: bool = False
    ) -> List[Service]:
        """Get services filtered by user permissions with their products and admins."""
        if is_admin:
            # Admin can see all services
            services = db.query(Service).all()
        else:
            # Non-admin users see only services they have permission for
            services = db.query(Service).join(
                PermissionAssignment,
                Service.id == PermissionAssignment.service_id
            ).filter(
                PermissionAssignment.user_id == user_id
            ).distinct().all()

        # Add products, product count, and admins to each service
        for service in services:
            products = db.query(Product).filter(
                Product.service_id == service.id
            ).all()
            service.products = products
            service.productCount = len(products)
            # Admins are already loaded via the relationship

        return services

    def get_with_products(
        self, db: Session, *, service_id: uuid.UUID, user_id: uuid.UUID, is_admin: bool = False
    ) -> Optional[Service]:
        """Get service with products filtered by user permissions."""
        service = self.get(db, service_id)
        if not service:
            return None

        if is_admin:
            # Admin can see all products
            products = db.query(Product).filter(
                Product.service_id == service_id).all()
        else:
            # Non-admin users see only products they have permission for
            products = db.query(Product).join(
                PermissionAssignment,
                Product.id == PermissionAssignment.product_id
            ).filter(
                Product.service_id == service_id,
                PermissionAssignment.user_id == user_id
            ).all()

        service.products = products
        return service


service = CRUDService(Service)
