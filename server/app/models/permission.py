from sqlalchemy import Column, ForeignKey, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
import uuid
from app.db.database import Base


class PermissionAssignment(Base):
    __tablename__ = "permission_assignments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), nullable=False)
    service_id = Column(UUID(as_uuid=True), ForeignKey(
        "services.id", ondelete="CASCADE"), nullable=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey(
        "products.id", ondelete="CASCADE"), nullable=True)

    # Constraints
    __table_args__ = (
        CheckConstraint("service_id IS NOT NULL OR product_id IS NOT NULL",
                        name="check_permission_assignment"),
    )

    # Relationships
    user = relationship("User", back_populates="permission_assignments")
    service = relationship("Service", back_populates="permission_assignments")
    product = relationship("Product", back_populates="permission_assignments")



