require('dotenv').config();
const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
const { randomUUID } = require('crypto');

async function createTestUser() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    const email = 'testsupplier@example.com';
    const password = 'test123456';
    const firstName = 'Test';
    const lastName = 'Supplier';
    const role = 'supplier';

    console.log('👤 Creating test user...');
    
    // Hash password
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Insert user
    const result = await pool.query(
      `INSERT INTO users (id, email, password_hash, role, first_name, last_name, is_active, is_email_verified, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       RETURNING *`,
      [randomUUID(), email, passwordHash, role, firstName, lastName, true, false]
    );
    
    if (result.rows.length > 0) {
      console.log('✅ Test user created successfully!');
      console.log('Email:', email);
      console.log('Password:', password);
      console.log('Role:', role);
    }
    
  } catch (error) {
    console.error('❌ Error creating test user:', error);
  } finally {
    await pool.end();
  }
}

createTestUser();