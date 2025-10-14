require('dotenv').config();
const { Pool } = require('pg');

async function debugUsers() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔍 Checking users table...');
    
    // Check table structure
    const structureResult = await pool.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('📋 Table structure:');
    structureResult.rows.forEach(row => {
      console.log(`  ${row.column_name}: ${row.data_type} (${row.is_nullable})`);
    });

    // Check all users
    const usersResult = await pool.query('SELECT * FROM users LIMIT 5');
    
    console.log('\n👥 Users in database:');
    if (usersResult.rows.length === 0) {
      console.log('  No users found');
    } else {
      usersResult.rows.forEach((user, index) => {
        console.log(`  User ${index + 1}:`);
        console.log(`    ID: ${user.id}`);
        console.log(`    Email: ${user.email}`);
        console.log(`    Role: ${user.role}`);
        console.log(`    First Name: ${user.first_name}`);
        console.log(`    Last Name: ${user.last_name}`);
        console.log(`    Active: ${user.is_active}`);
        console.log(`    Created: ${user.created_at}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ Debug error:', error);
  } finally {
    await pool.end();
  }
}

debugUsers();