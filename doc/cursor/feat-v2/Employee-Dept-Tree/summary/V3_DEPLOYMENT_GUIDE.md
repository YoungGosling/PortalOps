# v3 Department Feature - Deployment Guide

## Prerequisites

- PostgreSQL database running
- Backend server (FastAPI)
- Frontend server (Next.js)
- Admin access to PortalOps

## Step 1: Database Migration

### Option A: Using psql (Direct)

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server

# Connect to database and run migration
psql postgresql://portalops:password@localhost:5432/portalops \
  -f migrations/004_add_department_id_to_users.sql
```

### Option B: Manual SQL Execution

Connect to your database and run:

```sql
-- Add department_id column (nullable)
ALTER TABLE users 
ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_users_department_id ON users(department_id);
```

### Verify Migration

```sql
-- Check if column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'users' AND column_name = 'department_id';

-- Check index
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'idx_users_department_id';
```

Expected output:
```
 column_name   | data_type | is_nullable
---------------+-----------+-------------
 department_id | uuid      | YES

 indexname                | indexdef
--------------------------+--------------------------------------------------
 idx_users_department_id  | CREATE INDEX idx_users_department_id ON ...
```

## Step 2: Backend Deployment

### Check Dependencies

All dependencies are already in `requirements.txt`. No new packages needed.

### Restart Backend Server

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server

# Activate virtual environment
source .venv/bin/activate

# Install any updates (if needed)
pip install -r requirements.txt

# Restart server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Verify Backend

Test the updated API:

```bash
# Test GET /api/users (should include department_id)
curl -X GET "http://localhost:8000/api/users" \
  -H "Authorization: Bearer YOUR_TOKEN"

# Expected response includes department_id:
# {
#   "data": [
#     {
#       "id": "...",
#       "name": "...",
#       "department": "...",      // Legacy field
#       "department_id": "...",   // NEW field
#       ...
#     }
#   ]
# }
```

## Step 3: Frontend Deployment

### Install Dependencies

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/nextjs

# Install dependencies (if any new ones)
pnpm install
```

### Restart Frontend Server

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/nextjs

# Development mode
pnpm dev

# Production build
pnpm build
pnpm start
```

### Verify Frontend

1. Open browser: `http://localhost:3000`
2. Login as Admin
3. Navigate to "Employee Directory"

## Step 4: Manual Testing

### Test 1: Department Dropdown Appears

1. Click "Add User" button
2. **✓ Verify:** Department field is a dropdown (not text input)
3. **✓ Verify:** Dropdown shows all departments from Dept Master File
4. **✓ Verify:** Can select a department
5. **✓ Verify:** Can leave dropdown empty

### Test 2: Auto-Assignment of Products

1. In "Add User" dialog, select a department
2. **✓ Verify:** Toast appears: "Auto-assigned X products from department"
3. **✓ Verify:** Product selection tree shows checked products
4. **✓ Verify:** Products correspond to department's assigned products

### Test 3: Manual Product Override

1. Select a department (products auto-populated)
2. Manually deselect some auto-assigned products
3. **✓ Verify:** Can deselect department products
4. Manually select additional products not in department
5. **✓ Verify:** Can add extra products
6. Submit form
7. **✓ Verify:** User created with custom product list

### Test 4: Create User Without Department

1. Click "Add User"
2. Fill Name, Email, Position
3. Leave Department dropdown empty
4. Manually select products
5. Submit form
6. **✓ Verify:** User created successfully
7. **✓ Verify:** Only manually selected products assigned

### Test 5: Edit Existing User

1. Click "Edit" on an existing user
2. **✓ Verify:** Department dropdown shows current department (if any)
3. **✓ Verify:** Product tree shows currently assigned products
4. Change department to a different one
5. **✓ Verify:** New department products auto-added
6. **✓ Verify:** Previously selected products preserved
7. Submit changes
8. **✓ Verify:** User updated with merged product list

### Test 6: Edit User - Remove Department

1. Edit a user with a department
2. Clear department selection (set to empty)
3. **✓ Verify:** Products remain unchanged
4. Submit
5. **✓ Verify:** User's department_id set to NULL
6. **✓ Verify:** Products retained

### Test 7: Inbox Onboarding Workflow

1. Trigger an onboarding webhook (or use test task)
2. Go to Inbox → Click "Start" on onboarding task
3. **✓ Verify:** Department dropdown available
4. Select department
5. **✓ Verify:** Products auto-assigned
6. Complete onboarding
7. **✓ Verify:** User created with department and products

### Test 8: Database Validation

```sql
-- Check a created user
SELECT id, name, department, department_id 
FROM users 
WHERE email = 'test@example.com';

-- Verify department FK
SELECT u.name, d.name AS department_name
FROM users u
LEFT JOIN departments d ON u.department_id = d.id
WHERE u.email = 'test@example.com';

-- Check product assignments
SELECT u.name, p.name AS product_name
FROM users u
JOIN permission_assignments pa ON u.id = pa.user_id
JOIN products p ON pa.product_id = p.id
WHERE u.email = 'test@example.com';
```

## Step 5: Rollback Plan (If Needed)

If issues arise, you can rollback:

### Backend Rollback

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server
git checkout HEAD~1 app/models/user.py
git checkout HEAD~1 app/schemas/user.py
git checkout HEAD~1 app/api/api_v1/endpoints/users.py
```

### Database Rollback

```sql
-- Remove department_id column
ALTER TABLE users DROP COLUMN department_id;

-- Remove index
DROP INDEX IF EXISTS idx_users_department_id;
```

### Frontend Rollback

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/nextjs
git checkout HEAD~1 types/index.ts
git checkout HEAD~1 lib/api.ts
git checkout HEAD~1 components/users/UserFormDialog.tsx
```

## Troubleshooting

### Issue: Department dropdown empty

**Cause:** No departments in Dept Master File

**Solution:**
1. Go to Admin → Dept Master File
2. Add at least one department
3. Refresh Add User dialog

### Issue: Products not auto-assigning

**Cause:** Selected department has no products

**Solution:**
1. Go to Admin → Dept Master File
2. Edit the department
3. Assign products to department
4. Try again

### Issue: Migration fails - column already exists

**Cause:** Migration already ran

**Solution:**
```sql
-- Check if column exists
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'users' AND column_name = 'department_id';

-- If exists, skip migration
```

### Issue: API returns 500 error on user create

**Cause:** Migration not applied

**Solution:**
- Verify migration ran successfully
- Check backend logs: `tail -f server/logs/app.log`
- Ensure `department_id` column exists in database

### Issue: Select component not displaying correctly

**Cause:** UI library not installed

**Solution:**
```bash
cd nextjs
pnpm install @radix-ui/react-select
```

## Post-Deployment Verification

### Backend Health Check

```bash
curl http://localhost:8000/health

# Expected: {"status":"healthy"}
```

### API Endpoint Check

```bash
# GET /api/departments (should return departments list)
curl -X GET http://localhost:8000/api/departments \
  -H "Authorization: Bearer YOUR_TOKEN"

# GET /api/users (should include department_id)
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Frontend Check

1. Login: `http://localhost:3000/signin`
2. Dashboard loads: `http://localhost:3000/dashboard`
3. Employee Directory: `http://localhost:3000/users`
4. Dept Master File: `http://localhost:3000/admin/departments`

## Performance Considerations

### Database Indexes

The migration adds an index on `department_id` for faster lookups:

```sql
CREATE INDEX idx_users_department_id ON users(department_id);
```

### API Performance

- Department products fetched only when dropdown changes (lazy loading)
- No impact on existing API endpoints
- New endpoint `/api/departments/{id}/products` for department products

### Frontend Performance

- Departments fetched once when dialog opens
- Product auto-assignment is async (non-blocking)
- Toast notifications for user feedback

## Monitoring

### Logs to Watch

**Backend:**
```bash
tail -f server/logs/app.log | grep -E 'department|user.create|user.update'
```

**Database:**
```sql
-- Monitor user creation with departments
SELECT COUNT(*) AS users_with_dept
FROM users
WHERE department_id IS NOT NULL;

-- Monitor product assignments
SELECT d.name AS department, COUNT(DISTINCT u.id) AS user_count
FROM departments d
JOIN users u ON d.id = u.department_id
GROUP BY d.name;
```

## Success Criteria

- ✅ Database migration applied successfully
- ✅ Backend API returns `department_id` in user responses
- ✅ Frontend shows department dropdown instead of text input
- ✅ Selecting department auto-assigns products
- ✅ Manual product override works correctly
- ✅ Can create users with/without department
- ✅ Can edit users and change departments
- ✅ Inbox workflows function normally
- ✅ No errors in browser console
- ✅ No errors in backend logs

## Next Steps

After successful deployment:

1. **User Training:** Inform admins about new department dropdown
2. **Data Migration:** Optionally migrate existing `department` strings to `department_id`
3. **Documentation:** Update user manual with new workflow
4. **Monitor:** Watch for any issues in first 48 hours
5. **Optimize:** Consider adding department change notifications

## Support

If issues persist:

1. Check logs: Backend (`server/logs/`) and Frontend (browser console)
2. Verify database schema: `\d users` in psql
3. Test API directly with curl/Postman
4. Review implementation: `/doc/cursor/feat-v3/V3_DEPARTMENT_IMPLEMENTATION.md`

