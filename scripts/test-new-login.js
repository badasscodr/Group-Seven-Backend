require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function testNewLogin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const email = 'testsupplier@example.com';
    const password = 'test123456';

    console.log('🔐 Testing login with new user...');
    
    // Step 1: Find user
    const userResult = await pool.query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (userResult.rows.length === 0) {
      console.log('❌ User not found');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found:', user.email, 'Role:', user.role);
    
    // Step 2: Test password validation
    console.log('🔑 Testing password validation...');
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('❌ Invalid password');
      return;
    }
    
    console.log('✅ Login test passed! You can now login with:');
    console.log('Email:', email);
    console.log('Password:', password);
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await pool.end();
  }
}

testNewLogin();