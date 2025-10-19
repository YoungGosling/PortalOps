# User Inventory Bug Fix - UUID Serialization Error

**Date:** 2025-10-19  
**Status:** ✅ Fixed

## Problem

When updating a user via `PUT /api/users/{user_id}`, the API returned a 500 error:

```
ERROR: Database error: (builtins.TypeError) Object of type UUID is not JSON serializable
```

**Error Location:** `audit_logs` table insertion  
**Root Cause:** The `assignedProductIds` field in the audit log details contains UUID objects, which cannot be directly serialized to JSON.

## Error Details

```python
details={
    'name': '张三',
    'email': 'zhangsan@example.com',
    'department': '工程部',
    'assignedProductIds': [UUID('01395304-b7b5-478d-814f-ad78ac98a991'), ...]  # ❌ UUID objects
}
```

The `details` field in `audit_logs` table is of type `JSONB`, which requires all values to be JSON-serializable.

## Solution

Convert UUID objects to strings before logging to the audit trail.

### Code Change

**File:** `server/app/api/api_v1/endpoints/users.py`

**Before:**
```python
# Log the action
audit_log.log_action(
    db,
    actor_user_id=current_user.id,
    action="user.update",
    target_id=str(user_id),
    details=user_update.model_dump(exclude_unset=True)  # ❌ Contains UUID objects
)
```

**After:**
```python
# Log the action
update_details = user_update.model_dump(exclude_unset=True)
# Convert UUID objects to strings for JSON serialization
if "assignedProductIds" in update_details and update_details["assignedProductIds"]:
    update_details["assignedProductIds"] = [str(pid) for pid in update_details["assignedProductIds"]]

audit_log.log_action(
    db,
    actor_user_id=current_user.id,
    action="user.update",
    target_id=str(user_id),
    details=update_details  # ✅ All values are JSON-serializable
)
```

## Notes

- The `POST /api/users` (create user) endpoint already handles this correctly with:
  ```python
  "assignedProductIds": [str(pid) for pid in (user_in.assignedProductIds or [])]
  ```
- This fix ensures consistency between create and update operations
- No changes needed to the database schema or frontend

## Testing

After the fix, the following request should work:

```bash
PUT http://localhost:8000/api/users/{user_id}
Content-Type: application/json

{
  "name": "张三",
  "email": "zhangsan@example.com",
  "department": "工程部",
  "assignedProductIds": [
    "01395304-b7b5-478d-814f-ad78ac98a991",
    "01395304-b7b5-478d-814f-ad78ac980002"
  ]
}
```

Expected: `200 OK` with updated user data

