from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.crud.base import CRUDBase
from app.models.service import Service, Product
from app.models.permission import PermissionAssignment
from app.schemas.service import ServiceCreate, ServiceUpdate
import uuid


class CRUDService(CRUDBase[Service, ServiceCreate, ServiceUpdate]):
    def get_services_for_user(
        self, db: Session, *, user_id: uuid.UUID, is_admin: bool = False
    ) -> List[Service]:
        """Get services filtered by user permissions."""
        if is_admin:
            # Admin can see all services
            query = db.query(Service, func.count(Product.id).label(
                'product_count')).outerjoin(Product)
        else:
            # Non-admin users see only services they have permission for
            query = db.query(Service, func.count(Product.id).label('product_count')).join(
                PermissionAssignment,
                Service.id == PermissionAssignment.service_id
            ).outerjoin(Product).filter(
                PermissionAssignment.user_id == user_id
            )

        results = query.group_by(Service.id).all()

        # Add product count to service objects
        services = []
        for service, product_count in results:
            service.productCount = product_count
            services.append(service)

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



