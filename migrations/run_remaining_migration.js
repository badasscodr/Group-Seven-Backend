const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runRemaining() {
  console.log('\n🔄 Running remaining constraints rename migration...\n');

  try {
    const migrationPath = path.join(__dirname, '015_rename_remaining_constraints.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing migration...\n');

    await pool.query(sql);

    console.log('✅ All remaining constraints and indexes renamed!\n');

    // Verify
    const result = await pool.query(`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      AND conname LIKE '%\\_%' ESCAPE '\\'
      ORDER BY table_name, conname
      LIMIT 10
    `);

    if (result.rows.length === 0) {
      console.log('✅ No more snake_case constraints found!\n');
    } else {
      console.log('Remaining snake_case constraints:');
      result.rows.forEach(row => {
        console.log(`  ${row.table_name} → ${row.conname}`);
      });
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runRemaining();
