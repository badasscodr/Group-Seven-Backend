const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runTableRenameMigration() {
  console.log('\n🔄 Starting table rename migration...\n');
  console.log('Database:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Unknown');

  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '012_rename_tables_to_camelCase.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing table rename migration...');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Verify the renamed tables
    console.log('📋 Verifying renamed tables:\n');
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    console.log('Tables in database:');
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`);
    });

    console.log('\n✅ All tables renamed to camelCase successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runTableRenameMigration();
