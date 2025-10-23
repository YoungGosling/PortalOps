from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.deps import require_admin, get_current_user
from app.crud import product_status, payment_method, audit_log
from app.schemas.payment import (
    ProductStatus, ProductStatusCreate, ProductStatusUpdate,
    PaymentMethod, PaymentMethodCreate, PaymentMethodUpdate
)
from app.models.user import User

router = APIRouter()


# ==================== Product Statuses ====================

@router.get("/product-statuses", response_model=List[ProductStatus])
def get_all_product_statuses(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all product statuses.
    Available to all authenticated users for viewing.
    """
    statuses = product_status.get_multi(db)
    return statuses


@router.post("/product-statuses", response_model=ProductStatus, status_code=status.HTTP_201_CREATED)
def create_product_status(
    status_in: ProductStatusCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new product status.
    Requires Admin role.
    """
    # Check if name already exists
    existing = product_status.get_by_name(db, name=status_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Product status with name '{status_in.name}' already exists"
        )

    # Create the status
    new_status = product_status.create(db, obj_in=status_in)

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="product_status.create",
            target_id=str(new_status.id),
            details={"name": new_status.name,
                     "description": new_status.description}
        )
    except Exception as e:
        print(f"Audit log error: {e}")

    return new_status


@router.put("/product-statuses/{status_id}", response_model=ProductStatus)
def update_product_status(
    status_id: int,
    status_in: ProductStatusUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update an existing product status.
    Requires Admin role.
    """
    # Get existing status
    existing_status = product_status.get(db, id=status_id)
    if not existing_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product status with id {status_id} not found"
        )

    # Check if new name conflicts with another status
    if status_in.name and status_in.name != existing_status.name:
        name_conflict = product_status.get_by_name(db, name=status_in.name)
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Product status with name '{status_in.name}' already exists"
            )

    # Update the status
    updated_status = product_status.update(
        db, db_obj=existing_status, obj_in=status_in)

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="product_status.update",
            target_id=str(updated_status.id),
            details=status_in.dict(exclude_unset=True)
        )
    except Exception as e:
        print(f"Audit log error: {e}")

    return updated_status


@router.delete("/product-statuses/{status_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product_status(
    status_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a product status.
    Deletion is restricted if the status is currently assigned to any product.
    Requires Admin role.
    """
    # Get existing status
    existing_status = product_status.get(db, id=status_id)
    if not existing_status:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Product status with id {status_id} not found"
        )

    # Check if status is in use
    if product_status.is_in_use(db, status_id=status_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete product status that is currently assigned to products"
        )

    # Delete the status
    product_status.remove(db, id=status_id)

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="product_status.delete",
            target_id=str(status_id),
            details={"name": existing_status.name}
        )
    except Exception as e:
        print(f"Audit log error: {e}")


# ==================== Payment Methods ====================

@router.get("/payment-methods", response_model=List[PaymentMethod])
def get_all_payment_methods(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Retrieve all payment methods.
    Available to all authenticated users for viewing.
    """
    methods = payment_method.get_multi(db)
    return methods


@router.post("/payment-methods", response_model=PaymentMethod, status_code=status.HTTP_201_CREATED)
def create_payment_method(
    method_in: PaymentMethodCreate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Create a new payment method.
    Requires Admin role.
    """
    # Check if name already exists
    existing = payment_method.get_by_name(db, name=method_in.name)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Payment method with name '{method_in.name}' already exists"
        )

    # Create the method
    new_method = payment_method.create(db, obj_in=method_in)

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="payment_method.create",
            target_id=str(new_method.id),
            details={"name": new_method.name,
                     "description": new_method.description}
        )
    except Exception as e:
        print(f"Audit log error: {e}")

    return new_method


@router.put("/payment-methods/{method_id}", response_model=PaymentMethod)
def update_payment_method(
    method_id: int,
    method_in: PaymentMethodUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update an existing payment method.
    Requires Admin role.
    """
    # Get existing method
    existing_method = payment_method.get(db, id=method_id)
    if not existing_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment method with id {method_id} not found"
        )

    # Check if new name conflicts with another method
    if method_in.name and method_in.name != existing_method.name:
        name_conflict = payment_method.get_by_name(db, name=method_in.name)
        if name_conflict:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"Payment method with name '{method_in.name}' already exists"
            )

    # Update the method
    updated_method = payment_method.update(
        db, db_obj=existing_method, obj_in=method_in)

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="payment_method.update",
            target_id=str(updated_method.id),
            details=method_in.dict(exclude_unset=True)
        )
    except Exception as e:
        print(f"Audit log error: {e}")

    return updated_method


@router.delete("/payment-methods/{method_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_payment_method(
    method_id: int,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Delete a payment method.
    Deletion is restricted if the method is currently assigned to any payment record.
    Requires Admin role.
    """
    # Get existing method
    existing_method = payment_method.get(db, id=method_id)
    if not existing_method:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Payment method with id {method_id} not found"
        )

    # Check if method is in use
    if payment_method.is_in_use(db, method_id=method_id):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete payment method that is currently assigned to payment records"
        )

    # Delete the method
    payment_method.remove(db, id=method_id)

    # Log the action
    try:
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="payment_method.delete",
            target_id=str(method_id),
            details={"name": existing_method.name}
        )
    except Exception as e:
        print(f"Audit log error: {e}")
