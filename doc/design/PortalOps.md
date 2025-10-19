# Product Requirements Document: PortalOps

- **Version:** 2.0
- **Date:** 2025-10-17
- **Status:** Final

## 1. Vision & Core Principles

### 1.1. Product Vision
PortalOps is a centralized, secure SaaS platform for managing company web services, products, and user access. It provides fine-grained permission controls, tracks billing information via a payment inventory, and automates user onboarding and offboarding workflows triggered by external HR systems.

### 1.2. Core UI/UX Principles
- **Reusable Components:** A single, unified "Add/Edit" panel shall be used for all create and update operations across different modules to ensure a consistent user experience.
- **Real-Time Data Synchronization:** After any successful create, edit, or delete action, the UI must automatically re-fetch data and refresh the relevant view to display the most current information.

## 2. Roles and Permissions (RBAC)

The system will feature a hierarchical, two-role structure.

### 2.1. Admin (Super Administrator)
- **Access:** Unrestricted read/write access to all pages and modules within the application.
- **Permissions:**
    - Full CRUD (Create, Read, Update, Delete) capabilities for all Services and Products.
    - Can assign or revoke the `ServiceAdmin` role for any user in the User Directory.

### 2.2. ServiceAdmin (Service Administrator)
- **Access:** Limited to the modules and data relevant to their assigned services.
- **Permissions:**
    - Full CRUD capabilities for all **Products** that fall under the specific services they are assigned to manage.

## 3. Functional Modules (NAVIGATION)

### 3.1. Service Inventory
- **Display:** Services are rendered as individual cards. Each card must display the total count of products associated with it.
- **Functionality:**
    - **Add Service:**
        - The Add/Edit panel will require a **Service Name** (mandatory).
        - The panel will display a list of all *unassociated* products. The user can select multiple products to bind them to the new service. Product selection is optional.
    - **Edit Service:**
        - The user can modify the **Service Name**.
        - The user can associate additional products or disassociate currently linked products.
    - **Delete Service:**
        - Deleting a service that has products associated with it will only sever the link between the service and the products. The products themselves will not be deleted and will become "unassociated."

### 3.2. Product Inventory
- **Display:** Products are displayed in a list or table, with each product occupying a single row showing its **Name** and its parent **Service**.
- **Functionality:**
    - **CRUD:** Full CRUD operations for products are supported.
    - **Add/Edit Product:**
        - The Add/Edit panel will require a **Product Name** (mandatory, must be unique) and a **Service** (mandatory, single-choice dropdown of existing services).
    - **Filtering:** The page will include a dropdown menu to filter the product list by service. The default view will show all products.
- **Data Synchronization:**
    - On successful creation of a new product, a corresponding billing record **must** be automatically created in the **Payment Register**.
    - On deletion of a product, its association with any service is removed, and its corresponding billing record in the **Payment Register** is also deleted.

### 3.3. Payment Register
- **Data Integrity:** The total number of billing records in the Payment Register must always be identical to the total number of products in the Product Inventory.
- **Display:**
    - Each record is displayed on a single row, showing read-only **Service** and **Product** names, followed by the editable billing fields.
    - Records with all required fields filled are marked with a **green** indicator.
    - Records with one or more missing fields are marked with a **red** indicator and are always sorted to the top of the list.
- **Functionality:**
    - **No Add/Edit Panel:** This page does not use the standard Add/Edit panel. Billing information is edited directly inline on the page.
    - **Editable Fields (All Mandatory):**
        1.  Amount
        2.  Cardholder Name
        3.  Expiry Date (YYYY-MM-DD format)
        4.  Payment Method
        5.  Bill Attachment (File Upload)
- **Navigation Badge:**
    - A numerical badge will be displayed next to the "Payment Register" navigation link, showing the count of incomplete billing records.
    - The badge is hidden if the count is zero.
- **Data Synchronization:**
    - Upon successfully saving an update to any billing record, the page data and the navigation badge count must be immediately re-fetched and updated.

### 3.4. User Directory
- **Access:** This page is accessible only to users with the `Admin` role.
- **Functionality:**
    - **CRUD:** Full CRUD operations for users are supported.
    - **Add/Edit User:**
        - The Add/Edit panel will manage the user's **Name**, **Email**, and **Department**.
        - The panel will include an optional dropdown to assign a role (`Admin` or `ServiceAdmin`).
        - The panel will allow the assignment of specific **Services** or **Products**. If a service is assigned, the user implicitly gains access to all products under that service.
    - **Delete User:** Deleting a user will also remove all of their associated product and service assignments.
    - **Filtering:** The page will provide a mechanism to filter the user list to show only users associated with a selected product.

### 3.5. Inbox
- **Access:** This page is accessible only to users with the `Admin` role.
- **Display:** Incomplete tasks are always sorted to appear before completed tasks.
- **API Triggers:** The system exposes two webhook endpoints for an external HR system: one for onboarding and one for offboarding.
- **Onboarding Workflow:**
    - The API receives the new employee's **Name**, **Department**, and **Email**.
    - An "Onboarding" task is created. Clicking "Start Task" opens the **User Directory's "Add" panel**.
    - The `Name`, `Department`, and `Email` fields are pre-filled and are **read-only**.
    - The admin must assign at least one service or product to the user before submission is allowed.
    - On successful submission, a new user is created in the User Directory, and the onboarding task is automatically marked as "Completed."
- **Offboarding Workflow:**
    - The API receives the departing employee's **Name**, **Department**, and **Email**.
    - An "Offboarding" task is created. Clicking "Start Task" opens the **User Directory's "Edit" panel** for the specified user.
    - The user's `Name`, `Department`, and `Email` are **read-only**.
    - The user's currently assigned services and products are prominently displayed and are also **read-only**.
    - Successful submission of the panel confirms the offboarding action. The user is deleted from the User Directory, all associations are removed, and the offboarding task is automatically marked as "Completed."

## 4. Administration

### 4.1. Master Files
- **Access:** This page is accessible only to users with the `Admin` role.
- **Content:** This module serves as a central repository, listing all files that have been uploaded as "Bill Attachments" via the **Payment Register**.