import pool from '../core/config/database';
import { hashPassword } from '../core/utils/bcrypt';

async function createTestAdmin() {
  try {
    const email = 'testadmin@test.com';
    const password = 'Test123!@#';

    // Hash the password
    const passwordHash = await hashPassword(password);

    // Check if user already exists
    const checkQuery = 'SELECT id FROM users WHERE email = $1';
    const existingUser = await pool.query(checkQuery, [email]);

    if (existingUser.rows.length > 0) {
      // Update password
      const updateQuery = 'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING id, email, role';
      const result = await pool.query(updateQuery, [passwordHash, email]);
      console.log('✅ Updated existing test admin user');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${result.rows[0].role}`);
    } else {
      // Create new user
      const insertQuery = `
        INSERT INTO users (email, password_hash, role, first_name, last_name, is_active)
        VALUES ($1, $2, 'admin', 'Test', 'Admin', true)
        RETURNING id, email, role
      `;
      const result = await pool.query(insertQuery, [email, passwordHash]);
      console.log('✅ Created new test admin user');
      console.log(`   Email: ${result.rows[0].email}`);
      console.log(`   Password: ${password}`);
      console.log(`   Role: ${result.rows[0].role}`);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  }
}

createTestAdmin();
