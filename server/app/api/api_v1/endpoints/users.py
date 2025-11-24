from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.db.database import get_db
from app.crud import user, audit_log
from app.core.deps import require_any_admin_role, require_admin, get_user_roles
from app.schemas.user import User, UserCreate, UserUpdate, UserPermissionUpdate, UserUpdateV2
from app.models.user import User as UserModel
from app.models.sap_user import SapUser
from app.models.service import Product as ProductModel
from app.models.permission import PermissionAssignment
from pydantic import BaseModel
import uuid
import pandas as pd
import io

router = APIRouter()


@router.get("", response_model=dict)
def read_users(
    search: Optional[str] = Query(None),
    productId: Optional[uuid.UUID] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    sortBy: Optional[str] = Query(None),
    sortOrder: Optional[str] = Query("asc"),
    is_active: Optional[bool] = Query(True, description="Filter by active status (default: true)"),
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve users with pagination and search.
    Optionally filter by productId, is_active status, and sort by column.
    Returns statistics: total, active, and inactive user counts.
    """
    skip = (page - 1) * limit
    
    # Get statistics (total, active, inactive counts)
    stats = user.get_user_statistics(db, search=search, product_id=productId)
    
    # Get filtered users
    users = user.search_users(
        db, search=search, product_id=productId, skip=skip, limit=limit, 
        sort_by=sortBy, sort_order=sortOrder, is_active=is_active)

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

        # Get SAP IDs for this user
        sap_users = db.query(SapUser).filter(SapUser.user_id == u.id).all()
        sap_ids = [sap.sap_id for sap in sap_users]

        # v3: Get department name from relationship if department_id is set
        # Legacy field (for backward compatibility)
        department_name = u.department
        if u.department_id and u.dept_ref:
            department_name = u.dept_ref.name

        user_data.append({
            "id": str(u.id),
            "name": u.name,
            "email": u.email,
            "department": department_name,
            "department_id": str(u.department_id) if u.department_id else None,
            "position": u.position,
            "hire_date": u.hire_date.isoformat() if u.hire_date else None,
            "resignation_date": u.resignation_date.isoformat() if u.resignation_date else None,
            "is_active": u.is_active,
            "roles": roles,
            "assignedProductIds": assigned_product_ids,
            "sap_ids": sap_ids
        })

    # Get total count for current filter
    total_filtered = len(user.search_users(db, search=search, product_id=productId,
                      skip=0, limit=1000, sort_by=None, sort_order=None, is_active=is_active))

    return {
        "data": user_data,
        "pagination": {
            "total": total_filtered,
            "page": page,
            "limit": limit
        },
        "statistics": {
            "total": stats["total"],
            "active": stats["active"],
            "inactive": stats["inactive"]
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
    v4: Database triggers automatically assign department products when user is created with department_id.
    Manual product assignments are tracked separately with assignment_source='manual'.
    """
    from app.models.permission import PermissionAssignment
    
    # Check if user already exists
    existing_user = user.get_by_email(db, email=user_in.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User with this email already exists"
        )

    # Create user - database trigger will automatically assign department products
    new_user = user.create(db, obj_in=user_in)

    # Assign role if provided
    if user_in.role:
        user.assign_role(db, user_id=new_user.id, role_name=user_in.role)

    # Assign manual products if provided
    # 🔑 关键修复：手动指定的产品优先，即使与部门产品重叠也标记为 manual
    if user_in.assignedProductIds:
        for product_id in user_in.assignedProductIds:
            # Check if already assigned by department trigger
            existing = db.query(PermissionAssignment).filter(
                PermissionAssignment.user_id == new_user.id,
                PermissionAssignment.product_id == product_id
            ).first()
            
            if existing:
                # 🔑 如果已存在（由部门触发器创建），改为 manual 来源
                # 这确保用户创建时手动指定的产品不受后续部门同步影响
                existing.assignment_source = 'manual'
            else:
                # 添加新的 manual assignment
                manual_assignment = PermissionAssignment(
                    user_id=new_user.id,
                    product_id=product_id,
                    assignment_source='manual'
                )
                db.add(manual_assignment)
        
        db.commit()

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="user.create",
        target_id=str(new_user.id),
        details={
            "email": new_user.email,
            "name": new_user.name,
            "department": user_in.department,
            "department_id": str(user_in.department_id) if user_in.department_id else None,
            "position": user_in.position,
            "hire_date": user_in.hire_date.isoformat() if user_in.hire_date else None,
            "resignation_date": user_in.resignation_date.isoformat() if user_in.resignation_date else None,
            "role": user_in.role,
            "manual_product_assignments": [str(pid) for pid in (user_in.assignedProductIds or [])],
            "note": "Department products automatically assigned by database trigger"
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
    Update user (v4 - with automatic department product sync).
    Database triggers automatically handle:
    - Syncing department products when department_id changes
    - Removing old department products, adding new department products
    - Preserving manual product assignments
    """
    from app.models.permission import PermissionAssignment
    
    target_user = user.get(db, user_id)
    if not target_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update basic fields - database trigger will handle department product sync
    basic_update = UserUpdate(
        name=user_update.name,
        email=user_update.email,
        department=user_update.department,
        department_id=user_update.department_id,
        position=user_update.position,
        hire_date=user_update.hire_date,
        resignation_date=user_update.resignation_date if user_update.resignation_date else None
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
    # 🔑 关键修复：手动操作优先，可以覆盖或删除部门分配的产品
    if user_update.assignedProductIds is not None:
        # Get ALL current product assignments (both manual and department)
        all_assignments = db.query(PermissionAssignment).filter(
            PermissionAssignment.user_id == user_id,
            PermissionAssignment.product_id.isnot(None)
        ).all()
        
        current_all_product_ids = {str(a.product_id) for a in all_assignments}
        new_product_ids = {str(pid) for pid in user_update.assignedProductIds}
        
        # 🔑 删除不在新列表中的产品（不管来源是什么）
        # 这允许管理员取消部门分配的产品
        products_to_remove = current_all_product_ids - new_product_ids
        for product_id_str in products_to_remove:
            db.query(PermissionAssignment).filter(
                PermissionAssignment.user_id == user_id,
                PermissionAssignment.product_id == uuid.UUID(product_id_str)
            ).delete()  # 删除所有来源的记录
        
        # 🔑 添加新产品或更新现有产品为 manual
        # 这允许管理员手动添加产品，即使部门没有
        products_to_add = new_product_ids - current_all_product_ids
        for product_id_str in products_to_add:
            manual_assignment = PermissionAssignment(
                user_id=user_id,
                product_id=uuid.UUID(product_id_str),
                assignment_source='manual'  # 新添加的标记为手动
            )
            db.add(manual_assignment)
        
        # 🔑 对于已存在的产品，如果它是 department 来源，改为 manual
        # 这确保手动操作后，该产品不再受部门同步影响
        products_to_keep = new_product_ids & current_all_product_ids
        for product_id_str in products_to_keep:
            existing = db.query(PermissionAssignment).filter(
                PermissionAssignment.user_id == user_id,
                PermissionAssignment.product_id == uuid.UUID(product_id_str)
            ).first()
            
            if existing and existing.assignment_source == 'department':
                # 将部门分配改为手动分配，避免被后续部门同步覆盖
                existing.assignment_source = 'manual'
        
        db.commit()

    # Log the action
    update_details = user_update.model_dump(exclude_unset=True)
    # Convert UUID objects to strings for JSON serialization
    if "assignedProductIds" in update_details and update_details["assignedProductIds"]:
        update_details["assignedProductIds"] = [
            str(pid) for pid in update_details["assignedProductIds"]]
        update_details["note"] = "Manual product assignments only, department products auto-synced by trigger"
    if "department_id" in update_details and update_details["department_id"]:
        update_details["department_id"] = str(update_details["department_id"])
        update_details["department_sync_note"] = "Department products automatically synced by database trigger"

    # Convert date objects to strings for JSON serialization
    if "hire_date" in update_details and update_details["hire_date"]:
        update_details["hire_date"] = update_details["hire_date"].isoformat()
    if "resignation_date" in update_details and update_details["resignation_date"]:
        update_details["resignation_date"] = update_details["resignation_date"].isoformat()

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


class ImportAssignmentsResult(BaseModel):
    success_count: int
    failed_count: int
    errors: List[str]


@router.post("/import-assignments", response_model=ImportAssignmentsResult)
async def import_product_assignments(
    file: UploadFile = File(...),
    current_user: UserModel = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Import user-product assignments from Excel file.
    Excel file should have Employee and Email as first two columns,
    followed by product columns with 'Y' marking assignments.
    
    All users in the Excel file must exist in the system, otherwise the entire import will fail.
    """
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
    required_columns = ['Employee', 'Email']
    missing_columns = [col for col in required_columns if col not in df.columns]
    if missing_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Missing required columns: {', '.join(missing_columns)}"
        )

    # Filter out empty rows
    df = df.dropna(how='all')
    df = df[df['Email'].notna()]

    # Get product columns (all columns except Employee and Email)
    product_columns = [col for col in df.columns if col not in ['Employee', 'Email']]
    
    if not product_columns:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No product columns found in Excel file"
        )

    # Phase 1: Validate all users exist in the system
    validation_errors = []
    user_email_to_id = {}
    
    for idx, (_, row) in enumerate(df.iterrows()):
        row_number = idx + 2  # Excel row number (1-indexed + header)
        
        employee_name = str(row['Employee']).strip() if pd.notna(row['Employee']) else ""
        email = str(row['Email']).strip().lower() if pd.notna(row['Email']) else ""
        
        if not employee_name or not email:
            validation_errors.append(f"Row {row_number}: Employee name or email is empty")
            continue
        
        # Check if user exists in database
        existing_user = db.query(UserModel).filter(
            func.lower(UserModel.email) == email
        ).first()
        
        if not existing_user:
            validation_errors.append(
                f"Row {row_number}: User '{employee_name}' ({email}) not found in system"
            )
        else:
            user_email_to_id[email] = existing_user.id
    
    # If any user validation fails, return errors without importing anything
    if validation_errors:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Validation failed. All users must exist in the system before import. Errors: {'; '.join(validation_errors)}"
        )

    # Phase 2: Get product mapping
    product_name_to_id = {}
    products = db.query(ProductModel).all()
    for product in products:
        normalized_name = product.name.strip().lower()
        product_name_to_id[normalized_name] = product.id

    # Phase 3: Process assignments
    assignments_to_create = []
    errors = []
    success_count = 0
    failed_count = 0
    
    for idx, (_, row) in enumerate(df.iterrows()):
        row_number = idx + 2  # Excel row number (1-indexed + header)
        email = str(row['Email']).strip().lower()
        user_id = user_email_to_id[email]
        employee_name = str(row['Employee']).strip() if pd.notna(row['Employee']) else ""
        
        # Process each product column
        for product_col in product_columns:
            cell_value = row[product_col]
            
            # Check if marked as 'Y'
            if pd.notna(cell_value) and str(cell_value).strip().upper() == 'Y':
                normalized_product_name = product_col.strip().lower()
                product_id = product_name_to_id.get(normalized_product_name)
                
                if not product_id:
                    errors.append(f"Row {row_number}: Product '{product_col}' not found in Product Inventory")
                    failed_count += 1
                    continue
                
                # Check if assignment already exists
                existing = db.query(PermissionAssignment).filter(
                    PermissionAssignment.user_id == user_id,
                    PermissionAssignment.product_id == product_id
                ).first()
                
                if existing:
                    errors.append(f"Row {row_number}: Product '{product_col}' is already assigned to '{employee_name}'")
                    failed_count += 1
                else:
                    assignments_to_create.append({
                        'user_id': user_id,
                        'product_id': product_id,
                        'assignment_source': 'manual'
                    })

    # Phase 4: Batch insert assignments
    if assignments_to_create:
        try:
            for assignment in assignments_to_create:
                new_assignment = PermissionAssignment(**assignment)
                db.add(new_assignment)
            db.commit()
            success_count = len(assignments_to_create)
        except Exception as e:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to insert assignments: {str(e)}"
            )

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="user.import_assignments",
        target_id=str(current_user.id),
        details={
            "filename": file.filename,
            "rows_processed": len(df),
            "assignments_created": success_count,
            "failed_count": failed_count
        }
    )

    return ImportAssignmentsResult(
        success_count=success_count,
        failed_count=failed_count,
        errors=errors
    )
