-- Schema Validation Script
-- Run this in your connected psql session with: \i database/check_schema.sql

\echo '========== 1. Checking Tables =========='
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
ORDER BY table_name;

\echo ''
\echo '========== 2. Checking Views =========='
SELECT table_name 
FROM information_schema.views 
WHERE table_schema = 'public'
ORDER BY table_name;

\echo ''
\echo '========== 3. Checking Extensions =========='
SELECT extname, extversion 
FROM pg_extension 
WHERE extname = 'uuid-ossp';

\echo ''
\echo '========== 4. Users Table Structure =========='
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

\echo ''
\echo '========== 5. Roles Table Structure =========='
SELECT 
    column_name, 
    data_type, 
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'roles' 
ORDER BY ordinal_position;

\echo ''
\echo '========== 6. Services Table Structure =========='
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'services' 
ORDER BY ordinal_position;

\echo ''
\echo '========== 7. Products Table Structure =========='
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'products' 
ORDER BY ordinal_position;

\echo ''
\echo '========== 8. Payment Info Table Structure =========='
SELECT 
    column_name, 
    data_type, 
    numeric_precision,
    numeric_scale,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'payment_info' 
ORDER BY ordinal_position;

\echo ''
\echo '========== 9. Workflow Tasks Table Structure =========='
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'workflow_tasks' 
ORDER BY ordinal_position;

\echo ''
\echo '========== 10. Audit Logs Table Structure =========='
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'audit_logs' 
ORDER BY ordinal_position;

\echo ''
\echo '========== 11. Foreign Key Constraints =========='
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name,
    tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name, kcu.column_name;

\echo ''
\echo '========== 12. Check Constraints =========='
SELECT
    tc.table_name,
    tc.constraint_name,
    cc.check_clause
FROM information_schema.table_constraints tc
JOIN information_schema.check_constraints cc 
    ON tc.constraint_name = cc.constraint_name
WHERE tc.constraint_type = 'CHECK' 
    AND tc.table_schema = 'public'
ORDER BY tc.table_name;

\echo ''
\echo '========== 13. Indexes =========='
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

\echo ''
\echo '========== 14. Triggers =========='
SELECT
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
ORDER BY event_object_table, trigger_name;

\echo ''
\echo '========== 15. Roles Data =========='
SELECT * FROM roles ORDER BY id;

\echo ''
\echo '========== 16. Sample Data Count =========='
SELECT 'users' as table_name, COUNT(*) as row_count FROM users
UNION ALL
SELECT 'services', COUNT(*) FROM services
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'payment_info', COUNT(*) FROM payment_info
UNION ALL
SELECT 'permission_assignments', COUNT(*) FROM permission_assignments
UNION ALL
SELECT 'workflow_tasks', COUNT(*) FROM workflow_tasks
UNION ALL
SELECT 'audit_logs', COUNT(*) FROM audit_logs;

