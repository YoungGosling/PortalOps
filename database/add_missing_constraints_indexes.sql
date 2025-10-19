-- Add Missing Constraints and Indexes
-- This script adds the constraints and indexes that are defined in schema.sql
-- but missing from the current database

-- ============================================
-- 1. Add Missing Check Constraints
-- ============================================

\echo '========== Adding Missing Check Constraints =========='

-- permission_assignments: Ensure either service_id or product_id is not null
ALTER TABLE permission_assignments 
ADD CONSTRAINT permission_assignments_check 
CHECK (service_id IS NOT NULL OR product_id IS NOT NULL);

-- workflow_tasks: Restrict type to valid values
ALTER TABLE workflow_tasks 
ADD CONSTRAINT workflow_tasks_type_check 
CHECK (type IN ('onboarding', 'offboarding'));

-- workflow_tasks: Restrict status to valid values
ALTER TABLE workflow_tasks 
ADD CONSTRAINT workflow_tasks_status_check 
CHECK (status IN ('pending', 'completed', 'invited', 'in_progress', 'cancelled'));

\echo 'Check constraints added successfully!'
\echo ''

-- ============================================
-- 2. Add Missing Indexes for Performance
-- ============================================

\echo '========== Adding Missing Performance Indexes =========='

-- Foreign key indexes
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_products_service_id ON products(service_id);
CREATE INDEX idx_permission_assignments_user_id ON permission_assignments(user_id);
CREATE INDEX idx_permission_assignments_service_id ON permission_assignments(service_id);
CREATE INDEX idx_permission_assignments_product_id ON permission_assignments(product_id);
CREATE INDEX idx_workflow_tasks_assignee_user_id ON workflow_tasks(assignee_user_id);
CREATE INDEX idx_workflow_tasks_target_user_id ON workflow_tasks(target_user_id);
CREATE INDEX idx_audit_logs_actor_user_id ON audit_logs(actor_user_id);

\echo 'Foreign key indexes created!'

-- Multi-column indexes for permission checks
CREATE INDEX idx_permission_assignments_user_service ON permission_assignments(user_id, service_id);
CREATE INDEX idx_permission_assignments_user_product ON permission_assignments(user_id, product_id);

\echo 'Multi-column indexes created!'

-- Additional performance indexes
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX idx_workflow_tasks_assignee_status ON workflow_tasks(assignee_user_id, status);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_department ON users(department);

\echo 'Additional performance indexes created!'
\echo ''

-- ============================================
-- 3. Verify All Constraints and Indexes
-- ============================================

\echo '========== Verification: Check Constraints =========='
SELECT
    conrelid::regclass AS table_name,
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE contype = 'c'
AND connamespace = 'public'::regnamespace
ORDER BY conrelid::regclass::text;

\echo ''
\echo '========== Verification: All Indexes (excluding primary keys) =========='
SELECT
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND indexname NOT LIKE '%_pkey'
ORDER BY tablename, indexname;

\echo ''
\echo '========== Summary =========='
\echo 'All missing constraints and indexes have been added!'
\echo 'Your database structure now matches schema.sql completely.'

