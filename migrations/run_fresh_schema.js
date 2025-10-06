const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function runSchema() {
  console.log('\n🔨 Creating fresh camelCase schema...\n');

  try {
    const schemaPath = path.join(__dirname, 'FRESH_CAMELCASE_SCHEMA.sql');
    const schemaSql = fs.readFileSync(schemaPath, 'utf-8');

    console.log('📝 Running schema...\n');
    await pool.query(schemaSql);

    console.log('✅ Schema created!\n');

    // Verify
    const tables = await pool.query(`
      SELECT table_name FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const types = await pool.query(`
      SELECT typname FROM pg_type
      WHERE typtype = 'e' AND typnamespace = 'public'::regnamespace
      ORDER BY typname
    `);

    console.log(`📊 Tables: ${tables.rows.length}`);
    console.log(`📊 ENUM types: ${types.rows.length}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runSchema();
