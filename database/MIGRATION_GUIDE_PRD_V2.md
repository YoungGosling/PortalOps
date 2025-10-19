# PRD v2.0 Migration Guide

**Date:** 2025-10-17  
**Version:** 1.0  
**Author:** AI Assistant  
**Reference:** database_design_changes_v2.md

---

## Overview

This guide provides step-by-step instructions for migrating the PortalOps database from the original schema to PRD v2.0 requirements.

## Summary of Changes

### 1. Products Table
- ✅ `service_id` is now **nullable** (allows unassociated products)
- ✅ Foreign key constraint changed to `ON DELETE SET NULL`
- ✅ Added `UNIQUE` constraint on `name` column

### 2. Payment Info Table
- ✅ Added `bill_attachment_path` column (TEXT) for file upload tracking

### 3. Roles Table
- ✅ Removed `ProductAdministrator` role
- ✅ Only `Admin` and `ServiceAdministrator` roles remain

### 4. Views
- ✅ Updated `products_with_services` view to use LEFT JOIN (includes unassociated products)

---

## Pre-Migration Checklist

Before running the migration, please verify:

1. **Backup your database**
   ```bash
   pg_dump -U postgres -d portalops > backup_before_prd_v2_$(date +%Y%m%d_%H%M%S).sql
   ```

2. **Check for duplicate product names** (migration will fail if duplicates exist)
3. **Identify users with ProductAdministrator role** (they will lose this role)
4. **Ensure you have database admin privileges**

---

## Migration Steps

### Step 1: Check Current State

Run this in your psql session:

```sql
\i database/check_current_state_before_migration.sql
```

**Review the output carefully:**
- Note any duplicate product names
- Note any users with ProductAdministrator role
- Verify current table structures

### Step 2: Run Migration Script

The migration runs in a **transaction** for safety. If any step fails, all changes will be rolled back.

```sql
\i database/manual_migration_prd_v2_changes.sql
```

**The script will:**
1. Make `products.service_id` nullable
2. Update foreign key constraint to `ON DELETE SET NULL`
3. Add unique constraint to `products.name` (fails if duplicates exist)
4. Add `bill_attachment_path` column to `payment_info`
5. Remove ProductAdministrator role and its assignments

### Step 3: Review Changes

After the script completes, review the changes shown in the verification section.

**If everything looks correct:**
```sql
COMMIT;
```

**If something is wrong:**
```sql
ROLLBACK;
```

### Step 4: Update Views (if needed)

If you rolled back and need to recreate views after fixing issues:

```sql
DROP VIEW IF EXISTS products_with_services;

CREATE VIEW products_with_services AS
SELECT 
    p.id,
    p.name as product_name,
    p.description,
    s.name as service_name,
    s.vendor,
    s.url as service_url,
    p.created_at,
    p.updated_at
FROM products p
LEFT JOIN services s ON p.service_id = s.id;
```

---

## Post-Migration Verification

Run these queries to verify the migration:

```sql
-- 1. Verify products table structure
\d products

-- Expected: service_id nullable, unique constraint on name

-- 2. Verify payment_info table structure
\d payment_info

-- Expected: bill_attachment_path column exists

-- 3. Verify roles
SELECT * FROM roles;

-- Expected: Only 'Admin' and 'ServiceAdministrator'

-- 4. Test unassociated product creation
INSERT INTO products (name, description) 
VALUES ('Test Unassociated Product', 'Test product without service');

-- Should succeed

-- 5. Clean up test data
DELETE FROM products WHERE name = 'Test Unassociated Product';
```

---

## Troubleshooting

### Issue 1: Duplicate Product Names

**Error:** `Cannot add unique constraint due to duplicate product names`

**Solution:**
```sql
-- Find duplicates
SELECT name, COUNT(*) as count 
FROM products 
GROUP BY name 
HAVING COUNT(*) > 1;

-- Rename duplicates (example)
UPDATE products 
SET name = name || ' - ' || id::text 
WHERE id IN (
    SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (PARTITION BY name ORDER BY created_at) as rn
        FROM products
    ) sub WHERE rn > 1
);
```

### Issue 2: Users Losing ProductAdministrator Role

**Solution:** Assign affected users to appropriate new roles:

```sql
-- List affected users (run BEFORE migration)
SELECT u.name, u.email
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'ProductAdministrator';

-- After migration, assign new roles
INSERT INTO user_roles (user_id, role_id)
SELECT 
    u.id, 
    (SELECT id FROM roles WHERE name = 'ServiceAdministrator')
FROM users u
WHERE u.email IN ('user1@example.com', 'user2@example.com');
```

### Issue 3: Migration Fails Mid-Way

**Solution:** The transaction will automatically rollback. Review the error message, fix the issue, and re-run the migration script.

---

## Schema File Updates

The following files have been updated to reflect PRD v2.0:

- ✅ `database/schema.sql` - Updated with all PRD v2.0 changes
- ✅ `database/manual_migration_prd_v2_changes.sql` - Migration script
- ✅ `database/check_current_state_before_migration.sql` - Pre-migration checks

---

## Additional Notes

### Unassociated Products

After migration, when a service is deleted:
- Previously: All associated products were deleted (CASCADE)
- Now: Products remain but `service_id` is set to NULL

Example:
```sql
-- Create test service and product
INSERT INTO services (name) VALUES ('Test Service') RETURNING id;
-- Assume returned id: 'abc-123'

INSERT INTO products (name, service_id) 
VALUES ('Test Product', 'abc-123');

-- Delete service
DELETE FROM services WHERE id = 'abc-123';

-- Product still exists with service_id = NULL
SELECT * FROM products WHERE name = 'Test Product';
```

### Bill Attachments

The new `bill_attachment_path` column stores file paths or identifiers:
- Store relative paths from your uploads directory
- Or store cloud storage URLs/keys
- NULL is allowed (for backward compatibility)

Example:
```sql
UPDATE payment_info 
SET bill_attachment_path = 'uploads/bills/2025/10/invoice_123.pdf'
WHERE product_id = 'some-uuid';
```

---

## Rollback Plan

If you need to completely rollback to the pre-migration state:

```bash
# Restore from backup
psql -U postgres -d portalops < backup_before_prd_v2_TIMESTAMP.sql
```

---

## Questions or Issues?

If you encounter any issues during migration, refer to:
1. This guide's troubleshooting section
2. The original `database_design_changes_v2.md` document
3. PostgreSQL error messages for specific constraint violations

---

**Migration prepared by:** AI Assistant  
**Last updated:** 2025-10-17

