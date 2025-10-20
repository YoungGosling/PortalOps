from pydantic import BaseModel
from typing import Optional, List
from decimal import Decimal
from datetime import datetime, date
import uuid


class PaymentInfoBase(BaseModel):
    status: str = "incomplete"
    amount: Optional[Decimal] = None
    cardholderName: Optional[str] = None
    expiryDate: Optional[str] = None  # Changed to string for MM/DD/YYYY format
    paymentMethod: Optional[str] = None
    billAttachmentPath: Optional[str] = None
    invoices: Optional[List[dict]] = None  # For v2 API with invoice support


class PaymentInfoCreate(PaymentInfoBase):
    product_id: uuid.UUID


class PaymentInfoUpdate(BaseModel):
    status: Optional[str] = None
    amount: Optional[Decimal] = None
    # Keep database field name for API input
    cardholder_name: Optional[str] = None
    # Keep database field name for API input
    expiry_date: Optional[date] = None
    # Keep database field name for API input
    payment_method: Optional[str] = None


class PaymentInfo(PaymentInfoBase):
    product_id: uuid.UUID
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentRegisterItem(BaseModel):
    productId: uuid.UUID
    productName: str
    serviceName: str
    paymentInfo: PaymentInfoBase

    class Config:
        from_attributes = True


class PaymentRegisterSummary(BaseModel):
    incompleteCount: int
