from typing import List, Optional
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import audit_log
from app.core.deps import require_admin
from app.schemas.audit import AuditLog
from app.models.user import User
import uuid

router = APIRouter()


@router.get("", response_model=dict)
def read_audit_logs(
    actor_user_id: Optional[str] = Query(None),
    action: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(20, ge=1, le=100),
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Retrieve audit logs with pagination and filtering.
    """
    skip = (page - 1) * limit

    # Convert actor_user_id string to UUID if provided
    actor_uuid = None
    if actor_user_id:
        try:
            actor_uuid = uuid.UUID(actor_user_id)
        except ValueError:
            actor_uuid = None

    logs = audit_log.get_multi_with_actor(
        db,
        skip=skip,
        limit=limit,
        actor_user_id=actor_uuid,
        action=action
    )

    # Format the response data
    log_data = []
    for log in logs:
        actor_info = None
        if log.actor:
            actor_info = {
                "id": str(log.actor.id),
                "name": log.actor.name,
                "email": log.actor.email
            }

        log_data.append({
            "id": str(log.id),
            "actor": actor_info,
            "action": log.action,
            "targetId": log.target_id,
            "details": log.details,
            "createdAt": log.created_at.isoformat()
        })

    # Get total count for pagination (simplified approach)
    total_logs = len(audit_log.get_multi_with_actor(
        db, skip=0, limit=1000, actor_user_id=actor_uuid, action=action
    ))

    return {
        "data": log_data,
        "pagination": {
            "total": total_logs,
            "page": page,
            "limit": limit
        }
    }



