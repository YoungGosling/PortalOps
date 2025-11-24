from sqlalchemy import Column, String, Text, ForeignKey, DateTime, Integer, Table
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.database import Base

# Association table for service admins (many-to-many)
service_admins = Table(
    'service_admins',
    Base.metadata,
    Column('service_id', UUID(as_uuid=True), ForeignKey(
        'services.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'), primary_key=True)
)

# Association table for product admins (many-to-many)
product_admins = Table(
    'product_admins',
    Base.metadata,
    Column('product_id', UUID(as_uuid=True), ForeignKey(
        'products.id', ondelete='CASCADE'), primary_key=True),
    Column('user_id', UUID(as_uuid=True), ForeignKey(
        'users.id', ondelete='CASCADE'), primary_key=True)
)


class Service(Base):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    vendor = Column(String(255), nullable=True)
    url = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Relationships
    products = relationship(
        "Product", back_populates="service")
    permission_assignments = relationship(
        "PermissionAssignment", back_populates="service")
    # Many-to-many relationship with User through service_admins table
    admins = relationship(
        "User",
        secondary=service_admins,
        backref="administered_services"
    )


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey(
        "services.id", ondelete="SET NULL"), nullable=True)
    name = Column(String(255), nullable=False)
    url = Column(Text, nullable=True)
    description = Column(Text, nullable=True)
    status_id = Column(Integer, ForeignKey(
        "product_statuses.id", ondelete="RESTRICT"), nullable=False, default=1)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Relationships
    service = relationship("Service", back_populates="products")
    status = relationship("ProductStatus", back_populates="products")
    payment_info = relationship(
        "PaymentInfo", back_populates="product")
    permission_assignments = relationship(
        "PermissionAssignment", back_populates="product")
    # Many-to-many relationship with User through product_admins table
    admins = relationship(
        "User",
        secondary=product_admins,
        backref="administered_products"
    )
