-- File: manual_migration_prd_v2_changes.sql
-- Migration script to align database with PRD v2.0 requirements
-- Date: 2025-10-17
-- Reference: database_design_changes_v2.md

\echo '=========================================='
\echo 'PRD V2.0 MIGRATION SCRIPT'
\echo 'Date: 2025-10-17'
\echo '=========================================='
\echo ''

-- Start transaction for safety
BEGIN;

\echo '========== 1. MODIFYING products TABLE =========='

-- Change 1a: Allow service_id to be nullable
\echo 'Making service_id nullable...'
ALTER TABLE products ALTER COLUMN service_id DROP NOT NULL;

-- Change 1b: Update foreign key constraint to ON DELETE SET NULL
\echo 'Updating foreign key constraint...'
ALTER TABLE products DROP CONSTRAINT products_service_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_service_id_fkey
    FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;

-- Change 1c: Add UNIQUE constraint on product name
\echo 'Adding unique constraint to product name...'
-- First check if there are any duplicates
DO $$
DECLARE
    duplicate_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO duplicate_count
    FROM (
        SELECT name, COUNT(*) as cnt 
        FROM products 
        GROUP BY name 
        HAVING COUNT(*) > 1
    ) duplicates;
    
    IF duplicate_count > 0 THEN
        RAISE NOTICE 'WARNING: Found % duplicate product names. Please resolve before adding unique constraint.', duplicate_count;
        RAISE EXCEPTION 'Cannot add unique constraint due to duplicate product names';
    ELSE
        ALTER TABLE products ADD CONSTRAINT uq_products_name UNIQUE (name);
        RAISE NOTICE 'Unique constraint added successfully to products.name';
    END IF;
END $$;

\echo 'products table modifications complete!'
\echo ''

-- ================================================
\echo '========== 2. MODIFYING payment_info TABLE =========='

-- Change 2: Add bill_attachment_path column
\echo 'Adding bill_attachment_path column...'
ALTER TABLE payment_info ADD COLUMN bill_attachment_path TEXT;

\echo 'payment_info table modifications complete!'
\echo ''

-- ================================================
\echo '========== 3. MODIFYING roles TABLE =========='

-- Change 3: Remove ProductAdministrator role
\echo 'Removing ProductAdministrator role...'

-- Step 3a: Check how many users have this role
DO $$
DECLARE
    affected_users INTEGER;
BEGIN
    SELECT COUNT(*) INTO affected_users
    FROM user_roles 
    WHERE role_id IN (SELECT id FROM roles WHERE name = 'ProductAdministrator');
    
    IF affected_users > 0 THEN
        RAISE NOTICE 'WARNING: Removing ProductAdministrator role will affect % user(s)', affected_users;
    END IF;
END $$;

-- Step 3b: Delete user role assignments
DELETE FROM user_roles 
WHERE role_id IN (SELECT id FROM roles WHERE name = 'ProductAdministrator');

-- Step 3c: Delete the role itself
DELETE FROM roles WHERE name = 'ProductAdministrator';

\echo 'ProductAdministrator role removed!'
\echo ''

-- ================================================
\echo '========== 4. VERIFICATION =========='

\echo 'Verifying changes...'
\echo ''

\echo 'Products table structure:'
\d products

\echo ''
\echo 'Payment_info table structure:'
\d payment_info

\echo ''
\echo 'Current roles:'
SELECT * FROM roles ORDER BY id;

\echo ''
\echo '=========================================='
\echo 'MIGRATION COMPLETED SUCCESSFULLY!'
\echo 'Changes applied:'
\echo '  1. products.service_id is now nullable'
\echo '  2. products foreign key: ON DELETE SET NULL'
\echo '  3. products.name has UNIQUE constraint'
\echo '  4. payment_info.bill_attachment_path added'
\echo '  5. ProductAdministrator role removed'
\echo '=========================================='
\echo ''
\echo 'To commit these changes, type: COMMIT;'
\echo 'To rollback these changes, type: ROLLBACK;'

