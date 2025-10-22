# API Design Specification v3.0

## 1. Introduction

This document outlines the API changes and additions required to support the new features introduced in `product_requirements_v3.md`. These changes primarily affect the User and Administration modules, introducing endpoints for department management and enhancing existing user management capabilities.

## 2. Authentication & Authorization

All endpoints described below require authentication via a Bearer token in the `Authorization` header, consistent with the existing API.

Authorization roles are specified for each endpoint. The primary roles are `Admin` and `Service Admin`.

## 3. Data Models (Schemas)

This section details new and modified data models for API requests and responses.

### 3.1. User Model

The `User` object is updated to include `position`, `hire_date`, and `resignation_date`.

**`User` Response Model:**
```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "department": "string",
  "position": "string",         // NEW
  "hire_date": "YYYY-MM-DD",    // NEW
  "resignation_date": "YYYY-MM-DD", // NEW (nullable)
  "roles": ["Admin" | "Service Admin"],
  "assignedProductIds": ["uuid", "..."]
}
```

### 3.2. User Create/Update Models

The request body for creating and updating users is enhanced to include the new fields.

**`UserCreate` / `UserUpdate` Request Model:**
```json
{
  "name": "string",
  "email": "string",
  "department": "string",
  "position": "string",         // NEW
  "hire_date": "YYYY-MM-DD",    // NEW
  "resignation_date": "YYYY-MM-DD", // NEW (nullable)
  "role": "Service Admin",      // Now supports 'Service Admin'
  "assignedProductIds": ["uuid", "..."]
}
```

### 3.3. Department Model (New)

A new resource for managing departments.

**`Department` Response Model:**
```json
{
  "id": "uuid",
  "name": "string",
  "created_at": "datetime",
  "updated_at": "datetime"
}
```

**`DepartmentCreate` / `DepartmentUpdate` Request Model:**
```json
{
  "name": "string"
}
```

### 3.4. Department Product Assignment Model (New)

**`DepartmentProductAssignment` Request Model:**
```json
{
  "product_ids": ["uuid", "uuid", "..."]
}
```

## 4. API Endpoints

### 4.1. Users Module (`/api/users`)

#### 4.1.1. Get User Details
- **Endpoint:** `GET /api/users/{user_id}`
- **Description:** Retrieves details for a single user, now including `position`, `hire_date`, and `resignation_date`.
- **Authorization:** `Admin`
- **Response (200 OK):** `User` object (as defined in 3.1).

#### 4.1.2. List Users
- **Endpoint:** `GET /api/users`
- **Description:** Retrieves a list of users. Each user object in the array is now enriched with `position`, `hire_date`, and `resignation_date`.
- **Authorization:** `Admin`
- **Response (200 OK):** An array of `User` objects.

#### 4.1.3. Update User
- **Endpoint:** `PUT /api/users/{user_id}`
- **Description:** Updates a user's details. This endpoint now supports modifying `position`, `hire_date`, `resignation_date`, and assigning the `Service Admin` role.
- **Authorization:** `Admin`
- **Request Body:** `UserUpdate` object (as defined in 3.2).
- **Response (200 OK):** The updated `User` object.

### 4.2. Departments Module (`/api/departments`) (New)

This new module provides full CRUD functionality for managing departments and their product assignments.

**Authorization:** All endpoints in this module require the `Admin` role.

#### 4.2.1. List Departments
- **Endpoint:** `GET /api/departments`
- **Description:** Retrieves a list of all departments.
- **Response (200 OK):** An array of `Department` objects.

#### 4.2.2. Create Department
- **Endpoint:** `POST /api/departments`
- **Description:** Creates a new department.
- **Request Body:** `DepartmentCreate` object.
- **Response (201 Created):** The newly created `Department` object.

#### 4.2.3. Update Department
- **Endpoint:** `PUT /api/departments/{department_id}`
- **Description:** Updates a department's name.
- **Request Body:** `DepartmentUpdate` object.
- **Response (200 OK):** The updated `Department` object.

#### 4.2.4. Delete Department
- **Endpoint:** `DELETE /api/departments/{department_id}`
- **Description:** Deletes a department and its associated product assignments from `department_product_assignments`.
- **Response (204 No Content):** No response body.

#### 4.2.5. Get Department Product Assignments
- **Endpoint:** `GET /api/departments/{department_id}/products`
- **Description:** Retrieves a list of all products assigned to a specific department.
- **Response (200 OK):** An array of `Product` objects.

#### 4.2.6. Set Department Product Assignments
- **Endpoint:** `PUT /api/departments/{department_id}/products`
- **Description:** Sets the complete list of products for a department. This is a full replacement of all existing assignments for the department.
- **Request Body:** `DepartmentProductAssignment` object (as defined in 3.4).
- **Response (200 OK):** An object containing the list of newly assigned product IDs.
  ```json
  {
    "assigned_product_ids": ["uuid", "..."]
  }
  ```
