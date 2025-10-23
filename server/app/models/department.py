from sqlalchemy import Column, String, ForeignKey, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.database import Base


class Department(Base):
    __tablename__ = "departments"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False, unique=True)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Relationships
    product_assignments = relationship(
        "DepartmentProductAssignment", back_populates="department", cascade="all, delete-orphan")


class DepartmentProductAssignment(Base):
    __tablename__ = "department_product_assignments"

    department_id = Column(UUID(as_uuid=True), ForeignKey(
        "departments.id", ondelete="CASCADE"), primary_key=True)
    product_id = Column(UUID(as_uuid=True), ForeignKey(
        "products.id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    department = relationship(
        "Department", back_populates="product_assignments")
    product = relationship("Product")
