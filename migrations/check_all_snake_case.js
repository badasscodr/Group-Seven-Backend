const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkAllSnakeCase() {
  console.log('\n🔍 CHECKING ALL DATABASE OBJECTS FOR SNAKE_CASE...\n');
  console.log('═'.repeat(80));

  try {
    // Check ENUM types
    console.log('\n📋 ENUM TYPES (custom types):');
    console.log('─'.repeat(80));
    const types = await pool.query(`
      SELECT typname
      FROM pg_type
      WHERE typtype = 'e'
      AND typnamespace = 'public'::regnamespace
      ORDER BY typname
    `);

    types.rows.forEach(row => {
      const hasUnderscore = row.typname.includes('_');
      const marker = hasUnderscore ? '❌' : '✅';
      console.log(`${marker} ${row.typname}`);
    });
    console.log(`Total: ${types.rows.length}`);

    // Check all constraints
    console.log('\n📋 ALL CONSTRAINTS:');
    console.log('─'.repeat(80));
    const constraints = await pool.query(`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY conname
    `);

    const snakeConstraints = constraints.rows.filter(r => r.conname.includes('_'));
    if (snakeConstraints.length > 0) {
      console.log('❌ SNAKE_CASE CONSTRAINTS FOUND:');
      snakeConstraints.forEach(row => {
        console.log(`   ${row.table_name} → ${row.conname}`);
      });
    } else {
      console.log('✅ No snake_case constraints');
    }
    console.log(`Total constraints: ${constraints.rows.length}, Snake_case: ${snakeConstraints.length}`);

    // Check all indexes
    console.log('\n📋 ALL INDEXES:');
    console.log('─'.repeat(80));
    const indexes = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY indexname
    `);

    const snakeIndexes = indexes.rows.filter(r => r.indexname.includes('_'));
    if (snakeIndexes.length > 0) {
      console.log('❌ SNAKE_CASE INDEXES FOUND:');
      snakeIndexes.forEach(row => {
        console.log(`   ${row.tablename} → ${row.indexname}`);
      });
    } else {
      console.log('✅ No snake_case indexes');
    }
    console.log(`Total indexes: ${indexes.rows.length}, Snake_case: ${snakeIndexes.length}`);

    // Check tables
    console.log('\n📋 ALL TABLES:');
    console.log('─'.repeat(80));
    const tables = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const snakeTables = tables.rows.filter(r => r.table_name.includes('_'));
    if (snakeTables.length > 0) {
      console.log('❌ SNAKE_CASE TABLES FOUND:');
      snakeTables.forEach(row => {
        console.log(`   ${row.table_name}`);
      });
    } else {
      console.log('✅ No snake_case tables');
    }
    console.log(`Total tables: ${tables.rows.length}, Snake_case: ${snakeTables.length}`);

    // Check columns
    console.log('\n📋 ALL COLUMNS:');
    console.log('─'.repeat(80));
    const columns = await pool.query(`
      SELECT table_name, column_name
      FROM information_schema.columns
      WHERE table_schema = 'public'
      ORDER BY table_name, column_name
    `);

    const snakeColumns = columns.rows.filter(r => r.column_name.includes('_'));
    if (snakeColumns.length > 0) {
      console.log('❌ SNAKE_CASE COLUMNS FOUND (showing first 20):');
      snakeColumns.slice(0, 20).forEach(row => {
        console.log(`   ${row.table_name}.${row.column_name}`);
      });
      if (snakeColumns.length > 20) {
        console.log(`   ... and ${snakeColumns.length - 20} more`);
      }
    } else {
      console.log('✅ No snake_case columns');
    }
    console.log(`Total columns: ${columns.rows.length}, Snake_case: ${snakeColumns.length}`);

    console.log('\n' + '═'.repeat(80));
    const totalSnake = (types.rows.filter(r => r.typname.includes('_')).length) +
                       snakeConstraints.length +
                       snakeIndexes.length +
                       snakeTables.length +
                       snakeColumns.length;

    if (totalSnake > 0) {
      console.log(`\n❌ TOTAL SNAKE_CASE ITEMS: ${totalSnake}`);
    } else {
      console.log('\n✅ NO SNAKE_CASE FOUND!');
    }
    console.log('');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkAllSnakeCase();
