# PortalOps Backend v2.0 - Changelog

## Version 2.0 - 2025-10-17

### Major Changes

#### 🏗️ Architecture & Data Model
- **Non-Destructive Service Deletion**: Services can now be deleted without removing associated products. Products become "unassociated" and can be reassigned to other services.
- **Product Service Relationship**: `product.service_id` is now nullable, allowing products to exist without a service.
- **Simplified Role System**: Consolidated to two roles - `Admin` and `ServiceAdmin`.

#### 🔒 Authorization Updates
- **Stricter Permissions**: Service and Product CRUD operations now require `Admin` role exclusively.
- **User Management**: User listing and management now restricted to `Admin` role only.
- **Inbox Access**: Workflow tasks and inbox now Admin-only.

#### 📁 File Management
- **Bill Attachments**: Payment register now supports file uploads for bill attachments.
- **Master Files Module**: New module to list and download all uploaded bill attachments.
- **File Storage**: Attachments stored in `uploads/bill_attachments/` directory.

#### 🔄 Workflow Enhancements
- **Offboarding Webhook**: New HR webhook endpoint for employee offboarding.
- **Task Completion**: New endpoint to complete tasks and trigger backend actions (user creation/deletion).

### Detailed Changes

#### API Endpoints

##### Modified Endpoints
1. **Authentication**
   - `GET /api/auth/me`: Simplified response format with `assignedServiceIds`

2. **Services**
   - `POST /api/services`: Now accepts `productIds` for initial association
   - `PUT /api/services/{id}`: Supports `associateProductIds` and `disassociateProductIds`
   - `DELETE /api/services/{id}`: Non-destructive deletion (products remain)
   - All service endpoints now require `Admin` role

3. **Products**
   - `GET /api/products`: Added `?serviceId={uuid}` query parameter
   - `POST /api/products`: Now requires `Admin` role
   - `DELETE /api/products/{id}`: Now requires `Admin` role

4. **Payment Register**
   - `GET /api/payment-register`: Response includes `billAttachmentPath`
   - `PUT /api/payment-register/{productId}`: Changed to multipart/form-data for file uploads

5. **Users**
   - `GET /api/users`: Added `?productId={uuid}` query parameter, Admin-only
   - `PUT /api/users/{id}`: Unified endpoint combining basic info and permissions

6. **Workflows**
   - `GET /api/inbox/tasks`: Now Admin-only

##### New Endpoints
1. **Workflows**
   - `POST /api/webhooks/hr/offboarding`: Trigger offboarding workflow
   - `POST /api/inbox/tasks/{id}/complete`: Complete tasks and execute backend logic

2. **Master Files**
   - `GET /api/master-files/attachments`: List all bill attachments
   - `GET /api/master-files/attachments/{fileId}`: Download specific attachment

##### Deprecated Endpoints
- `PUT /api/users/{id}/permissions`: Functionality merged into `PUT /api/users/{id}`

#### Database Schema

##### Modified Tables
```sql
-- products table
ALTER TABLE products ALTER COLUMN service_id DROP NOT NULL;
ALTER TABLE products DROP CONSTRAINT products_service_id_fkey;
ALTER TABLE products ADD CONSTRAINT products_service_id_fkey 
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE SET NULL;

-- payment_info table
ALTER TABLE payment_info ADD COLUMN bill_attachment_path VARCHAR(500);

-- roles table (optional)
UPDATE roles SET name = 'ServiceAdmin' WHERE name = 'ServiceAdministrator';
```

#### Code Changes

##### New Files
- `app/api/api_v1/endpoints/master_files.py`: Master files management
- `MIGRATION_GUIDE_V2.md`: Comprehensive migration guide
- `database/manual_migration_prd_v2.sql`: Database migration script

##### Modified Files
**Models:**
- `app/models/service.py`: Updated Product model, removed cascade delete
- `app/models/payment.py`: Added bill_attachment_path field

**Schemas:**
- `app/schemas/service.py`: Added productIds support to ServiceCreate/ServiceUpdate
- `app/schemas/user.py`: Added UserUpdateV2 schema
- `app/schemas/payment.py`: Added billAttachmentPath field

**CRUD:**
- `app/crud/service.py`: Added create_with_products, update_with_products, remove_non_destructive
- `app/crud/user.py`: Added product_id filter to search_users
- `app/crud/payment.py`: Updated to include billAttachmentPath in responses

**Endpoints:**
- `app/api/api_v1/endpoints/services.py`: Updated all operations, changed to Admin-only
- `app/api/api_v1/endpoints/products.py`: Added filtering, changed permissions
- `app/api/api_v1/endpoints/payment_register.py`: Added file upload support
- `app/api/api_v1/endpoints/users.py`: Unified update, added filtering
- `app/api/api_v1/endpoints/workflows.py`: Added offboarding, task completion
- `app/api/api_v1/endpoints/auth.py`: Simplified /me response
- `app/api/api_v1/api.py`: Registered master_files router

**Core:**
- `app/core/deps.py`: Updated role checks for v2 role names

### Dependencies

#### New Dependencies
- `aiofiles`: Required for async file operations

### Breaking Changes

⚠️ **Important**: This version contains breaking changes

1. **Authorization**: Many endpoints now require `Admin` role exclusively
2. **API Responses**: `/api/auth/me` response structure changed
3. **API Requests**: Payment register update now uses multipart/form-data
4. **User Update**: Separate permissions endpoint removed
5. **Database Schema**: Foreign key behavior changed for products.service_id

### Migration Required

Yes, this version requires database migration. Please follow the steps in `MIGRATION_GUIDE_V2.md`.

### Rollback Support

Database backup and code rollback procedures are documented in `MIGRATION_GUIDE_V2.md`.

### Testing

All changes have been implemented according to:
- Product Requirements Document v2.0: `doc/design/PortalOps.md`
- API Specification v2.0: `doc/design/server/v2/API_Specification_v2.md`

### Known Issues

None at release time.

### Future Improvements

Potential enhancements for future versions:
- Batch product association/disassociation
- Bulk user offboarding
- Advanced attachment management (preview, versioning)
- Automated testing suite for v2 endpoints
- GraphQL API support

### Contributors

- Backend implementation aligned with PRD v2.0 requirements
- API design based on API Specification v2.0

---

## Version 1.0 (Previous)

See previous changelog for v1.0 features and changes.

