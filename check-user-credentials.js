require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.gxzdwfzjxjgqfmlzqtxz:UQz4n6vE5*Ff3@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres'
});

async function checkUserCredentials() {
  try {
    const result = await pool.query(`
      SELECT 
        u.email,
        u.role,
        u.first_name,
        u.last_name,
        u.is_active,
        u.created_at
      FROM users u 
      ORDER BY u.created_at
    `);
    
    console.log('🔐 USER CREDENTIALS AND ROLES');
    console.log('='.repeat(50));
    
    if (result.rows.length === 0) {
      console.log('❌ No users found in database');
    } else {
      result.rows.forEach((user, index) => {
        console.log(`\n${index + 1}. ${user.first_name} ${user.last_name}`);
        console.log(`   📧 Email: ${user.email}`);
        console.log(`   🔑 Role: ${user.role}`);
        console.log(`   📱 Active: ${user.is_active ? 'Yes' : 'No'}`);
        console.log(`   📅 Created: ${user.created_at}`);
        console.log(`   🔒 Default Password: Abc123!@# (for all test users)`);
      });
    }
    
    console.log('\n🎯 LOGIN CREDENTIALS SUMMARY');
    console.log('='.repeat(30));
    console.log('📧 Default Password for ALL users: Abc123!@#');
    console.log('');
    console.log('👤 ADMIN:');
    console.log('   Email: admin@g7.com');
    console.log('   Password: Abc123!@#');
    console.log('');
    console.log('👨‍💼 EMPLOYEE:');
    console.log('   Email: employee@g7.com');
    console.log('   Password: Abc123!@#');
    console.log('');
    console.log('🏢 CLIENT:');
    console.log('   Email: testclient@[timestamp]@g7.com');
    console.log('   Password: Abc123!@#');
    console.log('');
    console.log('🔧 SUPPLIER:');
    console.log('   Email: testsupplier@[timestamp]@g7.com');
    console.log('   Password: Abc123!@#');
    console.log('');
    console.log('🎓 CANDIDATE:');
    console.log('   Email: testcandidate@[timestamp]@g7.com');
    console.log('   Password: Abc123!@#');
    
  } catch (error) {
    console.error('❌ Error checking credentials:', error.message);
  } finally {
    await pool.end();
  }
}

checkUserCredentials();
