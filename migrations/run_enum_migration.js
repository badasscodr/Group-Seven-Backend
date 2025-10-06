const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runEnumMigration() {
  console.log('\n🔄 Running ENUM types rename migration...\n');

  try {
    const migrationPath = path.join(__dirname, '016_rename_enum_types.sql');
    const sql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('📝 Renaming all 19 ENUM types to camelCase...\n');

    await pool.query(sql);

    console.log('✅ All ENUM types renamed successfully!\n');

    // Verify
    const result = await pool.query(`
      SELECT typname
      FROM pg_type
      WHERE typtype = 'e'
      AND typnamespace = 'public'::regnamespace
      ORDER BY typname
    `);

    console.log('📋 Current ENUM types:');
    result.rows.forEach(row => {
      const hasUnderscore = row.typname.includes('_');
      const marker = hasUnderscore ? '❌' : '✅';
      console.log(`${marker} ${row.typname}`);
    });

    const snakeCount = result.rows.filter(r => r.typname.includes('_')).length;
    console.log(`\nTotal: ${result.rows.length}, Snake_case: ${snakeCount}`);

    if (snakeCount === 0) {
      console.log('\n✅ SUCCESS: All ENUM types are now camelCase!\n');
    } else {
      console.log(`\n❌ WARNING: ${snakeCount} ENUM types still have snake_case\n`);
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runEnumMigration();
