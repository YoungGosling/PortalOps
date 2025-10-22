# Product Requirements Document: PortalOps Feature Enhancements

## 1. Introduction

This document outlines the requirements for new features and enhancements for the PortalOps platform. The changes focus on improving user and product management by introducing a reusable component for product selection, enhancing administrative capabilities, and adding department-level product assignments.

---

## 2. Core Component: Reusable Service & Product Selection UI

### 2.1. Overview
A generic, reusable UI component will be developed to display and manage the selection of services and their associated products. This component will be used across different modules of the application where product assignment is required.

### 2.2. Functional Requirements

#### 2.2.1. Tree Structure Display
- The component shall render a list of Services in a tree-like structure.
- Each Service node can be expanded by default to show all associated Products underneath it.

#### 2.2.2. Selection Logic
- Every Service and Product in the tree shall have a checkbox next to it for selection.
- **Service Selection:** If a user clicks the checkbox for a Service, all Products listed under that Service shall also be selected (checked). Deselecting the Service will deselect all its products.
- **Product Selection:** Users shall be able to select or deselect individual Products independently. Additionally, when a user clicks the checkbox for a Service, all Products under that Service are selected. If, at this point, the user deselects a specific Product under the Service, the Service's checkbox should also be deselected, while the checkboxes for the remaining Products under the Service remain selected.
- **Deselected State:** A Service's checkbox should enter an "deselected" state if some, but not all, of its child Products are selected.

#### 2.2.3. Data Submission
- Regardless of whether a whole Service or individual Products are selected, the final data submitted from this component will be a list of the unique IDs of all selected **Products**.

---

## 3. Module: User Administration

### 3.1. Overview
Enhancements to the User Administration module will allow for more granular role assignments.

### 3.2. Functional Requirements

#### 3.2.1. "Service Admin" Role
- **Assignment:** System Administrators ("Admins") shall have the ability to assign or revoke the "Service Admin" role for any non-Admin user.
- **Restrictions:** An Admin cannot modify the roles or status of another Admin.
- **Functionality:** The "Service Admin" role is purely a descriptive label or tag. It does not grant the user any special permissions to manage or configure Services or Products.

---

## 4. Module: Employee Directory

### 4.1. Overview
The Employee Directory will be updated to display more user information and to incorporate the new product selection component for a better user experience.

### 4.2. Functional Requirements

#### 4.2.1. Enhanced User Information
- The main Employee Directory view and the individual user detail views must display the user's Position/Job Title and Hire Date. By default, each user's Resignation Date will not be shown, and the Resignation Date field will be empty.

#### 4.2.2. Product Assignment Interface
- In the "Add New User" and "Edit User" panels, the section for "Assign Products" must be replaced with the new **Reusable Service & Product Selection Component** (detailed in Section 2). This will provide a more intuitive and powerful way for Admins to manage product assignments for individual users.

---

## 5. New Module: Department Master File (Administration)

### 5.1. Overview
A new "Dept Master File" section will be added under the main "Administration" area. This module will enable Admins to manage departments and pre-assign default product sets to them.

### 5.2. Functional Requirements

#### 5.2.1. Department Grid View
- The default screen for this module shall be a table/grid that lists all available departments.
- Key information such as Department Name and ID should be displayed.

#### 5.2.2. Department-Level Product Assignment
- Admins shall have the ability to edit each department to assign a default set of products.
- The interface for assigning these products must reuse the **Reusable Service & Product Selection Component** (detailed in Section 2).

#### 5.2.3. Automatic Product Allocation for Users
- When a user is associated with a specific department, they will automatically be granted access to the products that have been pre-assigned to that department.

#### 5.2.4. Manual Override
- The automatic product allocation based on a user's department is a default setting. It **does not** prevent an Admin from manually adding or removing product assignments for that specific user via the **Employee Directory**. Any manual changes made in the Employee Directory will override the department's default product set for that individual user.
