from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
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
        description=product_in.description,
        service_id=product_in.serviceId,
        status_id=product_in.statusId if product_in.statusId is not None else 1
    )

    new_product = crud_product.create_with_payment_info(
        db, obj_in=product_create_schema, reporter=current_user.name)

    # Load service relationship and get status name
    from app.models.payment import ProductStatus
    from app.crud import payment_info

    service_name = new_product.service.name if new_product.service else None

    # Get status name
    status_name = None
    if new_product.status_id:
        status_obj = db.query(ProductStatus).filter(
            ProductStatus.id == new_product.status_id).first()
        if status_obj:
            status_name = status_obj.name

    # Get latest payment info (the one we just created)
    latest_payment = payment_info.get_latest_by_product(db, new_product.id)
    latest_payment_date = None
    latest_usage_start = None
    latest_usage_end = None

    if latest_payment:
        if latest_payment.payment_date:
            latest_payment_date = latest_payment.payment_date.strftime(
                "%m/%d/%Y")
        if latest_payment.usage_start_date:
            latest_usage_start = latest_payment.usage_start_date.strftime(
                "%m/%d/%Y")
        if latest_payment.usage_end_date:
            latest_usage_end = latest_payment.usage_end_date.strftime(
                "%m/%d/%Y")

    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.create",
        target_id=str(new_product.id),
        details={"name": new_product.name,
                 "service_id": str(new_product.service_id) if new_product.service_id else None}
    )

    # Return product with all required fields
    return {
        "id": new_product.id,
        "name": new_product.name,
        "url": new_product.url,
        "description": new_product.description,
        "service_id": new_product.service_id,
        "service_name": service_name,
        "status_id": new_product.status_id,
        "status": status_name,
        "latest_payment_date": latest_payment_date,
        "latest_usage_start_date": latest_usage_start,
        "latest_usage_end_date": latest_usage_end,
        "created_at": new_product.created_at,
        "updated_at": new_product.updated_at
    }


@router.get("", response_model=dict)
def get_products(
    serviceId: Optional[uuid.UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all products that the current user has access to.
    Optionally filter by serviceId.
    Includes product status and latest payment information.
    Supports pagination.
    """
    from app.crud import payment_info
    from app.models.payment import ProductStatus

    # Get user roles from database
    from app.core.deps import get_user_roles
    user_role_names = get_user_roles(current_user.id, db)
    is_admin = any(role in user_role_names for role in [
                   'Admin', 'ServiceAdmin'])

    skip = (page - 1) * limit
    if serviceId:
        products, total = crud_product.get_by_service(
            db, service_id=serviceId, user_id=current_user.id, is_admin=is_admin, skip=skip, limit=limit
        )
    else:
        products, total = crud_product.get_products_for_user(
            db, user_id=current_user.id, is_admin=is_admin, skip=skip, limit=limit
        )

    # Add service_name, status, and latest payment info to each product
    result = []
    for product in products:
        # Get product status name
        status_name = None
        if product.status_id:
            status_obj = db.query(ProductStatus).filter(
                ProductStatus.id == product.status_id).first()
            if status_obj:
                status_name = status_obj.name

        # Get latest payment info
        latest_payment = payment_info.get_latest_by_product(db, product.id)
        latest_payment_date = None
        latest_usage_start = None
        latest_usage_end = None

        if latest_payment:
            if latest_payment.payment_date:
                latest_payment_date = latest_payment.payment_date.strftime(
                    "%m/%d/%Y")
            if latest_payment.usage_start_date:
                latest_usage_start = latest_payment.usage_start_date.strftime(
                    "%m/%d/%Y")
            if latest_payment.usage_end_date:
                latest_usage_end = latest_payment.usage_end_date.strftime(
                    "%m/%d/%Y")

        product_dict = {
            "id": product.id,
            "name": product.name,
            "url": product.url,
            "description": product.description,
            "service_id": product.service_id,
            "service_name": product.service.name if product.service else None,
            "status_id": product.status_id,
            "status": status_name,
            "latest_payment_date": latest_payment_date,
            "latest_usage_start_date": latest_usage_start,
            "latest_usage_end_date": latest_usage_end,
            "created_at": product.created_at,
            "updated_at": product.updated_at
        }
        result.append(product_dict)

    return {
        "data": result,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit
        }
    }


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
    from app.models.payment import ProductStatus

    product_update = ProductUpdate(
        name=product_in.name,
        url=product_in.url,
        description=product_in.description,
        status_id=product_in.statusId if product_in.statusId is not None else product.status_id
    )

    # Update service_id separately if provided
    if product_in.serviceId:
        product.service_id = product_in.serviceId

    updated_product = crud_product.update(
        db, db_obj=product, obj_in=product_update)
    db.commit()
    db.refresh(updated_product)

    # Load service relationship
    if updated_product.service:
        service_name = updated_product.service.name
    else:
        service_name = None

    # Get status name
    status_name = None
    if updated_product.status_id:
        status_obj = db.query(ProductStatus).filter(
            ProductStatus.id == updated_product.status_id).first()
        if status_obj:
            status_name = status_obj.name

    # Get latest payment info
    from app.crud import payment_info
    latest_payment = payment_info.get_latest_by_product(db, updated_product.id)
    latest_payment_date = None
    latest_usage_start = None
    latest_usage_end = None

    if latest_payment:
        if latest_payment.payment_date:
            latest_payment_date = latest_payment.payment_date.strftime(
                "%m/%d/%Y")
        if latest_payment.usage_start_date:
            latest_usage_start = latest_payment.usage_start_date.strftime(
                "%m/%d/%Y")
        if latest_payment.usage_end_date:
            latest_usage_end = latest_payment.usage_end_date.strftime(
                "%m/%d/%Y")

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.update",
        target_id=str(product_id),
        details={"name": updated_product.name, "service_id": str(
            updated_product.service_id) if updated_product.service_id else None}
    )

    # Return product with service_name, status, and latest payment info
    return {
        "id": updated_product.id,
        "name": updated_product.name,
        "url": updated_product.url,
        "description": updated_product.description,
        "service_id": updated_product.service_id,
        "service_name": service_name,
        "status_id": updated_product.status_id,
        "status": status_name,
        "latest_payment_date": latest_payment_date,
        "latest_usage_start_date": latest_usage_start,
        "latest_usage_end_date": latest_usage_end,
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
    Delete a product safely:
    - Only Admin can delete products
    - Only products with "Inactive" status can be deleted
    - Payment records are preserved with product_id set to NULL and status set to 'error'
    - Permission assignments and department assignments are CASCADE deleted
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

    # Check if product status is "Inactive"
    # Load the status relationship if not already loaded
    from app.models.payment import ProductStatus
    if product.status:
        status_name = product.status.name
    else:
        # Fallback: query the status directly
        product_status = db.query(ProductStatus).filter(
            ProductStatus.id == product.status_id
        ).first()
        status_name = product_status.name if product_status else None

    if status_name != "Inactive":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="状态不是Inactive，无法删除"
        )

    # Delete the product
    # Database will handle:
    # - payment_info: product_id → NULL, trigger sets status → 'error' (preserved)
    # - permission_assignments: CASCADE deleted
    # - department_product_assignments: CASCADE deleted
    crud_product.remove(db, id=product_id)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.delete",
        target_id=str(product_id),
        details={
            "name": product.name,
            "service_id": str(product.service_id) if product.service_id else None,
            "status": status_name
        }
    )
