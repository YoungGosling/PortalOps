from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.crud import product as crud_product, audit_log
from app.core.deps import require_service_admin_or_higher, get_current_user
from app.schemas.service import Product, ProductCreateWithUrl, ProductCreate
from app.models.service import Product as ProductModel, Service as ServiceModel
from app.models.user import User
from app.models.payment import ProductStatus
import uuid
import pandas as pd
import io
from pydantic import BaseModel

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

    # Check if product with the same name already exists (case-insensitive)
    existing_product = db.query(ProductModel).filter(
        func.lower(ProductModel.name) == func.lower(product_in.name.strip())
    ).first()
    if existing_product:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Product already exists"
        )

    product_create_schema = ProductCreate(
        name=product_in.name,
        url=product_in.url,
        description=product_in.description,
        service_id=product_in.serviceId,
        status_id=product_in.statusId if product_in.statusId is not None else 1,
        adminUserIds=product_in.adminUserIds if hasattr(
            product_in, 'adminUserIds') else []
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

    # Log the action with admin info
    details = {
        "name": new_product.name,
        "service_id": str(new_product.service_id) if new_product.service_id else None
    }
    if product_in.adminUserIds:
        details["adminUserIds"] = [str(uid) for uid in product_in.adminUserIds]

    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.create",
        target_id=str(new_product.id),
        details=details
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


@router.get("/{product_id}/details")
def get_product_details(
    product_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get product details including administrators."""
    from app.schemas.service import AdminSimple

    product = crud_product.get(db, id=product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found"
        )

    # Return product with admins
    return {
        "id": product.id,
        "name": product.name,
        "url": product.url,
        "description": product.description,
        "service_id": product.service_id,
        "status_id": product.status_id,
        "admins": [AdminSimple(
            id=admin.id,
            name=admin.name,
            email=admin.email
        ) for admin in product.admins],
        "created_at": product.created_at,
        "updated_at": product.updated_at
    }


@router.get("", response_model=dict)
def get_products(
    serviceId: Optional[uuid.UUID] = None,
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    search: str = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get all products that the current user has access to.
    Optionally filter by serviceId and search by product name.
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
            db, service_id=serviceId, user_id=current_user.id, is_admin=is_admin, skip=skip, limit=limit, search=search
        )
    else:
        products, total = crud_product.get_products_for_user(
            db, user_id=current_user.id, is_admin=is_admin, skip=skip, limit=limit, search=search
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

        # Get product admins
        product_admins = [
            {
                "id": str(admin.id),
                "name": admin.name,
                "email": admin.email
            } for admin in product.admins
        ]

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
            "admins": product_admins,
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

    # Check if product with the same name already exists (case-insensitive)
    # Only check if the name has changed
    if product.name.strip().lower() != product_in.name.strip().lower():
        existing_product = db.query(ProductModel).filter(
            func.lower(ProductModel.name) == func.lower(
                product_in.name.strip()),
            ProductModel.id != product_id
        ).first()
        if existing_product:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Product already exists"
            )

    # Update product
    from app.schemas.service import ProductUpdate
    from app.models.payment import ProductStatus

    product_update = ProductUpdate(
        name=product_in.name,
        url=product_in.url,
        description=product_in.description,
        status_id=product_in.statusId if product_in.statusId is not None else product.status_id,
        adminUserIds=product_in.adminUserIds if hasattr(
            product_in, 'adminUserIds') else None
    )

    # Update service_id separately if provided
    if product_in.serviceId:
        product.service_id = product_in.serviceId

    updated_product = crud_product.update_with_admins(
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

    # Log the action with admin info
    details = {
        "name": updated_product.name,
        "service_id": str(updated_product.service_id) if updated_product.service_id else None
    }
    if hasattr(product_in, 'adminUserIds') and product_in.adminUserIds is not None:
        details["adminUserIds"] = [str(uid) for uid in product_in.adminUserIds]

    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.update",
        target_id=str(product_id),
        details=details
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


class ImportResult(BaseModel):
    success_count: int
    failed_count: int
    errors: List[str]


@router.post("/import", response_model=ImportResult)
async def import_products(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Import products from Excel file.
    Excel file should have columns: Product (required), Service (required), Description (optional), Status (optional), Administrator (optional).
    Administrator column can contain a single admin name or multiple admin names separated by commas.
    Each imported product will automatically create an incomplete payment record.
    """
    # Check if user is Admin (only Admin can import products)
    from app.core.deps import get_user_roles
    user_roles = get_user_roles(current_user.id, db)
    if "Admin" not in user_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only Admin can import products"
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
    required_columns = ['Product', 'Service']
    missing_columns = [
        col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(missing_columns)}"
        )

    # Filter out empty rows
    df = df.dropna(subset=['Product'], how='all')
    df = df[df['Product'].notna()]

    # Phase 1: Validate all rows without creating any data
    # This ensures "all or nothing" transaction semantics
    validation_errors = []
    validated_rows = []  # Store validated data for phase 2

    for idx, (_, row) in enumerate(df.iterrows()):
        row_number = idx + 2  # +2 because Excel rows start at 1 and we have a header row
        product_name = str(row['Product']).strip()

        # Validate product name
        if not product_name:
            validation_errors.append(
                f"Row {row_number}: Product name is empty")
            continue

        # Validate service name
        service_name = str(row['Service']).strip(
        ) if pd.notna(row['Service']) else None
        if not service_name:
            validation_errors.append(
                f"Row {row_number}: Service name is required")
            continue

        # Find service by name (case-insensitive)
        service = db.query(ServiceModel).filter(
            func.lower(ServiceModel.name) == func.lower(service_name)
        ).first()
        if not service:
            validation_errors.append(
                f"Row {row_number}: Service '{service_name}' not found")
            continue

        # Get optional description
        description = None
        if 'Description' in df.columns and pd.notna(row['Description']):
            description = str(row['Description']).strip()

        # Validate and get optional status
        status_id = 1  # Default to Active (id=1)
        if 'Status' in df.columns and pd.notna(row['Status']):
            status_name = str(row['Status']).strip()
            if status_name:  # Only validate if status is provided
                status_obj = db.query(ProductStatus).filter(
                    func.lower(ProductStatus.name) == func.lower(status_name)
                ).first()
                if status_obj:
                    status_id = status_obj.id
                else:
                    validation_errors.append(
                        f"Row {row_number}: Status '{status_name}' not found")
                    continue

        # Check if product already exists in database (case-insensitive)
        existing_product = db.query(ProductModel).filter(
            func.lower(ProductModel.name) == func.lower(product_name)
        ).first()
        if existing_product:
            validation_errors.append(
                f"Row {row_number}: Product '{product_name}' already exists in Product Inventory")
            continue

        # Check for duplicate product names within the import file
        duplicate_in_file = any(
            vr.get('product_name', '').lower() == product_name.lower()
            for vr in validated_rows
        )
        if duplicate_in_file:
            validation_errors.append(
                f"Row {row_number}: Product '{product_name}' is duplicated in the import file")
            continue

        # Validate and get optional administrators
        admin_user_ids = []
        if 'Administrator' in df.columns and pd.notna(row['Administrator']):
            admin_names_str = str(row['Administrator']).strip()
            if admin_names_str:
                # Split by comma and process each admin name
                admin_names = [name.strip()
                               for name in admin_names_str.split(',') if name.strip()]
                for admin_name in admin_names:
                    # Find user by name (case-insensitive)
                    admin_user = db.query(User).filter(
                        func.lower(User.name) == func.lower(admin_name)
                    ).first()
                    if admin_user:
                        admin_user_ids.append(admin_user.id)
                    else:
                        validation_errors.append(
                            f"Row {row_number}: Administrator '{admin_name}' not found in the system")

        # Store validated row data for phase 2
        validated_rows.append({
            'row_number': row_number,
            'product_name': product_name,
            'service_id': service.id,
            'service_name': service_name,
            'description': description,
            'status_id': status_id,
            'admin_user_ids': admin_user_ids
        })

    # If there are any validation errors, fail the entire import
    if validation_errors:
        return ImportResult(
            success_count=0,
            failed_count=len(df),
            errors=validation_errors
        )

    # Phase 2: All validations passed, now create all products
    # Use a transaction to ensure atomicity - all or nothing
    success_count = 0
    failed_count = 0
    errors = []

    try:
        # Create all products without committing (use flush instead of commit)
        created_products = []
        for row_data in validated_rows:
            try:
                # Create product directly without using create_with_payment_info
                # (which calls db.commit() internally)
                product_data = {
                    'name': row_data['product_name'],
                    'url': None,  # URL is not provided in import
                    'description': row_data['description'],
                    'service_id': row_data['service_id'],
                    'status_id': row_data['status_id']
                }
                db_obj = ProductModel(**product_data)
                db.add(db_obj)
                db.flush()  # Flush to get the ID but don't commit yet

                # Associate admin users if provided
                if row_data.get('admin_user_ids'):
                    for admin_user_id in row_data['admin_user_ids']:
                        admin_user = db.query(User).filter(
                            User.id == admin_user_id).first()
                        if admin_user:
                            db_obj.admins.append(admin_user)
                    db.flush()

                # Create an incomplete payment record linked to this product
                from app.models.payment import PaymentInfo
                payment_record = PaymentInfo(
                    product_id=db_obj.id,
                    status="incomplete",
                    payment_date=None,
                    usage_start_date=None,
                    usage_end_date=None,
                    reporter=current_user.name
                )
                db.add(payment_record)
                db.flush()  # Flush to get the payment record ID but don't commit yet

                created_products.append({
                    'product': db_obj,
                    'payment_record': payment_record,
                    'row_data': row_data
                })
                success_count += 1
            except Exception as e:
                # If any creation fails, rollback the transaction
                db.rollback()
                failed_count = len(validated_rows)
                errors.append(
                    f"Row {row_data['row_number']}: Failed to create product '{row_data['product_name']}': {str(e)}")
                # Add error for all remaining rows
                for remaining_row in validated_rows[validated_rows.index(row_data) + 1:]:
                    errors.append(
                        f"Row {remaining_row['row_number']}: Import failed due to previous error")
                break

        # Only commit and log if all creations succeeded
        if success_count == len(validated_rows):
            db.commit()  # Commit all products and payment records at once

            # Log all actions after successful commit
            for created_item in created_products:
                db_obj = created_item['product']
                row_data = created_item['row_data']
                details = {
                    "name": db_obj.name,
                    "service_id": str(db_obj.service_id),
                    "service_name": row_data['service_name'],
                    "imported": True
                }
                if row_data.get('admin_user_ids'):
                    details["adminUserIds"] = [
                        str(uid) for uid in row_data['admin_user_ids']]

                audit_log.log_action(
                    db,
                    actor_user_id=current_user.id,
                    action="product.create",
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
