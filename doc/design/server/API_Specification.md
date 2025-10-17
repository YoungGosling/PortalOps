# PortalOps: API Specification

## 1. General Principles

*   **Base URL:** All API endpoints are prefixed with `/api`.
*   **Authentication:** All protected endpoints require an `Authorization: Bearer <token>` header containing a valid JWT. The token is obtained via the `POST /api/auth/login` endpoint.
*   **Authorization:** Access to endpoints and resources is controlled by a Role-Based Access Control (RBAC) system. The user's role and specific permissions are evaluated on every request.
*   **Data Format:** All request and response bodies are `application/json`.
*   **Standard Error Response Body:** In case of an error (4xx or 5xx), the response body will follow this structure:
    ```json
    {
      "error": "A brief, machine-readable error code (e.g., 'invalid_input')",
      "message": "A human-readable description of the error."
    }
    ```

---

## 2. Authentication

### `POST /api/auth/login`
*   **Description:** Authenticates a user with their email and password.
*   **Request Body:**
    ```json
    {
      "email": "admin@portalops.com",
      "password": "password123"
    }
    ```
*   **Response (200 OK):** Returns a JWT access token and basic user information.
    ```json
    {
      "accessToken": "ey...",
      "user": {
        "id": "a1b2c3d4-...
      }
    }
    ```

### `GET /api/auth/me`
*   **Description:** Returns the profile, roles, and permissions of the currently authenticated user.
*   **Authorization:** Any authenticated user.
*   **Response (200 OK):**
    ```json
    {
      "id": "a1b2c3d4-...",
      "name": "Admin User",
      "email": "admin@portalops.com",
      "roles": ["Admin"],
      "permissions": {
        "services": ["service-uuid-1", "service-uuid-2"], // List of manageable service IDs
        "products": ["product-uuid-a", "product-uuid-b"]  // List of manageable product IDs
      }
    }
    ```

---

## 3. Users & Permissions

### `GET /api/users`
*   **Description:** Retrieves a paginated list of all users in the directory.
*   **Authorization:** `Admin`, `ServiceAdministrator`, `ProductAdministrator`.
*   **Query Parameters:** `?search={query}&page={number}&limit={number}`
*   **Response (200 OK):**
    ```json
    {
      "data": [
        {
          "id": "user-uuid-1",
          "name": "Jane Smith",
          "email": "jane@portalops.com",
          "department": "Engineering"
        }
      ],
      "pagination": { "total": 150, "page": 1, "limit": 20 }
    }
    ```

### `PUT /api/users/{id}/permissions`
*   **Description:** Updates a user's roles and their specific resource assignments.
*   **Authorization:** `Admin` (full access), `ServiceAdministrator` (can only assign products within their managed services).
*   **Request Body:**
    ```json
    {
      "roles": ["ServiceAdministrator"], // The complete list of roles for the user
      "assignments": {
        "services": { 
          "add": ["service-uuid-3"], 
          "remove": ["service-uuid-2"]
        },
        "products": { 
          "add": ["product-uuid-c"], 
          "remove": ["product-uuid-d"]
        }
      }
    }
    ```
*   **Response (204 No Content)**

---

## 4. Service Inventory

### `GET /api/services`
*   **Description:** Retrieves a list of services, automatically filtered based on the user's permissions.
*   **Authorization:** `Admin`, `ServiceAdministrator`, `ProductAdministrator`.
*   **Response (200 OK):** `[{"id": "...", "name": "...", "vendor": "...", "productCount": 5}, ...]`

### `POST /api/services`
*   **Description:** Creates a new service.
*   **Authorization:** `Admin`, `ServiceAdministrator`.
*   **Request Body:** `{"name": "New Service", "vendor": "Vendor Inc.", "url": "https://service.com"}`
*   **Response (201 Created):** The full new service object.

### `GET /api/services/{id}`
*   **Description:** Retrieves a single service, with its product list filtered by user permissions.
*   **Authorization:** `Admin`, `ServiceAdministrator` (if assigned), `ProductAdministrator` (if assigned to a product within).
*   **Response (200 OK):** `{"id": "...", "name": "...", "products": [{"id": "...", "name": "..."}]}`

*(Standard `PUT /api/services/{id}`, `DELETE /api/services/{id}`, and full CRUD for `/api/services/{serviceId}/products/{productId}` are also available, following RESTful patterns.)*

---

## 5. Payment Register

### `GET /api/payment-register`
*   **Description:** Retrieves the list of all products for the payment register, sorted with `incomplete` status first.
*   **Authorization:** `Admin`.
*   **Response (200 OK):**
    ```json
    [
      {
        "productId": "prod-1",
        "productName": "Analytics Pro",
        "serviceName": "DataDog",
        "paymentInfo": {
          "status": "incomplete",
          "amount": null,
          "cardholderName": null,
          "expiryDate": null,
          "paymentMethod": null
        }
      }
    ]
    ```

### `GET /api/payment-register/summary`
*   **Description:** Gets the count of products with incomplete billing info for the navigation badge.
*   **Authorization:** `Admin`.
*   **Response (200 OK):** `{"incompleteCount": 5}`

### `POST /api/payment-register`
*   **Description:** Adds a new product and its billing information in a single transaction. This creates a `product` and a `payment_info` record.
*   **Authorization:** `Admin`.
*   **Request Body:** `{"serviceId": "...", "productName": "...", "paymentInfo": {"amount": 100.00, ...}}`
*   **Response (201 Created):** The new payment register item.

### `PUT /api/payment-register/{productId}`
*   **Description:** Updates the billing information for a single product (for inline editing).
*   **Authorization:** `Admin`.
*   **Request Body:** `{"amount": 150.00, "cardholderName": "...", ...}`
*   **Response (204 No Content)**

---

## 6. Workflows & Inbox

### `POST /api/webhooks/hr/onboarding`
*   **Description:** Secure webhook for an external HR system to trigger an onboarding workflow.
*   **Authentication:** Requires a secret API Key in the `X-API-Key` header.
*   **Request Body:** `{"employee": {"name": "...", "email": "...", "department": "..."}}`
*   **Response (202 Accepted)**

### `GET /api/inbox/tasks`
*   **Description:** Retrieves a list of tasks assigned to the authenticated user.
*   **Authorization:** Any authenticated user.
*   **Query Parameters:** `?status=pending`
*   **Response (200 OK):** `[{"id": "...", "title": "...", "status": "pending", ...}, ...]`

### `PUT /api/inbox/tasks/{id}`
*   **Description:** Updates the status of a task.
*   **Authorization:** User must be the assignee of the task.
*   **Request Body:** `{"status": "completed", "comment": "Account created."}`
*   **Response (204 No Content)**

---

## 7. Audit Logs

### `GET /api/audit-logs`
*   **Description:** Retrieves a paginated list of audit log entries for administrative review.
*   **Authorization:** `Admin`.
*   **Query Parameters:** `?actorUserId={uuid}&action={action_name}&page=1`
*   **Response (200 OK):**
    ```json
    {
      "data": [
        {
          "id": "log-uuid",
          "actor": {"id": "...", "name": "..."},
          "action": "user.permissions.update",
          "targetId": "user-uuid-2",
          "details": {"roles": {"add": ["Admin"]}},
          "createdAt": "..."
        }
      ],
      "pagination": {...}
    }
    ```
