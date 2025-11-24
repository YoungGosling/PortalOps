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
        self, db: Session, *, search: Optional[str] = None, product_id: Optional[uuid.UUID] = None, skip: int = 0, limit: int = 100, sort_by: Optional[str] = None, sort_order: Optional[str] = "asc", is_active: Optional[bool] = None
    ) -> List[User]:
        from app.models.sap_user import SapUser
        from app.models.service import Product
        from app.models.department import Department
        from sqlalchemy import asc, desc, func
        query = db.query(User)
        
        # Filter by is_active if specified
        if is_active is not None:
            query = query.filter(User.is_active == is_active)
        
        if search:
            # Search by name, email, department, SAP ID, or Product Name
            # First, find user IDs that match SAP ID search
            sap_matching_user_ids = [
                row[0] for row in db.query(SapUser.user_id).filter(
                    SapUser.sap_id.ilike(f"%{search}%")
                ).all()
            ]
            
            # Find product IDs that match the search term
            matching_product_ids = [
                row[0] for row in db.query(Product.id).filter(
                    Product.name.ilike(f"%{search}%")
                ).all()
            ]
            
            # Find user IDs assigned to matching products
            product_matching_user_ids = []
            if matching_product_ids:
                product_matching_user_ids = [
                    row[0] for row in db.query(PermissionAssignment.user_id).filter(
                        PermissionAssignment.product_id.in_(matching_product_ids)
                    ).distinct().all()
                ]
            
            # Build search conditions
            search_conditions = [
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.department.ilike(f"%{search}%")
            ]
            
            # Add SAP ID search condition if there are matching IDs
            if sap_matching_user_ids:
                search_conditions.append(User.id.in_(sap_matching_user_ids))
            
            # Add Product Name search condition if there are matching user IDs
            if product_matching_user_ids:
                search_conditions.append(User.id.in_(product_matching_user_ids))
            
            query = query.filter(or_(*search_conditions))
        if product_id:
            # Filter users assigned to the specific product
            query = query.join(
                PermissionAssignment,
                User.id == PermissionAssignment.user_id
            ).filter(
                PermissionAssignment.product_id == product_id
            )
        
        # Apply sorting
        if sort_by:
            # For department sorting, we need to join with Department table and sort by department name
            if sort_by == "department":
                # Use subquery approach to avoid DISTINCT + ORDER BY issues with computed columns
                # First, build a subquery to get sorted user IDs
                # Use COALESCE to handle both department_id (via join) and legacy department field
                department_sort = func.coalesce(
                    Department.name,
                    User.department
                )
                # Select both User.id and department_sort for ORDER BY compatibility
                subquery = db.query(User.id, department_sort.label('dept_sort')).outerjoin(
                    Department, User.department_id == Department.id
                )
                # Apply the same filters to subquery
                if search:
                    # Rebuild search conditions for subquery
                    sap_matching_user_ids = [
                        row[0] for row in db.query(SapUser.user_id).filter(
                            SapUser.sap_id.ilike(f"%{search}%")
                        ).all()
                    ]
                    matching_product_ids = [
                        row[0] for row in db.query(Product.id).filter(
                            Product.name.ilike(f"%{search}%")
                        ).all()
                    ]
                    product_matching_user_ids = []
                    if matching_product_ids:
                        product_matching_user_ids = [
                            row[0] for row in db.query(PermissionAssignment.user_id).filter(
                                PermissionAssignment.product_id.in_(matching_product_ids)
                            ).distinct().all()
                        ]
                    search_conditions_sub = [
                        User.name.ilike(f"%{search}%"),
                        User.email.ilike(f"%{search}%"),
                        User.department.ilike(f"%{search}%")
                    ]
                    if sap_matching_user_ids:
                        search_conditions_sub.append(User.id.in_(sap_matching_user_ids))
                    if product_matching_user_ids:
                        search_conditions_sub.append(User.id.in_(product_matching_user_ids))
                    subquery = subquery.filter(or_(*search_conditions_sub))
                if product_id:
                    subquery = subquery.join(
                        PermissionAssignment,
                        User.id == PermissionAssignment.user_id
                    ).filter(
                        PermissionAssignment.product_id == product_id
                    )
                # Group by User.id and department_sort to ensure uniqueness while maintaining order
                subquery = subquery.group_by(User.id, department_sort)
                if sort_order and sort_order.lower() == "desc":
                    subquery = subquery.order_by(desc(department_sort))
                else:
                    subquery = subquery.order_by(asc(department_sort))
                # Get distinct user IDs in sorted order
                sorted_user_ids = [row[0] for row in subquery.all()]
                # Fetch users in the sorted order
                if sorted_user_ids:
                    # Create a mapping of user_id to position for ordering
                    id_to_order = {user_id: idx for idx, user_id in enumerate(sorted_user_ids)}
                    # Fetch users and sort by the order from subquery
                    users = db.query(User).filter(User.id.in_(sorted_user_ids)).all()
                    users.sort(key=lambda u: id_to_order.get(u.id, len(sorted_user_ids)))
                    return users[skip:skip+limit]
                else:
                    return []
            elif sort_by == "name":
                if sort_order and sort_order.lower() == "desc":
                    query = query.order_by(desc(User.name))
                else:
                    query = query.order_by(asc(User.name))
            elif sort_by == "position":
                if sort_order and sort_order.lower() == "desc":
                    query = query.order_by(desc(User.position))
                else:
                    query = query.order_by(asc(User.position))
            elif sort_by == "hire_date":
                if sort_order and sort_order.lower() == "desc":
                    query = query.order_by(desc(User.hire_date))
                else:
                    query = query.order_by(asc(User.hire_date))
        
        return query.offset(skip).limit(limit).all()

    def get_user_statistics(
        self, db: Session, *, search: Optional[str] = None, product_id: Optional[uuid.UUID] = None
    ) -> dict:
        """
        Get user statistics: total, active, and inactive counts.
        Optionally filtered by search and product_id.
        """
        from app.models.sap_user import SapUser
        from app.models.service import Product
        from sqlalchemy import or_, func
        
        # Build base query
        query = db.query(User)
        
        # Apply same filters as search_users (without is_active filter)
        if search:
            # Search by name, email, department, SAP ID, or Product Name
            sap_matching_user_ids = [
                row[0] for row in db.query(SapUser.user_id).filter(
                    SapUser.sap_id.ilike(f"%{search}%")
                ).all()
            ]
            
            matching_product_ids = [
                row[0] for row in db.query(Product.id).filter(
                    Product.name.ilike(f"%{search}%")
                ).all()
            ]
            
            product_matching_user_ids = []
            if matching_product_ids:
                product_matching_user_ids = [
                    row[0] for row in db.query(PermissionAssignment.user_id).filter(
                        PermissionAssignment.product_id.in_(matching_product_ids)
                    ).distinct().all()
                ]
            
            search_conditions = [
                User.name.ilike(f"%{search}%"),
                User.email.ilike(f"%{search}%"),
                User.department.ilike(f"%{search}%")
            ]
            
            if sap_matching_user_ids:
                search_conditions.append(User.id.in_(sap_matching_user_ids))
            
            if product_matching_user_ids:
                search_conditions.append(User.id.in_(product_matching_user_ids))
            
            query = query.filter(or_(*search_conditions))
        
        if product_id:
            query = query.join(
                PermissionAssignment,
                User.id == PermissionAssignment.user_id
            ).filter(
                PermissionAssignment.product_id == product_id
            )
        
        # Count total
        total = query.count()
        
        # Count active (is_active = True)
        active_query = query.filter(User.is_active == True)
        active = active_query.count()
        
        # Count inactive (is_active = False)
        inactive_query = query.filter(User.is_active == False)
        inactive = inactive_query.count()
        
        return {
            "total": total,
            "active": active,
            "inactive": inactive
        }

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
