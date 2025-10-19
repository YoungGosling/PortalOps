# User Inventory - Product Assignment Update

**Date:** 2025-10-19  
**Status:** ✅ Complete

## Summary of Changes

Updated the User Inventory module to assign **products** to users instead of services. The Role dropdown has been removed from the Add/Edit User dialog.

---

## Changes Made

### 1. Backend Changes

#### Schema Updates (`server/app/schemas/user.py`)
- ✅ Updated `UserCreate` schema to include:
  - `role`: Optional single role ("Admin" or "ServiceAdmin")
  - `assignedProductIds`: Optional list of product UUIDs
- ✅ Updated `UserUpdateV2` schema to use `assignedProductIds` instead of `assignedServiceIds`

#### API Endpoint Updates (`server/app/api/api_v1/endpoints/users.py`)

**GET /api/users**
- ✅ Returns `assignedProductIds` instead of `assignedServiceIds`
- ✅ Fetches product assignments from `permission_assignments` table

**POST /api/users** (Create User)
- ✅ Accepts `role` and `assignedProductIds` in request body
- ✅ Automatically assigns role if provided
- ✅ Automatically assigns products if provided
- ✅ Logs product assignments in audit log

**PUT /api/users/{user_id}** (Update User)
- ✅ Accepts `assignedProductIds` in request body
- ✅ Performs diff-based updates:
  - Removes old product assignments not in the new list
  - Adds new product assignments not in the old list
- ✅ Uses `assign_product_permission()` and `remove_product_permission()` methods

---

### 2. Frontend Changes

#### Type Updates (`nextjs/types/index.ts`)
- ✅ Updated `User` interface: `assignedServiceIds` → `assignedProductIds`
- ✅ Updated `UserCreateRequest`: `assignedServiceIds` → `assignedProductIds`
- ✅ Updated `UserUpdateRequest`: `assignedServiceIds` → `assignedProductIds`

#### API Client Updates (`nextjs/lib/api.ts`)
- ✅ Updated `getUsers()` to map `assignedProductIds` from backend response

#### User Form Dialog Updates (`nextjs/components/users/UserFormDialog.tsx`)

**Major Changes:**
- ✅ **Removed Role Dropdown** - No longer displays or manages user roles in the dialog
- ✅ **Replaced "Assign Services" with "Assign Products"**
  - Changed from `Service[]` to `Product[]`
  - Fetches all products from Product Inventory
  - Displays product name with service name in parentheses
  - Changed icon from `Building` to `Package`

**State Variables Changed:**
- `availableServices` → `availableProducts`
- `selectedServiceIds` → `selectedProductIds`
- `loadingServices` → `loadingProducts`
- `fetchServices()` → `fetchProducts()`
- `toggleServiceSelection()` → `toggleProductSelection()`

**UI Updates:**
- Product selection shows: `ProductName (ServiceName)`
- Loading message: "Loading products..."
- Empty state: "No products available"
- Selected badge shows product name
- For onboarding: "Please assign at least one product to the user"

#### Delete User Dialog Updates (`nextjs/components/users/DeleteUserDialog.tsx`)
- ✅ Changed "Assigned Services" → "Assigned Products"
- ✅ Shows count of `assignedProductIds`
- ✅ Updated warning message to mention "product assignments"

---

## Database Schema

The existing `permission_assignments` table already supports product assignments:

```sql
CREATE TABLE permission_assignments (
    id uuid PRIMARY KEY,
    user_id uuid NOT NULL,
    service_id uuid,        -- For service-level permissions (not used in User Inventory now)
    product_id uuid,        -- For product-level permissions (now used)
    CONSTRAINT permission_assignments_check 
        CHECK ((service_id IS NOT NULL) OR (product_id IS NOT NULL))
);
```

**Note:** User-to-product assignments are stored via `product_id` in the `permission_assignments` table.

---

## User Workflow

### Add User
1. Click "Add User" button
2. Fill in:
   - Name (required)
   - Email (required)
   - Department (optional)
3. Select products from the list (optional, 0 or more)
4. Submit to create user with product assignments

### Edit User
1. Click "Edit" on a user row
2. Form pre-fills with:
   - User's name, email, department
   - User's currently assigned products (checked in the list)
3. Modify information or change product assignments
4. Submit to update

### Product Selection UI
- Scrollable list of all products
- Each product shows: `Product Name (Service Name)`
- Click to toggle selection
- Selected products show with "Selected" badge
- Summary of selected products shown below the list
- Can remove products by clicking the X on badges

---

## API Request/Response Examples

### Create User
```json
POST /api/users
{
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "assignedProductIds": [
    "uuid-product-1",
    "uuid-product-2"
  ]
}
```

### Update User
```json
PUT /api/users/{user_id}
{
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "assignedProductIds": [
    "uuid-product-1",
    "uuid-product-3"
  ]
}
```

### Get Users Response
```json
{
  "data": [
    {
      "id": "user-uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Engineering",
      "roles": ["Admin"],
      "assignedProductIds": ["uuid-product-1", "uuid-product-2"]
    }
  ],
  "pagination": {
    "total": 10,
    "page": 1,
    "limit": 20
  }
}
```

---

## Testing Checklist

- ✅ Backend schema updated correctly
- ✅ Backend endpoints handle product assignments
- ✅ Frontend types updated
- ✅ User Form Dialog loads all products
- ✅ Add User with product assignments works
- ✅ Edit User shows assigned products correctly
- ✅ Edit User can update product assignments
- ✅ Delete User dialog shows product count
- ✅ No linter errors in backend or frontend
- ✅ Role dropdown removed from dialog
- ✅ Product selection syncs with Product Inventory

---

## Files Modified

### Backend
- `server/app/schemas/user.py`
- `server/app/api/api_v1/endpoints/users.py`

### Frontend
- `nextjs/types/index.ts`
- `nextjs/lib/api.ts`
- `nextjs/components/users/UserFormDialog.tsx`
- `nextjs/components/users/DeleteUserDialog.tsx`

---

## Notes

1. **Role Management**: While the Role dropdown has been removed from the dialog, role functionality still exists in the backend. Roles can be managed through other means if needed in the future.

2. **Product Sync**: The product list in User Inventory is automatically synced with Product Inventory. Any products added or removed in Product Inventory will immediately reflect in the user assignment dialog.

3. **Empty Products**: Users can be created without any product assignments (0 products assigned).

4. **Multiple Products**: Users can be assigned multiple products at once.

5. **Service Information**: When displaying products in the assignment list, the parent service name is shown in parentheses for context.

---

## Migration Notes

If you have existing users with `assignedServiceIds` in the database:
- The backend now only looks at `product_id` in `permission_assignments` table
- Old service-level assignments (via `service_id`) are not automatically migrated
- You may need to create a migration script if you want to preserve old service assignments as product assignments

