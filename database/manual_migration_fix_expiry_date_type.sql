-- Manual migration script to fix expiry_date column type
-- Change from VARCHAR(7) to DATE type for proper date handling

-- First, backup any existing data and convert it
-- Create a temporary column to store converted dates
ALTER TABLE payment_info ADD COLUMN expiry_date_new DATE;

-- Convert existing MM/YYYY format to proper dates (using first day of month)
UPDATE payment_info 
SET expiry_date_new = CASE 
    WHEN expiry_date IS NOT NULL AND expiry_date ~ '^\d{2}/\d{4}$' THEN
        TO_DATE(expiry_date || '/01', 'MM/YYYY/DD')
    ELSE NULL
END
WHERE expiry_date IS NOT NULL;

-- Drop the old column
ALTER TABLE payment_info DROP COLUMN expiry_date;

-- Rename the new column
ALTER TABLE payment_info RENAME COLUMN expiry_date_new TO expiry_date;

-- Add comment to document the change
COMMENT ON COLUMN payment_info.expiry_date IS 'Credit card expiry date - changed from VARCHAR(7) to DATE for proper date handling';

-- Update the schema.sql file should also be updated to reflect this change






