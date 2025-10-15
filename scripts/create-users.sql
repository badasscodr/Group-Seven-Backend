-- =====================================================
-- CREATE ADMIN USER
-- =====================================================

-- Create admin user
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

-- Create admin employee profile
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

-- =====================================================
-- CREATE EMPLOYEE USER
-- =====================================================

-- Create employee user
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

-- Create employee profile
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

-- =====================================================
-- VERIFY USERS CREATED
-- =====================================================

SELECT 
    email,
    role,
    first_name || ' ' || last_name as full_name,
    is_active,
    created_at
FROM users 
WHERE email IN ('admin@g7.com', 'employee@g7.com')
ORDER BY role;