# PortalOps Client - Role-Based Access Control System

A comprehensive React-based frontend for PortalOps with advanced Role-Based Access Control (RBAC) system, implementing hierarchical permission management for enterprise service administration.

## 🚀 New Role System Overview

Based on the updated Product Requirements Document, the system now implements a three-tier role hierarchy:

### 🔐 Role Definitions

#### 1. **Admin** (Full System Access)
- **Login**: ✅ Enabled
- **Permissions**: Complete system control
- **Capabilities**:
  - View and manage all services and products
  - Assign Service Administrator roles to users
  - Assign Product Administrator roles to users
  - Access all administrative functions
  - Full User Directory access

#### 2. **Service Administrator** (Service-Level Management)
- **Login**: ✅ Enabled  
- **Permissions**: Manage assigned services and all their products
- **Capabilities**:
  - View only assigned services in Service Inventory
  - Add new services to the system
  - Manage all products under assigned services
  - Assign Product Administrator roles (within managed services only)
  - Full User Directory access

#### 3. **Product Administrator** (Product-Level Management)
- **Login**: ✅ Enabled
- **Permissions**: Manage specific assigned products
- **Capabilities**:
  - View services containing assigned products only
  - Manage only specifically assigned products
  - Cannot add new services
  - Cannot assign roles to other users
  - Full User Directory access

#### 4. **User** (Data-Only Role)
- **Login**: ❌ **Cannot login to system**
- **Purpose**: Data storage only for HR/workflow purposes
- **Visibility**: Appears in User Directory for other roles to view

## 🎯 Demo Credentials

### Login-Enabled Accounts

| Role | Email | Password | Access Level |
|------|-------|----------|--------------|
| **Admin** | `admin@portalops.com` | `password` | Full system access |
| **Service Admin** | `service.admin@portalops.com` | `password` | Google Workspace + Microsoft 365 |
| **Product Admin** | `product.admin@portalops.com` | `password` | Gmail + Google Drive only |

### Non-Login Users (Data Only)
- `emily.davis@portalops.com` - Software Engineer
- `jane.smith@portalops.com` - Product Manager  
- `david.wilson@portalops.com` - Marketing Specialist

## 🏗 Key Features Implemented

### ✅ Advanced Permission System
- **Hierarchical Role Assignment**: Admin → Service Admin → Product Admin
- **Granular Access Control**: Service and product-level permissions
- **Dynamic UI Filtering**: Content filtered based on user permissions
- **Permission Management Interface**: Assign and revoke roles with proper authorization

### ✅ Service Inventory with RBAC
- **Admin**: Sees all services
- **Service Admin**: Sees only assigned services  
- **Product Admin**: Sees services containing assigned products
- **Add Service Button**: Visible only to Admin and Service Admin

### ✅ User Directory with Role Management
- All login-enabled roles can view User Directory
- Admin can assign Service Admin and Product Admin roles
- Service Admin can assign Product Admin roles (within their services only)
- Visual role indicators and permission status

### ✅ Enhanced Authentication
- Login validation checks `canLogin` property
- Role-based navigation menu filtering
- Dynamic header with role badges
- Secure session management

### ✅ Permission Management Dashboard
- **Admin Access**: Full permission assignment interface
- **Service Admin Access**: Limited to product admin assignments
- **Visual Permission Tracking**: Clear display of current assignments
- **Hierarchical Assignment**: Respects role hierarchy rules

## 🎨 UI/UX Improvements

### Role-Based Navigation
- **Dynamic Sidebar**: Menu items filtered by user permissions
- **Service Inventory**: Filtered service list based on access rights
- **Add Service Button**: Conditional visibility
- **Permission Manager**: Admin-only advanced role assignment

### Visual Role Indicators
- **Color-Coded Badges**: 
  - 🔴 Admin (Red)
  - 🔵 Service Admin (Blue)  
  - 🟢 Product Admin (Green)
  - ⚪ User (Gray)
- **Header Display**: Current user role with icon
- **User Menu**: Comprehensive role information

### Access Control Matrix

| Feature | Admin | Service Admin | Product Admin | User |
|---------|-------|---------------|---------------|------|
| **Login to System** | ✅ | ✅ | ✅ | ❌ |
| **Service Inventory** | All services | Assigned services | Services with assigned products | N/A |
| **Add Service** | ✅ | ✅ | ❌ | N/A |
| **Product Management** | All products | All products in assigned services | Assigned products only | N/A |
| **User Directory** | ✅ | ✅ | ✅ | N/A |
| **Assign Service Admin** | ✅ | ❌ | ❌ | N/A |
| **Assign Product Admin** | ✅ | ✅ (own services) | ❌ | N/A |

## 🛠 Technical Implementation

### Permission Context System
```typescript
interface AuthContextType {
  canAccessService: (serviceId: string) => boolean
  canAccessProduct: (serviceId: string, productId: string) => boolean
  canAddService: () => boolean
  canAssignServiceAdmin: () => boolean
  canAssignProductAdmin: (serviceId?: string) => boolean
  getAccessibleServices: () => string[]
  getAccessibleProducts: (serviceId: string) => string[]
}
```

### Enhanced Type System
```typescript
interface User {
  roles: UserRole[]
  servicePermissions?: ServicePermission[]
  productPermissions?: ProductPermission[]
  canLogin: boolean
}

interface ServicePermission {
  userId: string
  serviceId: string
  assignedBy: string
  isActive: boolean
}

interface ProductPermission {
  userId: string
  serviceId: string
  productId: string
  assignedBy: string
  isActive: boolean
}
```

## 🚀 Getting Started

1. **Install Dependencies**
   ```bash
   npm install
   ```

2. **Start Development Server**
   ```bash
   npm start
   ```

3. **Test Role-Based Access**
   - Login with different role accounts
   - Observe filtered navigation and content
   - Test permission assignment (Admin account)

## 📋 Testing Scenarios

### Admin Testing
1. Login as `admin@portalops.com`
2. Navigate to Permission Management
3. Assign Service Admin role to a user
4. Assign Product Admin role to another user
5. Verify role assignments in User Directory

### Service Admin Testing  
1. Login as `service.admin@portalops.com`
2. Verify limited service visibility (Google Workspace + Microsoft 365)
3. Test "Add Service" functionality
4. Assign Product Admin role within managed services

### Product Admin Testing
1. Login as `product.admin@portalops.com`  
2. Verify limited service visibility (Google Workspace only)
3. Verify limited product access (Gmail + Google Drive only)
4. Confirm no "Add Service" button
5. Confirm no role assignment capabilities

## 🔄 Migration from Previous System

### Key Changes
- **Removed Roles**: `hr`, `finance` → Replaced with granular permissions
- **Added Roles**: `service_admin`, `product_admin`
- **Login Restriction**: `user` role can no longer login
- **Permission Granularity**: Service and product-level access control
- **Hierarchical Assignment**: Delegated permission management

### Backward Compatibility
- Existing user data structure maintained
- Graceful handling of legacy role assignments
- Migration path for existing permissions

This implementation provides a robust, scalable RBAC system that meets enterprise security requirements while maintaining intuitive user experience and administrative flexibility.