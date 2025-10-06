const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runConstraintsMigration() {
  console.log('\n🔄 Starting constraints and indexes rename migration...\n');
  console.log('Database:', process.env.DATABASE_URL?.split('@')[1]?.split('?')[0] || 'Unknown');

  try {
    // Read the migration SQL
    const migrationPath = path.join(__dirname, '013_rename_constraints_indexes_to_camelCase.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Executing constraints and indexes rename migration...');
    console.log('   This will rename all constraints and indexes to camelCase...\n');

    // Execute the migration
    await pool.query(sql);

    console.log('✅ Migration completed successfully!\n');

    // Verify the changes
    console.log('📋 Verifying renamed constraints and indexes:\n');

    const constraints = await pool.query(`
      SELECT conname AS constraint_name, conrelid::regclass AS table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY table_name, constraint_name
      LIMIT 20
    `);

    console.log('Sample constraints (first 20):');
    constraints.rows.forEach(row => {
      console.log(`  ${row.table_name} → ${row.constraint_name}`);
    });

    const indexes = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
      LIMIT 20
    `);

    console.log('\nSample indexes (first 20):');
    indexes.rows.forEach(row => {
      console.log(`  ${row.tablename} → ${row.indexname}`);
    });

    console.log('\n✅ All constraints and indexes renamed to camelCase successfully!\n');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runConstraintsMigration();
