from sqlalchemy import Column, String, DECIMAL, ForeignKey, DateTime, Date, CheckConstraint, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
from app.db.database import Base


class ProductStatus(Base):
    """Master data table for configurable product statuses."""
    __tablename__ = "product_statuses"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Relationships
    products = relationship("Product", back_populates="status")


class PaymentMethod(Base):
    """Master data table for configurable payment methods."""
    __tablename__ = "payment_methods"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String(50), unique=True, nullable=False)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Relationships
    payment_info = relationship("PaymentInfo", back_populates="payment_method")


class Currency(Base):
    """Master data table for currencies used in payment records."""
    __tablename__ = "currencies"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(10), unique=True, nullable=False)
    name = Column(String(50), unique=True, nullable=False)
    symbol = Column(String(10), nullable=True)
    description = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Relationships
    payment_info = relationship("PaymentInfo", back_populates="currency")


class PaymentInfo(Base):
    """Payment records for products - supports one-to-many relationship allowing multiple payments per product."""
    __tablename__ = "payment_info"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    product_id = Column(UUID(as_uuid=True), ForeignKey(
        "products.id", ondelete="SET NULL"), nullable=True)
    status = Column(String(20), nullable=False, default="incomplete")
    amount = Column(DECIMAL(10, 2), nullable=True)
    cardholder_name = Column(String(255), nullable=True)
    expiry_date = Column(Date, nullable=True)
    payment_method_id = Column(Integer, ForeignKey(
        "payment_methods.id", ondelete="RESTRICT"), nullable=True)
    currency_id = Column(Integer, ForeignKey(
        "currencies.id", ondelete="RESTRICT"), nullable=True)
    payment_date = Column(Date, nullable=True)
    usage_start_date = Column(Date, nullable=True)
    usage_end_date = Column(Date, nullable=True)
    reporter = Column(String(255), nullable=False, default="System")
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('incomplete', 'complete', 'error')",
                        name="payment_info_status_check"),
        CheckConstraint("usage_start_date IS NULL OR usage_end_date IS NULL OR usage_end_date >= usage_start_date",
                        name="chk_usage_date_range"),
    )

    # Relationships
    product = relationship("Product", back_populates="payment_info")
    payment_method = relationship(
        "PaymentMethod", back_populates="payment_info")
    currency = relationship("Currency", back_populates="payment_info")
    invoices = relationship(
        "PaymentInvoice", back_populates="payment_info", cascade="all, delete-orphan")
