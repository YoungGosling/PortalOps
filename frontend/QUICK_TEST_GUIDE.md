# Quick Test Guide - Login Fix Verification

## Prerequisites

1. **Backend Server Running**
   - Ensure your backend API is running on `http://localhost:8000`
   - Check that `/api/auth/login` endpoint is accessible

2. **Environment Configuration**
   - Copy `env.example` to `.env.local` if not already done
   - Update `NEXT_PUBLIC_API_URL` if your backend runs on a different port

## Testing Steps

### 1. Start the Development Server

```bash
cd /home/evanzhang/EnterpriseProjects/PortalOps/frontend
pnpm install  # If dependencies aren't installed
pnpm dev
```

The server should start at `http://localhost:3000`

### 2. Test Login Flow

1. **Navigate to the app**: Open `http://localhost:3000`
   - ✅ Should redirect to `/signin` page
   
2. **Login Page Loads**:
   - ✅ Should see PortalOps login form
   - ✅ Should see "Sign In with Microsoft" button
   - ✅ Should see email/password form

3. **Attempt Login**:
   - Enter test credentials (e.g., `admin@portalops.com` / `password`)
   - Click "Sign In"
   - ✅ Should see "Signing in..." state
   - ✅ Should redirect to `/dashboard` (NOT 404!)
   
4. **Dashboard Loads**:
   - ✅ Should see the dashboard page with charts/metrics
   - ✅ Sidebar should be visible on the left
   - ✅ Header should show user profile dropdown
   - ✅ No console errors

### 3. Test Navigation

1. **Click Sidebar Items**:
   - ✅ Dashboard → `/dashboard` works
   - ✅ Inbox → `/inbox` works
   - ✅ Services → `/services` works (if user has permission)
   - ✅ Users → `/users` works (if user has permission)

2. **Direct URL Access**:
   - In browser, go to `http://localhost:3000/dashboard`
   - ✅ Should load dashboard without 404
   - Try other routes like `/inbox`, `/services`
   - ✅ All should work if user has permission

### 4. Test Authentication Persistence

1. **Refresh the Page**:
   - While on `/dashboard`, press F5 or Ctrl+R
   - ✅ Should remain on dashboard (not redirect to signin)
   - ✅ User data should still be visible

2. **Open DevTools** (F12):
   - Go to "Application" tab → "Cookies"
   - ✅ Should see `auth_token` cookie set
   - ✅ Cookie should have your JWT token value

3. **Check LocalStorage**:
   - In DevTools "Application" tab → "Local Storage"
   - ✅ Should see `portalops_user` with user data
   - ✅ Should see `portalops_token` with access token

### 5. Test Logout

1. **Click User Profile** (top right)
2. **Click "Sign Out"**
3. ✅ Should redirect to `/signin`
4. **Check DevTools**:
   - ✅ `auth_token` cookie should be deleted
   - ✅ `portalops_user` localStorage should be cleared

5. **Try accessing protected route**:
   - Manually navigate to `http://localhost:3000/dashboard`
   - ✅ Should redirect back to `/signin`

## Common Issues & Solutions

### Issue: Still getting 404 on /dashboard

**Solution**: Clear browser cache and cookies
```bash
# Or in DevTools:
# Application → Clear site data
```

### Issue: "Signing in..." never completes

**Possible causes**:
1. Backend server not running
2. Wrong API URL in `.env.local`
3. CORS issues

**Check**:
```bash
# Test backend manually
curl http://localhost:8000/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@portalops.com","password":"password"}'
```

### Issue: Redirects to signin after login

**Possible causes**:
1. Cookie not being set
2. Middleware not reading cookie

**Debug**:
1. Open DevTools → Network tab
2. Login and watch the requests
3. Check if `/dashboard` request has `auth_token` cookie
4. If no cookie, check browser console for errors

### Issue: Protected routes show 404

**Solution**: Ensure the route files exist:
```bash
ls -la app/(internal)/dashboard/page.tsx
ls -la app/(internal)/inbox/page.tsx
# etc.
```

## Verification Checklist

Use this checklist to verify everything works:

- [ ] App starts without errors (`pnpm dev`)
- [ ] Root `/` redirects to `/signin`
- [ ] Login form is visible and functional
- [ ] Login with valid credentials succeeds
- [ ] Redirects to `/dashboard` (no 404!)
- [ ] Dashboard page displays correctly
- [ ] Sidebar navigation works
- [ ] User profile dropdown shows user info
- [ ] Page refresh maintains auth state
- [ ] `auth_token` cookie is set after login
- [ ] Direct navigation to `/dashboard` works when authenticated
- [ ] Logout clears cookies and redirects to signin
- [ ] Cannot access `/dashboard` after logout

## Browser Console Checks

Open DevTools Console (F12) and verify:

✅ **No errors** like:
- ❌ `404 Not Found`
- ❌ `TypeError: Cannot read property...`
- ❌ `Failed to fetch`

✅ **Expected logs** (if you added any):
- `Login successful`
- `User profile loaded`
- `Navigating to /dashboard`

## Success Criteria

The fix is successful if:

1. ✅ Login redirects to `/dashboard` successfully
2. ✅ Dashboard page loads without 404
3. ✅ Authentication persists across page refreshes
4. ✅ All navigation works correctly
5. ✅ Logout clears auth and redirects properly

## Next Steps After Testing

If all tests pass:
1. Commit the changes
2. Deploy to staging/production
3. Test on deployed environment
4. Update team documentation

If issues persist:
1. Check `LOGIN_FIX_SUMMARY.md` for technical details
2. Review the file changes made
3. Check browser console for specific errors
4. Verify backend API is functioning correctly



