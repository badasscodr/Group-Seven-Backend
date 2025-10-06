const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkConstraints() {
  console.log('\n🔍 Checking database constraints and indexes...\n');

  try {
    // Check all constraints
    const constraints = await pool.query(`
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        contype AS constraint_type
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY table_name, constraint_name
    `);

    console.log('📋 CONSTRAINTS:');
    console.log('═'.repeat(80));
    constraints.rows.forEach(row => {
      const type = {
        'p': 'PRIMARY KEY',
        'f': 'FOREIGN KEY',
        'u': 'UNIQUE',
        'c': 'CHECK'
      }[row.constraint_type] || row.constraint_type;
      console.log(`${row.table_name.padEnd(30)} | ${type.padEnd(15)} | ${row.constraint_name}`);
    });

    // Check all indexes
    const indexes = await pool.query(`
      SELECT
        indexname,
        tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    console.log('\n📋 INDEXES:');
    console.log('═'.repeat(80));
    indexes.rows.forEach(row => {
      console.log(`${row.tablename.padEnd(30)} | ${row.indexname}`);
    });

    console.log('\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkConstraints();
