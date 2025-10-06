const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function toCamelCase(str) {
  // Convert snake_case to camelCase
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

async function generateRenameScript() {
  console.log('\n🔄 Generating constraint and index rename script...\n');

  try {
    let sql = `-- =====================================================
-- RENAME ALL CONSTRAINTS AND INDEXES TO CAMELCASE (AUTO-GENERATED)
-- =====================================================

BEGIN;

`;

    // Get all constraints
    const constraints = await pool.query(`
      SELECT
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        contype AS constraint_type
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      AND conname NOT LIKE 'users_%'
      AND conname NOT LIKE 'quotations_%'
      AND conname NOT LIKE 'payments_%'
      AND conname NOT LIKE 'documents_%'
      AND conname NOT LIKE 'messages_%'
      AND conname NOT LIKE 'notifications_%'
      AND conname NOT LIKE 'projects_%'
      AND conname NOT LIKE 'interviews_%'
      AND conname NOT LIKE 'attendance_%'
      ORDER BY table_name, constraint_name
    `);

    sql += `-- =====================================================\n`;
    sql += `-- RENAME CONSTRAINTS\n`;
    sql += `-- =====================================================\n\n`;

    for (const row of constraints.rows) {
      const tableName = row.table_name;
      const oldName = row.constraint_name;
      const newName = toCamelCase(oldName);

      if (oldName !== newName) {
        sql += `ALTER TABLE ${tableName} RENAME CONSTRAINT "${oldName}" TO "${newName}";\n`;
      }
    }

    // Get constraint names to exclude from index renaming
    const constraintNames = new Set(constraints.rows.map(r => r.constraint_name));

    // Get all indexes that need renaming (excluding those that are also constraints)
    const indexes = await pool.query(`
      SELECT
        indexname,
        tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'idx_%'
      AND indexname NOT LIKE 'users_%'
      AND indexname NOT LIKE 'quotations_%'
      AND indexname NOT LIKE 'payments_%'
      AND indexname NOT LIKE 'documents_%'
      AND indexname NOT LIKE 'messages_%'
      AND indexname NOT LIKE 'notifications_%'
      AND indexname NOT LIKE 'projects_%'
      AND indexname NOT LIKE 'interviews_%'
      AND indexname NOT LIKE 'attendance_%'
      ORDER BY tablename, indexname
    `);

    sql += `\n-- =====================================================\n`;
    sql += `-- RENAME INDEXES\n`;
    sql += `-- =====================================================\n\n`;

    for (const row of indexes.rows) {
      const oldName = row.indexname;
      const newName = toCamelCase(oldName);

      // Skip if this index name is also a constraint name
      if (!constraintNames.has(oldName) && oldName !== newName) {
        sql += `ALTER INDEX "${oldName}" RENAME TO "${newName}";\n`;
      }
    }

    sql += `\nCOMMIT;\n\nSELECT 'All constraints and indexes renamed to camelCase successfully.' AS status;\n`;

    // Write to file
    const outputPath = path.join(__dirname, '014_auto_generated_rename.sql');
    fs.writeFileSync(outputPath, sql);

    console.log(`✅ Generated rename script: ${outputPath}\n`);
    console.log('Script preview (first 30 lines):');
    console.log('═'.repeat(80));
    console.log(sql.split('\n').slice(0, 30).join('\n'));
    console.log('...\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error);
  } finally {
    await pool.end();
  }
}

generateRenameScript();
