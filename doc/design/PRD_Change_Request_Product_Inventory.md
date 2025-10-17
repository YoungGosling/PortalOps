# Product Requirement Change Document: Product Inventory & Payment Register Refactor

- **Document ID:** PRD-CH-003
- **Date:** 2025-10-16
- **Version:** 1.0
- **Status:** Proposed

## 1. Introduction & Purpose

This document outlines significant changes to the PortalOps product requirements. The primary purpose of this change is to decouple product creation from billing management by introducing a new **Product Inventory** module and refining the scope of the existing **Payment Register** module. This will create a more logical and streamlined workflow for administrators.

## 2. Summary of Changes

- The **Payment Register** module will no longer support the creation of new products. Its sole function will be to manage the billing details of existing products.
- A new **Product Inventory** module will be introduced as the dedicated location for creating new products.
- The creation of a product in the Product Inventory will automatically generate a corresponding, incomplete billing record in the Payment Register.
- The definition of "complete" billing information is now stricter, requiring all four main billing fields to be filled.

## 3. Detailed Changes to Existing Modules

### 3.1. Payment Register Module

The functionality of the Payment Register page is being refined to focus exclusively on billing management.

#### 3.1.1. Removed Functionality
- The **"Add Product" button and its associated form are to be removed** from the Payment Register user interface.
- The page will no longer support the manual creation of new product/billing entries.

#### 3.1.2. Modified Functionality
- The core purpose of this page is now to **edit the billing information** for existing products.
- Users can still perform inline editing of the four billing fields: Bill Amount, Cardholder Name, Expiration Date, and Payment Method.

#### 3.1.3. Updated "Completeness" Rule
- A billing record is now considered **"complete" only if all four of the following fields are filled:**
    1.  Bill Amount
    2.  Cardholder Name
    3.  Expiration Date
    4.  Payment Method
- The UI sorting (incomplete first) and color-coding (red for incomplete, green for complete) will be updated to reflect this stricter rule.

## 4. New Module Requirements

### 4.1. Product Inventory Module

A new module will be added to handle all product creation tasks.

#### 4.1.1. Navigation
- A new navigation item labeled **"Product Inventory"** shall be added to the main sidebar.
- Access to this module will be restricted to users with `Admin` or `ServiceAdministrator` roles.

#### 4.1.2. Core Functionality: Add Product
- The module will feature a primary user interface for adding new products.
- The "Add Product" form must contain the following fields:
    - **Product Name:** (Text Input, **Required**)
    - **Product URL:** (Text Input, Optional)
    - **Service:** (Dropdown/Select Input, **Required**). This dropdown will be populated with the list of existing services in the system.

#### 4.1.3. Data Synchronization
- **Critical Requirement:** Upon the successful creation of a new product in the Product Inventory, the system **must automatically create a corresponding new entry in the Payment Register**.
- This new Payment Register entry will be initialized with an "incomplete" status, as its billing details will be empty. This ensures that every new product immediately appears in the billing workflow.

## 5. Updated User Flow

- **To Add a New Product:** A user will now navigate to the **Product Inventory** module.
- **To Update Billing Information:** A user will navigate to the **Payment Register** module to find the product and fill in its billing details.
