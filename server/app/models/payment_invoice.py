from sqlalchemy import Column, DateTime, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.db.database import Base


class PaymentInvoice(Base):
    __tablename__ = "payment_invoices"

    id = Column(UUID(as_uuid=True), primary_key=True,
                default=func.uuid_generate_v4())
    product_id = Column(UUID(as_uuid=True), ForeignKey(
        "products.id", ondelete="CASCADE"), nullable=False)
    file_name = Column(Text, nullable=False)
    original_file_name = Column(Text, nullable=False)
    file_path = Column(Text, nullable=False)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)

    # Relationships
    product = relationship("Product", back_populates="payment_invoices")
