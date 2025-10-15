const bcrypt = require('bcryptjs');
const { query } = require('./Group-Seven-Backend/dist/core/config/database');

async function createAdmin() {
  try {
    console.log('🔧 Creating admin user...');
    
    // Check if admin exists
    const existingAdmin = await query('SELECT * FROM users WHERE email = $1', ['admin@g7.com']);
    
    if (existingAdmin.rows.length === 0) {
      console.log('Creating new admin user...');
      const passwordHash = await bcrypt.hash('admin123', 12);
      
      const result = await query(
        'INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active, is_email_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, email, role',
        ['admin@g7.com', passwordHash, 'admin', 'Admin', 'User', '1234567890', true, true]
      );
      
      console.log('✅ Admin created:', result.rows[0]);
      
      // Create employee profile for admin
      await query(
        'INSERT INTO employee_profiles (user_id, employee_id, department, position, hire_date, salary, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
        [result.rows[0].id, 'ADMIN001', 'Administration', 'System Administrator', 100000]
      );
      
      console.log('✅ Admin employee profile created');
    } else {
      console.log('ℹ️ Admin already exists:', existingAdmin.rows[0].email);
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createAdmin();
