from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import product as crud_product, audit_log
from app.core.deps import require_service_admin_or_higher, get_current_user
from app.schemas.service import Product, ProductCreateWithUrl, ProductCreate
from app.models.user import User
import uuid

router = APIRouter()


@router.post("", response_model=Product, status_code=201)
def create_product(
    product_in: ProductCreateWithUrl,
    current_user: User = Depends(require_service_admin_or_higher),
    db: Session = Depends(get_db)
):
    """
    Create a new product. This will also create an associated incomplete billing record.
    """
    product_create_schema = ProductCreate(
        name=product_in.name,
        url=product_in.url,
        service_id=product_in.serviceId
    )

    new_product = crud_product.create_with_payment_info(
        db, obj_in=product_create_schema)

    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.create",
        target_id=str(new_product.id),
        details={"name": new_product.name,
                 "service_id": str(new_product.service_id)}
    )

    return new_product


@router.get("", response_model=List[Product])
def get_products(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all products that the current user has access to.
    """
    # Get user roles from database
    from app.core.deps import get_user_roles
    user_role_names = get_user_roles(current_user.id, db)
    is_admin = any(role in user_role_names for role in ['Admin', 'ServiceAdministrator'])
    products = crud_product.get_products_for_user(
        db, user_id=current_user.id, is_admin=is_admin
    )
    return products


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: uuid.UUID,
    current_user: User = Depends(require_service_admin_or_higher),
    db: Session = Depends(get_db)
):
    """
    Delete a product and its associated payment info.
    """
    # Check if product exists
    product = crud_product.get(db, id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Delete the product (payment info will be deleted via CASCADE)
    crud_product.remove(db, id=product_id)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.delete",
        target_id=str(product_id),
        details={"name": product.name, "service_id": str(product.service_id)}
    )
