from typing import List, Optional
from sqlalchemy.orm import Session, joinedload
from app.crud.base import CRUDBase
from app.models.audit import AuditLog
from app.models.user import User
from app.schemas.audit import AuditLogCreate
import uuid


class CRUDAuditLog(CRUDBase[AuditLog, AuditLogCreate, dict]):
    def get_multi_with_actor(
        self,
        db: Session,
        *,
        skip: int = 0,
        limit: int = 100,
        actor_user_id: Optional[uuid.UUID] = None,
        action: Optional[str] = None
    ) -> List[AuditLog]:
        """Get audit logs with actor information."""
        query = db.query(AuditLog).options(joinedload(AuditLog.actor))

        if actor_user_id:
            query = query.filter(AuditLog.actor_user_id == actor_user_id)

        if action:
            query = query.filter(AuditLog.action.ilike(f"%{action}%"))

        return query.order_by(AuditLog.created_at.desc()).offset(skip).limit(limit).all()

    def log_action(
        self,
        db: Session,
        *,
        actor_user_id: uuid.UUID,
        action: str,
        target_id: Optional[str] = None,
        details: Optional[dict] = None
    ) -> AuditLog:
        """Create an audit log entry."""
        audit_log = AuditLog(
            actor_user_id=actor_user_id,
            action=action,
            target_id=target_id,
            details=details
        )
        db.add(audit_log)
        db.commit()
        db.refresh(audit_log)
        return audit_log


audit_log = CRUDAuditLog(AuditLog)
