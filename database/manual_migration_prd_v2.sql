-- Manual migration script for PortalOps PRD v2.0 changes
-- Date: 2025-10-17
-- Description: Apply v2.0 schema changes

-- 1. Make products.service_id nullable and change foreign key to SET NULL
ALTER TABLE products 
DROP CONSTRAINT IF EXISTS products_service_id_fkey;

ALTER TABLE products 
ALTER COLUMN service_id DROP NOT NULL;

ALTER TABLE products 
ADD CONSTRAINT products_service_id_fkey 
FOREIGN KEY (service_id) 
REFERENCES services(id) 
ON DELETE SET NULL;

-- 2. Add bill_attachment_path to payment_info
ALTER TABLE payment_info 
ADD COLUMN IF NOT EXISTS bill_attachment_path VARCHAR(500);

-- 3. Update role names for v2.0 (ServiceAdministrator -> ServiceAdmin)
-- Note: Only update if you want to rename the role
-- If you keep the old name "ServiceAdministrator", the backend will still work 
-- because we check for both in the code
UPDATE roles 
SET name = 'ServiceAdmin' 
WHERE name = 'ServiceAdministrator';

-- Optional: Remove deprecated ProductAdministrator role if it exists
-- DELETE FROM user_roles WHERE role_id = (SELECT id FROM roles WHERE name = 'ProductAdministrator');
-- DELETE FROM roles WHERE name = 'ProductAdministrator';

-- 4. Create uploads directory (run this command on the server)
-- mkdir -p uploads/bill_attachments
-- chmod 755 uploads/bill_attachments

-- Verification queries
SELECT 'Checking products.service_id constraint...' as step;
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    rc.update_rule,
    rc.delete_rule
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
JOIN information_schema.referential_constraints AS rc
    ON tc.constraint_name = rc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name = 'products'
  AND kcu.column_name = 'service_id';

SELECT 'Checking payment_info columns...' as step;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'payment_info'
ORDER BY ordinal_position;

SELECT 'Checking roles...' as step;
SELECT * FROM roles ORDER BY id;

