# Feature Specification: Payment Register Invoice Management

**Version:** 1.0  
**Author:** Gemini  
**Date:** 2025-10-20  
**Status:** Proposal  

## 1. Overview

This document outlines the requirements for enhancing the **Payment Register** module. The primary goal is to introduce a mandatory invoice upload feature, allowing multiple documents to be associated with each payment record. Additionally, a new read-only **Master Files** view will be created for administrators to review all uploaded invoices across the system.

## 2. Background

Currently, the Payment Register captures essential payment details but lacks a mechanism to store proof of payment, such as invoices or receipts. This enhancement will bridge that gap by providing a robust file management system for each transaction, improving auditability and record-keeping. The existing `payment_info` table with a single `bill_attachment_path` is insufficient for handling multiple files and will be replaced by a more scalable solution.

## 3. Detailed Requirements

### 3.1. Payment Register UI & Functional Changes

1.  **New "Invoice" Field**:
    *   A new field/section labeled "Invoice" shall be added to the Payment Register form.
    *   This section will feature a modern, multi-file upload component (e.g., a drag-and-drop area).

2.  **Mandatory Fields**:
    *   All five fields are now mandatory for saving a payment record:
        1.  Amount
        2.  Cardholder Name
        3.  Expiry Date
        4.  Payment Method
        5.  **Invoice** (at least one file must be uploaded).

3.  **File Handling**:
    *   The system must support uploading multiple files, primarily in PDF format, though other common document types should not be restricted.
    *   Upon successful upload, a list of uploaded files will be displayed within the form.
    *   Each listed file must have two actions available:
        *   **Preview**: A button or link to open the file in a new browser tab.
        *   **Delete**: An icon or button to remove the file from the payment record. This action should prompt the user for confirmation.

### 3.2. ADMINISTRATION > Master Files (Invoice Viewer)

1.  **New Read-Only View**:
    *   A new page will be created under `ADMINISTRATION > Master Files`.
    *   This page will display a comprehensive list of all invoice files uploaded through the Payment Register.

2.  **Display & Filtering**:
    *   The view will be a table with columns such as `File Name`, `Original File Name`, `Associated Product`, and `Upload Date`.
    *   A filter control (e.g., a dropdown or searchable input) must be provided to allow administrators to filter the displayed files by **Product**.

3.  **Permissions**:
    *   This view is strictly **read-only**. Administrators can view and download files but cannot upload, modify, or delete any files from this interface.

### 3.3. File Storage

1.  **Storage Location**:
    *   All uploaded invoice files will be stored on the server in a directory named `bills`.
    *   This directory will be located at `/home/evanzhang/EnterpriseProjects/PortalOpsStorage/bills/`, which is outside the main project directory.

2.  **File Naming Convention**:
    *   To prevent file name collisions, a secure naming convention must be used. Recommended format: `{uuid}_{original_filename}`.

## 4. Proposed Technical Implementation

### 4.1. Database Schema Changes

The existing `payment_info.bill_attachment_path` column is deprecated and should be removed. A new table is required to manage the one-to-many relationship between payment records and invoices.

**New Table: `payment_invoices`**

| Column Name        | Data Type            | Constraints                                       | Description                                      |
| ------------------ | -------------------- | ------------------------------------------------- | ------------------------------------------------ |
| `id`               | `uuid`               | `PRIMARY KEY`, `DEFAULT uuid_generate_v4()`       | Unique identifier for the invoice record.        |
| `product_id`       | `uuid`               | `NOT NULL`, `FOREIGN KEY (products.id)`           | Links the invoice to a product/payment record.   |
| `file_name`        | `text`               | `NOT NULL`                                        | The stored file name on disk (e.g., uuid.pdf).   |
| `original_file_name` | `text`               | `NOT NULL`                                        | The original user-provided file name.            |
| `file_path`        | `text`               | `NOT NULL`                                        | The absolute path to the file in storage.        |
| `created_at`       | `timestamp with time zone` | `NOT NULL`, `DEFAULT now()`                       | Timestamp of the upload.                         |

### 4.2. API Endpoint Adjustments (v2)

The following changes and additions to the API are proposed to support this feature.

**New Endpoints:**

*   **`POST /api/v2/payment-register/{productId}/invoices`**
    *   **Description**: Uploads one or more invoice files for a specific product's payment record.
    *   **Request**: `multipart/form-data`.
    *   **Action**: Saves files to the designated storage directory and creates corresponding entries in the `payment_invoices` table.

*   **`DELETE /api/v2/invoices/{invoiceId}`**
    *   **Description**: Deletes a specific invoice file.
    *   **Action**: Removes the record from the `payment_invoices` table and deletes the corresponding file from the file system.

*   **`GET /api/v2/invoices/{invoiceId}`**
    *   **Description**: Retrieves a specific invoice file for preview or download.
    *   **Action**: Returns the file with the appropriate `Content-Type` header.

*   **`GET /api/v2/master-files/invoices`**
    *   **Description**: Retrieves a list of all invoice records for the Master Files view.
    *   **Query Params**: `?productId={uuid}` (optional) to filter results by product.
    *   **Response**: An array of invoice metadata objects.

**Modified Endpoints:**

*   **`GET /api/v2/payment-register`**
    *   **Description**: The response payload for each payment record must be updated.
    *   **Change**: Instead of `bill_attachment_path`, include a new array field `invoices`.
    *   **Example Snippet**:
        ```json
        {
          "product_id": "...",
          "amount": "1500.00",
          // ... other fields
          "invoices": [
            {
              "id": "invoice-uuid-1",
              "original_file_name": "invoice-q4.pdf",
              "url": "/api/v2/invoices/invoice-uuid-1"
            }
          ]
        }
        ```

*   **`PUT /api/v2/payment-register/{productId}`**
    *   **Description**: This endpoint will now only handle updates to the core payment fields (Amount, Name, etc.). Invoice management is delegated to the new dedicated endpoints.
