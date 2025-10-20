-- Migration: Add azure_id column to users table for Azure AD authentication
-- Date: 2025-10-20
-- Description: Adds azure_id column to support Azure AD single sign-on

-- Add azure_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS azure_id VARCHAR(255) UNIQUE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_users_azure_id ON users(azure_id);

-- Add comment
COMMENT ON COLUMN users.azure_id IS 'Azure AD Object ID (oid) for SSO authentication';

