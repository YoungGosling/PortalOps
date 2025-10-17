# Database Modification Plan

**Document ID:** DB-MOD-001  
**Date:** 2025-10-16  
**Based on:** `PRD_Change_Request_Product_Inventory.md`

## 1. Introduction

This document outlines the necessary modifications to the database schema to support the introduction of the new Product Inventory module. The primary change is the addition of a field to store a URL for each product.

--- 

## 2. Summary of Changes

- **ADD** a new `url` column to the `products` table.
- **UPDATE** the corresponding SQLAlchemy model to reflect this change.
- **GENERATE** a database migration script to apply the change.

--- 

## 3. Detailed Schema Modification

### 3.1. Target Table: `products`

The `products` table requires a new column to store an optional URL for each product.

- **Column to Add:**
    - **Name:** `url`
    - **Data Type:** `TEXT`
    - **Constraints:** `NULLABLE` (as the product URL is optional)

--- 

## 4. Implementation Steps

This change should be implemented using the project's existing data modeling and migration tools.

### Step 1: Update the SQLAlchemy Model

Modify the `Product` class in the specified file to include the new `url` attribute.

- **File to Modify:** `server/app/models/service.py`
- **Change:**

```python
# In server/app/models/service.py

class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), ForeignKey("services.id", ondelete="CASCADE"), nullable=False)
    name = Column(String(255), nullable=False)
    url = Column(Text, nullable=True)  # <-- ADD THIS LINE
    description = Column(Text, nullable=True)
    created_at = Column(DateTime(timezone=True),
                        server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(),
                        onupdate=func.now(), nullable=False)

    # ... rest of the model relationships
```

### Step 2: Generate and Apply the Database Migration

After updating the model, use `alembic` to create and apply the migration script. This ensures the change is applied to the database schema in a controlled and versioned manner.

- **Run the following commands in the `server/` directory:**

1.  **Generate the migration script:**
    ```bash
    alembic revision --autogenerate -m "Add url column to products table"
    ```
    *This will create a new file in the `server/alembic/versions/` directory containing the `ALTER TABLE` statement.*

2.  **Apply the migration to the database:**
    ```bash
    alembic upgrade head
    ```
    *This command executes the migration script against the configured database, applying the schema change.*

### Step 3: (Optional) Raw SQL for Manual Application

If a manual database change is required, the following SQL command can be executed directly on the PostgreSQL database:

```sql
ALTER TABLE products ADD COLUMN url TEXT;
```

--- 

This completes the required database modification. All other changes outlined in the PRD are related to application logic and do not require further schema alterations.
