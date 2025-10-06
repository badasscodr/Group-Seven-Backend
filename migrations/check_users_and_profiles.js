const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkUsersAndProfiles() {
  console.log('\n🔍 Checking users and client profiles...\n');
  console.log('═'.repeat(80));

  try {
    // Check users
    const users = await pool.query('SELECT "id", "email", "role", "firstName", "lastName" FROM users ORDER BY "createdAt"');
    console.log('\n📋 USERS:');
    console.log('─'.repeat(80));
    users.rows.forEach(u => {
      console.log(`${u.email} (${u.role}) - ${u.firstName} ${u.lastName} [ID: ${u.id}]`);
    });
    console.log(`\nTotal users: ${users.rows.length}`);

    // Check clientProfiles table structure
    console.log('\n\n📋 CLIENT PROFILES TABLE STRUCTURE:');
    console.log('─'.repeat(80));
    const columns = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'clientProfiles'
      ORDER BY ordinal_position
    `);

    if (columns.rows.length === 0) {
      console.log('❌ clientProfiles table does not exist!');
    } else {
      columns.rows.forEach(col => {
        console.log(`  ${col.column_name} (${col.data_type}) ${col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
    }

    // Check client profiles data
    console.log('\n\n📋 CLIENT PROFILES DATA:');
    console.log('─'.repeat(80));
    const profiles = await pool.query('SELECT * FROM "clientProfiles"');

    if (profiles.rows.length === 0) {
      console.log('⚠️  No client profiles found');
    } else {
      profiles.rows.forEach(p => {
        console.log(`User ID: ${p.userId}`);
        console.log(`  Company: ${p.companyName || 'N/A'}`);
        console.log(`  Business Type: ${p.businessType || 'N/A'}`);
        console.log(`  Address: ${p.address || 'N/A'}`);
        console.log('');
      });
    }
    console.log(`Total client profiles: ${profiles.rows.length}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersAndProfiles();
