from sqlalchemy import Column, String, Integer, ForeignKey, DateTime, Text, Date
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    email = Column(String(255), nullable=False, unique=True)
    password_hash = Column(String(255), nullable=True)
    azure_id = Column(String(255), nullable=True,
                      unique=True)  # Azure AD Object ID
    # Legacy: department name (deprecated)
    department = Column(String(255), nullable=True)
    department_id = Column(UUID(as_uuid=True), ForeignKey(
        "departments.id", ondelete="SET NULL"), nullable=True)  # v3: Reference to Department
    position = Column(String(255), nullable=True)  # Job title/position
    hire_date = Column(Date, nullable=True)  # Date of hire
    resignation_date = Column(Date, nullable=True)  # Date of resignation
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Relationships
    user_roles = relationship(
        "UserRole", back_populates="user", cascade="all, delete-orphan")
    permission_assignments = relationship(
        "PermissionAssignment", back_populates="user", cascade="all, delete-orphan")
    assigned_tasks = relationship(
        "WorkflowTask", foreign_keys="WorkflowTask.assignee_user_id", back_populates="assignee")
    target_tasks = relationship(
        "WorkflowTask", foreign_keys="WorkflowTask.target_user_id", back_populates="target_user")
    audit_logs = relationship("AuditLog", back_populates="actor")
    dept_ref = relationship("Department", foreign_keys=[department_id])
    sap_users = relationship("SapUser", back_populates="user", cascade="all, delete-orphan")


class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True)
    name = Column(String(50), nullable=False, unique=True)

    # Relationships
    user_roles = relationship("UserRole", back_populates="role")


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id = Column(UUID(as_uuid=True), ForeignKey(
        "users.id", ondelete="CASCADE"), primary_key=True)
    role_id = Column(Integer, ForeignKey(
        "roles.id", ondelete="CASCADE"), primary_key=True)

    # Relationships
    user = relationship("User", back_populates="user_roles")
    role = relationship("Role", back_populates="user_roles")
