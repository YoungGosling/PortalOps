from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid


class UserBase(BaseModel):
    name: str
    email: EmailStr
    department: Optional[str] = None


class UserCreate(UserBase):
    password: Optional[str] = None
    role: Optional[str] = None  # Single role: "Admin" or "ServiceAdmin"
    assignedProductIds: Optional[List[uuid.UUID]] = []


class UserUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    department: Optional[str] = None
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
    department: Optional[str] = None
    role: Optional[str] = None  # Single role: "Admin" or "ServiceAdmin"
    assignedProductIds: Optional[List[uuid.UUID]] = []
