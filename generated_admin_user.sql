-- Create Admin User with Email/Password Authentication
-- Email: admin@portalops.com
-- Password: password

DO $$
DECLARE
    v_admin_email TEXT := 'admin@portalops.com';
    v_user_id UUID;
BEGIN
    -- 1. Check if the user already exists
    SELECT id INTO v_user_id FROM users WHERE email = v_admin_email LIMIT 1;

    IF v_user_id IS NOT NULL THEN
        -- Update existing user
        UPDATE users SET
            password_hash = '$2b$12$L8dgnADIiTx2EBAONTu30ObPsqWxjAIFVL5y/DnYKLbmPQO3fTseG',
            updated_at = NOW()
        WHERE id = v_user_id;
    ELSE
        -- Insert new user
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
            v_admin_email,
            '$2b$12$L8dgnADIiTx2EBAONTu30ObPsqWxjAIFVL5y/DnYKLbmPQO3fTseG',
            'IT Department',
            'System Administrator',
            CURRENT_DATE,
            NULL,
            NOW(),
            NOW()
        ) RETURNING id INTO v_user_id;
    END IF;

    -- 2. Assign Admin role
    -- Note: user_roles has a primary key (user_id, role_id) so ON CONFLICT works here
    INSERT INTO user_roles (user_id, role_id)
    SELECT v_user_id, r.id
    FROM roles r
    WHERE r.name = 'Admin'
    ON CONFLICT (user_id, role_id) DO NOTHING;
    
END $$;

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
