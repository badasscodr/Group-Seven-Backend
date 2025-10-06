const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function verifySchema() {
  console.log('\n🔍 VERIFYING CURRENT DATABASE SCHEMA...\n');
  console.log('═'.repeat(80));

  try {
    // Check all table names
    console.log('\n📋 ALL TABLE NAMES:\n');
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    tables.rows.forEach((row, index) => {
      const hasUnderscore = row.table_name.includes('_');
      const marker = hasUnderscore ? '❌ SNAKE_CASE' : '✅ camelCase';
      console.log(`${index + 1}. ${row.table_name} → ${marker}`);
    });

    console.log(`\nTotal tables: ${tables.rows.length}`);

    // Count snake_case vs camelCase
    const snakeCaseTables = tables.rows.filter(r => r.table_name.includes('_'));
    const camelCaseTables = tables.rows.filter(r => !r.table_name.includes('_'));

    console.log(`Snake_case tables: ${snakeCaseTables.length}`);
    console.log(`CamelCase tables: ${camelCaseTables.length}`);

    // Check ENUM types
    console.log('\n📋 ALL ENUM TYPES:\n');
    const types = await pool.query(`
      SELECT typname
      FROM pg_type
      WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace
      ORDER BY typname
    `);

    types.rows.forEach((row, index) => {
      const hasUnderscore = row.typname.includes('_');
      const marker = hasUnderscore ? '❌ SNAKE_CASE' : '✅ camelCase';
      console.log(`${index + 1}. ${row.typname} → ${marker}`);
    });

    console.log(`\nTotal ENUM types: ${types.rows.length}`);

    const snakeCaseTypes = types.rows.filter(r => r.typname.includes('_'));
    const camelCaseTypes = types.rows.filter(r => !r.typname.includes('_'));

    console.log(`Snake_case types: ${snakeCaseTypes.length}`);
    console.log(`CamelCase types: ${camelCaseTypes.length}`);

    console.log('\n' + '═'.repeat(80));

    if (snakeCaseTables.length > 0 || snakeCaseTypes.length > 0) {
      console.log('\n❌ DATABASE HAS SNAKE_CASE OBJECTS!\n');
      if (snakeCaseTables.length > 0) {
        console.log('Snake_case tables:');
        snakeCaseTables.forEach(t => console.log(`  • ${t.table_name}`));
      }
      if (snakeCaseTypes.length > 0) {
        console.log('\nSnake_case ENUM types:');
        snakeCaseTypes.forEach(t => console.log(`  • ${t.typname}`));
      }
    } else {
      console.log('\n✅ ALL OBJECTS ARE CAMELCASE!\n');
    }

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifySchema();
