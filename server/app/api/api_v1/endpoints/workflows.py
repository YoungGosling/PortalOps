from typing import List, Optional
from datetime import datetime, date
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import case
from app.db.database import get_db
from app.crud import workflow_task, user, audit_log, department
from app.core.deps import get_current_active_user, require_admin, verify_hr_webhook_key
from app.core.config import settings
from app.schemas.workflow import WorkflowTask, WorkflowTaskUpdate, OnboardingWebhookRequest, ProductWithServiceAdmin
from app.models.user import User
from app.models.service import Product, Service
from app.models.department import Department
from app.models.permission import PermissionAssignment
import uuid
import os
import aiofiles
import logging

logger = logging.getLogger(__name__)

router = APIRouter()
inbox_router = APIRouter()

# Storage directory for checklist files (configured via environment variable)
STORAGE_DIR = settings.CHECKLIST_STORAGE_DIR
os.makedirs(STORAGE_DIR, exist_ok=True)


@router.post("/hr/onboarding", status_code=202)
def hr_onboarding_webhook(
    webhook_data: OnboardingWebhookRequest,
    _: bool = Depends(verify_hr_webhook_key),
    db: Session = Depends(get_db)
):
    """
    Secure webhook for HR system to trigger onboarding workflow.
    Accepts: name, email, department, position, hireDate
    Creates ONLY a task with employee metadata. No user record is created until admin completes the task.
    """
    employee_data = webhook_data.employee

    # Check if there's already a pending onboarding task for this email
    existing_task = db.query(workflow_task.model).filter(
        workflow_task.model.employee_email == employee_data["email"],
        workflow_task.model.type == "onboarding",
        workflow_task.model.status == "pending"
    ).first()

    if existing_task:
        return {"message": "Onboarding task already exists for this employee"}

    # Check if user already exists in the system
    existing_user = user.get_by_email(db, email=employee_data["email"])
    if existing_user:
        return {
            "message": "User already exists in the system",
            "detail": f"User {employee_data['email']} is already registered"
        }

    # Find any admin to use as the assignee (all admins will see all tasks)
    from app.models.user import Role, UserRole
    admin_role = db.query(Role).filter(Role.name == "Admin").first()
    if not admin_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin role not found in system"
        )

    admin_user_role = db.query(UserRole).filter(
        UserRole.role_id == admin_role.id
    ).first()

    if not admin_user_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No admin user found in system"
        )

    # Parse hire date if provided
    hire_date_obj = None
    if employee_data.get("hireDate"):
        try:
            hire_date_obj = datetime.strptime(
                employee_data["hireDate"], "%Y-%m-%d").date()
        except ValueError:
            pass

    # Create onboarding task WITHOUT creating a user record
    task_details = f"Onboard new employee: {employee_data['name']} ({employee_data['email']})"
    workflow_task.create_onboarding_task(
        db,
        assignee_id=admin_user_role.user_id,
        employee_name=employee_data["name"],
        employee_email=employee_data["email"],
        employee_department=employee_data.get("department"),
        employee_position=employee_data.get("position"),
        employee_hire_date=hire_date_obj,
        details=task_details
    )

    return {"message": "Onboarding workflow triggered successfully"}


@router.post("/hr/offboarding", status_code=202)
def hr_offboarding_webhook(
    webhook_data: OnboardingWebhookRequest,
    _: bool = Depends(verify_hr_webhook_key),
    db: Session = Depends(get_db)
):
    """
    Secure webhook for HR system to trigger offboarding workflow.
    Accepts: name, email, resignationDate
    Creates a task but does NOT delete the user. User is only deleted when admin completes the task.
    """
    employee_data = webhook_data.employee

    # Find the user to offboard
    existing_user = user.get_by_email(db, email=employee_data["email"])
    if not existing_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {employee_data['email']} not found in the system"
        )

    # Check if there's already a pending offboarding task
    existing_task = db.query(workflow_task.model).filter(
        workflow_task.model.employee_email == employee_data["email"],
        workflow_task.model.type == "offboarding",
        workflow_task.model.status == "pending"
    ).first()

    if existing_task:
        return {"message": "Offboarding task already exists for this employee"}

    # Find any admin to use as the assignee
    from app.models.user import Role, UserRole
    admin_role = db.query(Role).filter(Role.name == "Admin").first()
    if not admin_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Admin role not found in system"
        )

    admin_user_role = db.query(UserRole).filter(
        UserRole.role_id == admin_role.id
    ).first()

    if not admin_user_role:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No admin user found in system"
        )

    # Parse resignation date if provided
    resignation_date_obj = None
    if employee_data.get("resignationDate"):
        try:
            resignation_date_obj = datetime.strptime(
                employee_data["resignationDate"], "%Y-%m-%d").date()
        except ValueError:
            pass

    # Get department name for display
    dept_name = None
    if existing_user.department_id:
        dept = db.query(Department).filter(Department.id ==
                                           existing_user.department_id).first()
        if dept:
            dept_name = dept.name
    elif existing_user.department:
        dept_name = existing_user.department

    # Create offboarding task WITHOUT deleting the user
    task_details = f"Offboard employee: {existing_user.name} ({existing_user.email})"
    workflow_task.create_offboarding_task(
        db,
        assignee_id=admin_user_role.user_id,
        target_user_id=existing_user.id,
        employee_name=existing_user.name,
        employee_email=existing_user.email,
        employee_department=dept_name,
        employee_position=existing_user.position,
        employee_hire_date=existing_user.hire_date,
        employee_resignation_date=resignation_date_obj,
        details=task_details
    )

    return {"message": "Offboarding workflow triggered successfully"}


@inbox_router.get("/tasks")
def read_user_tasks(
    status: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get paginated list of workflow tasks. Returns pending tasks first.
    """
    from app.models.workflow import WorkflowTask as WorkflowTaskModel

    # Build query
    query = db.query(WorkflowTaskModel)

    # Filter by status if provided
    if status:
        query = query.filter(WorkflowTaskModel.status == status)

    # Sort: pending first, then by created_at descending
    query = query.order_by(
        case((WorkflowTaskModel.status == 'pending', 1), else_=0).desc(),
        WorkflowTaskModel.created_at.desc()
    )

    # Get total count
    total = query.count()

    # Apply pagination
    tasks = query.offset((page - 1) * limit).limit(limit).all()

    return {
        "data": [WorkflowTask.from_orm(task) for task in tasks],
        "pagination": {
            "total": total,
            "page": page,
            "limit": limit
        }
    }


@inbox_router.put("/tasks/{task_id}", status_code=204)
def update_task(
    task_id: uuid.UUID,
    task_update: WorkflowTaskUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update task status and add comments.
    Any admin can update any task.
    """
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Update task
    update_data = task_update.dict(exclude_unset=True)
    if "comment" in update_data:
        # Add comment to details
        comment = update_data.pop("comment")
        if existing_task.details:
            update_data["details"] = f"{existing_task.details}\n\nComment: {comment}"
        else:
            update_data["details"] = f"Comment: {comment}"

    workflow_task.update(db, db_obj=existing_task, obj_in=update_data)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="task.update",
        target_id=str(task_id),
        details=task_update.dict(exclude_unset=True)
    )


@inbox_router.get("/tasks/{task_id}", response_model=WorkflowTask)
def read_task(
    task_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get specific task details with product assignments and service admin information.
    For onboarding: Returns department's default product assignments.
    For offboarding: Returns user's current product assignments.
    """
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Build response with product assignments
    task_dict = {
        "id": existing_task.id,
        "type": existing_task.type,
        "status": existing_task.status,
        "assignee_user_id": existing_task.assignee_user_id,
        "target_user_id": existing_task.target_user_id,
        "details": existing_task.details,
        "due_date": existing_task.due_date,
        "employee_name": existing_task.employee_name,
        "employee_email": existing_task.employee_email,
        "employee_department": existing_task.employee_department,
        "employee_position": existing_task.employee_position,
        "employee_hire_date": existing_task.employee_hire_date,
        "employee_resignation_date": existing_task.employee_resignation_date,
        "attachment_path": existing_task.attachment_path,
        "attachment_original_name": existing_task.attachment_original_name,
        "created_at": existing_task.created_at,
        "updated_at": existing_task.updated_at,
        "assigned_products": []
    }

    # Get product assignments based on task type
    if existing_task.type == "onboarding":
        # For completed onboarding tasks, use saved snapshot (actual assigned products)
        # For pending onboarding tasks, use department's default products
        if existing_task.product_assignments_snapshot:
            # Use saved snapshot for completed tasks (shows actual assigned products)
            task_dict["assigned_products"] = existing_task.product_assignments_snapshot
            logger.info(
                f"Using product assignments snapshot for completed onboarding task {task_id}")
        elif existing_task.employee_department:
            # Get department's default products for pending tasks
            dept = department.get_by_name(
                db, name=existing_task.employee_department)
            if dept:
                products = department.get_department_products(
                    db, department_id=dept.id)
                task_dict["assigned_products"] = _build_product_list_with_admins(
                    db, products)

    elif existing_task.type == "offboarding":
        # For offboarding, first try to use saved snapshot (if task is completed)
        # Otherwise, get user's current product assignments
        if existing_task.product_assignments_snapshot:
            # Use saved snapshot (user may have been deleted)
            task_dict["assigned_products"] = existing_task.product_assignments_snapshot
            logger.info(
                f"Using product assignments snapshot for offboarding task {task_id}")
        elif existing_task.target_user_id:
            # Get all permission assignments for this user (for pending tasks)
            permissions = db.query(PermissionAssignment).filter(
                PermissionAssignment.user_id == existing_task.target_user_id,
                PermissionAssignment.product_id.isnot(None)
            ).all()

            product_ids = [p.product_id for p in permissions]
            if product_ids:
                products = db.query(Product).options(
                    joinedload(Product.service)
                ).filter(Product.id.in_(product_ids)).all()
                task_dict["assigned_products"] = _build_product_list_with_admins(
                    db, products)

    return WorkflowTask(**task_dict)


def _build_product_list_with_admins(db: Session, products: List[Product]) -> List[dict]:
    """Helper function to build product list with service admin information."""
    result = []
    for product in products:
        service_admins = []
        if product.service:
            # Get service admins through the relationship
            # Service.admins is a many-to-many relationship with User
            for admin_user in product.service.admins:
                service_admins.append({
                    "name": admin_user.name,
                    "email": admin_user.email
                })

        result.append({
            "product_id": str(product.id),
            "product_name": product.name,
            "service_name": product.service.name if product.service else "N/A",
            "service_admins": service_admins
        })

    return result


@inbox_router.post("/tasks/{task_id}/attachment")
async def upload_task_attachment(
    task_id: uuid.UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Upload checklist attachment for a workflow task.
    Only one file per task - replaces existing if present.
    Supports PDF, DOCX, XLSX, XLS, PPTX, TXT, CSV, JPG, JPEG, PNG formats.
    """
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if not file.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No file provided"
        )

    # Validate file extension - support common document and image formats
    file_extension = os.path.splitext(file.filename)[1].lower()
    allowed_extensions = ['.pdf', '.docx', '.xlsx', '.xls',
                          '.pptx', '.txt', '.csv', '.jpg', '.jpeg', '.png']
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not supported. Allowed formats: {', '.join(allowed_extensions)}"
        )

    # Generate unique filename
    unique_filename = f"{task_id}_{uuid.uuid4()}{file_extension}"
    file_path = os.path.join(STORAGE_DIR, unique_filename)

    # Delete old attachment if exists
    if existing_task.attachment_path and os.path.exists(existing_task.attachment_path):
        try:
            os.remove(existing_task.attachment_path)
        except Exception:
            pass  # Continue even if deletion fails

    # Save file
    try:
        async with aiofiles.open(file_path, 'wb') as f:
            content = await file.read()
            await f.write(content)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to save file: {str(e)}"
        )

    # Update task with attachment path and original filename
    workflow_task.update_attachment_path(
        db, task_id=task_id, attachment_path=file_path, attachment_original_name=file.filename)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="task.attachment_upload",
        target_id=str(task_id),
        details={"filename": file.filename, "path": file_path}
    )

    return {
        "message": "Attachment uploaded successfully",
        "filename": file.filename,
        "path": file_path
    }


@inbox_router.get("/tasks/{task_id}/attachment")
async def download_task_attachment(
    task_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Download the attachment file for a workflow task."""
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    if not existing_task.attachment_path or not os.path.exists(existing_task.attachment_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Attachment not found"
        )

    # Use original filename if available, otherwise use the stored filename
    download_filename = existing_task.attachment_original_name or os.path.basename(
        existing_task.attachment_path)

    return FileResponse(
        path=existing_task.attachment_path,
        filename=download_filename,
        media_type='application/octet-stream'
    )


@inbox_router.post("/tasks/{task_id}/complete", status_code=204)
def complete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Complete a workflow task and trigger associated backend logic.
    Requires attachment to be uploaded before completion.

    For ONBOARDING: Expects user to be created first via Employee Directory, then marks task complete.
    For OFFBOARDING: Deletes the user and marks task as complete.
    """
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Check if already completed
    if existing_task.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task has already been completed"
        )

    # Validate attachment exists
    if not existing_task.attachment_path or not os.path.exists(existing_task.attachment_path):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Checklist attachment must be uploaded before completing the task"
        )

    # Handle based on task type
    if existing_task.type == "onboarding":
        # For onboarding, verify that the user has been created
        created_user = user.get_by_email(
            db, email=existing_task.employee_email)
        if not created_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User must be created before completing onboarding task"
            )

        # IMPORTANT: Save product assignments snapshot for the onboarded user
        # This ensures that when viewing completed onboarding tasks, we see the actual
        # products assigned to the user (including any manually added), not just department defaults
        permissions = db.query(PermissionAssignment).filter(
            PermissionAssignment.user_id == created_user.id,
            PermissionAssignment.product_id.isnot(None)
        ).all()

        product_ids = [p.product_id for p in permissions]
        product_assignments_snapshot = []

        if product_ids:
            products = db.query(Product).options(
                joinedload(Product.service)
            ).filter(Product.id.in_(product_ids)).all()
            product_assignments_snapshot = _build_product_list_with_admins(
                db, products)

        logger.info(
            f"Saved {len(product_assignments_snapshot)} product assignments for onboarding task {task_id}")

        # Update task with the created user's ID and product assignments snapshot
        workflow_task.update(db, db_obj=existing_task, obj_in={
            "target_user_id": created_user.id,
            "status": "completed",
            "product_assignments_snapshot": product_assignments_snapshot
        })

        # Log the action
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="user.onboard",
            target_id=str(created_user.id),
            details={
                "task_id": str(task_id),
                "email": existing_task.employee_email,
                "attachment": existing_task.attachment_path
            }
        )

    elif existing_task.type == "offboarding":
        # For offboarding, delete the user
        if not existing_task.target_user_id:
            logger.warning(
                f"Offboarding task {task_id} has no target_user_id, skipping user deletion but marking as complete")
            # Still mark task as completed even if target_user_id is missing
            workflow_task.update(db, db_obj=existing_task,
                                 obj_in={"status": "completed"})
        else:
            target_user = user.get(db, existing_task.target_user_id)
            if target_user:
                # IMPORTANT: Save product assignments snapshot BEFORE deleting user
                # (permissions will be CASCADE deleted with the user)
                permissions = db.query(PermissionAssignment).filter(
                    PermissionAssignment.user_id == existing_task.target_user_id,
                    PermissionAssignment.product_id.isnot(None)
                ).all()

                product_ids = [p.product_id for p in permissions]
                product_assignments_snapshot = []

                if product_ids:
                    products = db.query(Product).options(
                        joinedload(Product.service)
                    ).filter(Product.id.in_(product_ids)).all()
                    product_assignments_snapshot = _build_product_list_with_admins(
                        db, products)

                logger.info(
                    f"Saved {len(product_assignments_snapshot)} product assignments for offboarding task {task_id}")

                # Log before deletion (audit trail)
                audit_log.log_action(
                    db,
                    actor_user_id=current_user.id,
                    action="user.offboard",
                    target_id=str(existing_task.target_user_id),
                    details={
                        "task_id": str(task_id),
                        "email": target_user.email,
                        "name": target_user.name,
                        "department": existing_task.employee_department,
                        "position": existing_task.employee_position,
                        "hire_date": str(existing_task.employee_hire_date) if existing_task.employee_hire_date else None,
                        "resignation_date": str(existing_task.employee_resignation_date) if existing_task.employee_resignation_date else None,
                        "attachment": existing_task.attachment_path,
                        "product_count": len(product_assignments_snapshot)
                    }
                )

                # Delete the user (CASCADE will handle related records)
                user.remove(db, id=existing_task.target_user_id)
                logger.info(
                    f"User {existing_task.target_user_id} deleted successfully for offboarding task {task_id}")

                # Mark task as completed and save product assignments snapshot
                workflow_task.update(db, db_obj=existing_task,
                                     obj_in={
                                         "status": "completed",
                                         "product_assignments_snapshot": product_assignments_snapshot
                                     })
            else:
                logger.warning(
                    f"User {existing_task.target_user_id} not found for offboarding task {task_id}, already deleted or invalid ID")
                # Mark task as completed even if user not found
                workflow_task.update(db, db_obj=existing_task,
                                     obj_in={"status": "completed"})

            logger.info(f"Offboarding task {task_id} marked as completed")

    # Log task completion
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="task.complete",
        target_id=str(task_id),
        details={"type": existing_task.type}
    )


@inbox_router.delete("/tasks/{task_id}", status_code=204)
def delete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a completed workflow task and its attachment."""
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Only allow deletion of completed tasks
    if existing_task.status != 'completed':
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only completed tasks can be deleted"
        )

    # Delete attachment file if exists
    if existing_task.attachment_path and os.path.exists(existing_task.attachment_path):
        try:
            os.remove(existing_task.attachment_path)
        except Exception:
            pass

    # Delete task from database
    workflow_task.remove(db, id=task_id)

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="task.delete",
        target_id=str(task_id),
        details={"employee_name": existing_task.employee_name}
    )
