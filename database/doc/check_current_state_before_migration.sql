-- Check Current State Before PRD v2.0 Migration

\echo '========== 1. Current products table structure =========='
\d products

\echo ''
\echo '========== 2. Check if any products have NULL service_id =========='
SELECT COUNT(*) as products_with_null_service 
FROM products 
WHERE service_id IS NULL;

\echo ''
\echo '========== 3. Check for duplicate product names =========='
SELECT name, COUNT(*) as count 
FROM products 
GROUP BY name 
HAVING COUNT(*) > 1;

\echo ''
\echo '========== 4. Current payment_info table structure =========='
\d payment_info

\echo ''
\echo '========== 5. Current roles =========='
SELECT * FROM roles ORDER BY id;

\echo ''
\echo '========== 6. Users with ProductAdministrator role =========='
SELECT u.name, u.email, r.name as role_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE r.name = 'ProductAdministrator';

\echo ''
\echo '========== Current state check complete =========='

