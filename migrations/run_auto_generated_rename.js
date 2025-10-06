const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runRename() {
  console.log('\n🔄 Running auto-generated rename migration...\n');

  try {
    // Read the auto-generated SQL
    const migrationPath = path.join(__dirname, '014_auto_generated_rename.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing rename migration...\n');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ All constraints and indexes renamed to camelCase!\n');

    // Verify
    const sampleConstraints = await pool.query(`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY table_name, conname
      LIMIT 15
    `);

    console.log('📋 Sample constraints (first 15):');
    sampleConstraints.rows.forEach(row => {
      console.log(`  ${row.table_name} → ${row.conname}`);
    });

    const sampleIndexes = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
      LIMIT 15
    `);

    console.log('\n📋 Sample indexes (first 15):');
    sampleIndexes.rows.forEach(row => {
      console.log(`  ${row.tablename} → ${row.indexname}`);
    });

    console.log('\n✅ Migration completed successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runRename();
