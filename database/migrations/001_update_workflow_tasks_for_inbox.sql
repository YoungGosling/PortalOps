-- Migration: Update workflow_tasks table to support storing employee metadata
-- instead of requiring a user record to exist before creating onboarding tasks
--
-- Changes:
-- 1. Make target_user_id nullable (for onboarding before user is created)
-- 2. Add employee metadata columns (name, email, department)
-- 3. Update foreign key constraint to allow NULL

-- Step 1: Drop the existing foreign key constraint
ALTER TABLE workflow_tasks 
  DROP CONSTRAINT IF EXISTS workflow_tasks_target_user_id_fkey;

-- Step 2: Make target_user_id nullable
ALTER TABLE workflow_tasks 
  ALTER COLUMN target_user_id DROP NOT NULL;

-- Step 3: Add employee metadata columns
ALTER TABLE workflow_tasks 
  ADD COLUMN IF NOT EXISTS employee_name VARCHAR(255),
  ADD COLUMN IF NOT EXISTS employee_email VARCHAR(255),
  ADD COLUMN IF NOT EXISTS employee_department VARCHAR(255);

-- Step 4: Re-add the foreign key constraint with ON DELETE SET NULL
ALTER TABLE workflow_tasks 
  ADD CONSTRAINT workflow_tasks_target_user_id_fkey 
  FOREIGN KEY (target_user_id) 
  REFERENCES users(id) 
  ON DELETE SET NULL;

-- Step 5: Add index on employee_email for faster lookups
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_employee_email 
  ON workflow_tasks(employee_email);

-- Step 6: Update any existing tasks to populate the employee metadata from target user
UPDATE workflow_tasks wt
SET 
  employee_name = u.name,
  employee_email = u.email,
  employee_department = u.department
FROM users u
WHERE wt.target_user_id = u.id
  AND (wt.employee_email IS NULL OR wt.employee_name IS NULL);

COMMENT ON COLUMN workflow_tasks.employee_name IS 'Employee name from HR system (may not have user record yet for onboarding)';
COMMENT ON COLUMN workflow_tasks.employee_email IS 'Employee email from HR system (may not have user record yet for onboarding)';
COMMENT ON COLUMN workflow_tasks.employee_department IS 'Employee department from HR system (may not have user record yet for onboarding)';

