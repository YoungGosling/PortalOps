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


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    vendor: Optional[str] = None
    url: Optional[str] = None
    associateProductIds: Optional[List[uuid.UUID]] = []
    disassociateProductIds: Optional[List[uuid.UUID]] = []


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


class ProductCreateWithUrl(BaseModel):
    name: str
    url: Optional[str] = None
    serviceId: uuid.UUID


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    url: Optional[str] = None
    description: Optional[str] = None


class Product(ProductBase):
    id: uuid.UUID
    service_id: uuid.UUID
    service_name: Optional[str] = None
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


class ServiceWithProducts(Service):
    products: List[ProductSimple] = []
