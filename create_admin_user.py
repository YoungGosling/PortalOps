#!/usr/bin/env python3
"""
Generate correct bcrypt hash for admin user creation
Run this script to generate the SQL with correct password hash
"""
from server.app.core.security import get_password_hash
import sys
import os

# Add the server directory to the path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'server'))


def generate_admin_sql(password: str = "password"):
    """Generate SQL to create admin user with proper bcrypt hash"""

    password_hash = get_password_hash(password)

    sql = f"""-- Create Admin User with Email/Password Authentication
-- Email: admin@portalops.com
-- Password: {password}

-- Step 1: Insert Admin user
INSERT INTO users (
    id,
    name,
    email,
    password_hash,
    department,
    position,
    hire_date,
    azure_id,
    created_at,
    updated_at
) VALUES (
    gen_random_uuid(),
    'System Administrator',
    'admin@portalops.com',
    '{password_hash}',
    'IT Department',
    'System Administrator',
    CURRENT_DATE,
    NULL,
    NOW(),
    NOW()
)
ON CONFLICT (email) DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    updated_at = NOW();

-- Step 2: Assign Admin role
WITH admin_user AS (
    SELECT id FROM users WHERE email = 'admin@portalops.com'
),
admin_role AS (
    SELECT id FROM roles WHERE name = 'Admin'
)
INSERT INTO user_roles (user_id, role_id)
SELECT admin_user.id, admin_role.id
FROM admin_user, admin_role
ON CONFLICT (user_id, role_id) DO NOTHING;

-- Step 3: Verify the user was created correctly
SELECT 
    u.id,
    u.name,
    u.email,
    u.department,
    u.position,
    u.password_hash IS NOT NULL AS has_password,
    u.azure_id IS NULL AS is_local_user,
    r.name AS role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@portalops.com';
"""

    return sql


if __name__ == "__main__":
    # Allow custom password via command line argument
    password = sys.argv[1] if len(sys.argv) > 1 else "password"

    print("=" * 80)
    print("ADMIN USER CREATION SQL")
    print("=" * 80)
    print(generate_admin_sql(password))
    print("\n" + "=" * 80)
    print("USAGE:")
    print("  1. Copy the SQL above")
    print("  2. Connect to your PostgreSQL database")
    print("  3. Execute the SQL")
    print("  4. Login with admin@portalops.com / password")
    print("=" * 80)
