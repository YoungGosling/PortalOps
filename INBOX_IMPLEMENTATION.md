# Inbox Workflow Implementation - Complete Guide

## Overview

This implementation ensures that:
1. **Onboarding**: HR webhook creates a task ONLY. User is NOT created until Admin completes the onboarding in Inbox.
2. **Offboarding**: HR webhook creates a task ONLY. User is NOT deleted until Admin completes the offboarding in Inbox.
3. Users will NOT appear in Employee Directory until onboarding is completed.

## Architecture Changes

### Database Schema Changes

The `workflow_tasks` table has been updated to:
- Store employee metadata directly (name, email, department) 
- Make `target_user_id` nullable (since user doesn't exist yet for onboarding)
- Change foreign key constraint to `ON DELETE SET NULL`

**Migration SQL**: `/database/migrations/001_update_workflow_tasks_for_inbox.sql`

### Backend Changes

1. **Models** (`app/models/workflow.py`):
   - Added `employee_name`, `employee_email`, `employee_department` columns
   - Made `target_user_id` nullable

2. **Schemas** (`app/schemas/workflow.py`):
   - Updated to include employee metadata fields
   - Made `target_user_id` optional

3. **CRUD** (`app/crud/workflow.py`):
   - `create_onboarding_task`: Now stores employee data, no user creation
   - `create_offboarding_task`: Now stores employee data alongside user reference

4. **Webhooks** (`app/api/api_v1/endpoints/workflows.py`):
   - **`POST /api/webhooks/hr/onboarding`**:
     - ✅ Creates task with employee metadata
     - ❌ Does NOT create user record
     - ✅ Checks for duplicate pending tasks
     - ✅ Checks if user already exists
   
   - **`POST /api/webhooks/hr/offboarding`**:
     - ✅ Creates task referencing existing user
     - ❌ Does NOT delete user
     - ✅ Checks for duplicate pending tasks

5. **Complete Task** (`app/api/api_v1/endpoints/workflows.py`):
   - **`POST /api/inbox/tasks/{id}/complete`**:
     - **Onboarding**: Verifies user was created via Employee Directory API, then marks task complete
     - **Offboarding**: Deletes the user, then marks task complete

### Frontend Changes

1. **Types** (`types/index.ts`):
   - Updated `WorkflowTask` to use `type` instead of `task_type`
   - Made `target_user_id` optional

2. **Inbox Page** (`app/(internal)/inbox/page.tsx`):
   - For onboarding: Creates temporary user object with task data (no API call needed)
   - For offboarding: Fetches existing user from Employee Directory
   - Calls `completeTask` after successful user create/delete

3. **UserFormDialog** (`components/users/UserFormDialog.tsx`):
   - Detects onboarding by checking if `user.id` is empty
   - For onboarding: Calls `createUser` API
   - For offboarding: Just triggers callback (task completion handles deletion)

## Workflow Flows

### Onboarding Flow

```
1. HR System → POST /api/webhooks/hr/onboarding
   ↓ (Creates task with employee data, NO user created)
   
2. Inbox shows pending task with employee info

3. Admin clicks "Start Task"
   ↓ (Opens UserFormDialog with temp user object from task data)
   
4. Admin assigns services → Clicks "Complete Onboarding"
   ↓ (Calls POST /api/users to create user)
   
5. User created successfully
   ↓ (Calls POST /api/inbox/tasks/{id}/complete)
   
6. Backend verifies user exists → Marks task complete
   ↓
   
7. User NOW appears in Employee Directory ✅
```

### Offboarding Flow

```
1. HR System → POST /api/webhooks/hr/offboarding
   ↓ (Creates task referencing user, NO deletion)
   
2. Inbox shows pending task

3. Admin clicks "Start Task"
   ↓ (Fetches user from Employee Directory, shows in read-only form)
   
4. Admin reviews → Clicks "Confirm Offboarding"
   ↓ (Triggers callback which calls POST /api/inbox/tasks/{id}/complete)
   
5. Backend:
   - Deletes user from database
   - Removes all permission assignments
   - Marks task complete
   ↓
   
6. User NO LONGER appears in Employee Directory ✅
```

## Installation & Migration

### Step 1: Apply Database Migration

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps

# Connect to PostgreSQL
psql -U postgres -d portalops

# Run migration
\i database/migrations/001_update_workflow_tasks_for_inbox.sql

# Verify changes
\d workflow_tasks
```

Expected output should show:
- `employee_name` column
- `employee_email` column
- `employee_department` column
- `target_user_id` allows NULL

### Step 2: Restart Backend

```bash
cd server
source .venv/bin/activate
python -m uvicorn app.main:app --reload
```

### Step 3: Rebuild Frontend

```bash
cd nextjs
pnpm install  # If needed
pnpm run dev
```

## Testing Guide

### Test 1: Onboarding Webhook

```bash
# Send onboarding webhook
curl -X POST http://localhost:8000/api/webhooks/hr/onboarding \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: your-webhook-key" \
  -d '{
    "employee": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "department": "Engineering"
    }
  }'

# Expected Response:
# {"message": "Onboarding workflow triggered successfully"}
```

**Verify**:
1. Check Inbox - should see pending onboarding task
2. Check Employee Directory - should NOT see john.doe@example.com yet ✅

### Test 2: Complete Onboarding

1. Login as Admin
2. Go to Inbox
3. Click "Start Task" on John Doe's onboarding
4. Assign at least one service
5. Click "Complete Onboarding"

**Verify**:
1. Task should be marked as completed in Inbox
2. Employee Directory should NOW show john.doe@example.com ✅
3. User should have assigned services

### Test 3: Offboarding Webhook

```bash
# Send offboarding webhook
curl -X POST http://localhost:8000/api/webhooks/hr/offboarding \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: your-webhook-key" \
  -d '{
    "employee": {
      "name": "John Doe",
      "email": "john.doe@example.com",
      "department": "Engineering"
    }
  }'

# Expected Response:
# {"message": "Offboarding workflow triggered successfully"}
```

**Verify**:
1. Check Inbox - should see pending offboarding task
2. Check Employee Directory - should STILL see john.doe@example.com ✅

### Test 4: Complete Offboarding

1. Login as Admin
2. Go to Inbox
3. Click "Start Task" on John Doe's offboarding
4. Review user's current service assignments (read-only)
5. Click "Confirm Offboarding"

**Verify**:
1. Task should be marked as completed in Inbox
2. Employee Directory should NO LONGER show john.doe@example.com ✅
3. All permission assignments should be removed

### Test 5: Duplicate Prevention

```bash
# Try sending the same onboarding webhook again
curl -X POST http://localhost:8000/api/webhooks/hr/onboarding \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: your-webhook-key" \
  -d '{
    "employee": {
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "department": "HR"
    }
  }'

# Send it again
curl -X POST http://localhost:8000/api/webhooks/hr/onboarding \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Key: your-webhook-key" \
  -d '{
    "employee": {
      "name": "Jane Smith",
      "email": "jane.smith@example.com",
      "department": "HR"
    }
  }'

# Expected Response:
# {"message": "Onboarding task already exists for this employee"}
```

## API Endpoints Reference

### Webhooks (HR System)

- `POST /api/webhooks/hr/onboarding` - Trigger onboarding workflow
- `POST /api/webhooks/hr/offboarding` - Trigger offboarding workflow

### Inbox (Admin Only)

- `GET /api/inbox/tasks` - List all tasks
- `POST /api/inbox/tasks/{id}/complete` - Complete a task (creates/deletes user)

### User Management

- `GET /api/users` - List users (onboarded users only)
- `POST /api/users` - Create user (used during onboarding)
- `DELETE /api/users/{id}` - Delete user (called by complete offboarding)

## Key Behaviors

### ✅ Correct Behavior

1. Onboarding webhook creates task, no user in directory yet
2. Admin completes onboarding → user appears in directory
3. Offboarding webhook creates task, user still in directory
4. Admin completes offboarding → user disappears from directory
5. Cannot create duplicate pending tasks for same email

### ❌ Previous Incorrect Behavior (Fixed)

1. ~~Onboarding webhook immediately created placeholder user~~ 
2. ~~User appeared in directory before admin completed onboarding~~
3. ~~Offboarding webhook immediately deleted user~~
4. ~~Admin couldn't review user before deletion~~

## Troubleshooting

### Issue: User appears in directory before onboarding complete

**Check**: Did you apply the database migration?
```sql
SELECT employee_name, employee_email, target_user_id 
FROM workflow_tasks 
WHERE type = 'onboarding';
```

If `target_user_id` is NOT NULL for pending onboarding tasks, the old webhook code is still running.

### Issue: Task complete fails with "User must be created"

**Reason**: Admin didn't successfully create the user first.

**Fix**: Ensure the user creation succeeded before clicking complete.

### Issue: Migration fails

**Error**: `column "employee_email" already exists`

**Solution**: The migration is idempotent. If columns exist, it's safe to continue.

## Database Queries for Debugging

```sql
-- View all pending tasks with employee data
SELECT 
  id, 
  type, 
  status,
  employee_name,
  employee_email,
  target_user_id,
  created_at
FROM workflow_tasks
WHERE status = 'pending'
ORDER BY created_at DESC;

-- View users that were created via onboarding
SELECT 
  u.id,
  u.name,
  u.email,
  wt.id as task_id,
  wt.created_at as onboarded_at
FROM users u
JOIN workflow_tasks wt ON wt.target_user_id = u.id
WHERE wt.type = 'onboarding'
  AND wt.status = 'completed';

-- Check for orphaned tasks (user deleted but task not completed)
SELECT 
  id,
  type,
  employee_email,
  target_user_id,
  status
FROM workflow_tasks
WHERE target_user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE id = target_user_id
  );
```

## Production Considerations

1. **Webhook Authentication**: Ensure `X-Webhook-Key` is properly configured
2. **Email Uniqueness**: The system prevents duplicate emails
3. **Task Assignment**: Currently assigns to first found admin
4. **Audit Logs**: All user creations/deletions are logged
5. **Cascade Deletes**: Permission assignments are automatically deleted with users

## Files Changed

### Backend
- `/server/app/models/workflow.py`
- `/server/app/schemas/workflow.py`
- `/server/app/crud/workflow.py`
- `/server/app/api/api_v1/endpoints/workflows.py`
- `/database/migrations/001_update_workflow_tasks_for_inbox.sql` (new)

### Frontend
- `/nextjs/types/index.ts`
- `/nextjs/app/(internal)/inbox/page.tsx`
- `/nextjs/components/users/UserFormDialog.tsx`

## Summary

This implementation ensures that the Inbox serves as a true gatekeeper for user lifecycle management. No users are created or deleted until an administrator explicitly reviews and approves the action through the Inbox interface. This provides better control, auditability, and prevents accidental premature access or data loss.

