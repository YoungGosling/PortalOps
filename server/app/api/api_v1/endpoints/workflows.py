from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import workflow_task, user, audit_log
from app.core.deps import get_current_active_user, require_admin, verify_hr_webhook_key
from app.schemas.workflow import WorkflowTask, WorkflowTaskUpdate, OnboardingWebhookRequest
from app.models.user import User
import uuid

router = APIRouter()
inbox_router = APIRouter()


@router.post("/hr/onboarding", status_code=202)
def hr_onboarding_webhook(
    webhook_data: OnboardingWebhookRequest,
    _: bool = Depends(verify_hr_webhook_key),
    db: Session = Depends(get_db)
):
    """
    Secure webhook for HR system to trigger onboarding workflow.
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
    # We still need an assignee_id for database constraints, but it's now just a placeholder
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

    # Create onboarding task WITHOUT creating a user record
    # Note: assignee_id is now just a placeholder - all admins can see and process all tasks
    task_details = f"Onboard new employee: {employee_data['name']} ({employee_data['email']})"
    workflow_task.create_onboarding_task(
        db,
        assignee_id=admin_user_role.user_id,
        employee_name=employee_data["name"],
        employee_email=employee_data["email"],
        employee_department=employee_data.get("department"),
        details=task_details
    )

    return {"message": "Onboarding workflow triggered successfully"}


@router.post("/hr/offboarding", status_code=202)
def hr_offboarding_webhook(
    webhook_data: OnboardingWebhookRequest,  # Same schema, contains employee data
    _: bool = Depends(verify_hr_webhook_key),
    db: Session = Depends(get_db)
):
    """
    Secure webhook for HR system to trigger offboarding workflow.
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

    # Find any admin to use as the assignee (all admins will see all tasks)
    # We still need an assignee_id for database constraints, but it's now just a placeholder
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

    # Create offboarding task WITHOUT deleting the user
    # Note: assignee_id is now just a placeholder - all admins can see and process all tasks
    task_details = f"Offboard employee: {employee_data['name']} ({employee_data['email']})"
    workflow_task.create_offboarding_task(
        db,
        assignee_id=admin_user_role.user_id,
        target_user_id=existing_user.id,
        employee_name=existing_user.name,
        employee_email=existing_user.email,
        employee_department=existing_user.department,
        details=task_details
    )

    return {"message": "Offboarding workflow triggered successfully"}


@inbox_router.get("/tasks", response_model=List[WorkflowTask])
def read_user_tasks(
    status: Optional[str] = Query(None),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Get all tasks visible to admin users (Admin only).
    All admins see the same tasks regardless of who they're assigned to.
    Employee details are now stored directly in the task.
    """
    tasks = workflow_task.get_all_admin_tasks(db, status=status)

    # Tasks now have employee_name, employee_email, employee_department directly
    # No need to look up from users table
    return tasks


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

    # No assignee check - any admin can update any task

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
    Get specific task details.
    Any admin can view any task.
    """
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # No assignee check - any admin can view any task

    return existing_task


@inbox_router.post("/tasks/{task_id}/complete", status_code=204)
def complete_task(
    task_id: uuid.UUID,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Complete a workflow task and trigger associated backend logic.
    Any admin can complete any task. Prevents duplicate processing.

    For ONBOARDING: This endpoint is called AFTER the admin has successfully created the user
    via the User Directory's create endpoint. This endpoint just marks the task as complete.

    For OFFBOARDING: This endpoint DELETES the user and marks the task as complete.

    Flow:
    - Onboarding: Frontend creates user -> if successful -> calls this to mark task complete
    - Offboarding: Frontend calls this directly -> deletes user -> marks task complete
    """
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # No assignee check - any admin can complete any task

    # Check if already completed (protection against duplicate processing)
    if existing_task.status == "completed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Task has already been completed by another admin"
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

        # Update task with the created user's ID
        workflow_task.update(db, db_obj=existing_task, obj_in={
            "target_user_id": created_user.id,
            "status": "completed"
        })

        # Log the action
        audit_log.log_action(
            db,
            actor_user_id=current_user.id,
            action="user.onboard",
            target_id=str(created_user.id),
            details={"task_id": str(
                task_id), "email": existing_task.employee_email}
        )

    elif existing_task.type == "offboarding":
        # For offboarding, delete the user
        if not existing_task.target_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot offboard: target user not found"
            )

        target_user = user.get(db, existing_task.target_user_id)
        if target_user:
            user.remove(db, id=existing_task.target_user_id)

            # Log the action
            audit_log.log_action(
                db,
                actor_user_id=current_user.id,
                action="user.offboard",
                target_id=str(existing_task.target_user_id),
                details={"task_id": str(task_id), "email": target_user.email}
            )

        # Mark task as completed
        workflow_task.update(db, db_obj=existing_task,
                             obj_in={"status": "completed"})

    # Log task completion
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="task.complete",
        target_id=str(task_id),
        details={"type": existing_task.type}
    )
