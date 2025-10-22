# PortalOps Backend

FastAPI-based backend for the PortalOps enterprise portal operations management system.

## Features

- **Authentication & Authorization**: JWT-based authentication with Role-Based Access Control (RBAC)
- **User Management**: Complete Employee Directory with role and permission management
- **Service Inventory**: Manage services and their products
- **Payment Register**: Track billing information for all products
- **Workflow Management**: Onboarding/offboarding task management with inbox system
- **Audit Logging**: Comprehensive audit trail for all administrative actions
- **Scheduled Jobs**: Automated reminders for payment expiration and pending tasks

## Architecture

- **Framework**: FastAPI with Python 3.11
- **Database**: PostgreSQL with SQLAlchemy ORM
- **Authentication**: JWT tokens with bcrypt password hashing
- **Scheduler**: APScheduler for background tasks
- **Deployment**: Docker with docker-compose

## Quick Start

### Using Docker Compose (Recommended)

1. Clone the repository and navigate to the server directory:
```bash
cd server
```

2. Start the services:
```bash
docker-compose up -d
```

3. The API will be available at `http://localhost:8000`
4. API documentation at `http://localhost:8000/docs`

### Manual Setup

1. Install dependencies:
```bash
pip install -r requirements.txt
```

2. Set up environment variables:
```bash
cp env.example .env
# Edit .env with your configuration
```

3. Set up PostgreSQL database and run the schema:
```bash
# Run the database schema from ../database/schema.sql
# Run sample data from ../database/sample_data.sql
```

4. Start the application:
```bash
uvicorn app.main:app --reload
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### Users
- `GET /api/users` - List users with search and pagination
- `POST /api/users` - Create new user
- `PUT /api/users/{id}/permissions` - Update user roles and permissions
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Services
- `GET /api/services` - List services (filtered by permissions)
- `POST /api/services` - Create service
- `GET /api/services/{id}` - Get service with products
- `PUT /api/services/{id}` - Update service
- `DELETE /api/services/{id}` - Delete service

### Products
- `POST /api/services/{service_id}/products` - Create product
- `GET /api/services/{service_id}/products/{product_id}` - Get product
- `PUT /api/services/{service_id}/products/{product_id}` - Update product
- `DELETE /api/services/{service_id}/products/{product_id}` - Delete product

### Payment Register
- `GET /api/payment-register` - Get payment register
- `GET /api/payment-register/summary` - Get incomplete payment count
- `POST /api/payment-register` - Create product with payment info
- `PUT /api/payment-register/{product_id}` - Update payment info

### Workflows
- `POST /api/webhooks/hr/onboarding` - HR onboarding webhook
- `GET /api/inbox/tasks` - Get user's tasks
- `PUT /api/inbox/tasks/{id}` - Update task status
- `GET /api/inbox/tasks/{id}` - Get task details

### Audit Logs
- `GET /api/audit-logs` - Get audit logs with filtering

## Role-Based Access Control

### Roles
- **Admin**: Full access to all modules and data
- **ServiceAdministrator**: Limited to assigned services and their products
- **ProductAdministrator**: Limited to assigned products only

### Permission System
- Users are assigned roles and specific resource permissions
- All endpoints enforce server-side permission checks
- Audit logging tracks all administrative actions

## Configuration

Key environment variables:

```bash
# Database
DATABASE_URL=postgresql://portalops:password@localhost:5432/portalops

# JWT
JWT_SECRET_KEY=your-super-secret-jwt-key
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=15

# API
API_V1_STR=/api
PROJECT_NAME=PortalOps

# File Upload
UPLOAD_DIR=/uploads
MAX_FILE_SIZE=10485760

# Webhooks
HR_WEBHOOK_API_KEY=your-hr-webhook-secret-key

# Development
DEBUG=true
```

## Development

### Running Tests
```bash
# Install test dependencies
pip install pytest pytest-asyncio httpx

# Run tests
pytest
```

### Database Migrations
```bash
# Generate migration
alembic revision --autogenerate -m "Description"

# Apply migration
alembic upgrade head
```

### Code Quality
```bash
# Format code
black app/

# Sort imports
isort app/

# Lint code
flake8 app/
```

## Deployment

### Production Considerations

1. **Security**:
   - Change all default secrets and API keys
   - Use HTTPS with proper TLS certificates
   - Configure CORS for specific origins
   - Set up proper firewall rules

2. **Database**:
   - Use managed PostgreSQL service or proper backup strategy
   - Configure connection pooling
   - Set up monitoring and alerting

3. **Monitoring**:
   - Set up application logging
   - Configure health checks
   - Monitor API performance and errors

4. **Scaling**:
   - Use load balancer for multiple instances
   - Configure Redis for session storage if needed
   - Set up proper resource limits

### Docker Production Deployment

```bash
# Build production image
docker build -t portalops-backend .

# Run with production environment
docker run -d \
  --name portalops-backend \
  -p 8000:8000 \
  -e DATABASE_URL=postgresql://user:pass@host:5432/db \
  -e JWT_SECRET_KEY=your-production-secret \
  -e DEBUG=false \
  portalops-backend
```

## License

This project is proprietary software for enterprise use.



