# PortalOps Backend Deployment Guide

## 🚀 Quick Start

### Option 1: Docker Compose (Recommended)

1. **Navigate to server directory:**
```bash
cd server
```

2. **Start services:**
```bash
./start.sh
```
or manually:
```bash
docker-compose up -d
```

3. **Verify deployment:**
```bash
python test_api.py
```

4. **Access the application:**
- API: http://localhost:8000
- Documentation: http://localhost:8000/docs
- Health Check: http://localhost:8000/health

### Option 2: Manual Setup

1. **Set up environment:**
```bash
cp env.example .env
# Edit .env with your configuration
```

2. **Install dependencies:**
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

3. **Set up database:**
```bash
# Run PostgreSQL and execute:
# - ../database/schema.sql
# - ../database/sample_data.sql
```

4. **Start application:**
```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

## 📁 Project Structure

```
server/
├── app/
│   ├── api/
│   │   └── api_v1/
│   │       ├── api.py              # API router configuration
│   │       └── endpoints/          # API endpoint implementations
│   │           ├── auth.py         # Authentication endpoints
│   │           ├── users.py        # User management endpoints
│   │           ├── services.py     # Service inventory endpoints
│   │           ├── payment_register.py # Payment register endpoints
│   │           ├── workflows.py    # Workflow and inbox endpoints
│   │           └── audit_logs.py   # Audit log endpoints
│   ├── core/
│   │   ├── config.py              # Application configuration
│   │   ├── security.py            # JWT and password handling
│   │   ├── deps.py                # FastAPI dependencies and RBAC
│   │   ├── scheduler.py           # APScheduler configuration
│   │   └── exceptions.py          # Custom exceptions
│   ├── crud/
│   │   ├── base.py                # Base CRUD operations
│   │   ├── user.py                # User CRUD operations
│   │   ├── service.py             # Service CRUD operations
│   │   ├── product.py             # Product CRUD operations
│   │   ├── payment.py             # Payment CRUD operations
│   │   ├── workflow.py            # Workflow CRUD operations
│   │   └── audit.py               # Audit log CRUD operations
│   ├── db/
│   │   └── database.py            # Database connection and session
│   ├── models/
│   │   ├── user.py                # User, Role, UserRole models
│   │   ├── service.py             # Service, Product models
│   │   ├── payment.py             # PaymentInfo model
│   │   ├── permission.py          # PermissionAssignment model
│   │   ├── workflow.py            # WorkflowTask model
│   │   └── audit.py               # AuditLog model
│   ├── schemas/
│   │   ├── auth.py                # Authentication schemas
│   │   ├── user.py                # User schemas
│   │   ├── service.py             # Service and Product schemas
│   │   ├── payment.py             # Payment schemas
│   │   ├── workflow.py            # Workflow schemas
│   │   └── audit.py               # Audit log schemas
│   └── main.py                    # FastAPI application entry point
├── docker-compose.yml             # Docker Compose configuration
├── Dockerfile                     # Docker image configuration
├── requirements.txt               # Python dependencies
├── env.example                    # Environment variables template
├── start.sh                       # Startup script
├── test_api.py                    # API testing script
└── README.md                      # Documentation
```

## 🔧 Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://portalops:password@localhost:5432/portalops` |
| `JWT_SECRET_KEY` | JWT signing secret | `your-super-secret-jwt-key-change-this-in-production` |
| `JWT_ACCESS_TOKEN_EXPIRE_MINUTES` | Token expiration time | `15` |
| `API_V1_STR` | API prefix | `/api` |
| `PROJECT_NAME` | Application name | `PortalOps` |
| `HR_WEBHOOK_API_KEY` | HR webhook authentication key | `your-hr-webhook-secret-key` |
| `DEBUG` | Debug mode | `true` |

### Database Schema

The application uses the database schema defined in `../database/schema.sql` with the following main tables:

- `users` - User directory
- `roles` - System roles (Admin, ServiceAdministrator, ProductAdministrator)
- `user_roles` - User-role assignments
- `services` - Service inventory
- `products` - Products within services
- `payment_info` - Billing information
- `permission_assignments` - RBAC permissions
- `workflow_tasks` - Onboarding/offboarding tasks
- `audit_logs` - Audit trail

## 🔐 Authentication & Authorization

### Authentication Flow

1. User logs in with email/password via `POST /api/auth/login`
2. Server validates credentials and returns JWT access token
3. Client includes token in `Authorization: Bearer <token>` header
4. Server validates token on each request

### Role-Based Access Control (RBAC)

| Role | Permissions |
|------|-------------|
| **Admin** | Full access to all modules and data |
| **ServiceAdministrator** | Access to assigned services and their products |
| **ProductAdministrator** | Access to assigned products only |

### Permission System

- Users are assigned roles and specific resource permissions
- All endpoints enforce server-side permission checks
- Permission assignments are stored in `permission_assignments` table
- Audit logging tracks all administrative actions

## 📊 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user profile

### User Management
- `GET /api/users` - List users (with search/pagination)
- `POST /api/users` - Create user
- `PUT /api/users/{id}/permissions` - Update user permissions
- `GET /api/users/{id}` - Get user details
- `PUT /api/users/{id}` - Update user
- `DELETE /api/users/{id}` - Delete user

### Service Inventory
- `GET /api/services` - List services
- `POST /api/services` - Create service
- `GET /api/services/{id}` - Get service with products
- `PUT /api/services/{id}` - Update service
- `DELETE /api/services/{id}` - Delete service
- `POST /api/services/{id}/products` - Create product
- `GET /api/services/{id}/products/{pid}` - Get product
- `PUT /api/services/{id}/products/{pid}` - Update product
- `DELETE /api/services/{id}/products/{pid}` - Delete product

### Payment Register
- `GET /api/payment-register` - Get payment register
- `GET /api/payment-register/summary` - Get incomplete count
- `POST /api/payment-register` - Create product with payment info
- `PUT /api/payment-register/{id}` - Update payment info

### Workflows
- `POST /api/webhooks/hr/onboarding` - HR onboarding webhook
- `GET /api/inbox/tasks` - Get user tasks
- `PUT /api/inbox/tasks/{id}` - Update task
- `GET /api/inbox/tasks/{id}` - Get task details

### Audit Logs
- `GET /api/audit-logs` - Get audit logs (Admin only)

## 🔄 Scheduled Jobs

The application includes background jobs using APScheduler:

1. **Payment Expiration Check** - Daily at 9 AM
   - Scans for expiring payment information
   - Sends notifications to administrators

2. **Pending Task Reminder** - Weekly on Mondays at 10 AM
   - Checks for pending onboarding/offboarding tasks
   - Sends reminder notifications

## 🧪 Testing

### API Testing
```bash
# Run basic API tests
python test_api.py

# Manual testing with curl
curl http://localhost:8000/health
curl http://localhost:8000/api/auth/login -X POST -H "Content-Type: application/json" -d '{"email":"admin@example.com","password":"password"}'
```

### Load Testing
```bash
# Install dependencies
pip install locust

# Run load tests (create locustfile.py first)
locust -f locustfile.py --host=http://localhost:8000
```

## 🚀 Production Deployment

### Security Checklist

- [ ] Change all default secrets and API keys
- [ ] Use HTTPS with proper TLS certificates
- [ ] Configure CORS for specific origins
- [ ] Set up proper firewall rules
- [ ] Use environment variables for sensitive data
- [ ] Enable database connection encryption
- [ ] Set up proper logging and monitoring

### Performance Optimization

- [ ] Configure database connection pooling
- [ ] Set up Redis for caching (if needed)
- [ ] Use a reverse proxy (Nginx/Caddy)
- [ ] Configure proper resource limits
- [ ] Set up horizontal scaling with load balancer

### Monitoring

- [ ] Set up application logging
- [ ] Configure health checks
- [ ] Monitor API performance and errors
- [ ] Set up database monitoring
- [ ] Configure alerting for critical issues

### Backup Strategy

- [ ] Set up automated database backups
- [ ] Configure file storage backups
- [ ] Test backup restoration procedures
- [ ] Document recovery procedures

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   - Check DATABASE_URL configuration
   - Verify PostgreSQL is running
   - Check network connectivity

2. **JWT Token Issues**
   - Verify JWT_SECRET_KEY is set
   - Check token expiration time
   - Ensure proper token format

3. **Permission Denied Errors**
   - Check user roles and permissions
   - Verify RBAC configuration
   - Check audit logs for details

4. **Docker Issues**
   - Check Docker and Docker Compose versions
   - Verify port availability
   - Check container logs: `docker-compose logs`

### Logs

- Application logs: Check container logs or console output
- Database logs: Check PostgreSQL logs
- Scheduler logs: Included in application logs

### Support

For issues and support:
1. Check the logs for error details
2. Verify configuration settings
3. Test with the provided test script
4. Review the API documentation at `/docs`

## 📝 License

This project is proprietary software for enterprise use.



