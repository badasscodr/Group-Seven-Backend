const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : false,
});

async function fixPasswordHashes() {
  console.log('🔧 Fixing password hashes for admin and employee users...');
  
  try {
    const passwordHash = '$2b$12$3WIFqGvQ5MiUco5JZT3ruuP7rjbH.4msZdPynOth1ZBp/CKa4Gele';
    
    // Update admin user password hash
    console.log('✅ Updating admin user...');
    const adminResult = await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE email = 'admin@g7.com'
      RETURNING email, role, updated_at
    `, [passwordHash]);
    
    console.log('✅ Admin updated:', adminResult.rows[0]);
    
    // Update employee user password hash
    console.log('✅ Updating employee user...');
    const employeeResult = await pool.query(`
      UPDATE users 
      SET password_hash = $1, updated_at = CURRENT_TIMESTAMP 
      WHERE email = 'employee@g7.com'
      RETURNING email, role, updated_at
    `, [passwordHash]);
    
    console.log('✅ Employee updated:', employeeResult.rows[0]);
    
    // Verify the update
    console.log('\n✅ Password hashes fixed successfully!');
    console.log('\n📋 Updated Users:');
    [adminResult.rows[0], employeeResult.rows[0]].forEach(user => {
      console.log(`  📧 ${user.email}`);
      console.log(`  👤 ${user.role}`);
      console.log(`  📅 Updated: ${user.updated_at.toISOString()}`);
      console.log('');
    });

    console.log('\n🔐 Login Credentials:');
    console.log('  Admin: admin@g7.com | Abc123!@#');
    console.log('  Employee: employee@g7.com | Abc123!@#');

  } catch (error) {
    console.error('❌ Error fixing password hashes:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

fixPasswordHashes().catch(console.error);