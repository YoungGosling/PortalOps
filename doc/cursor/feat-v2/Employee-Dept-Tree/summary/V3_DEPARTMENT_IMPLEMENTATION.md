# v3 Department Integration Implementation Summary

## Overview

Implemented PRD v3 requirements for department-based user management:
1. ✅ Department field changed from free text to dropdown (single select)
2. ✅ Auto-assignment of department products when department is selected
3. ✅ Manual product assignment can override/supplement department defaults

## Backend Changes

### 1. Database Schema Updates

**File:** `server/app/models/user.py`
- Added `department_id` field as UUID foreign key to `departments` table
- Kept legacy `department` string field for backward compatibility
- Added relationship: `dept_ref = relationship("Department", foreign_keys=[department_id])`

**Migration:** `server/migrations/004_add_department_id_to_users.sql`
```sql
ALTER TABLE users 
ADD COLUMN department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

CREATE INDEX idx_users_department_id ON users(department_id);
```

### 2. Schema Updates

**File:** `server/app/schemas/user.py`

Updated schemas to include `department_id`:
- `UserBase`: Added `department_id: Optional[uuid.UUID] = None`
- `UserCreate`: Inherits from UserBase
- `UserUpdate`: Added `department_id: Optional[uuid.UUID] = None`
- `UserUpdateV2`: Added `department_id: Optional[uuid.UUID] = None`

### 3. API Endpoints Updates

**File:** `server/app/api/api_v1/endpoints/users.py`

#### `POST /api/users` (Create User)
- Fetches department products if `department_id` is provided
- Combines department products with manually assigned products
- Auto-assigns all combined products to the user

```python
# v3: Get department products if department_id is set
department_product_ids = []
if user_in.department_id:
    from app.crud import department as dept_crud
    department_product_ids = [
        str(p.id) for p in dept_crud.get_department_products(db, department_id=user_in.department_id)
    ]

# Combine department products with manually assigned products
all_product_ids = set(department_product_ids)
if user_in.assignedProductIds:
    all_product_ids.update([str(pid) for pid in user_in.assignedProductIds])
```

#### `PUT /api/users/{user_id}` (Update User)
- Same logic as create: fetches and merges department + manual products
- Updates product assignments when department changes

#### `GET /api/users` (List Users)
- Returns `department_id` in user data alongside legacy `department` field

## Frontend Changes

### 1. Type Definitions

**File:** `nextjs/types/index.ts`

Updated User interface:
```typescript
export interface User {
  id: string;
  name: string;
  email: string;
  department?: string;         // Deprecated: kept for backward compatibility
  department_id?: string;      // v3: FK to Department (UUID)
  position?: string;
  hire_date?: string;
  resignation_date?: string;
  roles: ('Admin' | 'ServiceAdmin')[];
  assignedProductIds: string[];
}
```

Updated request interfaces:
- `UserCreateRequest`: Added `department_id?: string`
- `UserUpdateRequest`: Added `department_id?: string`

### 2. API Client

**File:** `nextjs/lib/api.ts`

Updated `getUsers()` to include `department_id` in response mapping:
```typescript
return response.data.map((user) => ({
  ...
  department_id: user.department_id,
  ...
}));
```

### 3. User Form Dialog

**File:** `nextjs/components/users/UserFormDialog.tsx`

Major changes:

#### State Management
```typescript
const [departmentId, setDepartmentId] = useState('');  // Changed from department (string)
const [departments, setDepartments] = useState<Department[]>([]);
const [loadingDepartments, setLoadingDepartments] = useState(false);
```

#### Department Dropdown UI
Replaced text input with Select component:
```tsx
<Select
  value={departmentId}
  onValueChange={handleDepartmentChange}
  disabled={loading || isWorkflowMode || loadingDepartments}
>
  <SelectTrigger id="user-department">
    <SelectValue placeholder="Select department" />
  </SelectTrigger>
  <SelectContent>
    {departments.map((dept) => (
      <SelectItem key={dept.id} value={dept.id}>
        {dept.name}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

#### Auto-Population Logic
```typescript
const handleDepartmentChange = async (newDepartmentId: string) => {
  setDepartmentId(newDepartmentId);
  
  if (newDepartmentId) {
    try {
      const deptProducts = await apiClient.getDepartmentProducts(newDepartmentId);
      const deptProductIds = deptProducts.map(p => p.id);
      
      // Merge with existing manual selections
      const allProductIds = Array.from(new Set([...selectedProductIds, ...deptProductIds]));
      setSelectedProductIds(allProductIds);
      
      toast.success(`Auto-assigned ${deptProductIds.length} products from department`);
    } catch (error) {
      console.error('Failed to load department products:', error);
      toast.error('Failed to load department products');
    }
  }
};
```

#### Form Submission
Updated to send `department_id` instead of `department`:
```typescript
const userData = {
  name: name.trim(),
  email: email.trim(),
  department_id: departmentId || undefined,  // Changed from department
  ...
};
```

## User Flow

### Adding a New User

1. Admin opens "Add User" dialog
2. Fills in Name, Email, Position, Hire Date
3. **Selects Department from dropdown** (fetched from Dept Master File)
4. Upon department selection:
   - System fetches all products assigned to that department
   - Auto-populates the product selection tree
   - Shows toast: "Auto-assigned X products from department"
5. Admin can manually add/remove products (supplements department defaults)
6. Submits form
7. Backend receives `department_id` + `assignedProductIds`
8. Backend combines department products + manual products
9. User created with all combined products assigned

### Editing an Existing User

1. Admin opens "Edit User" dialog
2. Form pre-populated with user's current data including `department_id`
3. If department is changed:
   - New department's products are fetched and merged
   - Existing manual selections are preserved
4. Admin can adjust product selections
5. Submit triggers same merge logic as create

### Department Master File Integration

When admin edits a department's product assignments in "Dept Master File":
- Changes only affect **new users** assigned to that department
- Existing users are **not** automatically updated
- Admin must manually edit existing users to update their products

## Migration Instructions

### 1. Run Database Migration

```bash
cd server

# Apply migration
psql -U portalops_user -d portalops_db -f migrations/004_add_department_id_to_users.sql
```

### 2. Restart Backend

```bash
cd server
source .venv/bin/activate
uvicorn app.main:app --reload
```

### 3. Restart Frontend

```bash
cd nextjs
pnpm dev
```

## Testing Checklist

### Department Dropdown
- [ ] Department field shows as dropdown (not text input)
- [ ] Dropdown populated from Dept Master File
- [ ] Can select a department
- [ ] Can leave department empty (optional)

### Auto-Assignment
- [ ] Selecting department auto-populates products
- [ ] Toast notification shows number of products assigned
- [ ] Manual product selections preserved when changing department
- [ ] Can manually deselect auto-assigned products
- [ ] Can manually add additional products

### Create User
- [ ] Create user without department → no auto-assigned products
- [ ] Create user with department → gets department products
- [ ] Create user with department + manual products → gets both
- [ ] User correctly saved with `department_id` in database

### Edit User
- [ ] Edit form shows correct department from dropdown
- [ ] Changing department triggers auto-assignment
- [ ] Can remove department (set to empty)
- [ ] Manual product changes override department defaults

### Backward Compatibility
- [ ] Existing users with string `department` still display correctly
- [ ] Legacy `department` field still returned in API responses
- [ ] No breaking changes for existing users

### Inbox Workflows
- [ ] Onboarding workflow: can select department for new user
- [ ] Onboarding workflow: department products auto-assigned
- [ ] Offboarding workflow: not affected by changes

## API Changes Summary

### Request Changes

**POST /api/users**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "department_id": "uuid-here",  // NEW: replaces department string
  "position": "Engineer",
  "assignedProductIds": ["uuid1", "uuid2"]  // Optional: supplements department products
}
```

**PUT /api/users/{user_id}**
```json
{
  "department_id": "uuid-here",  // NEW
  "assignedProductIds": ["uuid1", "uuid2"]
}
```

### Response Changes

**GET /api/users**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "department": "Engineering",  // Kept for backward compatibility
      "department_id": "dept-uuid",  // NEW
      "assignedProductIds": ["prod1", "prod2"]
    }
  ]
}
```

## Files Modified

### Backend
- `server/app/models/user.py` - Added department_id field
- `server/app/schemas/user.py` - Added department_id to schemas
- `server/app/api/api_v1/endpoints/users.py` - Auto-assignment logic
- `server/migrations/004_add_department_id_to_users.sql` - New migration

### Frontend
- `nextjs/types/index.ts` - Updated User interface
- `nextjs/lib/api.ts` - Updated getUsers() mapping
- `nextjs/components/users/UserFormDialog.tsx` - Department dropdown + auto-assignment

## Notes

1. **Backward Compatibility**: The legacy `department` string field is kept to avoid breaking existing code
2. **Manual Override**: Users can always manually adjust products beyond department defaults
3. **Non-Retroactive**: Changing department products in Dept Master File only affects future user assignments
4. **Validation**: Department selection is optional (not required)
5. **Performance**: Department products fetched only when department is selected (lazy loading)

## Future Enhancements

Consider for future versions:
- Bulk update users when department products change
- Department change history/audit trail
- Warning when removing department (products may be affected)
- Department hierarchy support (parent/child departments)

