const { query } = require('../src/core/config/database');

async function createUsers() {
  console.log('🚀 Creating admin and employee users...');
  
  try {
    // Check if users already exist first
    const checkQuery = `
      SELECT id, email, role FROM users 
      WHERE email IN ('admin@g7.com', 'employee@g7.com')
    `;
    
    const existingUsers = await query(checkQuery);
    const existingEmails = existingUsers.rows.map(row => row.email);
    
    // Create admin user
    if (!existingEmails.includes('admin@g7.com')) {
      console.log('✅ Creating admin user...');
      
      const adminQuery = `INSERT INTO users (
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
      )`;
      
      await query(adminQuery);
      
      // Create admin profile
      const adminProfileQuery = `INSERT INTO employee_profiles (
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
      )`;
      
      await query(adminProfileQuery);
      console.log('✅ Admin user created: admin@g7.com');
    } else {
      console.log('ℹ️ Admin user already exists: admin@g7.com');
    }

    // Create employee user
    if (!existingEmails.includes('employee@g7.com')) {
      console.log('✅ Creating employee user...');
      
      const employeeQuery = `INSERT INTO users (
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
      )`;
      
      await query(employeeQuery);
      
      // Create employee profile
      const employeeProfileQuery = `INSERT INTO employee_profiles (
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
      )`;
      
      await query(employeeProfileQuery);
      console.log('✅ Employee user created: employee@g7.com');
    } else {
      console.log('ℹ️ Employee user already exists: employee@g7.com');
    }

    // Verify users were created
    const verifyQuery = `SELECT 
      email,
      role,
      first_name || ' ' || last_name as full_name,
      is_active,
      created_at
      FROM users 
      WHERE email IN ('admin@g7.com', 'employee@g7.com')
      ORDER BY role`;

    const result = await query(verifyQuery);
    
    console.log('\n✅ Users created successfully!');
    console.log('\n📋 Created Users:');
    result.rows.forEach(user => {
      console.log(`  📧 ${user.email}`);
      console.log(`  👤 ${user.full_name} (${user.role})`);
      console.log(`  ✅ Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log(`  📅 Created: ${user.created_at.toISOString()}`);
      console.log('');
    });

    console.log('\n🔐 Login Credentials:');
    console.log('  Admin: admin@g7.com | Abc123!@#');
    console.log('  Employee: employee@g7.com | Abc123!@#');

  } catch (error) {
    console.error('❌ Error creating users:', error.message);
    throw error;
  }
}

// Run the function
if (require.main === module) {
  createUsers().catch(console.error);
}