# Inbox Feature Change Request

- **Version:** 1.0
- **Date:** 2025-10-21
- **Status:** Proposal

## 1. Introduction

This document outlines a requested change to the Inbox functionality within the PortalOps platform. The goal is to transform the Inbox from a user-specific task list into a shared queue for all administrators. This change will ensure that any administrator can process any available task, while preventing multiple administrators from processing the same task concurrently.

## 2. Current Functionality Analysis

Based on the existing project documentation (`PortalOps.md`, `API_Specification.md`, `Database_Design.md`), the current Inbox operates as follows:

- **Role-Based Access:** The Inbox is accessible only to users with the `Admin` role.
- **Task Assignment:** The `workflow_tasks` database table includes an `assignee_user_id` column. This indicates that when an onboarding or offboarding task is created via the API, it is assigned to a *specific* administrator.
- **API Endpoints:**
    - `GET /api/inbox/tasks`: Retrieves tasks specifically "assigned to the authenticated user."
    - `PUT /api/inbox/tasks/{id}`: Updates a task's status, but requires the user to be the assignee.

This design creates isolated task lists for each administrator, preventing others from viewing or intervening in their assigned workflows.

## 3. Proposed Changes

To meet the new requirements, the following changes are proposed to create a unified, concurrency-safe Inbox.

### 3.1. Unified Inbox View

All users with the `Admin` role will see the exact same list of pending tasks. The concept of a pre-assigned task (`assignee_user_id`) will be deprecated and removed. The Inbox will function as a shared queue where any Admin can pick up any unhandled task.

### 3.2. Task Processing and Locking Mechanism

To prevent race conditions where two Admins might attempt to process the same task simultaneously, a "task claiming" or "locking" mechanism will be introduced.

1.  **Initial State:** A new task is created with a `status` of `'pending'` and its processing-related fields are `NULL`.
2.  **Task Claiming:** When an Admin clicks "Start Task," the system will attempt to atomically "claim" that task for them.
3.  **Concurrency Control:**
    - This claim action will be an `UPDATE` operation on the task's database record, setting the `processed_by_user_id` to the current Admin's ID.
    - This update will be conditional, executing **only if** `processed_by_user_id` is currently `NULL`.
    - **Success:** If the update succeeds (1 row affected), the Admin has successfully claimed the task and can proceed with the workflow.
    - **Failure:** If the update fails (0 rows affected), it means another Admin claimed the task moments before. The UI will display a non-intrusive notification stating, **"This task has already been processed or is currently being handled by another administrator."**
4.  **Task Completion:** Once the workflow (e.g., user creation or deletion) is successfully completed, the task `status` will be marked as `'completed'`.

## 4. Database Schema Modifications

The `workflow_tasks` table needs to be modified to support this new logic.

**Table:** `workflow_tasks`

| Action | Column Name        | Data Type     | Constraints/Details                                                                                             |
| :--- | :--- | :--- |:--------------------------------------------------------------------------------------------------------------------------------|
| **REMOVE** | `assignee_user_id` | `UUID`        | This column is no longer needed as tasks are not pre-assigned.                                                  |
| **ADD**    | `processed_by_user_id` | `UUID`        | `NULLABLE`, `FOREIGN KEY (users.id)`. Stores the ID of the Admin who successfully claimed the task.             |
| **ADD**    | `processed_at`     | `TIMESTAMPTZ` | `NULLABLE`. Stores the timestamp of when the task was claimed, providing a clear audit trail.                 |
| **MODIFY** | `status`           | `VARCHAR(20)` | Consider adding a `'processing'` status to differentiate between a pending task and one actively being worked on. |

## 5. API Endpoint Modifications

The existing API for the Inbox needs to be adjusted, and one new endpoint should be created.

### 5.1. `GET /api/inbox/tasks` (Modified)

- **Description:** Retrieves the list of all tasks for the shared Inbox.
- **Logic Change:** The endpoint will no longer filter by the authenticated user. It will return all tasks where the `status` is `'pending'`. The sorting should remain the same, with incomplete tasks appearing first.

### 5.2. `POST /api/inbox/tasks/{id}/claim` (New Endpoint)

- **Description:** Allows an administrator to claim a pending task. This endpoint should be called when the user clicks "Start Task".
- **Authorization:** `Admin` role required.
- **Logic:**
    1.  Performs an atomic database update:
        ```sql
        UPDATE workflow_tasks
        SET
          processed_by_user_id = :current_admin_id,
          processed_at = NOW(),
          status = 'processing'
        WHERE
          id = :task_id AND processed_by_user_id IS NULL;
        ```
    2.  **On Success (1 row updated):** Return `200 OK` with the full task object. The frontend can then navigate to the appropriate User Directory panel.
    3.  **On Failure (0 rows updated):** Return `409 Conflict` with the error message: `"Task is already being processed by another user."`

### 5.3. `PUT /api/inbox/tasks/{id}` (Modified)

- **Description:** Marks a task as completed after the underlying workflow is finished.
- **Logic Change:**
    - The request body should now primarily focus on updating the status: `{"status": "completed"}`.
    - The endpoint should perform a check to ensure that the user making the request is the same one who claimed the task (`processed_by_user_id`). This prevents an Admin from accidentally completing a task another Admin is working on.

## 6. High-Level Workflow Example

1.  Admin A and Admin B both load the Inbox page. They both see "Onboarding Task for John Doe" with `status: 'pending'`.
2.  Admin A clicks "Start Task" for John Doe.
3.  The frontend sends a `POST /api/inbox/tasks/{task_id}/claim` request.
4.  The backend executes the atomic `UPDATE` operation. It succeeds. The API returns a `200 OK`. Admin A is redirected to the User Directory "Add" panel.
5.  Simultaneously, Admin B clicks "Start Task" for the same task.
6.  The frontend sends another `POST /api/inbox/tasks/{task_id}/claim` request.
7.  The backend executes the same `UPDATE` operation, but the `WHERE ... AND processed_by_user_id IS NULL` clause now fails because Admin A's ID is in that field. The query affects 0 rows.
8.  The API returns a `409 Conflict` error. Admin B's UI displays the message that the task is already being handled. The task list on Admin B's screen can be refreshed to show the task as "processing" or remove it from the pending queue.
