# Backend Code Modification Plan

**Document ID:** BE-MOD-001  
**Date:** 2025-10-16  
**Based on:** `PRD_Change_Request_Product_Inventory.md`

## 1. Introduction

This document provides a detailed, step-by-step technical plan for modifying the backend application to align with the new product requirements. The changes involve creating a new Product Inventory module and refactoring the existing Payment Register module.

--- 

## 2. Database Schema Modification

A new field is required to store the product's URL.

- **Action:** Add a `url` column to the `products` table.
- **File to Modify:** `server/app/models/service.py`
- **Change:** Update the `Product` model class.

```python
# In server/app/models/service.py, inside the Product class:

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    url = Column(Text, nullable=True)  # <-- ADD THIS LINE
    description = Column(Text, nullable=True)
    # ... rest of the model
```

- **Migration:** After updating the model, generate and apply a database migration.
  ```bash
  # Generate a new migration script
  alembic revision --autogenerate -m "Add url to products table"

  # Apply the migration to the database
  alembic upgrade head
  ```

--- 

## 3. New Product Inventory Module Implementation

This involves creating a new dedicated endpoint for adding products.

### 3.1. Create New Pydantic Schema

- **Action:** Define a schema to validate the request body for creating a new product.
- **File to Modify:** `server/app/schemas/service.py`
- **Change:** Add a new `ProductCreateWithUrl` schema. Note that `service_id` is not part of the body but will be added from the path.

```python
# In server/app/schemas/service.py

class ProductCreate(ProductBase):
    service_id: uuid.UUID

# ADD THE FOLLOWING NEW SCHEMA
class ProductCreateWithUrl(BaseModel):
    name: str
    url: Optional[str] = None
    serviceId: uuid.UUID
```

### 3.2. Implement New CRUD Logic

- **Action:** Create a new function in the product CRUD file that creates a product and its associated empty payment record in a single transaction.
- **File to Modify:** `server/app/crud/product.py`
- **Change:** Add the following method to the `CRUDProduct` class.

```python
# In server/app/crud/product.py, inside CRUDProduct class:

from app.models.payment import PaymentInfo

def create_with_payment_info(self, db: Session, *, obj_in: ProductCreate) -> Product:
    """
    Create a new product and a corresponding incomplete payment_info record.
    """
    # Create the product object
    db_obj = Product(
        name=obj_in.name,
        url=obj_in.url, # Assuming url is added to ProductCreate schema
        service_id=obj_in.service_id
    )
    db.add(db_obj)
    db.flush() # Use flush to get the ID before committing

    # Create the corresponding incomplete payment_info record
    payment_info_obj = PaymentInfo(
        product_id=db_obj.id,
        status="incomplete"
    )
    db.add(payment_info_obj)
    
    db.commit()
    db.refresh(db_obj)
    return db_obj
```

### 3.3. Create New API Endpoint

- **Action:** Create a new endpoint file to handle product-specific actions.
- **File to Create:** `server/app/api/api_v1/endpoints/products.py`
- **Content:**

```python
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.crud import product as crud_product, audit_log
from app.core.deps import require_service_admin_or_higher
from app.schemas.service import Product, ProductCreateWithUrl
from app.models.user import User

router = APIRouter()

@router.post("", response_model=Product, status_code=201)
def create_product(
    product_in: ProductCreateWithUrl,
    current_user: User = Depends(require_service_admin_or_higher),
    db: Session = Depends(get_db)
):
    """
    Create a new product. This will also create an associated incomplete billing record.
    """
    from app.schemas.service import ProductCreate # Import locally to use
    
    product_create_schema = ProductCreate(
        name=product_in.name,
        url=product_in.url,
        service_id=product_in.serviceId
    )

    new_product = crud_product.create_with_payment_info(db, obj_in=product_create_schema)

    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="product.create",
        target_id=str(new_product.id),
        details={"name": new_product.name, "service_id": str(new_product.service_id)}
    )

    return new_product
```

### 3.4. Update API Router

- **Action:** Register the new products router.
- **File to Modify:** `server/app/api/api_v1/api.py`
- **Change:** Import and include the new router.

```python
# In server/app/api/api_v1/api.py

from fastapi import APIRouter
from app.api.api_v1.endpoints import auth, users, services, payment_register, workflows, audit_logs, products # <-- Add products

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(products.router, prefix="/products", tags=["products"]) # <-- ADD THIS LINE
api_router.include_router(payment_register.router, prefix="/payment-register", tags=["payment-register"])
# ... rest of the routers
```

--- 

## 4. Refactor Payment Register Module

### 4.1. Remove Obsolete Endpoint and Logic

- **Action:** Delete the endpoint for creating products via the payment register.
- **File to Modify:** `server/app/api/api_v1/endpoints/payment_register.py`
- **Change:** Delete the `create_payment_register_item` function and its `@router.post("", ...)` decorator.

- **Action:** Remove the corresponding, now-unused CRUD function.
- **File to Modify:** `server/app/crud/payment.py`
- **Change:** Delete the `create_with_product` method from the `CRUDPaymentInfo` class.

- **Action:** Remove the now-unused Pydantic schema.
- **File to Modify:** `server/app/schemas/payment.py`
- **Change:** Delete the `PaymentRegisterCreate` class.

### 4.2. Update Payment Info Logic

- **Action:** Enhance the `update_payment_info` endpoint to automatically set the `status` to `complete` when all required fields are provided.
- **File to Modify:** `server/app/api/api_v1/endpoints/payment_register.py`
- **Change:** Modify the `update_payment_info` function.

```python
# In server/app/api/api_v1/endpoints/payment_register.py

@router.put("/{product_id}", status_code=204)
def update_payment_info(
    product_id: uuid.UUID,
    payment_update: PaymentInfoUpdate,
    current_user: User = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """
    Update payment information for a product.
    """
    existing_payment_info = payment_info.get(db, product_id)
    update_data = payment_update.dict(exclude_unset=True)

    if not existing_payment_info:
        # This case should be rare now, but handle it defensively
        from app.schemas.payment import PaymentInfoCreate
        payment_create = PaymentInfoCreate(
            product_id=product_id,
            **update_data
        )
        updated_obj = payment_info.create(db, obj_in=payment_create)
    else:
        updated_obj = payment_info.update(db, db_obj=existing_payment_info, obj_in=update_data)

    # Check for completeness
    final_data = {**updated_obj.__dict__, **update_data}
    if (
        final_data.get('amount') is not None and
        final_data.get('cardholder_name') and
        final_data.get('expiry_date') and
        final_data.get('payment_method')
    ):
        if updated_obj.status != 'complete':
            payment_info.update(db, db_obj=updated_obj, obj_in={"status": "complete"})
    else:
        if updated_obj.status != 'incomplete':
            payment_info.update(db, db_obj=updated_obj, obj_in={"status": "incomplete"})

    # Log the action
    audit_log.log_action(
        db,
        actor_user_id=current_user.id,
        action="payment_info.update",
        target_id=str(product_id),
        details=payment_update.dict(exclude_unset=True)
    )
```