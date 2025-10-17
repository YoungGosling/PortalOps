# PortalOps: Database Design

## 1. Introduction

This document provides a detailed design of the PostgreSQL database schema for the PortalOps platform. The design is based on the product and architecture requirements, focusing on data integrity, performance, and robust support for the Role-Based Access Control (RBAC) system.

## 2. Entity-Relationship Diagram (ERD) Overview

The database is composed of several core entities with the following key relationships:

*   **Users and Roles:** A `users` table stores user profiles. A `roles` table defines the possible system roles. A `user_roles` join table creates a many-to-many relationship between them.
*   **Services and Products:** A `services` table stores webservice information. A `products` table stores the modules for each service, creating a one-to-many relationship from `services` to `products`.
*   **Permissions:** A `permission_assignments` table is central to the RBAC system. It links users directly to the specific `services` or `products` they are authorized to manage.
*   **Payments:** A `payment_info` table holds a one-to-one relationship with the `products` table, storing billing details for each product.
*   **Workflows:** A `workflow_tasks` table stores tasks related to onboarding/offboarding, linked to both an assignee (an administrator) and a target user (the employee).
*   **Auditing:** An `audit_logs` table records significant actions performed by users for compliance and tracking.

## 3. Table Definitions

### `users`
Stores information about all individuals in the system, including those who can log in and those who are only listed in the directory.

| Column Name     | Data Type      | Constraints                      | Description                                                                 |
|-----------------|----------------|----------------------------------|-----------------------------------------------------------------------------|
| `id`            | `UUID`         | `PRIMARY KEY`                    | Unique identifier for the user.                                             |
| `name`          | `VARCHAR(255)` | `NOT NULL`                       | User's full name.                                                           |
| `email`         | `VARCHAR(255)` | `NOT NULL, UNIQUE`               | User's email address, used for login.                                       |
| `password_hash` | `VARCHAR(255)` |                                  | Hashed password for login-enabled users. `NULL` for non-login users.        |
| `department`    | `VARCHAR(255)` |                                  | The user's department.                                                      |
| `created_at`    | `TIMESTAMPTZ`  | `NOT NULL, DEFAULT now()`        | Timestamp of creation.                                                      |
| `updated_at`    | `TIMESTAMPTZ`  | `NOT NULL, DEFAULT now()`        | Timestamp of last update.                                                   |

### `roles`
A static table defining the system roles.

| Column Name | Data Type     | Constraints        | Description                                                                  |
|-------------|---------------|--------------------|------------------------------------------------------------------------------|
| `id`        | `SERIAL`      | `PRIMARY KEY`      | Unique identifier for the role.                                              |
| `name`      | `VARCHAR(50)` | `NOT NULL, UNIQUE` | Role name ('Admin', 'ServiceAdministrator', 'ProductAdministrator').          |

### `user_roles`
Join table for the many-to-many relationship between `users` and `roles`.

| Column Name | Data Type | Constraints                               | Description                               |
|-------------|-----------|-------------------------------------------|-------------------------------------------|
| `user_id`   | `UUID`    | `PRIMARY KEY, FOREIGN KEY (users.id)`     | Foreign key to the `users` table.         |
| `role_id`   | `INTEGER` | `PRIMARY KEY, FOREIGN KEY (roles.id)`     | Foreign key to the `roles` table.         |

### `services`
Stores the list of company web services.

| Column Name  | Data Type      | Constraints               | Description                                           |
|--------------|----------------|---------------------------|-------------------------------------------------------|
| `id`         | `UUID`         | `PRIMARY KEY`             | Unique identifier for the service.                    |
| `name`       | `VARCHAR(255)` | `NOT NULL`                | Name of the service (e.g., "Google Workspace").       |
| `vendor`     | `VARCHAR(255)` |                           | The service provider (e.g., "Google").                |
| `url`        | `TEXT`         |                           | URL to access the service.                            |
| `created_at` | `TIMESTAMPTZ`  | `NOT NULL, DEFAULT now()` |                                                       |
| `updated_at` | `TIMESTAMPTZ`  | `NOT NULL, DEFAULT now()` |                                                       |

### `products`
Stores products/modules associated with a service.

| Column Name   | Data Type      | Constraints                               | Description                               |
|---------------|----------------|-------------------------------------------|-------------------------------------------|
| `id`          | `UUID`         | `PRIMARY KEY`                             | Unique identifier for the product.        |
| `service_id`  | `UUID`         | `NOT NULL, FOREIGN KEY (services.id)`     | The service this product belongs to.      |
| `name`        | `VARCHAR(255)` | `NOT NULL`                                | Name of the product (e.g., "Gmail").      |
| `description` | `TEXT`         |                                           | A brief description of the product.       |
| `created_at`  | `TIMESTAMPTZ`  | `NOT NULL, DEFAULT now()`                 |                                           |
| `updated_at`  | `TIMESTAMPTZ`  | `NOT NULL, DEFAULT now()`                 |                                           |

### `payment_info`
Stores billing information for each product.

| Column Name       | Data Type        | Constraints                               | Description                                           |
|-------------------|------------------|-------------------------------------------|-------------------------------------------------------|
| `product_id`      | `UUID`           | `PRIMARY KEY, FOREIGN KEY (products.id)`  | One-to-one relationship with a product.               |
| `status`          | `VARCHAR(20)`    | `NOT NULL, DEFAULT 'incomplete'`        | 'incomplete' or 'complete'.                           |
| `amount`          | `DECIMAL(10, 2)` |                                           | The billing amount.                                   |
| `cardholder_name` | `VARCHAR(255)`   |                                           | Name of the cardholder.                               |
| `expiry_date`     | `VARCHAR(7)`     |                                           | Expiration date (e.g., 'MM/YYYY').                    |
| `payment_method`  | `VARCHAR(50)`    |                                           | e.g., 'Visa', 'Mastercard'.                           |
| `updated_at`      | `TIMESTAMPTZ`    | `NOT NULL, DEFAULT now()`                 |                                                       |

### `permission_assignments`
The core table for RBAC, linking users to the specific resources they manage.

| Column Name  | Data Type | Constraints                               | Description                                                                  |
|--------------|-----------|-------------------------------------------|------------------------------------------------------------------------------|
| `id`         | `UUID`    | `PRIMARY KEY`                             | Unique identifier for the assignment.                                        |
| `user_id`    | `UUID`    | `NOT NULL, FOREIGN KEY (users.id)`        | The user being granted permission.                                           |
| `service_id` | `UUID`    | `FOREIGN KEY (services.id), NULLABLE`     | The service being assigned (for Service Administrators).                     |
| `product_id` | `UUID`    | `FOREIGN KEY (products.id), NULLABLE`     | The product being assigned (for Product Administrators).                     |

*Constraint: `CHECK (service_id IS NOT NULL OR product_id IS NOT NULL)`*

### `workflow_tasks`
Stores tasks for the inbox system.

| Column Name        | Data Type     | Constraints                               | Description                                           |
|--------------------|---------------|-------------------------------------------|-------------------------------------------------------|
| `id`               | `UUID`        | `PRIMARY KEY`                             | Unique identifier for the task.                       |
| `type`             | `VARCHAR(20)` | `NOT NULL`                                | 'onboarding' or 'offboarding'.                        |
| `status`           | `VARCHAR(20)` | `NOT NULL, DEFAULT 'pending'`           | 'pending', 'completed', 'invited', etc.             |
| `assignee_user_id` | `UUID`        | `NOT NULL, FOREIGN KEY (users.id)`        | The admin responsible for the task.                   |
| `target_user_id`   | `UUID`        | `NOT NULL, FOREIGN KEY (users.id)`        | The user the task is about.                           |
| `details`          | `TEXT`        |                                           | A description of the task.                            |
| `due_date`         | `TIMESTAMPTZ` |                                           | Optional due date.                                    |
| `created_at`       | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()`                 |                                                       |
| `updated_at`       | `TIMESTAMPTZ` | `NOT NULL, DEFAULT now()`                 |                                                       |

### `audit_logs`
Records significant events for auditing purposes.

| Column Name     | Data Type      | Constraints                        | Description                                                                  |
|-----------------|----------------|------------------------------------|------------------------------------------------------------------------------|
| `id`            | `UUID`         | `PRIMARY KEY`                      | Unique identifier for the log entry.                                         |
| `actor_user_id` | `UUID`         | `NOT NULL, FOREIGN KEY (users.id)` | The user who performed the action.                                           |
| `action`        | `VARCHAR(255)` | `NOT NULL`                         | e.g., 'user.role.assign', 'service.create'.                                  |
| `target_id`     | `VARCHAR(255)` |                                    | The ID of the entity that was affected.                                      |
| `details`       | `JSONB`        |                                    | A JSON object with before/after state or other details.                      |
| `created_at`    | `TIMESTAMPTZ`  | `NOT NULL, DEFAULT now()`          |                                                                              |

## 4. Indexing Strategy

To ensure query performance, the following indexes should be created:

*   Indexes on all `FOREIGN KEY` columns (e.g., `products.service_id`, `permission_assignments.user_id`).
*   A multi-column index on `(user_id, service_id)` and `(user_id, product_id)` in the `permission_assignments` table to speed up permission checks.
*   An index on `audit_logs.actor_user_id` and `audit_logs.action`.
*   An index on `workflow_tasks.assignee_user_id` and `workflow_tasks.status`.

This schema provides a robust and normalized foundation for the PortalOps application.
