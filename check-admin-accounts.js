/**
 * Check existing admin accounts and create one if needed
 */

require('dotenv').config();
const { query } = require('./dist/core/config/database');

async function checkAdminAccounts() {
  try {
    console.log('🔍 Checking existing admin accounts...');
    
    // Check all users with admin role
    const adminUsers = await query(`
      SELECT id, email, first_name, last_name, role, is_active, created_at 
      FROM users 
      WHERE role = 'admin' 
      ORDER BY created_at DESC
    `);
    
    console.log(`📊 Found ${adminUsers.rows.length} admin users:`);
    
    if (adminUsers.rows.length === 0) {
      console.log('❌ No admin accounts found!');
      
      // Check all users to see what exists
      const allUsers = await query(`
        SELECT id, email, first_name, last_name, role, is_active, created_at 
        FROM users 
        ORDER BY created_at DESC
        LIMIT 10
      `);
      
      console.log(`📋 All users in database (${allUsers.rows.length}):`);
      allUsers.rows.forEach(user => {
        console.log(`   - ${user.email} (${user.role}) - Active: ${user.is_active}`);
      });
      
      // Create a default admin account
      console.log('\n🔧 Creating default admin account...');
      
      const hashedPassword = '$2b$10$rOzJqQjQjQjQjQjQjQjQjOzJqQjQjQjQjQjQjQjQjQjQjQjQjQjQjQjQ'; // This is a hash for 'Admin@123456'
      
      const newAdmin = await query(`
        INSERT INTO users (email, password_hash, first_name, last_name, role, is_active, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())
        RETURNING id, email, first_name, last_name, role
      `, [
        'admin@gsiprojects.com',
        hashedPassword,
        'System',
        'Administrator',
        'admin',
        true
      ]);
      
      console.log('✅ Admin account created successfully!');
      console.log(`   Email: admin@gsiprojects.com`);
      console.log(`   Password: Admin@123456`);
      console.log(`   Name: ${newAdmin.rows[0].first_name} ${newAdmin.rows[0].last_name}`);
      
    } else {
      console.log('✅ Existing admin accounts:');
      adminUsers.rows.forEach(admin => {
        console.log(`   - ${admin.email} (${admin.first_name} ${admin.last_name}) - Active: ${admin.is_active}`);
        console.log(`     Created: ${admin.created_at}`);
      });
    }
    
    // Test login with the first admin account
    if (adminUsers.rows.length > 0) {
      console.log('\n🔐 Testing admin login...');
      
      const testResponse = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: adminUsers.rows[0].email,
          password: 'Admin@123456' // Try common password
        })
      });
      
      if (testResponse.ok) {
        const loginData = await testResponse.json();
        console.log('✅ Login successful!');
        console.log(`   Token: ${loginData.data?.accessToken ? 'Received' : 'Not received'}`);
      } else {
        const errorData = await testResponse.json();
        console.log(`❌ Login failed: ${errorData.error?.message || 'Unknown error'}`);
        console.log('   You may need to reset the admin password');
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking admin accounts:', error);
  } finally {
    process.exit(0);
  }
}

checkAdminAccounts();
