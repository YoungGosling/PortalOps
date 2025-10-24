from pydantic import BaseModel
from typing import Optional, List, Dict
from datetime import datetime, date
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
    employee_position: Optional[str] = None
    employee_hire_date: Optional[date] = None
    employee_resignation_date: Optional[date] = None


class WorkflowTaskUpdate(BaseModel):
    status: Optional[str] = None
    comment: Optional[str] = None
    attachment_path: Optional[str] = None


class ProductWithServiceAdmin(BaseModel):
    product_id: str
    product_name: str
    service_name: str
    service_admins: List[Dict[str, str]]  # [{"name": "...", "email": "..."}]


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
    employee_position: Optional[str] = None
    employee_hire_date: Optional[date] = None
    employee_resignation_date: Optional[date] = None
    attachment_path: Optional[str] = None
    attachment_original_name: Optional[str] = None
    # Product assignments with service admin info
    assigned_products: Optional[List[ProductWithServiceAdmin]] = None

    class Config:
        from_attributes = True


class OnboardingWebhookRequest(BaseModel):
    # {"name": "...", "email": "...", "department": "...", "position": "...", "hireDate": "..."} for onboarding
    employee: dict
    # {"name": "...", "email": "...", "resignationDate": "..."} for offboarding
