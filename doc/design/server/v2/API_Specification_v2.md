# PortalOps: API Specification v2.0

- **Version:** 2.0
- **Date:** 2025-10-17
- **Status:** Final

## 1. Introduction & General Principles

This document outlines the v2.0 API for PortalOps, updated to align with the Product Requirements Document (PRD) v2.0. It reflects significant changes in resource management, workflow automation, and role-based access control, providing a migration path from the existing v1 implementation.

*   **Base URL:** All API endpoints are prefixed with `/api`.
*   **Authentication:** All protected endpoints require an `Authorization: Bearer <token>` header.
*   **Authorization:** Access is controlled by a two-role system: `Admin` and `ServiceAdmin`. The `ProductAdministrator` role is deprecated.
*   **Data Format:** All request and response bodies are `application/json`, except for file uploads which use `multipart/form-data`.
*   **Standard Error Response:**
    ```json
    { "error": "error_code", "message": "A human-readable error description." }
    ```

---

## 2. Authentication

Endpoints for user login and session verification remain largely unchanged.

### `POST /api/auth/login`
*   **Description:** Authenticates a user and returns a JWT.
*   **Implementation:** `endpoints/auth.py` - `login`

### `GET /api/auth/me`
*   **Description:** Returns the profile and permissions of the current user.
*   **Implementation:** `endpoints/auth.py` - `read_users_me`
*   **[UPDATED] Response (200 OK):** The `roles` array is simplified to only `Admin` or `ServiceAdmin`. The complex `permissions` object is replaced with a simple list of assigned service IDs.
    ```json
    {
      "id": "a1b2c3d4-...",
      "name": "Admin User",
      "email": "admin@portalops.com",
      "roles": ["Admin"],
      "assignedServiceIds": ["service-uuid-1"]
    }
    ```

---

## 3. Service Inventory

### `GET /api/services`
*   **Description:** Retrieves a list of services. `Admin` sees all services; `ServiceAdmin` sees only their assigned services.
*   **Implementation:** `endpoints/services.py` - `read_services`
*   **Response (200 OK):** The `product_count` field is already correctly implemented.

### `POST /api/services`
*   **[UPDATED] Description:** Creates a new service and can optionally associate existing, unassociated products.
*   **Authorization:** `Admin`.
*   **Implementation:** `endpoints/services.py` - `create_service` must be updated.
*   **Request Body:** The `ServiceCreate` schema in `schemas/service.py` needs to be updated to accept `productIds`.
    ```json
    {
      "name": "New Analytics Service",
      "vendor": "New Vendor",
      "productIds": ["prod-uuid-unassociated-1"]
    }
    ```

### `PUT /api/services/{id}`
*   **[UPDATED] Description:** Updates a service's details and manages its product associations.
*   **Authorization:** `Admin`.
*   **Implementation:** `endpoints/services.py` - `update_service` must be updated.
*   **Request Body:** The `ServiceUpdate` schema needs to support association/disassociation.
    ```json
    {
      "name": "Updated Analytics Service",
      "associateProductIds": ["prod-uuid-newly-associated"],
      "disassociateProductIds": ["prod-uuid-to-be-unassociated"]
    }
    ```

### `DELETE /api/services/{id}`
*   **[UPDATED] Description:** Deletes a service. The backend implementation must be changed to be non-destructive to products, severing the link by setting `products.service_id` to `NULL`.
*   **Authorization:** `Admin`.
*   **Implementation:** `endpoints/services.py` - `delete_service` logic needs to change from `service.remove(db, id=service_id)` to a method that sets the foreign key to null.

---

## 4. Product Inventory

### `GET /api/products`
*   **Description:** Retrieves a list of products.
*   **Implementation:** `endpoints/products.py` - `get_products`
*   **[NEW] Query Parameters:** `?serviceId={uuid}` to filter by service.

### `POST /api/products`
*   **Description:** Creates a new product. The existing implementation correctly creates a corresponding `payment_info` record.
*   **Implementation:** `endpoints/products.py` - `create_product`
*   **Authorization:** `Admin` (The dependency should be changed from `require_service_admin_or_higher` to `require_admin`).

### `DELETE /api/products/{id}`
*   **Description:** Deletes a product. The existing implementation correctly cascades the delete to the `payment_info` record.
*   **Implementation:** `endpoints/products.py` - `delete_product`
*   **Authorization:** `Admin` (The dependency should be changed from `require_service_admin_or_higher` to `require_admin`).

---

## 5. Payment Register

### `GET /api/payment-register`
*   **[UPDATED] Description:** Retrieves all payment records. The response schema needs to be updated to include the path for any uploaded bill attachments.
*   **Implementation:** `endpoints/payment_register.py` - `read_payment_register`
*   **Schema:** `schemas/payment.py` - `PaymentInfo` needs a `bill_attachment_path: Optional[str] = None` field.

### `PUT /api/payment-register/{productId}`
*   **[UPDATED] Description:** Updates the billing information for a product. This endpoint must be changed to accept `multipart/form-data` to handle file uploads.
*   **Implementation:** `endpoints/payment_register.py` - `update_payment_info` signature and logic must be significantly changed to handle `File()` uploads alongside form data.
*   **Authorization:** `Admin`.

### `GET /api/payment-register/summary`
*   **Description:** Gets the count of incomplete billing records. Unchanged.
*   **Implementation:** `endpoints/payment_register.py` - `read_payment_register_summary`

---

## 6. User Directory

### `GET /api/users`
*   **[UPDATED] Description:** Retrieves users. Access should be restricted to `Admin` only.
*   **Implementation:** `endpoints/users.py` - `read_users`. The dependency should be changed from `require_any_admin_role` to `require_admin`.
*   **[NEW] Query Parameters:** `?productId={uuid}` to find users associated with a specific product. This logic needs to be added to the `user.search_users` CRUD method.

### `PUT /api/users/{id}`
*   **[UPDATED] Description:** This single endpoint should replace both the existing `update_user` and the complex `update_user_permissions` endpoints for simplicity.
*   **Authorization:** `Admin`.
*   **Implementation:** `endpoints/users.py` - `update_user` should be expanded, and `update_user_permissions` should be removed.
*   **Request Body:** A new `UserUpdateV2` schema is needed.
    ```json
    {
      "name": "Jane Doe",
      "email": "jane.doe@example.com",
      "department": "Marketing",
      "role": "ServiceAdmin",
      "assignedServiceIds": ["service-uuid-1"]
    }
    ```

### `DELETE /api/users/{id}`
*   **Description:** Deletes a user and all their associated permissions.
*   **Implementation:** `endpoints/users.py` - `delete_user`. Unchanged.

---

## 7. Inbox & HR Webhooks

### `GET /api/inbox/tasks`
*   **[UPDATED] Description:** Retrieves tasks. Access should be restricted to `Admin` only.
*   **Implementation:** `endpoints/workflows.py` - `read_user_tasks`. The dependency should be changed from `get_current_active_user` to `require_admin`.

### `POST /api/inbox/tasks/{id}/complete`
*   **[NEW] Description:** Completes a workflow task and triggers the associated backend logic (e.g., creating or deleting a user).
*   **Authorization:** `Admin`.
*   **Implementation:** A new endpoint to be added in `endpoints/workflows.py`.
*   **Usage:**
    *   **Onboarding:** Body contains final assignments. Backend creates user, assigns resources, marks task complete.
    *   **Offboarding:** Body is empty. Backend deletes user, marks task complete.

### `POST /api/webhooks/hr/onboarding`
*   **Description:** Webhook to trigger an onboarding task. Unchanged.
*   **Implementation:** `endpoints/workflows.py` - `hr_onboarding_webhook`.

### `POST /api/webhooks/hr/offboarding`
*   **[NEW] Description:** Secure webhook for an external HR system to trigger an offboarding task.
*   **Implementation:** A new endpoint, similar to the onboarding one, needs to be created in `endpoints/workflows.py`.
*   **Request Body:**
    ```json
    { "employee": { "name": "John Doe", "email": "john.doe@example.com" } }
    ```

---

## 8. Master Files

### `GET /api/master-files/attachments`
*   **[NEW] Description:** Retrieves a list of all files uploaded as "Bill Attachments".
*   **Authorization:** `Admin`.
*   **Implementation:** Requires a new endpoint file, e.g., `endpoints/master_files.py`.

### `GET /api/master-files/attachments/{fileId}`
*   **[NEW] Description:** Downloads a specific attachment file.
*   **Authorization:** `Admin`.
*   **Implementation:** To be added in the new `endpoints/master_files.py`.
