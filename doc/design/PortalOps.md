# Product Requirements Document: PortalOps

## Product Vision
PortalOps is a centralized, secure SaaS platform for managing company webservices, granular user access, payment monitoring, and automating HR-triggered onboarding/offboarding using structured, auditable workflow tasks.

## Objectives
- Enhance security and compliance by automating account provisioning and deprovisioning.
- Reduce manual workload for IT/HR and improve staff onboarding/offboarding experience.
- Provide detailed tracking of services, payments, and product-level user assignments.

## Stakeholders
- IT Administrators
- HR Managers
- Finance/Accounting Staff
- All Employees (System Users)

---

## Functional Requirements

### Service Inventory Module
- Add, update, and delete webservice records, storing attributes: name, vendor, URL, renewal/payment details.
- Each webservice record supports multiple assignable products/modules (e.g., Gmail, Drive for Google Workspace).
- Administrators can manage user access per product, not just at the overall service level.

### User Management Module
- Maintain a directory mapping users to service and product/module access, including access expiry.
- Allow bulk onboarding/offboarding and assignment/reassignment of service/product administrators.

### Payment Tracking Module
- Store payment info per service (cardholder, renewal frequency, expiry).
- Automated notifications for upcoming expirations/renewals, visible in the inbox and dashboard.

---

## Onboarding & Offboarding Workflows

### Onboarding Workflow

- **API Trigger:**  
  Initiated automatically by the HR system sending new staff data to PortalOps via API.

- **Access Discovery:**  
  PortalOps determines all webservices and products/modules required for the new staff member, based on role/department/templates.

- **Task Generation:**  
  For each required webservice/product, generate an inbox task for the responsible admin/owner. Each task specifies:
    - Staff name and profile
    - Service/product/module to provision
    - Configuration details (role, access level, etc.)

- **Manual Action & Completion:**  
  Responsible personnel manually create accounts in external webservices, then mark the task as "created," "invited," or with a custom status/comment.

- **Reminders & Escalation:**  
  Automatic notifications for pending tasks; support for reassignment or escalation as needed.

- **Audit Logging & Reporting:**  
  All actions/statuses are audit-logged. HR/IT can generate onboarding progress and completion reports.

- **Staff Notification:**  
  Optionally, new hires receive a welcome message and service summary.

---

### Offboarding Workflow

- **API Trigger:**  
  HR system signals the staff departure via API integration.

- **Access Discovery:**  
  PortalOps searches all webservices and products/modules where the user holds access.

- **Task Generation:**  
  For each assigned service/product, an inbox task is generated for the responsible admin/service owner with:
    - Staff name and former access
    - Service/product/module
    - Recommended action (delete, suspend, password change, etc.)

- **Manual Action & Completion Status:**  
  Admins or owners take required actions in the relevant 3rd-party system. Afterward, they update the inbox task with the actual status (e.g., "deleted", "suspended", "password changed", or custom), and can leave a comment.

- **Reminders & Escalation:**  
  Pending offboarding tasks generate reminders and may be escalated/reassigned.

- **Audit Logging & Reporting:**  
  All actions/resolutions are fully audit-logged. Management can view offboarding status, outstanding items, and compliance history.

---

### Inbox-Driven Workflow Module

- All onboarding and offboarding checklist tasks are managed and confirmed through the PortalOps inbox (personal or team).
- Tasks can be marked complete, commented on, queried, or reassigned.
- Admins and users can track/manage pending/completed tasks, with full audit trails and timestamped status updates.

---

### HR System API Integration

- Seamless connection to HR platform via API for automated event triggers, onboarding, and offboarding.
- Initiates relevant workflow tasks and updates user/service/product records accordingly.

---

### Dashboard & Reporting

- Central dashboard with navigation to all functional areas: Service Inventory, User Management, Payment Tracking, Inbox (workflows), and Reports.
- Live overview: active services, user+product access, payment status, onboarding/offboarding progress, and workflow/compliance stats.
- Exportable and filterable reports; scheduled email summaries.

---

### Security & Compliance

- OAuth/JWT authentication, encrypted data storage/transit, granular role-based access.
- Access logs and alerts for suspicious, failed, or unauthorized actions.
- Complete audit trail for all workflow and administrative actions.

---

## Non-Functional Requirements

- Scalable architecture for future integrations and product expansion.
- Responsive, intuitive UI/UX for admins and all other roles.
- Resilient error handling and consistent system activity logging.

---

## Success Metrics

- Reduction in manual onboarding/offboarding errors.
- Fast workflow completion times.
- Accurate mapping of service-product-user relationships.
- High admin/user satisfaction with workflow and inbox usability.
