from typing import List
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.crud import service, product, audit_log
from app.core.deps import require_any_admin_role, require_service_admin_or_higher, get_user_roles
from app.schemas.service import Service, ServiceCreate, ServiceUpdate, ServiceWithProducts, Product, ProductCreate, ProductUpdate
from app.models.service import Service as ServiceModel
from app.models.user import User
import uuid
import pandas as pd
import io
from pydantic import BaseModel

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

    # Check if service with the same name already exists (case-insensitive)
    existing_service = db.query(ServiceModel).filter(
        func.lower(ServiceModel.name) == func.lower(service_in.name.strip())
    ).first()
    if existing_service:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Service Provider already exists"
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

    # Check if service with the same name already exists (case-insensitive)
    # Only check if the name has changed
    if service_update.name and existing_service.name.strip().lower() != service_update.name.strip().lower():
        duplicate_service = db.query(ServiceModel).filter(
            func.lower(ServiceModel.name) == func.lower(
                service_update.name.strip()),
            ServiceModel.id != service_id
        ).first()
        if duplicate_service:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Service Provider already exists"
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


class ImportResult(BaseModel):
    success_count: int
    failed_count: int
    errors: List[str]


@router.post("/import", response_model=ImportResult)
async def import_services(
    file: UploadFile = File(...),
    current_user: User = Depends(require_any_admin_role),
    db: Session = Depends(get_db)
):
    """
    Import services from Excel file.
    Excel file should have two columns: Service (service name) and Administrators (comma-separated admin names).
    """
    # Check if user is Admin (only Admin can import services)
    user_roles = get_user_roles(current_user.id, db)
    if "Admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can import services"
        )

    # Validate file extension
    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )

    file_extension = file.filename.lower().split('.')[-1]
    if file_extension not in ['xlsx', 'xls']:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an Excel file (.xlsx or .xls)"
        )

    # Read file content
    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read Excel file: {str(e)}"
        )

    # Validate columns
    df.columns = df.columns.str.strip()
    required_columns = ['Service', 'Administrators']
    missing_columns = [
        col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(missing_columns)}"
        )

    # Filter out empty rows
    df = df.dropna(subset=['Service'], how='all')
    df = df[df['Service'].notna()]

    # Phase 1: Validate all rows without creating any data
    # This ensures "all or nothing" transaction semantics
    validation_errors = []
    validated_rows = []  # Store validated data for phase 2

    for idx, (_, row) in enumerate(df.iterrows()):
        row_number = idx + 2  # +2 because Excel rows start at 1 and we have a header row
        service_name = str(row['Service']).strip()

        # Validate service name
        if not service_name:
            validation_errors.append(
                f"Row {row_number}: Service name is empty")
            continue

        # Parse administrators
        admin_names = []
        if pd.notna(row['Administrators']):
            admin_str = str(row['Administrators']).strip()
            if admin_str:
                # Split by comma and clean up
                admin_names = [name.strip()
                               for name in admin_str.split(',') if name.strip()]

        # Find user IDs for administrators
        admin_user_ids = []
        admin_not_found = []
        if admin_names:
            for admin_name in admin_names:
                # Search for user by exact name match (case-insensitive)
                user = db.query(User).filter(
                    func.lower(User.name) == func.lower(admin_name)
                ).first()
                if user:
                    admin_user_ids.append(user.id)
                else:
                    admin_not_found.append(admin_name)

        # Validate administrators
        if admin_names and admin_not_found:
            for admin_name in admin_not_found:
                validation_errors.append(
                    f"Row {row_number}: Administrator '{admin_name}' not found")
            continue

        # Check if service already exists
        existing_service = db.query(ServiceModel).filter(
            func.lower(ServiceModel.name) == func.lower(service_name)
        ).first()
        if existing_service:
            validation_errors.append(
                f"Row {row_number}: Service '{service_name}' already exists")
            continue

        # Check for duplicate service names within the import file
        duplicate_in_file = any(
            vr.get('service_name', '').lower() == service_name.lower()
            for vr in validated_rows
        )
        if duplicate_in_file:
            validation_errors.append(
                f"Row {row_number}: Service '{service_name}' is duplicated in the import file")
            continue

        # Store validated row data for phase 2
        validated_rows.append({
            'row_number': row_number,
            'service_name': service_name,
            'admin_user_ids': admin_user_ids
        })

    # If there are any validation errors, fail the entire import
    if validation_errors:
        return ImportResult(
            success_count=0,
            failed_count=len(df),
            errors=validation_errors
        )

    # Phase 2: All validations passed, now create all services
    # Use a transaction to ensure atomicity - all or nothing
    success_count = 0
    failed_count = 0
    errors = []

    try:
        # Create all services without committing (use flush instead of commit)
        created_services = []
        for row_data in validated_rows:
            try:
                # Create service without productIds and adminUserIds
                service_data = {
                    'name': row_data['service_name'],
                    'vendor': None,
                    'url': None
                }
                db_obj = ServiceModel(**service_data)
                db.add(db_obj)
                db.flush()  # Flush to get the ID but don't commit yet

                # Associate admin users if provided
                if row_data['admin_user_ids']:
                    for user_id in row_data['admin_user_ids']:
                        user = db.query(User).filter(
                            User.id == user_id).first()
                        if user:
                            db_obj.admins.append(user)

                created_services.append({
                    'service': db_obj,
                    'row_data': row_data
                })
                success_count += 1
            except Exception as e:
                # If any creation fails, rollback the transaction
                db.rollback()
                failed_count = len(validated_rows)
                errors.append(
                    f"Row {row_data['row_number']}: Failed to create service '{row_data['service_name']}': {str(e)}")
                # Add error for all remaining rows
                for remaining_row in validated_rows[validated_rows.index(row_data) + 1:]:
                    errors.append(
                        f"Row {remaining_row['row_number']}: Import failed due to previous error")
                break

        # Only commit and log if all creations succeeded
        if success_count == len(validated_rows):
            db.commit()  # Commit all services at once

            # Log all actions after successful commit
            for created_item in created_services:
                db_obj = created_item['service']
                row_data = created_item['row_data']
                details = {"name": db_obj.name}
                if row_data['admin_user_ids']:
                    details["adminUserIds"] = [
                        str(uid) for uid in row_data['admin_user_ids']]

                audit_log.log_action(
                    db,
                    actor_user_id=current_user.id,
                    action="service.create",
                    target_id=str(db_obj.id),
                    details=details
                )
        else:
            db.rollback()

    except Exception as e:
        # Rollback on any unexpected error
        db.rollback()
        failed_count = len(validated_rows)
        errors.append(f"Import failed: {str(e)}")

    return ImportResult(
        success_count=success_count,
        failed_count=failed_count,
        errors=errors
    )
