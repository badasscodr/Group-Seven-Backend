-- =====================================================
-- FIX PASSWORD HASHES FOR ADMIN AND EMPLOYEE
-- =====================================================

-- Generate correct hash for "Abc123!@#" using bcrypt
-- The correct hash is: $2b$12$3WIFqGvQ5MiUco5JZT3ruuP7rjbH.4msZdPynOth1ZBp/CKa4Gele

-- Update admin user password hash
UPDATE users 
SET password_hash = '$2b$12$3WIFqGvQ5MiUco5JZT3ruuP7rjbH.4msZdPynOth1ZBp/CKa4Gele', 
    updated_at = CURRENT_TIMESTAMP 
WHERE email = 'admin@g7.com';

-- Update employee user password hash
UPDATE users 
SET password_hash = '$2b$12$3WIFqGvQ5MiUco5JZT3ruuP7rjbH.4msZdPynOth1ZBp/CKa4Gele', 
    updated_at = CURRENT_TIMESTAMP 
WHERE email = 'employee@g7.com';

-- Verify the update
SELECT 
    email,
    role,
    first_name || ' ' || last_name as full_name,
    password_hash,
    created_at,
    updated_at
FROM users 
WHERE email IN ('admin@g7.com', 'employee@g7.com')
ORDER BY role;

-- =====================================================
-- TEST SQL (Copy and paste this to test)
-- =====================================================

-- To test the hash, you can use this in a SQL editor or psql:
-- SELECT crypt('Abc123!@#', '$2b$12$3WIFqGvQ5MiUco5JZT3ruuP7rjbH.4msZdPynOth1ZBp/CKa4Gele');

-- Expected result: true