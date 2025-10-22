# PortalOps Client - Product Requirements Document: Role & Permission Refactor

## 1. Overview

This document provides a detailed specification for the Role-Based Access Control (RBAC) redesign within the PortalOps client application. The goal of this refactor is to improve flexibility and precision in permission management to better reflect organizational structures within enterprises.

Key changes include:

* Removal of the existing `User` login role.
* Introduction of two new roles: `Service Administrator` and `Product Administrator`.
* Redefinition of permission assignment responsibilities for the `Admin` role.
* Clarification of access rights to the **Service Inventory** and **Employee Directory** for different roles.

## 2. User Role Definitions

The system will contain the following four roles, with three of them being login-enabled.

### 2.1. Admin

`Admin` is the highest-level role with full control over the system.

**Key Responsibilities & Permissions:**

* **Full Access**: Can access and manage all modules in the system, including all services and all products under those services.
* **User Management**:

  * View all users in the **Employee Directory**.
  * Assign or revoke `Service Administrator` permissions for any user.
  * Assign or revoke `Product Administrator` permissions for any user.
* **Service & Product Management**:

  * Possesses all permissions of a `Service Administrator`, including the ability to add new services.
  * Can access all services and all products in the **Service Inventory**.

### 2.2. Service Administrator

`Service Administrator` is responsible for managing one or more specific services and all products within them.

**Key Responsibilities & Permissions:**

* **Service Management**:

  * Can only see services in the **Service Inventory** that have been assigned by an `Admin`.
  * Has permission to add new services (`Add Service`).
  * Can configure all settings related to the services they manage.
* **Product Management**:

  * Can access and manage **all** products under their assigned services.
* **Permission Assignment**:

  * Can assign `Product Administrator` permissions to other users under their managed services.
    For example, if a user is the Service Admin of "Service A", they may assign another user as Product Admin of "Product A1" or "Product A2" under the same service.

### 2.3. Product Administrator

`Product Administrator` is responsible for managing one or more specific products under a specific service.

**Key Responsibilities & Permissions:**

* **Limited Service Access**:

  * Can only see services in the **Service Inventory** that contain products assigned to them.
* **Product Management**:

  * Under the corresponding service, they can only access and manage products for which they have explicit permissions.
    For example, if assigned only to "Product A1" under "Service A", they cannot see or manage "Product A2".

### 2.4. User (Non-login Role)

The `User` role **cannot log in** to the system. Their information exists purely as data within the **Employee Directory**.

**Key Responsibilities & Permissions:**

* None. No login capability and no operational permissions.
* Their account details (e.g., name, department, email) can be viewed by authorized roles under the **Employee Directory**.

## 3. Access Control Matrix

| Feature / Role                      | Admin               | Service Administrator                  | Product Administrator                        |
| :---------------------------------- | :------------------ | :------------------------------------- | :------------------------------------------- |
| **Login to System**                 | ✅                   | ✅                                      | ✅                                            |
| **Service Inventory**               | View all services   | View assigned services                 | View services containing assigned products   |
| **Service Details**                 | Access all services | Access assigned services               | Access services containing assigned products |
| **Product List (within a service)** | View all products   | View all products                      | View only assigned products                  |
| **Add Service**                     | ✅                   | ✅                                      | ❌                                            |
| **Employee Directory**                  | View all users      | View all users                         | View all users                               |
| **Assign Service Admin Role**       | ✅                   | ❌                                      | ❌                                            |
| **Assign Product Admin Role**       | ✅                   | ✅ (within their managed services only) | ❌                                            |

## 4. Key UI Adjustment Requirements

1. **Navigation Bar / Sidebar**:

   * The `Add Service` button/link should only be visible to `Admin` and `Service Administrator`.

2. **Service Inventory Page**:

   * On page load, the list of visible services must be dynamically filtered based on the current user's role and assigned permissions.
   * `Admin` sees all services.
   * `Service Administrator` sees only their assigned services.
   * `Product Administrator` sees only services containing their assigned products.

3. **Service Details Page**:

   * For `Product Administrator`, the product list must be filtered to show **only** products they are authorized to manage.

4. **Employee Directory / Role Assignment Page**:

   * A clear interface must be provided to allow `Admin` and `Service Administrator` to assign roles to users.
   * `Admin` should be able to:

     * Select a user.
     * Assign `Service Administrator` roles (multiple services allowed).
     * Assign `Product Administrator` roles (must select a service first, then product).
   * `Service Administrator` should be able to:

     * Select a user.
     * Assign `Product Administrator` roles **only within services they manage** (multiple products allowed).

## 5. Summary: Differences from the Previous Design

| Category                  | Old Design                 | New Design                          | Key Changes                                                                  |
| :------------------------ | :------------------------- | :---------------------------------- | :--------------------------------------------------------------------------- |
| **Roles**                 | Admin, RoleA, RoleB, User  | Admin, Service Admin, Product Admin | Role names and responsibilities redefined; `User` is no longer a login role. |
| **Service Access**        | Not clearly differentiated | Granular role-based access          | Admin sees everything, Service/Product Admins see partial data.              |
| **Product Access**        | Not clearly differentiated | Granular role-based access          | Admin/Service Admin see all, Product Admin sees only assigned products.      |
| **Permission Assignment** | Simple assignment          | Hierarchical / Delegated assignment | Admin assigns Service Admins, Service Admins assign Product Admins.          |

---

