from pydantic import BaseModel, Field
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
    paymentMethodId: Optional[int] = None
    paymentDate: Optional[str] = None
    usageStartDate: Optional[str] = None
    usageEndDate: Optional[str] = None
    reporter: Optional[str] = None
    billAttachmentPath: Optional[str] = None
    invoices: Optional[List[dict]] = None  # For v2 API with invoice support


class PaymentInfoCreate(BaseModel):
    product_id: uuid.UUID
    status: str = "incomplete"
    amount: Optional[Decimal] = None
    cardholder_name: Optional[str] = None
    expiry_date: Optional[date] = None
    payment_method_id: Optional[int] = None
    payment_date: date
    usage_start_date: date
    usage_end_date: date
    reporter: str


class PaymentInfoUpdate(BaseModel):
    status: Optional[str] = None
    amount: Optional[Decimal] = None
    cardholder_name: Optional[str] = None
    expiry_date: Optional[date] = None
    payment_method_id: Optional[int] = None
    payment_date: Optional[date] = None
    usage_start_date: Optional[date] = None
    usage_end_date: Optional[date] = None
    reporter: Optional[str] = None


class PaymentInfo(PaymentInfoBase):
    id: uuid.UUID
    product_id: uuid.UUID
    created_at: datetime
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


# Master data schemas
class ProductStatusBase(BaseModel):
    name: str
    description: Optional[str] = None


class ProductStatusCreate(ProductStatusBase):
    pass


class ProductStatusUpdate(ProductStatusBase):
    name: Optional[str] = None


class ProductStatus(ProductStatusBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentMethodBase(BaseModel):
    name: str
    description: Optional[str] = None


class PaymentMethodCreate(PaymentMethodBase):
    pass


class PaymentMethodUpdate(PaymentMethodBase):
    name: Optional[str] = None


class PaymentMethod(PaymentMethodBase):
    id: int
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
