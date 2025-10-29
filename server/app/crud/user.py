from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import or_
from app.crud.base import CRUDBase
from app.models.user import User, Role, UserRole
from app.models.permission import PermissionAssignment
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password
import uuid


class CRUDUser(CRUDBase[User, UserCreate, UserUpdate]):
    def get_by_email(self, db: Session, *, email: str) -> Optional[User]:
        return db.query(User).filter(User.email == email).first()

    def create(self, db: Session, *, obj_in: UserCreate) -> User:
        db_obj = User(
            name=obj_in.name,
            email=obj_in.email,
            department=obj_in.department,
            department_id=obj_in.department_id,  # v3: FK to departments table
            position=obj_in.position,
            hire_date=obj_in.hire_date,
            resignation_date=None,  # Always default to None as per requirements
            password_hash=get_password_hash(
                obj_in.password) if obj_in.password else None,
        )
        db.add(db_obj)
        db.commit()
        db.refresh(db_obj)
        return db_obj

    def authenticate(self, db: Session, *, email: str, password: str) -> Optional[User]:
        user = self.get_by_email(db, email=email)
        if not user:
            return None
        if not user.password_hash:
            return None
        if not verify_password(password, user.password_hash):
            return None
        return user

    def update_password(self, db: Session, *, user: User, password: str) -> User:
        user.password_hash = get_password_hash(password)
        db.add(user)
        db.commit()
        db.refresh(user)
        return user

    def search_users(
        self, db: Session, *, search: Optional[str] = None, product_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100
    ) -> List[User]:
        query = db.query(User)
        if search:
            query = query.filter(
                or_(
                    User.name.ilike(f"%{search}%"),
                    User.email.ilike(f"%{search}%"),
                    User.department.ilike(f"%{search}%")
                )
            )
        if product_id:
            # Filter users assigned to the specific product
            query = query.join(
                PermissionAssignment,
                User.id == PermissionAssignment.user_id
            ).filter(
                PermissionAssignment.product_id == product_id
            )
        return query.offset(skip).limit(limit).all()

    def get_user_roles(self, db: Session, *, user_id: uuid.UUID) -> List[str]:
        roles = db.query(Role.name).join(UserRole).filter(
            UserRole.user_id == user_id).all()
        return [role.name for role in roles]

    def assign_role(self, db: Session, *, user_id: uuid.UUID, role_name: str) -> bool:
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            return False

        # Check if already assigned
        existing = db.query(UserRole).filter(
            UserRole.user_id == user_id, UserRole.role_id == role.id
        ).first()
        if existing:
            return True

        user_role = UserRole(user_id=user_id, role_id=role.id)
        db.add(user_role)
        db.commit()
        return True

    def remove_role(self, db: Session, *, user_id: uuid.UUID, role_name: str) -> bool:
        role = db.query(Role).filter(Role.name == role_name).first()
        if not role:
            return False

        user_role = db.query(UserRole).filter(
            UserRole.user_id == user_id, UserRole.role_id == role.id
        ).first()
        if user_role:
            db.delete(user_role)
            db.commit()
        return True

    def assign_service_permission(self, db: Session, *, user_id: uuid.UUID, service_id: uuid.UUID) -> bool:
        # Check if already assigned
        existing = db.query(PermissionAssignment).filter(
            PermissionAssignment.user_id == user_id,
            PermissionAssignment.service_id == service_id
        ).first()
        if existing:
            return True

        permission = PermissionAssignment(
            user_id=user_id, service_id=service_id)
        db.add(permission)
        db.commit()
        return True

    def remove_service_permission(self, db: Session, *, user_id: uuid.UUID, service_id: uuid.UUID) -> bool:
        permission = db.query(PermissionAssignment).filter(
            PermissionAssignment.user_id == user_id,
            PermissionAssignment.service_id == service_id
        ).first()
        if permission:
            db.delete(permission)
            db.commit()
        return True

    def assign_product_permission(self, db: Session, *, user_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        # Check if already assigned
        existing = db.query(PermissionAssignment).filter(
            PermissionAssignment.user_id == user_id,
            PermissionAssignment.product_id == product_id
        ).first()
        if existing:
            return True

        permission = PermissionAssignment(
            user_id=user_id, product_id=product_id)
        db.add(permission)
        db.commit()
        return True

    def remove_product_permission(self, db: Session, *, user_id: uuid.UUID, product_id: uuid.UUID) -> bool:
        permission = db.query(PermissionAssignment).filter(
            PermissionAssignment.user_id == user_id,
            PermissionAssignment.product_id == product_id
        ).first()
        if permission:
            db.delete(permission)
            db.commit()
        return True


user = CRUDUser(User)
