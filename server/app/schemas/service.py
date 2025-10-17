from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime
import uuid


class ServiceBase(BaseModel):
    name: str
    vendor: Optional[str] = None
    url: Optional[str] = None


class ServiceCreate(ServiceBase):
    pass


class ServiceUpdate(BaseModel):
    name: Optional[str] = None
    vendor: Optional[str] = None
    url: Optional[str] = None


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
    service_id: uuid.UUID


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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ServiceWithProducts(Service):
    products: List[Product] = []
