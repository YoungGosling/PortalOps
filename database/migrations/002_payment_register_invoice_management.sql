-- Migration: Payment Register Invoice Management
-- Date: 2025-10-20
-- Description: Implements invoice management for Payment Register with multiple file support
--
-- Changes:
-- 1. Create payment_invoices table for one-to-many relationship between payments and invoices
-- 2. Remove deprecated bill_attachment_path column from payment_info table
-- 3. Add necessary indexes and constraints

-- Step 1: Create payment_invoices table
CREATE TABLE IF NOT EXISTS payment_invoices (
    id UUID DEFAULT uuid_generate_v4() NOT NULL,
    product_id UUID NOT NULL,
    file_name TEXT NOT NULL,
    original_file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
    CONSTRAINT payment_invoices_pkey PRIMARY KEY (id),
    CONSTRAINT payment_invoices_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Step 2: Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_invoices_product_id ON payment_invoices(product_id);
CREATE INDEX IF NOT EXISTS idx_payment_invoices_created_at ON payment_invoices(created_at);

-- Step 3: Add table comment
COMMENT ON TABLE payment_invoices IS 'Invoice files associated with payment records';

-- Step 4: Add column comments
COMMENT ON COLUMN payment_invoices.id IS 'Unique identifier for the invoice record';
COMMENT ON COLUMN payment_invoices.product_id IS 'Links the invoice to a product/payment record';
COMMENT ON COLUMN payment_invoices.file_name IS 'The stored file name on disk (e.g., uuid.pdf)';
COMMENT ON COLUMN payment_invoices.original_file_name IS 'The original user-provided file name';
COMMENT ON COLUMN payment_invoices.file_path IS 'The absolute path to the file in storage';
COMMENT ON COLUMN payment_invoices.created_at IS 'Timestamp of the upload';

-- Step 5: Remove deprecated bill_attachment_path column from payment_info
-- First, check if there are any existing files that need to be migrated
-- (This would be done in a separate data migration if needed)

-- Drop the column
ALTER TABLE payment_info DROP COLUMN IF EXISTS bill_attachment_path;

-- Step 6: Add comment to payment_info table about the change
COMMENT ON TABLE payment_info IS 'Billing information for each product - invoice files now stored in payment_invoices table';
