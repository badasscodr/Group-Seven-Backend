const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function listRemaining() {
  try {
    const result = await pool.query(`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint
      WHERE conrelid::regclass::text IN ('quotations', 'payments', 'interviews', 'attendance', 'documents', 'messages', 'notifications', 'projects', 'users')
      ORDER BY table_name, conname
    `);

    console.log('\n📋 Actual constraint names:\n');
    result.rows.forEach(row => {
      console.log(`ALTER TABLE ${row.table_name} RENAME CONSTRAINT "${row.conname}" TO "...";`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

listRemaining();
