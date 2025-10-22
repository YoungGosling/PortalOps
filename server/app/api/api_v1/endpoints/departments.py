from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import department, audit_log
from app.core.deps import require_admin
from app.schemas.department import (
    Department,
    DepartmentCreate,
    DepartmentUpdate,
    DepartmentProductAssignment,
    DepartmentProductAssignmentResponse
)
from app.schemas.service import Product
from app.models.user import User as UserModel
import uuid

router = APIRouter()


@router.get("", response_model=List[Department])
def list_departments(
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    List all departments.
    Admin only.
    """
    departments = department.get_multi(db)
    return departments


@router.post("", response_model=Department, status_code=status.HTTP_201_CREATED)
def create_department(
    department_in: DepartmentCreate,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new department.
    Admin only.
    """
    # Check if department with this name already exists
    existing = department.get_by_name(db, name=department_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists"
        )

    new_department = department.create(db, obj_in=department_in)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="department.create",
        target_id=str(new_department.id),
        details={"name": new_department.name}
    )

    return new_department


@router.put("/{department_id}", response_model=Department)
def update_department(
    department_id: uuid.UUID,
    department_update: DepartmentUpdate,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update a department's name.
    Admin only.
    """
    target_department = department.get(db, department_id)
    if not target_department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    # Check if another department with this name already exists
    existing = department.get_by_name(db, name=department_update.name)
    if existing and existing.id != department_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Department with this name already exists"
        )

    updated_department = department.update(
        db, db_obj=target_department, obj_in=department_update)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="department.update",
        target_id=str(department_id),
        details={"name": department_update.name}
    )

    return updated_department


@router.delete("/{department_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_department(
    department_id: uuid.UUID,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a department and its product assignments.
    Admin only.
    """
    target_department = department.get(db, department_id)
    if not target_department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    department_name = target_department.name
    department.remove(db, id=department_id)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="department.delete",
        target_id=str(department_id),
        details={"name": department_name}
    )


@router.get("/{department_id}/products", response_model=List[Product])
def get_department_products(
    department_id: uuid.UUID,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all products assigned to a department.
    Admin only.
    """
    target_department = department.get(db, department_id)
    if not target_department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    products = department.get_department_products(
        db, department_id=department_id)
    return products


@router.put("/{department_id}/products", response_model=DepartmentProductAssignmentResponse)
def set_department_products(
    department_id: uuid.UUID,
    assignment: DepartmentProductAssignment,
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Set (replace) all product assignments for a department.
    Admin only.
    """
    target_department = department.get(db, department_id)
    if not target_department:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Department not found"
        )

    # Set the product assignments
    assigned_ids = department.set_department_products(
        db, department_id=department_id, product_ids=assignment.product_ids
    )

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="department.products.update",
        target_id=str(department_id),
        details={
            "department_name": target_department.name,
            "product_ids": [str(pid) for pid in assigned_ids]
        }
    )

    return DepartmentProductAssignmentResponse(
        assigned_product_ids=[str(pid) for pid in assigned_ids]
    )
