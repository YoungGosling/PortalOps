-- Manual migration script to add url column to products table
-- Run this if alembic is not available

-- Add url column to products table
ALTER TABLE products ADD COLUMN url TEXT;

-- Optional: Add comment to document the change
COMMENT ON COLUMN products.url IS 'Product URL added for Product Inventory module';
