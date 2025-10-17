from sqlalchemy import Column, String, DECIMAL, ForeignKey, DateTime, Date, CheckConstraint
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class PaymentInfo(Base):
    __tablename__ = "payment_info"

    product_id = Column(UUID(as_uuid=True), ForeignKey(
        "products.id", ondelete="CASCADE"), primary_key=True)
    status = Column(String(20), nullable=False, default="incomplete")
    amount = Column(DECIMAL(10, 2), nullable=True)
    cardholder_name = Column(String(255), nullable=True)
    expiry_date = Column(Date, nullable=True)
    payment_method = Column(String(50), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(
    ), onupdate=func.now(), nullable=False)

    # Constraints
    __table_args__ = (
        CheckConstraint("status IN ('incomplete', 'complete')",
                        name="check_payment_status"),
    )

    # Relationships
    product = relationship("Product", back_populates="payment_info")
