# PortalOps v3 API Quick Reference

## Base URL
All endpoints: `http://localhost:8000/api`

## Authentication
All endpoints require: `Authorization: Bearer <token>`

---

## 1. Enhanced User Endpoints

### Get User List
```http
GET /api/users?search=john&page=1&limit=20
```

**Response:**
```json
{
  "data": [
    {
      "id": "uuid",
      "name": "John Doe",
      "email": "john@example.com",
      "department": "Engineering",
      "position": "Software Engineer",
      "hire_date": "2023-01-15",
      "resignation_date": null,
      "roles": ["Service Admin"],
      "assignedProductIds": ["uuid1", "uuid2"]
    }
  ],
  "pagination": {
    "total": 50,
    "page": 1,
    "limit": 20
  }
}
```

### Get User by ID
```http
GET /api/users/{user_id}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "position": "Software Engineer",
  "hire_date": "2023-01-15",
  "resignation_date": null,
  "created_at": "2023-01-10T10:00:00Z",
  "updated_at": "2023-01-10T10:00:00Z"
}
```

### Create User
```http
POST /api/users
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "position": "Software Engineer",
  "hire_date": "2023-01-15",
  "role": "Service Admin",
  "assignedProductIds": ["uuid1", "uuid2"]
}
```

**Note:** `resignation_date` will automatically default to `null`

### Update User
```http
PUT /api/users/{user_id}
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "department": "Engineering",
  "position": "Senior Software Engineer",
  "hire_date": "2023-01-15",
  "resignation_date": null,
  "role": "Admin",
  "assignedProductIds": ["uuid1", "uuid2", "uuid3"]
}
```

---

## 2. Department Management Endpoints

### List All Departments
```http
GET /api/departments
Authorization: Bearer <admin_token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Engineering",
    "created_at": "2023-01-10T10:00:00Z",
    "updated_at": "2023-01-10T10:00:00Z"
  },
  {
    "id": "uuid",
    "name": "Marketing",
    "created_at": "2023-01-10T10:00:00Z",
    "updated_at": "2023-01-10T10:00:00Z"
  }
]
```

### Create Department
```http
POST /api/departments
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Sales"
}
```

**Response:** (201 Created)
```json
{
  "id": "uuid",
  "name": "Sales",
  "created_at": "2023-01-10T10:00:00Z",
  "updated_at": "2023-01-10T10:00:00Z"
}
```

### Update Department
```http
PUT /api/departments/{department_id}
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "Sales & Marketing"
}
```

**Response:**
```json
{
  "id": "uuid",
  "name": "Sales & Marketing",
  "created_at": "2023-01-10T10:00:00Z",
  "updated_at": "2023-01-10T12:00:00Z"
}
```

### Delete Department
```http
DELETE /api/departments/{department_id}
Authorization: Bearer <admin_token>
```

**Response:** (204 No Content)

**Note:** This will cascade delete all product assignments for this department.

---

## 3. Department Product Assignment Endpoints

### Get Department Products
```http
GET /api/departments/{department_id}/products
Authorization: Bearer <admin_token>
```

**Response:**
```json
[
  {
    "id": "uuid",
    "service_id": "uuid",
    "name": "Jira",
    "description": "Project tracking tool",
    "url": "https://jira.example.com",
    "created_at": "2023-01-10T10:00:00Z",
    "updated_at": "2023-01-10T10:00:00Z"
  },
  {
    "id": "uuid",
    "service_id": "uuid",
    "name": "Confluence",
    "description": "Documentation tool",
    "url": "https://confluence.example.com",
    "created_at": "2023-01-10T10:00:00Z",
    "updated_at": "2023-01-10T10:00:00Z"
  }
]
```

### Set Department Products
```http
PUT /api/departments/{department_id}/products
Authorization: Bearer <admin_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "product_ids": [
    "product-uuid-1",
    "product-uuid-2",
    "product-uuid-3"
  ]
}
```

**Response:**
```json
{
  "assigned_product_ids": [
    "product-uuid-1",
    "product-uuid-2",
    "product-uuid-3"
  ]
}
```

**Note:** This is a full replacement operation. All existing assignments will be removed and replaced with the new list.

---

## Error Responses

### 400 Bad Request
```json
{
  "detail": "Department with this name already exists"
}
```

### 401 Unauthorized
```json
{
  "detail": "Could not validate credentials"
}
```

### 403 Forbidden
```json
{
  "detail": "Not enough permissions"
}
```

### 404 Not Found
```json
{
  "detail": "Department not found"
}
```

---

## Common Use Cases

### 1. Create a new department and assign products
```bash
# Step 1: Create department
curl -X POST http://localhost:8000/api/departments \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"name": "Engineering"}'

# Step 2: Assign products
curl -X PUT http://localhost:8000/api/departments/{dept_id}/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"product_ids": ["uuid1", "uuid2"]}'
```

### 2. Create a user with position and hire date
```bash
curl -X POST http://localhost:8000/api/users \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "department": "Engineering",
    "position": "Software Engineer",
    "hire_date": "2023-01-15",
    "role": "Service Admin",
    "assignedProductIds": ["uuid1", "uuid2"]
  }'
```

### 3. Update department products
```bash
curl -X PUT http://localhost:8000/api/departments/{dept_id}/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"product_ids": ["new-uuid1", "new-uuid2", "new-uuid3"]}'
```

### 4. Get all users with their positions
```bash
curl -X GET http://localhost:8000/api/users \
  -H "Authorization: Bearer <token>"
```

---

## Authorization Requirements

| Endpoint | Required Role |
|----------|--------------|
| GET /api/users | Admin |
| POST /api/users | Admin |
| PUT /api/users/{id} | Admin |
| DELETE /api/users/{id} | Admin |
| GET /api/departments | Admin |
| POST /api/departments | Admin |
| PUT /api/departments/{id} | Admin |
| DELETE /api/departments/{id} | Admin |
| GET /api/departments/{id}/products | Admin |
| PUT /api/departments/{id}/products | Admin |

---

## Testing with Postman

### Environment Variables
```
BASE_URL: http://localhost:8000
TOKEN: <your_jwt_token>
```

### Import Collection
Use the endpoints above to create a Postman collection for testing.

---

## Notes

1. **Resignation Date:** Always defaults to `null` when creating users. Should be hidden in the UI by default.

2. **Department Products:** The assignment is a full replacement operation, not an append.

3. **Audit Logging:** All operations are logged with actor information.

4. **Role Assignment:** "Service Admin" role is fully supported alongside "Admin" role.

5. **Cascading Deletes:** Deleting a department removes all its product assignments automatically.

---

## Database Schema Reference

### Users Table
- `id` (UUID, PK)
- `name` (String)
- `email` (String, Unique)
- `department` (String, nullable)
- `position` (String, nullable) - **NEW**
- `hire_date` (Date, nullable) - **NEW**
- `resignation_date` (Date, nullable) - **NEW**
- `password_hash` (String, nullable)
- `azure_id` (String, nullable, unique)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Departments Table
- `id` (UUID, PK)
- `name` (String, Unique)
- `created_at` (DateTime)
- `updated_at` (DateTime)

### Department_Product_Assignments Table
- `department_id` (UUID, FK, PK)
- `product_id` (UUID, FK, PK)

---

## Version Information

- API Version: v3.0
- Implementation Date: October 22, 2025
- Based on: product_requirements_v3.md, api_design_v3.md

