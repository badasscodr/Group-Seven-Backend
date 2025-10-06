const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function searchSpecific() {
  console.log('\n🔍 Searching for specific patterns user mentioned...\n');

  try {
    // Get ALL constraints and indexes, then filter in JavaScript
    const constraints = await pool.query(`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY conname
    `);

    const indexes = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY indexname
    `);

    console.log('📋 ALL CONSTRAINT NAMES:');
    console.log('─'.repeat(80));
    constraints.rows.forEach(r => {
      console.log(`${r.table_name} → ${r.conname}`);
    });

    console.log('\n📋 ALL INDEX NAMES:');
    console.log('─'.repeat(80));
    indexes.rows.forEach(r => {
      console.log(`${r.tablename} → ${r.indexname}`);
    });

    // Search for the specific patterns user mentioned
    const searchPatterns = ['user_id', '_user_', 'managerId', 'id_employeeProfiles'];

    console.log('\n🔍 SEARCHING FOR USER-MENTIONED PATTERNS:');
    searchPatterns.forEach(pattern => {
      const found = [];
      constraints.rows.forEach(r => {
        if (r.conname.includes(pattern)) found.push(`CONSTRAINT: ${r.table_name} → ${r.conname}`);
      });
      indexes.rows.forEach(r => {
        if (r.indexname.includes(pattern)) found.push(`INDEX: ${r.tablename} → ${r.indexname}`);
      });

      if (found.length > 0) {
        console.log(`\n  Pattern "${pattern}":`);
        found.forEach(f => console.log(`    ${f}`));
      }
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

searchSpecific();
