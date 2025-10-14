require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

async function createAdminAccount() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔧 Creating admin account...');
    
    const email = 'admin@example.com';
    const password = 'Password123';
    const firstName = 'Admin';
    const lastName = 'User';
    const role = 'admin';

    // Check if admin already exists
    const existingAdmin = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );

    if (existingAdmin.rows.length > 0) {
      console.log('⚠️ Admin account already exists. Updating password...');
      
      // Update the existing admin password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE email = $2',
        [passwordHash, email]
      );
      
      console.log('✅ Admin password updated successfully!');
    } else {
      console.log('👤 Creating new admin account...');
      
      // Hash password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);
      
      // Insert admin user
      const result = await pool.query(
        `INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active, is_email_verified, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
         RETURNING *`,
        [randomUUID(), email, passwordHash, role, firstName, lastName, true, true]
      );
      
      if (result.rows.length > 0) {
        console.log('✅ Admin account created successfully!');
      }
    }
    
    console.log('📋 Admin Credentials:');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('Role:', role);
    
  } catch (error) {
    console.error('❌ Error creating admin account:', error);
  } finally {
    await pool.end();
  }
}

createAdminAccount();