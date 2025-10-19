# PortalOps v2.0 Migration Guide

## Overview
This guide documents the changes made to migrate from v1.0 to v2.0 based on the updated Product Requirements Document (PRD v2.0).

## Database Changes

### 1. Products Table
- **Change**: `service_id` is now nullable
- **Foreign Key**: Changed from `ON DELETE CASCADE` to `ON DELETE SET NULL`
- **Impact**: When a service is deleted, products become "unassociated" instead of being deleted

### 2. Payment Info Table
- **New Field**: `bill_attachment_path VARCHAR(500)`
- **Purpose**: Store file path for uploaded bill attachments

### 3. Roles Simplification
- **Deprecated**: `ProductAdministrator` role (if it exists)
- **Renamed**: `ServiceAdministrator` → `ServiceAdmin` (optional, code supports both)
- **Active Roles**: Only `Admin` and `ServiceAdmin`

## API Changes

### Authentication & Authorization

#### GET /api/auth/me (Modified)
**Response Changes:**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "roles": ["Admin"],
  "assignedServiceIds": ["service-uuid-1"]  // Changed from complex "permissions" object
}
```

### Service Inventory

#### POST /api/services (Modified)
**New Request Body:**
```json
{
  "name": "Service Name",
  "vendor": "Vendor Name",
  "productIds": ["prod-uuid-1", "prod-uuid-2"]  // New: optional product association
}
```
**Authorization**: Now requires `Admin` role only

#### PUT /api/services/{id} (Modified)
**New Request Body:**
```json
{
  "name": "Updated Name",
  "associateProductIds": ["prod-uuid-3"],      // New: add products
  "disassociateProductIds": ["prod-uuid-1"]    // New: remove products
}
```
**Authorization**: Now requires `Admin` role only

#### DELETE /api/services/{id} (Modified)
**Behavior**: Now non-destructive - sets products' `service_id` to NULL instead of deleting them
**Authorization**: Now requires `Admin` role only

### Product Inventory

#### GET /api/products (Modified)
**New Query Parameter:** `?serviceId={uuid}` - filter products by service
**Authorization**: Accessible to all authenticated users with appropriate permissions

#### POST /api/products (Modified)
**Authorization**: Changed from `ServiceAdmin+` to `Admin` only

#### DELETE /api/products/{id} (Modified)
**Authorization**: Changed from `ServiceAdmin+` to `Admin` only

### Payment Register

#### GET /api/payment-register (Modified)
**Response Changes:**
```json
{
  "paymentInfo": {
    "billAttachmentPath": "/uploads/bill_attachments/file.pdf"  // New field
  }
}
```

#### PUT /api/payment-register/{productId} (Modified)
**Content-Type**: Changed from `application/json` to `multipart/form-data`
**New Request:**
```
Form Fields:
- amount: string (optional)
- cardholder_name: string (optional)
- expiry_date: string (YYYY-MM-DD) (optional)
- payment_method: string (optional)
- bill_attachment: file (optional)
```

### User Directory

#### GET /api/users (Modified)
**New Query Parameter:** `?productId={uuid}` - filter users by product association
**Authorization**: Changed from `any_admin_role` to `Admin` only

#### PUT /api/users/{id} (Modified - Unified Endpoint)
**New Request Body (UserUpdateV2):**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "department": "Marketing",
  "role": "ServiceAdmin",              // Single role
  "assignedServiceIds": ["service-uuid-1"]  // Service assignments
}
```
**Note**: This replaces the separate `PUT /api/users/{id}/permissions` endpoint

**Deprecated**: `PUT /api/users/{id}/permissions` - functionality merged into main update endpoint

### Inbox & Workflows

#### GET /api/inbox/tasks (Modified)
**Authorization**: Changed to `Admin` only

#### POST /api/inbox/tasks/{id}/complete (New)
**Purpose**: Complete a workflow task and trigger backend logic
- Onboarding: Mark task complete
- Offboarding: Delete user and mark task complete
**Authorization**: `Admin` only

#### POST /api/webhooks/hr/offboarding (New)
**Request Body:**
```json
{
  "employee": {
    "name": "John Doe",
    "email": "john@example.com"
  }
}
```
**Authentication**: Requires HR webhook API key

### Master Files (New Module)

#### GET /api/master-files/attachments (New)
**Purpose**: List all uploaded bill attachments
**Response:**
```json
[
  {
    "fileId": "product-uuid",
    "fileName": "bill.pdf",
    "filePath": "/uploads/bill_attachments/bill.pdf",
    "fileSize": 12345,
    "productId": "product-uuid"
  }
]
```
**Authorization**: `Admin` only

#### GET /api/master-files/attachments/{fileId} (New)
**Purpose**: Download a specific attachment
**Response**: File download
**Authorization**: `Admin` only

## Backend Code Changes

### Models
1. **app/models/service.py**
   - Modified `Product.service_id`: nullable, ON DELETE SET NULL
   - Modified `Service.products` relationship: removed cascade delete

2. **app/models/payment.py**
   - Added `bill_attachment_path` field

### Schemas
1. **app/schemas/service.py**
   - `ServiceCreate`: Added `productIds: Optional[List[UUID]]`
   - `ServiceUpdate`: Added `associateProductIds` and `disassociateProductIds`
   - `ProductCreate`: Made `service_id` optional

2. **app/schemas/user.py**
   - Added `UserUpdateV2` schema (unified update)

3. **app/schemas/payment.py**
   - `PaymentInfoBase`: Added `billAttachmentPath: Optional[str]`

### CRUD Operations
1. **app/crud/service.py**
   - Added `create_with_products()`: Create service and associate products
   - Added `update_with_products()`: Update service and manage associations
   - Added `remove_non_destructive()`: Delete service without deleting products

2. **app/crud/user.py**
   - Modified `search_users()`: Added `product_id` filter parameter

3. **app/crud/payment.py**
   - Modified `get_payment_register()`: Include `billAttachmentPath` in response

### Endpoints
1. **app/api/api_v1/endpoints/services.py**
   - Updated CRUD operations to use new methods
   - Changed authorization to Admin only

2. **app/api/api_v1/endpoints/products.py**
   - Added `serviceId` query parameter
   - Changed authorization to Admin only for create/delete

3. **app/api/api_v1/endpoints/payment_register.py**
   - Modified `update_payment_info()` to accept multipart/form-data
   - Added file upload handling

4. **app/api/api_v1/endpoints/users.py**
   - Added `productId` query parameter
   - Updated `update_user()` to use `UserUpdateV2` schema
   - Changed list authorization to Admin only

5. **app/api/api_v1/endpoints/workflows.py**
   - Added `hr_offboarding_webhook()` endpoint
   - Added `complete_task()` endpoint
   - Changed task list authorization to Admin only

6. **app/api/api_v1/endpoints/master_files.py** (New)
   - Created new endpoint file for attachment management

7. **app/api/api_v1/endpoints/auth.py**
   - Modified `/me` response format

### Dependencies
1. **app/core/deps.py**
   - Updated role checks to use "ServiceAdmin" instead of "ServiceAdministrator"

## Migration Steps

### 1. Database Migration
```bash
# Backup your database first!
pg_dump portalops > backup_before_v2_migration.sql

# Apply migration
psql -U your_user -d portalops -f database/manual_migration_prd_v2.sql
```

### 2. File System Setup
```bash
# Create uploads directory
mkdir -p uploads/bill_attachments
chmod 755 uploads/bill_attachments
```

### 3. Install Dependencies
```bash
cd server
pip install aiofiles  # Required for async file operations
```

### 4. Update Environment
Ensure your `.env` file has the HR webhook API key configured:
```
HR_WEBHOOK_API_KEY=your-secret-key-here
```

### 5. Test the Migration
1. Start the server: `./start.sh`
2. Check API documentation: `http://localhost:8000/docs`
3. Test key endpoints:
   - Create a service with products
   - Upload a bill attachment
   - Test offboarding webhook
   - Verify master files listing

## Breaking Changes Summary

### API Changes
- **Services**: Create/Update/Delete now Admin-only
- **Products**: Create/Delete now Admin-only
- **Users**: List endpoint now Admin-only
- **User Update**: Permissions merged into main update endpoint
- **Payment Update**: Changed to multipart/form-data
- **Auth /me**: Response structure simplified

### Role Changes
- Only two roles supported: `Admin` and `ServiceAdmin`
- `ProductAdministrator` role deprecated (if existed)

### Behavior Changes
- Deleting a service no longer deletes its products
- Products can exist without a service (unassociated)

## Rollback Plan

If you need to rollback:
```bash
# Restore database backup
psql -U your_user -d portalops < backup_before_v2_migration.sql

# Revert code changes
git checkout v1.0  # or your previous stable tag
```

## Testing Checklist

- [ ] Service creation with product association
- [ ] Service update with product association/disassociation
- [ ] Service deletion (products remain unassociated)
- [ ] Product filtering by service
- [ ] User filtering by product
- [ ] Bill attachment upload
- [ ] Bill attachment listing in master files
- [ ] Bill attachment download
- [ ] Onboarding workflow
- [ ] Offboarding workflow
- [ ] Task completion
- [ ] Auth /me endpoint response
- [ ] Permission checks for Admin-only endpoints

## Support

For issues or questions, refer to:
- API Specification: `doc/design/server/v2/API_Specification_v2.md`
- Product Requirements: `doc/design/PortalOps.md`

