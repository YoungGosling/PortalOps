-- Add evanzhang@dynasys.com.hk as Admin user
-- This script creates the user if not exists and assigns Admin role

-- Check if user exists, if not create it
DO $$
DECLARE
    user_uuid UUID;
BEGIN
    -- Try to find existing user
    SELECT id INTO user_uuid FROM users WHERE email = 'evanzhang@dynasys.com.hk';
    
    IF user_uuid IS NULL THEN
        -- User doesn't exist, create new user
        INSERT INTO users (id, name, email, password_hash, department)
        VALUES (
            '550e8400-e29b-41d4-a716-446655440010',
            'Evan Zhang',
            'evanzhang@dynasys.com.hk',
            NULL,  -- NULL password_hash means this is an Azure AD user
            'IT'
        )
        RETURNING id INTO user_uuid;
        
        RAISE NOTICE 'Created new user: evanzhang@dynasys.com.hk with UUID: %', user_uuid;
    ELSE
        RAISE NOTICE 'User already exists: evanzhang@dynasys.com.hk with UUID: %', user_uuid;
    END IF;
    
    -- Check if user already has Admin role
    IF NOT EXISTS (
        SELECT 1 FROM user_roles 
        WHERE user_id = user_uuid AND role_id = 1
    ) THEN
        -- Assign Admin role (role_id = 1)
        INSERT INTO user_roles (user_id, role_id)
        VALUES (user_uuid, 1);
        
        RAISE NOTICE 'Assigned Admin role to evanzhang@dynasys.com.hk';
    ELSE
        RAISE NOTICE 'User already has Admin role';
    END IF;
    
    -- Insert audit log for this action
    INSERT INTO audit_logs (actor_user_id, action, target_id, details)
    VALUES (
        user_uuid,
        'user.role.assign',
        user_uuid::text,
        jsonb_build_object(
            'role', 'Admin',
            'assigned_at', now()::text,
            'assigned_by', 'system_migration'
        )
    );
    
END $$;

-- Verify the assignment
SELECT 
    u.id,
    u.name,
    u.email,
    u.department,
    r.name as role
FROM users u
LEFT JOIN user_roles ur ON u.id = ur.user_id
LEFT JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'evanzhang@dynasys.com.hk';

