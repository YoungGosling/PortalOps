# v3 Department Feature - User Guide

## What's New

The Employee Directory now has enhanced department management:

- **Department Selection:** Department is now a dropdown menu (not free text)
- **Auto-Assignment:** Selecting a department automatically assigns its products
- **Smart Merging:** You can still manually add or remove products

## For Administrators

### Setup: Dept Master File

Before using the new department features, configure departments:

1. Go to **Admin → Dept Master File**
2. Add your departments (e.g., "Engineering", "Sales", "HR")
3. For each department, assign default products:
   - Click "Edit" on a department
   - Use the tree selector to choose products
   - Click "Save"

**Example:**
```
Department: Engineering
Products: 
  ✓ GitHub Enterprise
  ✓ AWS Console
  ✓ Slack Enterprise
  ✓ Figma Professional

Department: Sales
Products:
  ✓ Salesforce CRM
  ✓ HubSpot
  ✓ Slack Enterprise
```

### Adding a New User

1. Go to **Employee Directory**
2. Click **"Add User"**
3. Fill in basic information:
   - Name (required)
   - Email (required)
   - Position (optional)
   - Hire Date (optional)

4. **Select Department** (optional but recommended):
   - Click the department dropdown
   - Choose from available departments
   - ✨ Products auto-populate based on department

5. **Adjust Products** (optional):
   - Review auto-assigned products in tree view
   - Deselect any products the user doesn't need
   - Add additional products by checking them

6. Click **"Create User"**

#### Example Flow

```
Step 1: Enter "John Doe", "john@example.com"
Step 2: Select "Engineering" from dropdown
        → Toast: "Auto-assigned 4 products from department"
Step 3: Product tree now shows:
        ✓ GitHub Enterprise (auto-assigned)
        ✓ AWS Console (auto-assigned)
        ✓ Slack Enterprise (auto-assigned)
        ✓ Figma Professional (auto-assigned)
Step 4: Manually add:
        ✓ Jira Software (added manually)
Step 5: Manually remove:
        ✗ Figma Professional (deselected)
Final: User has 4 products (3 from dept + 1 manual - 1 removed)
```

### Editing an Existing User

1. Go to **Employee Directory**
2. Click **"Edit"** on a user
3. Form shows current information including department

#### Changing Department

If you change a user's department:
- New department's products are **auto-added**
- User's existing manual products are **preserved**
- Result: User gets **both** old and new products

**Example:**
```
Current State:
  Department: Sales
  Products: Salesforce CRM, HubSpot, Custom Tool

Change to: Engineering

Result:
  Department: Engineering
  Products: Salesforce CRM, HubSpot, Custom Tool,  ← Kept
            GitHub, AWS, Slack, Figma            ← Added
```

#### Removing Department

To remove a user's department assignment:
1. Edit user
2. Clear the department dropdown
3. Products remain unchanged
4. Save

### Department-Less Users

You can create users without assigning a department:
- Leave department dropdown empty
- Manually select products
- These users won't get automatic product updates

**Use cases:**
- Contractors with custom access
- Temporary users
- Cross-functional roles

## For Regular Users

### Viewing Your Information

In the Employee Directory, you'll see:
- Your name and email
- Your department
- Your position/title
- Your hire date
- Products you have access to

## FAQs

### Q: What happens if I change a department's products?

**A:** Changes only affect **new users** assigned to that department. Existing users are not automatically updated.

**Example:**
```
Today: Engineering has GitHub, AWS, Slack
       - Create user "Alice" → gets GitHub, AWS, Slack

Tomorrow: Add "Figma" to Engineering department
       - Create user "Bob" → gets GitHub, AWS, Slack, Figma
       - Alice still has: GitHub, AWS, Slack (unchanged)
```

### Q: Can I manually override department products?

**A:** Yes! Department products are defaults. You can:
- Remove products from department list
- Add products not in department
- Completely customize each user's access

### Q: Do I have to assign a department?

**A:** No, department is optional. Users without departments can still have products assigned manually.

### Q: What if a user needs access to multiple departments' products?

**A:** 
1. Assign them to their primary department
2. Manually add products from other departments
3. Or, don't assign a department and manually select all products

### Q: Can a user belong to multiple departments?

**A:** No, each user can only have one primary department. For cross-department access, manually assign additional products.

## Best Practices

### 1. Set Up Departments First

Before adding users:
- Create all departments in Dept Master File
- Assign products to each department
- Review and test with a dummy user

### 2. Use Departments for Common Patterns

Assign products to departments for:
- Standard company tools (email, chat, docs)
- Department-specific tools (CRM for sales, IDE for engineering)
- Default access levels

### 3. Manual Override for Exceptions

Use manual product selection for:
- Managers needing cross-department access
- Specialized roles with unique tool needs
- Temporary access grants

### 4. Review Regularly

Periodically review:
- Are department product assignments up-to-date?
- Do users have correct access?
- Are there unused product assignments?

## Workflow: Onboarding

When HR triggers an onboarding workflow:

1. Onboarding task appears in **Inbox**
2. Admin clicks **"Start"** on task
3. Form pre-filled with HR data (name, email, department)
4. **Select department** → Products auto-assign
5. Adjust products if needed
6. Click **"Complete Onboarding"**
7. User created with all permissions

## Workflow: Offboarding

Offboarding workflow unchanged:
1. Task appears in Inbox
2. Admin reviews user info
3. Confirms offboarding
4. User and all access removed

## Visual Guide

### Old vs New Department Field

**Before (v2):**
```
Department: [________________]  ← Free text input
            Type anything
```

**After (v3):**
```
Department: [Select department ▼]  ← Dropdown
            ├─ Engineering
            ├─ Sales
            ├─ HR
            └─ Finance
```

### Product Auto-Assignment

**Before Department Selection:**
```
Assign Products:
  Service: GitHub
    □ GitHub Enterprise
  Service: AWS
    □ AWS Console
  Service: Slack
    □ Slack Enterprise
```

**After Selecting "Engineering":**
```
✅ Auto-assigned 3 products from department

Assign Products:
  Service: GitHub
    ✓ GitHub Enterprise  ← Auto-checked
  Service: AWS
    ✓ AWS Console        ← Auto-checked
  Service: Slack
    ✓ Slack Enterprise   ← Auto-checked
```

## Tips & Tricks

### Tip 1: Quick Setup for Similar Users

Creating multiple users in same department:
1. Set department first
2. Products auto-populate
3. Quick adjustments if needed
4. Save

### Tip 2: Bulk Department Changes

To move multiple users to a new department:
1. Edit each user individually
2. Change department
3. Review merged products
4. Save

*(Bulk edit not yet available but planned for future)*

### Tip 3: Test with Dummy User

Before rolling out:
1. Create a test user
2. Try different departments
3. Verify products auto-assign correctly
4. Delete test user

## Troubleshooting

### Issue: Department dropdown is empty

**Solution:** 
1. Go to Admin → Dept Master File
2. Add departments first
3. Return to Add User dialog

### Issue: No products auto-assigned

**Solution:**
1. Check if department has products in Dept Master File
2. Edit department and assign products
3. Try again

### Issue: Wrong products assigned

**Solution:**
1. Manually deselect incorrect products
2. Manually select correct products
3. Review department setup in Dept Master File

## Keyboard Shortcuts

- `Tab` - Navigate between fields
- `Space` - Open dropdown
- `Enter` - Submit form
- `Esc` - Close dialog

## Support

For issues or questions:
1. Check this guide
2. Review Dept Master File configuration
3. Contact your system administrator

## Changelog

### v3.0 (Current)
- ✨ Department dropdown with auto-population
- ✨ Automatic product assignment from departments
- ✨ Smart product merging
- 🔧 Improved user creation workflow

### v2.0 (Previous)
- Free text department field
- Manual product assignment only

