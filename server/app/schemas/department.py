from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid


class DepartmentBase(BaseModel):
    name: str


class DepartmentCreate(DepartmentBase):
    pass


class DepartmentUpdate(DepartmentBase):
    pass


class Department(DepartmentBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    users: Optional[List[str]] = None  # List of user names in this department

    class Config:
        from_attributes = True


class DepartmentProductAssignment(BaseModel):
    """Request model for setting department product assignments."""
    product_ids: List[uuid.UUID]


class DepartmentProductAssignmentResponse(BaseModel):
    """Response model after setting department product assignments."""
    assigned_product_ids: List[str]
