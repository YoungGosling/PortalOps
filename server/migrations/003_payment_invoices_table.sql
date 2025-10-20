-- Migration: Add payment_invoices table for invoice management
-- This migration adds the payment_invoices table as specified in the feature requirements

-- Create payment_invoices table
CREATE TABLE IF NOT EXISTS payment_invoices (
    id uuid DEFAULT uuid_generate_v4() NOT NULL,
    product_id uuid NOT NULL,
    file_name text NOT NULL,
    original_file_name text NOT NULL,
    file_path text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT payment_invoices_pkey PRIMARY KEY (id),
    CONSTRAINT payment_invoices_product_id_fkey FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_payment_invoices_product_id ON payment_invoices USING btree (product_id);
CREATE INDEX IF NOT EXISTS idx_payment_invoices_created_at ON payment_invoices USING btree (created_at);

-- Add comments
COMMENT ON TABLE payment_invoices IS 'Invoice files associated with payment records';
COMMENT ON COLUMN payment_invoices.id IS 'Unique identifier for the invoice record';
COMMENT ON COLUMN payment_invoices.product_id IS 'Links the invoice to a product/payment record';
COMMENT ON COLUMN payment_invoices.file_name IS 'The stored file name on disk (e.g., uuid.pdf)';
COMMENT ON COLUMN payment_invoices.original_file_name IS 'The original user-provided file name';
COMMENT ON COLUMN payment_invoices.file_path IS 'The absolute path to the file in storage';
COMMENT ON COLUMN payment_invoices.created_at IS 'Timestamp of the upload';
