from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime, date
import uuid


class UserBase(BaseModel):
    name: str
    email: EmailStr
    # Deprecated: kept for backward compatibility
    department: Optional[str] = None
    department_id: Optional[uuid.UUID] = None  # v3: FK to departments table
    position: Optional[str] = None
    hire_date: Optional[date] = None
    resignation_date: Optional[date] = None


class UserCreate(UserBase):
    password: Optional[str] = None
    role: Optional[str] = None  # Single role: "Admin" or "Service Admin"
    assignedProductIds: Optional[List[uuid.UUID]] = []

    def __init__(self, **data):
        # Ensure resignation_date defaults to None
        if 'resignation_date' not in data:
            data['resignation_date'] = None
        super().__init__(**data)


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None  # Deprecated
    department_id: Optional[uuid.UUID] = None  # v3: FK to departments
    position: Optional[str] = None
    hire_date: Optional[date] = None
    resignation_date: Optional[date] = None
    password: Optional[str] = None


class User(UserBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserWithRoles(User):
    roles: List[str] = []


class UserPermissions(BaseModel):
    services: List[str] = []
    products: List[str] = []


class UserPermissionUpdate(BaseModel):
    roles: List[str]
    # {"services": {"add": [...], "remove": [...]}, "products": {...}}
    assignments: Dict[str, Dict[str, List[str]]]


class UserUpdateV2(BaseModel):
    """Unified update schema for v2 - combines basic info and permissions."""
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    # Deprecated: kept for backward compatibility
    department: Optional[str] = None
    department_id: Optional[uuid.UUID] = None  # v3: FK to departments table
    position: Optional[str] = None
    hire_date: Optional[date] = None
    resignation_date: Optional[date] = None
    role: Optional[str] = None  # Single role: "Admin" or "Service Admin"
    assignedProductIds: Optional[List[uuid.UUID]] = []
