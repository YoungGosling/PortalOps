# v3 Department Feature - Quick Start

## 🚀 Quick Deployment (5 Minutes)

### Step 1: Database Migration (1 min)

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server

# Run migration
psql postgresql://portalops:password@localhost:5432/portalops \
  -f migrations/004_add_department_id_to_users.sql

# Verify
psql postgresql://portalops:password@localhost:5432/portalops \
  -c "SELECT column_name FROM information_schema.columns WHERE table_name='users' AND column_name='department_id';"
```

Expected output: `department_id`

### Step 2: Restart Backend (1 min)

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/server
source .venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Wait for: `Application startup complete.`

### Step 3: Restart Frontend (1 min)

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/nextjs
pnpm dev
```

Wait for: `Ready in XXXms`

### Step 4: Quick Test (2 min)

1. Open: `http://localhost:3000`
2. Login as Admin
3. Go to Employee Directory
4. Click "Add User"
5. **✓ Check:** Department field is a dropdown (not text input)
6. Select any department
7. **✓ Check:** Toast appears: "Auto-assigned X products"
8. **✓ Check:** Products checked in tree view

✅ **Done!** Feature is live.

---

## 📋 What Changed?

### For End Users
- Department is now a dropdown menu
- Selecting a department auto-assigns its products
- Can still manually adjust products

### For Admins
- Set up departments in "Dept Master File" first
- Assign default products to each department
- Users inherit department products automatically

---

## 🔧 Troubleshooting

### Migration Error: "column already exists"
```bash
# Check if migration already ran
psql portalops_db -c "\d users" | grep department_id
```
If it shows `department_id`, skip step 1.

### Backend Error: "department not found"
```bash
# Check departments table exists
psql portalops_db -c "SELECT COUNT(*) FROM departments;"
```
If zero, add departments in Admin → Dept Master File.

### Frontend: Dropdown Empty
Go to **Admin → Dept Master File** and add departments first.

---

## 📚 Full Documentation

- **Technical Details:** `V3_DEPARTMENT_IMPLEMENTATION.md`
- **Deployment Guide:** `V3_DEPLOYMENT_GUIDE.md`
- **User Manual:** `V3_USER_GUIDE.md`
- **Summary:** `V3_IMPLEMENTATION_SUMMARY.md`

---

## ✅ Success Checklist

- [ ] Migration applied without errors
- [ ] Backend restarts successfully
- [ ] Frontend restarts successfully
- [ ] Can login and access Employee Directory
- [ ] Department shows as dropdown
- [ ] Selecting department auto-assigns products
- [ ] Can create user with department
- [ ] Can create user without department

---

## 🆘 Need Help?

1. Check error logs:
   - Backend: `server/logs/app.log`
   - Frontend: Browser console (F12)

2. Verify database:
   ```bash
   psql portalops_db -c "\d users"
   ```

3. Test API directly:
   ```bash
   curl http://localhost:8000/api/departments \
     -H "Authorization: Bearer YOUR_TOKEN"
   ```

4. Review full guides in `/doc/cursor/feat-v3/`

---

## 🔄 Rollback (if needed)

```bash
# 1. Stop services (Ctrl+C both backend and frontend)

# 2. Rollback database
psql portalops_db -c "ALTER TABLE users DROP COLUMN department_id;"

# 3. Revert code
cd /home/evanzhang/EnterpriseProjects/PortalOps
git revert HEAD

# 4. Restart services (same as deployment steps 2-3)
```

---

**Status:** 🟢 Ready to Deploy  
**Version:** v3.0.0  
**Date:** 2025-10-22

