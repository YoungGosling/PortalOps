from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import service, product, audit_log
from app.core.deps import require_any_admin_role, require_service_admin_or_higher, get_user_roles
from app.schemas.service import Service, ServiceCreate, ServiceUpdate, ServiceWithProducts, Product, ProductCreate, ProductUpdate
from app.models.user import User
import uuid

router = APIRouter()


@router.get("", response_model=dict)
def read_services(
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    current_user: User = Depends(require_any_admin_role),
    db: Session = Depends(get_db)
):
    """
    Retrieve services filtered by user permissions with their products.
    Supports pagination and search by service name.
    """
    user_roles = get_user_roles(current_user.id, db)
    is_admin = "Admin" in user_roles

    skip = (page - 1) * limit
    services, total = service.get_services_for_user(
        db, user_id=current_user.id, is_admin=is_admin, skip=skip, limit=limit, search=search)

    return {
        "data": services,
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit
        }
    }


@router.post("", response_model=Service, status_code=201)
def create_service(
    service_in: ServiceCreate,
    current_user: User = Depends(require_any_admin_role),
    db: Session = Depends(get_db)
):
    """
    Create new service and optionally associate products.
    """
    # Check if user is Admin (only Admin can create services)
    user_roles = get_user_roles(current_user.id, db)
    if "Admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can create services"
        )

    new_service = service.create_with_products(db, obj_in=service_in)

    # Log the action (convert UUIDs to strings for JSON serialization)
    details = {"name": new_service.name, "vendor": new_service.vendor}
    if service_in.adminUserIds:
        details["adminUserIds"] = [str(uid) for uid in service_in.adminUserIds]

    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="service.create",
        target_id=str(new_service.id),
        details=details
    )

    return new_service


@router.get("/{service_id}", response_model=ServiceWithProducts)
def read_service(
    service_id: uuid.UUID,
    current_user: User = Depends(require_any_admin_role),
    db: Session = Depends(get_db)
):
    """
    Get service by ID with products filtered by user permissions.
    """
    user_roles = get_user_roles(current_user.id, db)
    is_admin = "Admin" in user_roles

    service_with_products = service.get_with_products(
        db, service_id=service_id, user_id=current_user.id, is_admin=is_admin
    )

    if not service_with_products:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    return service_with_products


@router.put("/{service_id}", response_model=Service)
def update_service(
    service_id: uuid.UUID,
    service_update: ServiceUpdate,
    current_user: User = Depends(require_any_admin_role),
    db: Session = Depends(get_db)
):
    """
    Update service and manage product associations.
    """
    # Check if user is Admin (only Admin can update services)
    user_roles = get_user_roles(current_user.id, db)
    if "Admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can update services"
        )

    existing_service = service.get(db, service_id)
    if not existing_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    updated_service = service.update_with_products(
        db, db_obj=existing_service, obj_in=service_update)

    # Log the action (convert UUIDs to strings for JSON serialization)
    details = service_update.model_dump(exclude_unset=True)
    if "adminUserIds" in details and details["adminUserIds"] is not None:
        details["adminUserIds"] = [str(uid) for uid in details["adminUserIds"]]
    if "associateProductIds" in details and details["associateProductIds"]:
        details["associateProductIds"] = [
            str(pid) for pid in details["associateProductIds"]]
    if "disassociateProductIds" in details and details["disassociateProductIds"]:
        details["disassociateProductIds"] = [
            str(pid) for pid in details["disassociateProductIds"]]

    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="service.update",
        target_id=str(service_id),
        details=details
    )

    return updated_service


@router.delete("/{service_id}", status_code=204)
def delete_service(
    service_id: uuid.UUID,
    current_user: User = Depends(require_any_admin_role),
    db: Session = Depends(get_db)
):
    """
    Delete service - only allowed if no products are associated.
    """
    # Check if user is Admin (only Admin can delete services)
    user_roles = get_user_roles(current_user.id, db)
    if "Admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can delete services"
        )

    existing_service = service.get(db, service_id)
    if not existing_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    # Check if service has any products
    from app.models.service import Product
    product_count = db.query(Product).filter(
        Product.service_id == service_id).count()
    if product_count > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unable to delete the service：There are still {product_count} products under this service. Please delete or transfer all products before deleting the service."
        )

    # Delete the service
    service.remove(db, id=service_id)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="service.delete",
        target_id=str(service_id),
        details={"name": existing_service.name}
    )


# Product endpoints within services
@router.post("/{service_id}/products", response_model=Product, status_code=201)
def create_product(
    service_id: uuid.UUID,
    product_in: ProductCreate,
    current_user: User = Depends(require_service_admin_or_higher),
    db: Session = Depends(get_db)
):
    """
    Create new product for a service.
    """
    # Verify service exists
    existing_service = service.get(db, service_id)
    if not existing_service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found"
        )

    # Set the service_id
    product_in.service_id = service_id
    new_product = product.create(db, obj_in=product_in)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.create",
        target_id=str(new_product.id),
        details={"name": new_product.name, "service_id": str(service_id)}
    )

    return new_product


@router.get("/{service_id}/products/{product_id}", response_model=Product)
def read_product(
    service_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(require_any_admin_role),
    db: Session = Depends(get_db)
):
    """
    Get product by ID.
    """
    existing_product = product.get(db, product_id)
    if not existing_product or existing_product.service_id != service_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Check permissions
    user_roles = get_user_roles(current_user.id, db)
    is_admin = "Admin" in user_roles

    if not is_admin and not product.user_can_access(db, product_id=product_id, user_id=current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied to this product"
        )

    return existing_product


@router.put("/{service_id}/products/{product_id}", response_model=Product)
def update_product(
    service_id: uuid.UUID,
    product_id: uuid.UUID,
    product_update: ProductUpdate,
    current_user: User = Depends(require_service_admin_or_higher),
    db: Session = Depends(get_db)
):
    """
    Update product.
    """
    existing_product = product.get(db, product_id)
    if not existing_product or existing_product.service_id != service_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    updated_product = product.update(
        db, db_obj=existing_product, obj_in=product_update)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.update",
        target_id=str(product_id),
        details=product_update.dict(exclude_unset=True)
    )

    return updated_product


@router.delete("/{service_id}/products/{product_id}", status_code=204)
def delete_product(
    service_id: uuid.UUID,
    product_id: uuid.UUID,
    current_user: User = Depends(require_service_admin_or_higher),
    db: Session = Depends(get_db)
):
    """
    Delete product.
    """
    existing_product = product.get(db, product_id)
    if not existing_product or existing_product.service_id != service_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    product.remove(db, id=product_id)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.delete",
        target_id=str(product_id),
        details={"name": existing_product.name}
    )
