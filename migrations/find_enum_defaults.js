const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function findEnumDefaults() {
  try {
    const result = await pool.query(`
      SELECT
        c.table_name,
        c.column_name,
        c.column_default,
        c.udt_name as type_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
      AND c.column_default IS NOT NULL
      AND c.data_type = 'USER-DEFINED'
      ORDER BY c.table_name, c.column_name
    `);

    console.log('\n📋 ENUM columns with defaults:\n');
    result.rows.forEach(row => {
      console.log(`${row.table_name}.${row.column_name}`);
      console.log(`  Type: ${row.type_name}`);
      console.log(`  Default: ${row.column_default}\n`);
    });

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

findEnumDefaults();
