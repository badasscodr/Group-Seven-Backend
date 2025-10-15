-- =====================================================
-- CREATE EMPLOYEE USER
-- =====================================================

-- First, check if employee user already exists
DO $$
BEGIN
    -- Insert employee user into users table
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
        '550e8400-e29b-41d4-a716-446655440001',
        'employee@g7.com',
        '$2b$12$LQAv3Lw9zmGFbAWnJ5I8y0s7F9pL6wG9Ndmv4hvtZT2Zr5BcG',
        'employee',
        'Employee',
        'User',
        '+1234567891',
        NULL,
        true,
        true,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (id) DO NOTHING;
    
    -- Insert employee profile into appropriate tables
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
        '550e8400-e29b-41d4-a716-446655440001',
        'EMP002',
        'Operations',
        'General Employee',
        CURRENT_DATE,
        45000.00,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    ) ON CONFLICT (user_id) DO NOTHING;
    
    RAISE NOTICE 'Employee user created/updated successfully: employee@g7.com';
EXCEPTION
    WHEN unique_violation THEN
        RAISE NOTICE 'Employee user already exists: employee@g7.com';
END;
$$;
$$