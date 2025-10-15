const { query } = require('./dist/core/config/database');

async function checkDatabaseSchema() {
  try {
    console.log('🔍 Checking database schema...');
    
    // Check if employee_profiles table exists
    const tableResult = await query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'employee_profiles'"
    );
    
    console.log('employee_profiles table exists:', tableResult.rows.length > 0);
    
    if (tableResult.rows.length > 0) {
      console.log('✅ Table found');
      
      // Check if there are any employee profiles
      const profileCount = await query('SELECT COUNT(*) as count FROM employee_profiles');
      console.log('Number of employee profiles:', profileCount.rows[0].count);
      
      // Show structure of employee_profiles table
      const columns = await query(
        "SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'employee_profiles' ORDER BY ordinal_position"
      );
      console.log('\n📋 employee_profiles table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
      
      // Check if there are any users with employee role
      const employeeUsers = await query("SELECT id, email, first_name, last_name FROM users WHERE role = 'employee'");
      console.log('\n👥 Users with employee role:', employeeUsers.rows.length);
      if (employeeUsers.rows.length > 0) {
        employeeUsers.rows.forEach(emp => {
          console.log(`  - ${emp.email} (${emp.first_name} ${emp.last_name})`);
        });
      }
      
    } else {
      console.log('❌ Table NOT found - need to run migration');
      console.log('🔧 Running migration script...');
      
      // Try to run the migration
      const fs = require('fs');
      const path = require('path');
      
      const migrationPath = path.join(__dirname, 'Group-Seven-Backend', 'migrations', '002_enhanced_schema.sql');
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      await query(migrationSQL);
      console.log('✅ Migration completed successfully');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkDatabaseSchema();
