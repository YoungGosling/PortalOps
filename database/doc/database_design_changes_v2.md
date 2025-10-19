# Database Design Change Document: PortalOps PRD v2.0

- **Version:** 1.0
- **Date:** 2025-10-17
- **Author:** Gemini

## 1. Introduction

This document outlines the necessary modifications to the PortalOps database schema to align it with the requirements specified in the Product Requirements Document (PRD) v2.0. The changes primarily address new business logic for product and service management, payment tracking, and role definitions.

## 2. Summary of Changes

1.  **`products` Table:** The relationship between products and services has been updated to allow for "unassociated" products. A uniqueness constraint has been added to the product name.
2.  **`payment_info` Table:** A new field has been added to track file attachments for billing records.
3.  **`roles` Table:** The available roles have been streamlined to match the two-role hierarchy (`Admin`, `ServiceAdmin`) defined in the PRD.

## 3. Detailed Schema Modifications

### 3.1. `products` Table

#### Change 1: Make `service_id` Nullable

-   **Reason:** Per PRD v2.0, Section 3.1, deleting a service must not delete the products associated with it. Instead, the link should be severed, and the products should become "unassociated." This requires the `service_id` foreign key to be nullable.
-   **SQL Implementation:**
    ```sql
    ALTER TABLE products ALTER COLUMN service_id DROP NOT NULL;
    ```

#### Change 2: Update Foreign Key `ON DELETE` Behavior

-   **Reason:** To support the requirement for unassociated products, the foreign key constraint must be changed from `ON DELETE CASCADE` to `ON DELETE SET NULL`. When a parent `service` is deleted, the `service_id` field in the corresponding `products` rows will be set to `NULL`.
-   **SQL Implementation:**
    *Note: The constraint name `products_service_id_fkey` is the default, but it may differ in your environment. You can find the correct name using `\d products` in `psql`.*
    ```sql
    ALTER TABLE products DROP CONSTRAINT products_service_id_fkey;
    ALTER TABLE products ADD CONSTRAINT products_service_id_fkey
        FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
    ```

#### Change 3: Add `UNIQUE` Constraint to `name`

-   **Reason:** PRD v2.0, Section 3.2, specifies that every `Product Name` must be unique.
-   **SQL Implementation:**
    ```sql
    ALTER TABLE products ADD CONSTRAINT uq_products_name UNIQUE (name);
    ```

### 3.2. `payment_info` Table

#### Change 1: Add `bill_attachment_path` Column

-   **Reason:** PRD v2.0, Section 3.3, requires a "Bill Attachment (File Upload)" for each payment record. Section 4.1 (Master Files) further confirms that these attachments must be tracked. This new `TEXT` column will store the path or unique identifier for the uploaded file.
-   **SQL Implementation:**
    ```sql
    ALTER TABLE payment_info ADD COLUMN bill_attachment_path TEXT;
    ```

### 3.3. `roles` Table

#### Change 1: Remove `ProductAdministrator` Role

-   **Reason:** PRD v2.0, Section 2, defines a strict two-role system: `Admin` and `ServiceAdmin`. The `ProductAdministrator` role from the original schema is no longer specified and should be removed to align with the new design.
-   **SQL Implementation:**
    *Note: To maintain data integrity, corresponding records in the `user_roles` join table must be removed first.*
    ```sql
    -- Step 1: Delete assignments for the role
    DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name = 'ProductAdministrator');

    -- Step 2: Delete the role itself
    DELETE FROM roles WHERE name = 'ProductAdministrator';
    ```

## 4. Consolidated SQL Script for Migration

This script combines all the above changes into a single migration file.

```sql
-- File: manual_migration_prd_v2_changes.sql

-- ========= MIGRATION SCRIPT FOR PRD V2.0 =========

-- 1. MODIFY 'products' TABLE
--    - Allow service_id to be null
--    - Update foreign key to ON DELETE SET NULL
--    - Add unique constraint on product name
ALTER TABLE products ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE products DROP CONSTRAINT products_service_id_fkey; -- Note: Verify this constraint name
ALTER TABLE products ADD CONSTRAINT products_service_id_fkey
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;
ALTER TABLE products ADD CONSTRAINT uq_products_name UNIQUE (name);

-- 2. MODIFY 'payment_info' TABLE
--    - Add column to store path to bill attachment
ALTER TABLE payment_info ADD COLUMN bill_attachment_path TEXT;

-- 3. MODIFY 'roles' TABLE
--    - Remove the obsolete 'ProductAdministrator' role
--    - Ensure user_roles are cleaned up first to avoid foreign key violations
DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name = 'ProductAdministrator');
DELETE FROM roles WHERE name = 'ProductAdministrator';

-- ========= END OF MIGRATION SCRIPT =========
```
