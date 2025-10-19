from typing import List, Optional
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
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Create a new product. This will also create an associated incomplete billing record.
    Only Admin can create products.
    """
    # Check if user is Admin (only Admin can create products)
    from app.core.deps import get_user_roles
    user_roles = get_user_roles(current_user.id, db)
    if "Admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can create products"
        )

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
                 "service_id": str(new_product.service_id) if new_product.service_id else None}
    )

    return new_product


@router.get("", response_model=List[Product])
def get_products(
    serviceId: Optional[uuid.UUID] = None,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all products that the current user has access to.
    Optionally filter by serviceId.
    """
    # Get user roles from database
    from app.core.deps import get_user_roles
    user_role_names = get_user_roles(current_user.id, db)
    is_admin = any(role in user_role_names for role in [
                   'Admin', 'ServiceAdmin'])

    if serviceId:
        products = crud_product.get_by_service(
            db, service_id=serviceId, user_id=current_user.id, is_admin=is_admin
        )
    else:
        products = crud_product.get_products_for_user(
            db, user_id=current_user.id, is_admin=is_admin
        )
    
    # Add service_name to each product
    result = []
    for product in products:
        product_dict = {
            "id": product.id,
            "name": product.name,
            "url": product.url,
            "description": product.description,
            "service_id": product.service_id,
            "service_name": product.service.name if product.service else None,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        }
        result.append(product_dict)
    
    return result


@router.put("/{product_id}", response_model=Product)
def update_product(
    product_id: uuid.UUID,
    product_in: ProductCreateWithUrl,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Update a product. Only Admin can update products.
    """
    # Check if user is Admin (only Admin can update products)
    from app.core.deps import get_user_roles
    user_roles = get_user_roles(current_user.id, db)
    if "Admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can update products"
        )

    # Check if product exists
    product = crud_product.get(db, id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Update product
    from app.schemas.service import ProductUpdate
    product_update = ProductUpdate(
        name=product_in.name,
        url=product_in.url
    )
    
    # Update service_id separately if provided
    if hasattr(product_in, 'serviceId') and product_in.serviceId:
        product.service_id = product_in.serviceId
    
    updated_product = crud_product.update(db, db_obj=product, obj_in=product_update)
    db.commit()
    db.refresh(updated_product)

    # Load service relationship
    if updated_product.service:
        service_name = updated_product.service.name
    else:
        service_name = None

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.update",
        target_id=str(product_id),
        details={"name": updated_product.name, "service_id": str(
            updated_product.service_id) if updated_product.service_id else None}
    )

    # Return product with service_name
    return {
        "id": updated_product.id,
        "name": updated_product.name,
        "url": updated_product.url,
        "description": updated_product.description,
        "service_id": updated_product.service_id,
        "service_name": service_name,
        "created_at": updated_product.created_at,
        "updated_at": updated_product.updated_at
    }


@router.delete("/{product_id}", status_code=204)
def delete_product(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Delete a product and its associated payment info.
    Only Admin can delete products.
    """
    # Check if user is Admin (only Admin can delete products)
    from app.core.deps import get_user_roles
    user_roles = get_user_roles(current_user.id, db)
    if "Admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can delete products"
        )

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
        details={"name": product.name, "service_id": str(
            product.service_id) if product.service_id else None}
    )
