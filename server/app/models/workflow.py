from sqlalchemy import Column, String, Text, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.database import Base


class WorkflowTask(Base):
    __tablename__ = "workflow_tasks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    type = Column(String(20), nullable=False)
    status = Column(String(20), nullable=False, default="pending")
    assignee_user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    target_user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    details = Column(Text, nullable=True)
    due_date = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint("type IN ('onboarding', 'offboarding')",
                        name="check_task_type"),
        CheckConstraint(
            "status IN ('pending', 'completed', 'invited', 'in_progress', 'cancelled')", name="check_task_status"),
    )

    # Relationships
    assignee = relationship("User", foreign_keys=[
                            assignee_user_id], back_populates="assigned_tasks")
    target_user = relationship("User", foreign_keys=[
                               target_user_id], back_populates="target_tasks")



