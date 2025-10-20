# Inbox Count Inconsistency Fix

## Problem Description

The Dashboard's "View Inbox" button was showing an incorrect count that didn't match the actual number of tasks visible in the Inbox page.

**Example**: 
- Dashboard showed: "2" pending tasks
- Inbox page displayed: only 1 task
- Database (`workflow_tasks` table): 2 tasks total, but only 1 assigned to current user

## Root Cause

There was an inconsistency between two API endpoints:

1. **Dashboard Pending Tasks Count** (`GET /api/dashboard/pending-tasks-count`)
   - Counted **ALL** pending tasks in the system
   - Did NOT filter by assignee
   ```python
   pending_count = db.query(func.count(WorkflowTask.id)).filter(
       WorkflowTask.status == 'pending'
   ).scalar()
   ```

2. **Inbox Tasks List** (`GET /api/inbox/tasks`)
   - Returned tasks **only for the current user**
   - Filtered by `assignee_user_id`
   ```python
   tasks = workflow_task.get_tasks_for_user(
       db, user_id=current_user.id, status=status
   )
   ```

## Solution

Modified the Dashboard pending tasks count endpoint to filter by the current user's ID, making it consistent with the Inbox tasks endpoint.

### Changed File

**File**: `server/app/api/api_v1/endpoints/dashboard.py`

**Changes** (lines 143-159):
```python
@router.get("/pending-tasks-count")
def get_pending_tasks_count(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """
    Get count of pending workflow tasks (onboarding/offboarding) assigned to the current user.
    Returns the count of tasks with status='pending' assigned to the current user.
    """
    pending_count = db.query(func.count(WorkflowTask.id)).filter(
        WorkflowTask.status == 'pending',
        WorkflowTask.assignee_user_id == current_user.id  # ✅ Added filter
    ).scalar()

    return {
        "pendingCount": pending_count or 0
    }
```

## Impact

- ✅ Dashboard "View Inbox" count now matches the actual number of tasks in Inbox
- ✅ Users only see counts for tasks assigned to them
- ✅ Consistent behavior across Dashboard and Inbox pages
- ✅ No breaking changes to API response format
- ✅ No frontend changes required

## Testing

To verify the fix:

1. **Check database state**:
   ```sql
   SELECT id, type, status, assignee_user_id, employee_name, employee_email 
   FROM workflow_tasks 
   WHERE status = 'pending';
   ```

2. **Test Dashboard count**:
   - Log in as a user
   - Check the "View Inbox" badge number on Dashboard
   - Should show only tasks assigned to that user

3. **Test Inbox page**:
   - Navigate to Inbox (`/inbox`)
   - Count visible pending tasks
   - Should match Dashboard badge number

4. **Test with multiple users**:
   - Create tasks assigned to different users
   - Log in as each user
   - Verify each sees only their own tasks

## Related Files

- Backend:
  - `server/app/api/api_v1/endpoints/dashboard.py` (MODIFIED)
  - `server/app/api/api_v1/endpoints/workflows.py` (reference)
  - `server/app/crud/workflow.py` (reference)

- Frontend:
  - `nextjs/app/(internal)/page.tsx` (Dashboard - no changes needed)
  - `nextjs/app/(internal)/inbox/page.tsx` (Inbox - no changes needed)
  - `nextjs/lib/api.ts` (API client - no changes needed)

## Deployment

No special deployment steps required. Simply restart the backend server to apply the changes:

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server
./start.sh
```

Or if using Docker:
```bash
docker-compose restart
```


