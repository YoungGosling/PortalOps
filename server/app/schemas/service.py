from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid


class ServiceBase(BaseModel):
    name: str
    vendor: Optional[str] = None
    url: Optional[str] = None


class ServiceCreate(ServiceBase):
    productIds: Optional[List[uuid.UUID]] = []
    adminUserIds: Optional[List[uuid.UUID]] = []


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    vendor: Optional[str] = None
    url: Optional[str] = None
    associateProductIds: Optional[List[uuid.UUID]] = []
    disassociateProductIds: Optional[List[uuid.UUID]] = []
    adminUserIds: Optional[List[uuid.UUID]] = None


class Service(ServiceBase):
    id: uuid.UUID
    created_at: datetime
    updated_at: datetime
    productCount: Optional[int] = 0

    class Config:
        from_attributes = True


class ProductBase(BaseModel):
    name: str
    url: Optional[str] = None
    description: Optional[str] = None


class ProductCreate(ProductBase):
    service_id: Optional[uuid.UUID] = None
    status_id: int = 1  # Default to Active


class ProductCreateWithUrl(BaseModel):
    name: str
    url: Optional[str] = None
    description: Optional[str] = None
    serviceId: uuid.UUID
    statusId: Optional[int] = 1  # Default to Active


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None
    status_id: Optional[int] = None


class Product(ProductBase):
    id: uuid.UUID
    service_id: uuid.UUID
    service_name: Optional[str] = None
    status_id: int
    status: Optional[str] = None  # Product status name
    latest_payment_date: Optional[str] = None
    latest_usage_start_date: Optional[str] = None
    latest_usage_end_date: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ProductSimple(BaseModel):
    """Simplified product info for service listings"""
    id: uuid.UUID
    name: str

    class Config:
        from_attributes = True


class AdminSimple(BaseModel):
    """Simplified admin info for service listings"""
    id: uuid.UUID
    name: str
    email: str

    class Config:
        from_attributes = True


class ServiceWithProducts(Service):
    products: List[ProductSimple] = []
    admins: List[AdminSimple] = []
