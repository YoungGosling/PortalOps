from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.department import Department, DepartmentProductAssignment
from app.models.service import Product
from app.schemas.department import DepartmentCreate, DepartmentUpdate
import uuid


class CRUDDepartment(CRUDBase[Department, DepartmentCreate, DepartmentUpdate]):
    def get_by_name(self, db: Session, *, name: str) -> Optional[Department]:
        """Get department by name."""
        return db.query(Department).filter(Department.name == name).first()

    def get_department_products(self, db: Session, *, department_id: uuid.UUID) -> List[Product]:
        """Get all products assigned to a department."""
        product_ids = db.query(DepartmentProductAssignment.product_id).filter(
            DepartmentProductAssignment.department_id == department_id
        ).all()
        product_ids = [pid[0] for pid in product_ids]

        if not product_ids:
            return []

        products = db.query(Product).filter(Product.id.in_(product_ids)).all()
        return products

    def set_department_products(
        self, db: Session, *, department_id: uuid.UUID, product_ids: List[uuid.UUID]
    ) -> List[uuid.UUID]:
        """
        Set (replace) all product assignments for a department.
        Returns the list of assigned product IDs.
        """
        # Remove existing assignments
        db.query(DepartmentProductAssignment).filter(
            DepartmentProductAssignment.department_id == department_id
        ).delete()

        # Add new assignments
        for product_id in product_ids:
            assignment = DepartmentProductAssignment(
                department_id=department_id,
                product_id=product_id
            )
            db.add(assignment)

        db.commit()
        return product_ids


department = CRUDDepartment(Department)
