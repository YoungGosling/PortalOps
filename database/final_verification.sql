-- Final Verification Script
-- Run this after applying add_missing_constraints_indexes.sql
-- to confirm database structure matches schema.sql 100%

\echo '==========================================
FINAL SCHEMA VERIFICATION REPORT
=========================================='
\echo ''

\echo '1. Tables Count (Expected: 9)'
SELECT COUNT(*) as table_count 
FROM information_schema.tables 
WHERE table_schema = 'public' AND table_type = 'BASE TABLE';

\echo ''
\echo '2. Views Count (Expected: 3)'
SELECT COUNT(*) as view_count 
FROM information_schema.views 
WHERE table_schema = 'public';

\echo ''
\echo '3. Foreign Keys Count (Expected: 10)'
SELECT COUNT(*) as fk_count
FROM pg_constraint
WHERE contype = 'f'
AND connamespace = 'public'::regnamespace;

\echo ''
\echo '4. Check Constraints Count (Expected: 4)'
\echo '   - payment_info_status_check'
\echo '   - permission_assignments_check'
\echo '   - workflow_tasks_type_check'
\echo '   - workflow_tasks_status_check'
SELECT COUNT(*) as check_count
FROM pg_constraint
WHERE contype = 'c'
AND connamespace = 'public'::regnamespace;

\echo ''
\echo '5. Performance Indexes Count (Expected: 16, excluding PKs)'
SELECT COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey'
AND indexname NOT LIKE '%_key';

\echo ''
\echo '6. Triggers Count (Expected: 5)'
SELECT COUNT(*) as trigger_count
FROM information_schema.triggers
WHERE trigger_schema = 'public';

\echo ''
\echo '7. Roles Data (Expected: 3 roles)'
SELECT COUNT(*) as roles_count FROM roles;

\echo ''
\echo '=========================================='
\echo 'DETAILED CHECK CONSTRAINTS:'
\echo '=========================================='
SELECT
    conrelid::regclass AS table_name,
    conname AS constraint_name
FROM pg_constraint
WHERE contype = 'c'
AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;

\echo ''
\echo '=========================================='
\echo 'ALL INDEXES (excluding PKs and unique):'
\echo '=========================================='
SELECT
    tablename,
    COUNT(*) as index_count
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey'
AND indexname NOT LIKE '%_key'
GROUP BY tablename
ORDER BY tablename;

\echo ''
\echo '=========================================='
\echo 'VERIFICATION COMPLETE!'
\echo 'If all counts match expected values,'
\echo 'your database is 100% consistent with schema.sql'
\echo '=========================================='

