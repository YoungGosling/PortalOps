from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import workflow_task, user, audit_log
from app.core.deps import get_current_active_user, verify_hr_webhook_key
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
    """
    employee_data = webhook_data.employee

    # Create or get the employee user
    existing_user = user.get_by_email(db, email=employee_data["email"])
    if not existing_user:
        from app.schemas.user import UserCreate
        user_create = UserCreate(
            name=employee_data["name"],
            email=employee_data["email"],
            department=employee_data.get("department")
        )
        new_user = user.create(db, obj_in=user_create)
        target_user_id = new_user.id
    else:
        target_user_id = existing_user.id

    # Find admins to assign tasks to
    # For simplicity, assign to the first admin found
    from app.models.user import Role, UserRole
    admin_role = db.query(Role).filter(Role.name == "Admin").first()
    if admin_role:
        admin_user_role = db.query(UserRole).filter(
            UserRole.role_id == admin_role.id).first()
        if admin_user_role:
            assignee_id = admin_user_role.user_id

            # Create onboarding task
            task_details = f"Onboard new employee: {employee_data['name']} ({employee_data['email']})"
            workflow_task.create_onboarding_task(
                db,
                assignee_id=assignee_id,
                target_user_id=target_user_id,
                details=task_details
            )

    return {"message": "Onboarding workflow triggered"}


@inbox_router.get("/tasks", response_model=List[WorkflowTask])
def read_user_tasks(
    status: Optional[str] = Query(None),
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get tasks assigned to the current user.
    """
    tasks = workflow_task.get_tasks_for_user(
        db, user_id=current_user.id, status=status)
    return tasks


@inbox_router.put("/tasks/{task_id}", status_code=204)
def update_task(
    task_id: uuid.UUID,
    task_update: WorkflowTaskUpdate,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Update task status and add comments.
    """
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Check if user is the assignee
    if existing_task.assignee_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only update tasks assigned to you"
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
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get specific task details.
    """
    existing_task = workflow_task.get(db, task_id)
    if not existing_task:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found"
        )

    # Check if user is the assignee
    if existing_task.assignee_user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only view tasks assigned to you"
        )

    return existing_task



