from pydantic import BaseModel
from typing import Optional, Dict, Any
from datetime import datetime
import uuid


class AuditLogBase(BaseModel):
    action: str
    target_id: Optional[str] = None
    details: Optional[Dict[str, Any]] = None


class AuditLogCreate(AuditLogBase):
    actor_user_id: uuid.UUID


class AuditLog(AuditLogBase):
    id: uuid.UUID
    actor_user_id: uuid.UUID
    created_at: datetime
    actor: Optional[dict] = None  # Will be populated with user info

    class Config:
        from_attributes = True



