from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class WorkflowTaskBase(BaseModel):
    type: str
    status: str = "pending"
    details: Optional[str] = None
    due_date: Optional[datetime] = None


class WorkflowTaskCreate(WorkflowTaskBase):
    assignee_user_id: uuid.UUID
    target_user_id: Optional[uuid.UUID] = None  # Nullable for onboarding
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    employee_department: Optional[str] = None


class WorkflowTaskUpdate(BaseModel):
    status: Optional[str] = None
    comment: Optional[str] = None


class WorkflowTask(WorkflowTaskBase):
    id: uuid.UUID
    assignee_user_id: uuid.UUID
    target_user_id: Optional[uuid.UUID] = None  # Nullable for onboarding
    created_at: datetime
    updated_at: datetime
    # Employee details from HR system (stored directly in task)
    employee_name: Optional[str] = None
    employee_email: Optional[str] = None
    employee_department: Optional[str] = None

    class Config:
        from_attributes = True


class OnboardingWebhookRequest(BaseModel):
    employee: dict  # {"name": "...", "email": "...", "department": "..."}
