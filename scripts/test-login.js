require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

async function testLogin() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const email = 'supplier@example.com';
    const password = 'password123'; // Assuming this was the password used

    console.log('🔐 Testing login process...');
    
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
    
    // Step 3: Test JWT generation
    console.log('🎟️ Testing JWT generation...');
    const { JwtUtils } = require('../dist/modules/core/utils/jwt');
    
    try {
      const tokens = JwtUtils.generateTokens(
        user.id,
        user.email,
        user.role,
        user.first_name,
        user.last_name
      );
      console.log('✅ JWT tokens generated successfully');
      console.log('Access token length:', tokens.accessToken.length);
      console.log('Refresh token length:', tokens.refreshToken.length);
    } catch (jwtError) {
      console.error('❌ JWT generation failed:', jwtError);
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  } finally {
    await pool.end();
  }
}

testLogin();