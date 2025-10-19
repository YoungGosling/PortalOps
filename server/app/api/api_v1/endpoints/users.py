from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import user, audit_log
from app.core.deps import require_any_admin_role, require_admin, get_user_roles
from app.schemas.user import User, UserCreate, UserUpdate, UserPermissionUpdate, UserUpdateV2
from app.models.user import User as UserModel
import uuid

router = APIRouter()


@router.get("", response_model=dict)
def read_users(
    search: Optional[str] = Query(None),
    productId: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve users with pagination and search.
    Optionally filter by productId.
    """
    skip = (page - 1) * limit
    users = user.search_users(
        db, search=search, product_id=productId, skip=skip, limit=limit)

    # Get total count for pagination
    total_users = len(user.search_users(db, search=search, product_id=productId,
                      skip=0, limit=1000))  # Simple approach

    user_data = []
    for u in users:
        # Get roles for this user
        roles = get_user_roles(u.id, db)

        # Get assigned product IDs
        from app.models.permission import PermissionAssignment
        product_assignments = db.query(PermissionAssignment).filter(
            PermissionAssignment.user_id == u.id,
            PermissionAssignment.product_id.isnot(None)
        ).all()
        assigned_product_ids = [str(a.product_id) for a in product_assignments]

        user_data.append({
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "department": u.department,
            "roles": roles,
            "assignedProductIds": assigned_product_ids
        })

    return {
        "data": user_data,
        "pagination": {
            "total": total_users,
            "page": page,
            "limit": limit
        }
    }


@router.post("", response_model=User)
def create_user(
    user_in: UserCreate,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create new user with optional role and product assignments.
    """
    # Check if user already exists
    existing_user = user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    new_user = user.create(db, obj_in=user_in)

    # Assign role if provided
    if user_in.role:
        user.assign_role(db, user_id=new_user.id, role_name=user_in.role)

    # Assign products if provided
    if user_in.assignedProductIds:
        for product_id in user_in.assignedProductIds:
            user.assign_product_permission(
                db, user_id=new_user.id, product_id=product_id)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="user.create",
        target_id=str(new_user.id),
        details={
            "email": new_user.email,
            "name": new_user.name,
            "role": user_in.role,
            "assignedProductIds": [str(pid) for pid in (user_in.assignedProductIds or [])]
        }
    )

    return new_user


@router.put("/{user_id}/permissions", status_code=204)
def update_user_permissions(
    user_id: uuid.UUID,
    permission_update: UserPermissionUpdate,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update user's roles and permissions.
    """
    target_user = user.get(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Get current roles for comparison
    current_roles = get_user_roles(user_id, db)

    # Update roles - remove all current roles and add new ones
    for role_name in current_roles:
        user.remove_role(db, user_id=user_id, role_name=role_name)

    for role_name in permission_update.roles:
        user.assign_role(db, user_id=user_id, role_name=role_name)

    # Update service assignments
    if "services" in permission_update.assignments:
        services_update = permission_update.assignments["services"]

        if "add" in services_update:
            for service_id_str in services_update["add"]:
                service_id = uuid.UUID(service_id_str)
                user.assign_service_permission(
                    db, user_id=user_id, service_id=service_id)

        if "remove" in services_update:
            for service_id_str in services_update["remove"]:
                service_id = uuid.UUID(service_id_str)
                user.remove_service_permission(
                    db, user_id=user_id, service_id=service_id)

    # Update product assignments
    if "products" in permission_update.assignments:
        products_update = permission_update.assignments["products"]

        if "add" in products_update:
            for product_id_str in products_update["add"]:
                product_id = uuid.UUID(product_id_str)
                user.assign_product_permission(
                    db, user_id=user_id, product_id=product_id)

        if "remove" in products_update:
            for product_id_str in products_update["remove"]:
                product_id = uuid.UUID(product_id_str)
                user.remove_product_permission(
                    db, user_id=user_id, product_id=product_id)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="user.permissions.update",
        target_id=str(user_id),
        details={
            "roles": permission_update.roles,
            "assignments": permission_update.assignments
        }
    )


@router.get("/{user_id}", response_model=User)
def read_user(
    user_id: uuid.UUID,
    current_user: UserModel = Depends(require_any_admin_role),
    db: Session = Depends(get_db)
):
    """
    Get user by ID.
    """
    target_user = user.get(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return target_user


@router.put("/{user_id}", response_model=User)
def update_user(
    user_id: uuid.UUID,
    user_update: UserUpdateV2,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update user (v2 - unified update including basic info and permissions).
    """
    target_user = user.get(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update basic fields
    basic_update = UserUpdate(
        name=user_update.name,
        email=user_update.email,
        department=user_update.department
    )
    updated_user = user.update(db, db_obj=target_user, obj_in=basic_update)

    # Update role if provided
    if user_update.role:
        # Remove all existing roles
        current_roles = get_user_roles(user_id, db)
        for role_name in current_roles:
            user.remove_role(db, user_id=user_id, role_name=role_name)

        # Add new role
        user.assign_role(db, user_id=user_id, role_name=user_update.role)

    # Update product assignments if provided
    if user_update.assignedProductIds is not None:
        # Get current product assignments
        from app.models.permission import PermissionAssignment
        current_assignments = db.query(PermissionAssignment).filter(
            PermissionAssignment.user_id == user_id,
            PermissionAssignment.product_id.isnot(None)
        ).all()

        current_product_ids = {str(a.product_id) for a in current_assignments}
        new_product_ids = {str(pid) for pid in user_update.assignedProductIds}

        # Remove old assignments
        for product_id_str in current_product_ids - new_product_ids:
            user.remove_product_permission(
                db, user_id=user_id, product_id=uuid.UUID(product_id_str))

        # Add new assignments
        for product_id_str in new_product_ids - current_product_ids:
            user.assign_product_permission(
                db, user_id=user_id, product_id=uuid.UUID(product_id_str))

    # Log the action
    update_details = user_update.model_dump(exclude_unset=True)
    # Convert UUID objects to strings for JSON serialization
    if "assignedProductIds" in update_details and update_details["assignedProductIds"]:
        update_details["assignedProductIds"] = [
            str(pid) for pid in update_details["assignedProductIds"]]

    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="user.update",
        target_id=str(user_id),
        details=update_details
    )

    return updated_user


@router.delete("/{user_id}", status_code=204)
def delete_user(
    user_id: uuid.UUID,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete user.
    """
    target_user = user.get(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    user.remove(db, id=user_id)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="user.delete",
        target_id=str(user_id),
        details={"email": target_user.email, "name": target_user.name}
    )
