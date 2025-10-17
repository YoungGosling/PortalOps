# PortalOps Database Setup

This directory contains the PostgreSQL database schema and setup scripts for the PortalOps platform.

## Files

- `schema.sql` - Complete database schema with tables, indexes, constraints, and triggers
- `sample_data.sql` - Sample data for development and testing
- `README.md` - This file

## Database Setup

### Prerequisites

- PostgreSQL 12 or higher
- UUID extension support

### Installation Steps

1. **Create Database**
   ```bash
   createdb portalops
   ```

2. **Run Schema Script**
   ```bash
   psql -d portalops -f schema.sql
   ```

3. **Load Sample Data (Optional)**
   ```bash
   psql -d portalops -f sample_data.sql
   ```

### Database Connection

Default connection parameters:
- Database: `portalops`
- Host: `localhost`
- Port: `5432`
- User: Your PostgreSQL user

## Schema Overview

### Core Tables

1. **users** - User profiles and authentication
2. **roles** - System roles (Admin, ServiceAdministrator, ProductAdministrator)
3. **user_roles** - Many-to-many relationship between users and roles
4. **services** - Company web services (Google Workspace, Microsoft 365, etc.)
5. **products** - Products/modules within services (Gmail, Outlook, etc.)
6. **payment_info** - Billing information for products
7. **permission_assignments** - RBAC core table linking users to resources
8. **workflow_tasks** - Onboarding/offboarding tasks
9. **audit_logs** - System activity logging

### Key Features

- **UUID Primary Keys** - All tables use UUID for better scalability
- **Automatic Timestamps** - `created_at` and `updated_at` fields with triggers
- **RBAC Support** - Flexible role-based access control system
- **Performance Indexes** - Optimized for common query patterns
- **Data Integrity** - Foreign key constraints and check constraints
- **Audit Trail** - Comprehensive logging of system activities

### Views

- `user_roles_view` - Users with their assigned roles
- `products_with_services` - Products with service information
- `permission_details` - Permission assignments with user/resource details

## Sample Data

The sample data includes:

- 5 sample users (including admin, service manager, product manager)
- 4 services (Google Workspace, Microsoft 365, Slack, Zoom)
- 8 products across the services
- Payment information for all products
- Permission assignments demonstrating RBAC
- Sample workflow tasks and audit logs

### Sample Users

| Name | Email | Role | Department |
|------|-------|------|------------|
| John Admin | admin@company.com | Admin | IT |
| Alice Service Manager | alice@company.com | ServiceAdministrator | IT |
| Bob Product Manager | bob@company.com | ProductAdministrator | Operations |
| Carol Employee | carol@company.com | - | Marketing |
| David Employee | david@company.com | - | Sales |

**Note**: All sample users with login capability use the same password hash for testing purposes.

## Database Maintenance

### Backup

```bash
pg_dump portalops > portalops_backup.sql
```

### Restore

```bash
psql -d portalops < portalops_backup.sql
```

### Reset Database

```bash
dropdb portalops
createdb portalops
psql -d portalops -f schema.sql
psql -d portalops -f sample_data.sql
```

## Performance Considerations

The schema includes several performance optimizations:

1. **Indexes on Foreign Keys** - All foreign key columns are indexed
2. **Multi-column Indexes** - For common query patterns in permission checks
3. **Partial Indexes** - On status fields for workflow tasks
4. **JSONB for Audit Details** - Efficient storage and querying of structured data

## Security Notes

- Password hashes should use bcrypt or similar strong hashing algorithms
- Consider implementing row-level security (RLS) for additional data protection
- Regular audit log review is recommended
- Sensitive data in audit logs should be carefully managed

## Development Tips

1. Use the provided views for common queries
2. Always use transactions for multi-table operations
3. The `updated_at` triggers automatically maintain timestamps
4. Check constraints ensure data integrity - respect them in application code
5. Use the audit logging system for tracking important changes



