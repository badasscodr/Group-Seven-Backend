const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function listConstraints() {
  console.log('\n📋 Listing ALL actual constraint names...\n');

  try {
    const constraints = await pool.query(`
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        contype AS constraint_type
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY table_name, constraint_name
    `);

    console.log('-- ACTUAL CONSTRAINT NAMES IN DATABASE:');
    console.log('-- ═'.repeat(40));
    constraints.rows.forEach(row => {
      const type = {
        'p': 'PRIMARY KEY',
        'f': 'FOREIGN KEY',
        'u': 'UNIQUE',
        'c': 'CHECK'
      }[row.constraint_type] || row.constraint_type;
      console.log(`-- ${row.table_name.padEnd(30)} | ${type.padEnd(15)} | ${row.constraint_name}`);
    });

    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

listConstraints();
