# System Architecture Design Document (Simplified Monolithic Architecture)
**Project:** PortalOps  
**Architecture Type:** Monolithic (Single FastAPI Application)  
**Backend Tech Stack:** Python + FastAPI  
**Database:** PostgreSQL  
**Deployment:** Docker (single container or docker-compose)  
**Authentication:** JWT-based  
**File Storage:** Local filesystem (`/uploads`)  
**Scheduled Jobs:** Yes (using APScheduler)

---

## 1. Purpose

This document describes the simplified architecture of PortalOps as a **single FastAPI application** without external distributed systems (no Kubernetes, Redis, Celery, or microservices). It is optimized for **moderate scale and fast development**, while keeping security and maintainability in mind.

---

## 2. High-Level Architecture Overview

```
PortalOps (FastAPI Monolith)
├── API Layer (Routers / Controllers)
├── Service Layer (Business Logic)
├── Data Layer (PostgreSQL via SQLAlchemy ORM)
├── Auth Layer (JWT + Role-Based Access Control)
├── File Storage (/uploads)
├── Scheduler (APScheduler for reminders)
└── Audit Logging
```

The application is packaged as a **single container using Docker** and can optionally include `docker-compose` with PostgreSQL.

---

## 3. Core Modules

| Module              | Description |
|--------------------|-------------|
| **Auth Module**     | Login, JWT token issuing, token refresh, password hashing |
| **Role & Permission Module** | Implements RBAC with Admin / Service Admin / Product Admin enforcement |
| **Service Inventory Module** | Manage services and their products (e.g., “Google Workspace → Gmail / Drive”) |
| **User Directory Module** | List users and their assigned access |
| **Payment Register Module** | Manage billing details per product |
| **Onboarding & Offboarding Workflow** | Generates tasks and reminders |
| **Scheduler Module (APScheduler)** | Sends email alerts or internal notifications for pending tasks or expiring payments |

---

## 4. Data Storage

- **Database:** PostgreSQL (SQLAlchemy ORM + Alembic for migrations)
- **File Storage:** Local directory `/uploads` (configurable via environment variables)
- **Sensitive fields (e.g. card expiration):** Stored in database but masked on output
- **Backups:** `pg_dump` scheduled externally or via cronjob

---

## 5. Authentication & Authorization

### 5.1 Authentication

- Users authenticate using **username + password**
- Authentication flow uses **JWT access tokens (short-lived, ~15 min)** and **refresh tokens**
- Passwords stored using **bcrypt hashing**

### 5.2 Authorization (RBAC)

Each request is checked against **user roles and assigned permissions**. RBAC logic is enforced **server-side**, even if UI hides elements.

| Role              | Capabilities |
|-------------------|--------------|
| **Admin**         | Full access to all modules and all data |
| **Service Administrator** | Limited to assigned services and their products |
| **Product Administrator** | Limited to assigned products only |
| **User (non-login)** | Exists in User Directory only, no access |

---

## 6. Scheduled Jobs (APScheduler)

| Job Type | Logic |
|----------|--------|
| Payment Expiration Reminder | Scan products with expiring billing details and notify admins |
| Pending Task Reminder | Remind service/product admins of pending onboarding/offboarding tasks |

Scheduled jobs **run within the same FastAPI process** and are triggered on application startup.

---

## 7. Deployment Model

### 7.1 Docker-Based Deployment

Example structure:

```
docker-compose.yml
├── portalops-app (FastAPI)
└── postgres
```

The container exposes:

| Port | Purpose |
|------|----------|
| 8000 | FastAPI HTTP API |

Environment variables control DB connection string, JWT secret, upload directory, etc.

---

## 8. Security Considerations

| Aspect | Implementation |
|--------|----------------|
| Password Storage | bcrypt |
| Token Transport | HTTPS only (TLS handled by reverse proxy such as Nginx or Caddy) |
| Sensitive Data | Minimize storage of raw payment card info; store only masked values |
| Audit Logging | All admin actions (access changes, role assignments, edits) stored in audit log table |

---

## 9. Future Scalability Path

When higher scale or team-based operations are needed, the following upgrades can be made **without rewriting core logic**:

| Upgrade | Migration Path |
|---------|----------------|
| Redis Caching | Add Redis and wrap in caching layer |
| Asynchronous Workers | Extract scheduled jobs into Celery-based worker |
| Horizontal Scaling | Run multiple FastAPI containers behind a load balancer |
| Event-Driven Integrations | Add Kafka or SNS/SQS later if high-volume triggers are needed |

---

## 10. Next Documents

Based on this HLD, the following will be delivered:

1. **Database Design Document (ERD + table structure)**  
2. **API Specification (RESTful)**  
3. **Role & Permission Technical Policy (RBAC Enforcement Guide)**

---

**End of Document**
