# PortalOps Frontend - Testing Checklist

## Pre-Testing Setup

1. ✅ Build completed successfully
2. ✅ No TypeScript errors
3. ✅ No duplicate routes
4. ✅ Development server can start

## Visual Testing

### Dashboard Page (`/dashboard`)
- [ ] Verify stat cards have left border accent (blue, green, yellow, red)
- [ ] Check icon backgrounds are light colored (bg-*-50)
- [ ] Confirm card text hierarchy (muted title, bold number, muted description)
- [ ] Verify trend indicators show correctly
- [ ] Check "Recent Activity" section displays properly
- [ ] Check "Upcoming Renewals" section displays properly
- [ ] Verify "Quick Actions" section is visible
- [ ] Test responsive layout on mobile/tablet

### Inbox Page (`/inbox`)
- [ ] Verify 4 status summary cards at top (Pending, In Progress, Completed, Escalated)
- [ ] Check search input works and filters tasks
- [ ] Check status filter dropdown works
- [ ] Verify task cards show correct icons with colored backgrounds
- [ ] Confirm pending badge is yellow with lowercase text
- [ ] Confirm completed badge is green with lowercase text
- [ ] Check "Start Task" button appears on pending tasks
- [ ] Check "Comments" button appears on pending tasks
- [ ] Verify task details display correctly (Service Details, Assigned to)
- [ ] Test responsive layout on mobile/tablet

### Layout Components

#### Header
- [ ] Verify header background is white in light mode
- [ ] Check hamburger menu toggles sidebar
- [ ] Verify PortalOps logo and name display
- [ ] Check search button is visible
- [ ] Check admin settings button shows for Admin users (with orange dot)
- [ ] Check notifications dropdown works
- [ ] Check help button is visible
- [ ] Verify user dropdown menu works
- [ ] Check theme switcher works (Light/Dark/System)
- [ ] Verify sign out works

#### Sidebar
- [ ] Verify sidebar background is white in light mode
- [ ] Check sidebar collapses/expands correctly
- [ ] Verify navigation items show appropriate icons
- [ ] Check active state highlighting works
- [ ] Verify Payment Register badge shows incomplete count
- [ ] Check role-based menu items (Admin vs ServiceAdmin)
- [ ] Verify "Administration" section is collapsible (Admin only)
- [ ] Test responsive behavior on mobile

### Color Scheme

#### Light Mode
- [ ] Main background: Light gray (#fafafa / hsl(0 0% 98%))
- [ ] Card backgrounds: Pure white
- [ ] Header: Pure white with subtle border
- [ ] Sidebar: Pure white with border
- [ ] Text: Dark gray for primary, muted for secondary
- [ ] Borders: Subtle gray

#### Dark Mode
- [ ] Main background: Dark blue-gray
- [ ] Card backgrounds: Dark
- [ ] Header: Dark with backdrop blur
- [ ] Sidebar: Dark
- [ ] Text: Light gray for primary, muted for secondary
- [ ] Borders: Dark gray

### Other Pages

#### Services Page (`/services`)
- [ ] Service cards display correctly
- [ ] Add/Edit service functionality works
- [ ] Product count displays on each service card
- [ ] Delete service works (products become unassociated)

#### Products Page (`/products`)
- [ ] Product list displays correctly
- [ ] Filter by service dropdown works
- [ ] Add/Edit product functionality works
- [ ] Delete product works (removes from Payment Register)

#### Users Page (`/users`)
- [ ] User list displays correctly (Admin only)
- [ ] Filter by product works
- [ ] Add/Edit user functionality works
- [ ] Role assignment works
- [ ] Service/Product assignment works
- [ ] Delete user works

#### Payment Register (`/payment-register`)
- [ ] All billing records display (Admin only)
- [ ] Incomplete records show at top with red indicator
- [ ] Complete records show green indicator
- [ ] Inline editing works for all fields
- [ ] File upload works for bill attachments
- [ ] Navigation badge updates after saving
- [ ] Amount, Cardholder, Expiry Date, Payment Method fields work

## Functional Testing

### Authentication
- [ ] Azure AD login works (if configured)
- [ ] Email/password login works
- [ ] Session persists across page refreshes
- [ ] Logout works correctly
- [ ] Protected routes redirect to signin when not authenticated

### Role-Based Access
- [ ] Admin sees all pages
- [ ] ServiceAdmin sees limited pages (no Inbox, User Directory, Payment Register)
- [ ] Regular users see appropriate pages
- [ ] Navigation menu updates based on role

### Data Operations
- [ ] Create operations work and refresh data
- [ ] Update operations work and refresh data
- [ ] Delete operations work and refresh data
- [ ] Toast notifications appear for all operations
- [ ] Error handling works for failed operations

### Workflow (Inbox)
- [ ] Onboarding tasks display correctly
- [ ] Start onboarding opens panel with pre-filled employee data
- [ ] Service/Product assignment is required
- [ ] Completing onboarding creates user
- [ ] Offboarding tasks display correctly
- [ ] Start offboarding opens panel with current assignments
- [ ] Completing offboarding deletes user

## Browser Testing
- [ ] Chrome/Edge (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile Safari (iOS)
- [ ] Mobile Chrome (Android)

## Performance Testing
- [ ] Page load time < 2 seconds
- [ ] Smooth animations and transitions
- [ ] No console errors
- [ ] No memory leaks
- [ ] Responsive to user interactions

## Accessibility Testing
- [ ] Keyboard navigation works
- [ ] Focus states are visible
- [ ] Screen reader compatible
- [ ] Sufficient color contrast
- [ ] ARIA labels present where needed

## Edge Cases
- [ ] Empty states display correctly
- [ ] Loading states display correctly
- [ ] Error states display correctly
- [ ] Long text wraps properly
- [ ] Large datasets paginate/scroll properly
- [ ] Network errors are handled gracefully

## Final Checks
- [ ] No console warnings or errors
- [ ] All images load correctly
- [ ] All fonts load correctly
- [ ] All icons display correctly
- [ ] Build produces no warnings
- [ ] Linter passes with no errors

## Notes
- Azure login configuration is optional and should not affect core functionality
- Some API endpoints may not be available in development mode
- Fallback data is used when API calls fail for development purposes

