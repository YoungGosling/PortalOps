from typing import List, Optional
from sqlalchemy.orm import Session
from app.crud.base import CRUDBase
from app.models.workflow import WorkflowTask
from app.schemas.workflow import WorkflowTaskCreate, WorkflowTaskUpdate
import uuid


class CRUDWorkflowTask(CRUDBase[WorkflowTask, WorkflowTaskCreate, WorkflowTaskUpdate]):
    def get_tasks_for_user(
        self, db: Session, *, user_id: uuid.UUID, status: Optional[str] = None
    ) -> List[WorkflowTask]:
        """Get tasks assigned to a specific user."""
        query = db.query(WorkflowTask).filter(
            WorkflowTask.assignee_user_id == user_id)

        if status:
            query = query.filter(WorkflowTask.status == status)

        return query.order_by(WorkflowTask.created_at.desc()).all()

    def get_pending_tasks(self, db: Session) -> List[WorkflowTask]:
        """Get all pending tasks for reminder notifications."""
        return db.query(WorkflowTask).filter(WorkflowTask.status == 'pending').all()

    def create_onboarding_task(
        self, db: Session, *, assignee_id: uuid.UUID, target_user_id: uuid.UUID, details: str
    ) -> WorkflowTask:
        """Create an onboarding task."""
        task = WorkflowTask(
            type="onboarding",
            assignee_user_id=assignee_id,
            target_user_id=target_user_id,
            details=details,
            status="pending"
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    def create_offboarding_task(
        self, db: Session, *, assignee_id: uuid.UUID, target_user_id: uuid.UUID, details: str
    ) -> WorkflowTask:
        """Create an offboarding task."""
        task = WorkflowTask(
            type="offboarding",
            assignee_user_id=assignee_id,
            target_user_id=target_user_id,
            details=details,
            status="pending"
        )
        db.add(task)
        db.commit()
        db.refresh(task)
        return task


workflow_task = CRUDWorkflowTask(WorkflowTask)



