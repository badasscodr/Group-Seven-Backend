-- =====================================================
-- CREATE ADMIN USER
-- =====================================================

-- First, check if admin user already exists
DO $$
BEGIN
    -- Insert admin user into users table
    INSERT INTO users (
        id,
        email,
        password_hash,
        role,
        first_name,
        last_name,
        phone,
        avatar_url,
        is_active,
        is_email_verified,
        created_at,
        updated_at
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'admin@g7.com',
        '$2b$12$LQAv3Lw9zmGFbAWnJ5I8y0s7F9pL6wG9Ndmv4hvtZT2Zr5BcG',
        'admin',
        'Admin',
        'User',
        '+1234567890',
        NULL,
        true,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Insert admin profile into appropriate tables
    INSERT INTO employee_profiles (
        user_id,
        employee_id,
        department,
        position,
        hire_date,
        salary,
        created_at,
        updated_at
    ) VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'EMP001',
        'Administration',
        'System Administrator',
        CURRENT_DATE,
        75000.00,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Admin user created/updated successfully: admin@g7.com';
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Admin user already exists: admin@g7.com';
END;
$$;
$$