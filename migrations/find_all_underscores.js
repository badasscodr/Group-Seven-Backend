const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function findAllUnderscores() {
  console.log('\n🔍 FINDING ALL NAMES WITH UNDERSCORES...\n');
  console.log('═'.repeat(80));

  try {
    // Check constraints with full details
    console.log('\n📋 CONSTRAINTS WITH UNDERSCORES:');
    console.log('─'.repeat(80));
    const constraints = await pool.query(`
      SELECT
        conname as name,
        conrelid::regclass AS table_name,
        contype as type,
        CASE contype
          WHEN 'p' THEN 'PRIMARY KEY'
          WHEN 'f' THEN 'FOREIGN KEY'
          WHEN 'u' THEN 'UNIQUE'
          WHEN 'c' THEN 'CHECK'
        END as constraint_type
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      AND conname LIKE '%\_%'
      ORDER BY table_name, conname
    `);

    if (constraints.rows.length > 0) {
      constraints.rows.forEach(row => {
        console.log(`❌ ${row.table_name} → ${row.name} (${row.constraint_type})`);
      });
      console.log(`\nTotal: ${constraints.rows.length}`);
    } else {
      console.log('✅ No constraints with underscores');
    }

    // Check indexes with full details
    console.log('\n📋 INDEXES WITH UNDERSCORES:');
    console.log('─'.repeat(80));
    const indexes = await pool.query(`
      SELECT
        indexname as name,
        tablename,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE '%\_%'
      ORDER BY tablename, indexname
    `);

    if (indexes.rows.length > 0) {
      indexes.rows.forEach(row => {
        console.log(`❌ ${row.tablename} → ${row.name}`);
      });
      console.log(`\nTotal: ${indexes.rows.length}`);
    } else {
      console.log('✅ No indexes with underscores');
    }

    console.log('\n' + '═'.repeat(80));
    console.log(`\n⚠️  TOTAL ITEMS WITH UNDERSCORES: ${constraints.rows.length + indexes.rows.length}\n`);

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

findAllUnderscores();
