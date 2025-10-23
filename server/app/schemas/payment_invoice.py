from pydantic import BaseModel
from typing import Optional
from datetime import datetime
import uuid


class PaymentInvoiceBase(BaseModel):
    file_name: str
    original_file_name: str
    file_path: str


class PaymentInvoiceCreate(PaymentInvoiceBase):
    payment_info_id: uuid.UUID


class PaymentInvoiceUpdate(BaseModel):
    file_name: Optional[str] = None
    original_file_name: Optional[str] = None
    file_path: Optional[str] = None


class PaymentInvoice(PaymentInvoiceBase):
    id: uuid.UUID
    payment_info_id: uuid.UUID
    created_at: datetime

    class Config:
        from_attributes = True


class PaymentInvoiceResponse(BaseModel):
    id: uuid.UUID
    original_file_name: str
    url: str

    class Config:
        from_attributes = True


class MasterFileInvoice(BaseModel):
    id: uuid.UUID
    file_name: str
    original_file_name: str
    payment_info_id: uuid.UUID
    product_name: str
    service_name: str
    created_at: datetime

    class Config:
        from_attributes = True
