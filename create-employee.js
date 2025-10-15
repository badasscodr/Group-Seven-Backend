const { query } = require('./Group-Seven-Backend/dist/core/config/database');

async function createEmployeeUser() {
  try {
    console.log('🔍 Checking existing employee users...');
    
    // Check existing users
    const users = await query('SELECT id, email, role, first_name, last_name FROM users WHERE role = $1', ['employee']);
    console.log('Existing employee users:', users.rows.length);
    
    if (users.rows.length === 0) {
      console.log('Creating employee user...');
      const bcrypt = require('bcryptjs');
      const passwordHash = await bcrypt.hash('password123', 12);
      
      const result = await query(
        'INSERT INTO users (email, password_hash, role, first_name, last_name, phone, is_active, is_email_verified, created_at, updated_at) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP) RETURNING id, email, role',
        ['employee@g7.com', passwordHash, 'employee', 'John', 'Doe', '1234567890', true, true]
      );
      
      console.log('✅ Employee user created:', result.rows[0]);
      
      // Check if employee_profiles table exists
      const tableCheck = await query(
        "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_profiles'"
      );
      
      if (tableCheck.rows.length > 0) {
        console.log('✅ employee_profiles table exists');
        
        // Create employee profile
        await query(
          'INSERT INTO employee_profiles (user_id, employee_id, department, position, hire_date, salary, created_at, updated_at) VALUES ($1, $2, $3, $4, CURRENT_DATE, $5, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)',
          [result.rows[0].id, 'EMP001', 'Engineering', 'Developer', 60000]
        );
        
        console.log('✅ Employee profile created');
      } else {
        console.log('❌ employee_profiles table does not exist - need to run migration');
      }
      
    } else {
      console.log('Employee users found:');
      users.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name} ${user.last_name})`);
      });
      
      // Check if they have profiles
      for (const user of users.rows) {
        const profileCheck = await query('SELECT * FROM employee_profiles WHERE user_id = $1', [user.id]);
        if (profileCheck.rows.length > 0) {
          console.log(`✅ Profile exists for ${user.email}`);
        } else {
          console.log(`❌ No profile found for ${user.email}`);
        }
      }
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

createEmployeeUser();
