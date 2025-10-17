# Product Requirements: Payment Register

## 1. Overview

This document outlines the requirements for a new "Payment Register" feature. This feature will replace the existing "Reports" section and provide administrators with a centralized location to manage product billing information.

## 2. Navigation and Access Control

### 2.1. Navigation Updates
- The "Reports" item in the main navigation shall be removed.
- A new navigation item labeled "Payment Register" shall be added.
- The position of the "Payment Register" and "User Directory" navigation items shall be swapped.

### 2.2. Access Control
- Access to the "Payment Register" page shall be restricted to users with the "Admin" role. Users without this role should not see the navigation item and should be denied access if they attempt to navigate to the URL directly.

## 3. Payment Register Page Functionality

### 3.1. Core Functionality: Billing Information Management
- The primary purpose of this page is to display and manage billing information for various products.
- For each product, the following billing details must be captured:
    - Bill Amount
    - Cardholder Name
    - Expiration Date
    - Payment Method
- The information for each product, including its service name, product name, and billing details, should be presented in a single row for easy viewing and editing.

### 3.2. Display and Sorting
- **Default Order:** By default, the list of products shall be sorted to show products with incomplete billing information at the top, followed by products with complete billing information.
- **Visual Cues:**
    - Rows for products with incomplete billing information shall be visually distinguished with a red color indicator.
    - Rows for products with complete billing information shall be visually distinguished with a green color indicator.

### 3.3. Inline Editing
- Users must be able to edit the billing information for any product directly within the list on the Payment Register page.
- The interface should support saving changes for multiple products without requiring page reloads or navigation to a separate editing page for each product.

### 3.4. Navigation Badge
- A notification badge shall be displayed on the "Payment Register" navigation link in the sidebar.
- If there are one or more products with incomplete billing information, this badge will be red and display the total count of such products.
- If all products have complete billing information, the badge should not be visible.

### 3.5. Add New Product and Billing Information
- The page must include an "Add" button.
- Clicking the "Add" button will provide a mechanism to add a new product and its associated billing information simultaneously.
- The fields required for adding a new entry are:
    - Service Name (selectable from a dropdown of existing services)
    - Product Name
    - Bill Amount
    - Cardholder Name
    - Expiration Date
    - Payment Method

### 3.6. Data Synchronization
- **Service Inventory Integration:** When a new product is added through the "Add" functionality on the Payment Register page, the new product must also be automatically added to the corresponding service within the "Service Inventory".
- **Data Consistency:** Product information from the "Service Inventory" should be the source of truth and be reflected in the "Payment Register". Any updates to product names or service associations in the inventory should be synchronized.
