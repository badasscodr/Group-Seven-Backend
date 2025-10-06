const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
}

async function renameAllConstraintsAndIndexes() {
  console.log('\n🔧 Renaming ALL constraints and indexes to camelCase...\n');
  console.log('═'.repeat(80));

  try {
    // Get all constraints
    const constraints = await pool.query(`
      SELECT conname, conrelid::regclass AS table_name, contype
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      ORDER BY table_name, conname
    `);

    console.log('📝 Renaming constraints...\n');
    let constraintCount = 0;

    for (const constraint of constraints.rows) {
      const newName = toCamelCase(constraint.conname);
      if (newName !== constraint.conname) {
        await pool.query(`ALTER TABLE ${constraint.table_name} RENAME CONSTRAINT "${constraint.conname}" TO "${newName}"`);
        console.log(`✅ ${constraint.table_name} → ${constraint.conname} → ${newName}`);
        constraintCount++;
      }
    }

    console.log(`\n✅ Renamed ${constraintCount} constraints\n`);

    // Get all indexes (excluding those auto-renamed by constraints)
    const indexes = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    console.log('📝 Renaming indexes...\n');
    let indexCount = 0;

    // Get all constraint names for filtering
    const constraintNames = new Set(constraints.rows.map(r => r.conname));
    const newConstraintNames = new Set(constraints.rows.map(r => toCamelCase(r.conname)));

    for (const index of indexes.rows) {
      const newName = toCamelCase(index.indexname);

      // Skip if this index was already renamed by a constraint rename
      if (constraintNames.has(index.indexname) || newConstraintNames.has(index.indexname)) {
        continue;
      }

      if (newName !== index.indexname) {
        try {
          await pool.query(`ALTER INDEX "${index.indexname}" RENAME TO "${newName}"`);
          console.log(`✅ ${index.tablename} → ${index.indexname} → ${newName}`);
          indexCount++;
        } catch (error) {
          // Skip if already renamed
          if (!error.message.includes('does not exist')) {
            console.log(`⚠️  Skipped ${index.indexname}: ${error.message}`);
          }
        }
      }
    }

    console.log(`\n✅ Renamed ${indexCount} indexes\n`);

    console.log('═'.repeat(80));
    console.log(`\n✅ TOTAL: ${constraintCount} constraints + ${indexCount} indexes renamed\n`);

    // Final verification
    const remainingSnake = await pool.query(`
      SELECT COUNT(*) as count FROM (
        SELECT conname as name FROM pg_constraint WHERE connamespace = 'public'::regnamespace AND conname ~ '_'
        UNION ALL
        SELECT indexname as name FROM pg_indexes WHERE schemaname = 'public' AND indexname ~ '_'
      ) AS all_names
    `);

    console.log(`📊 Remaining snake_case constraints/indexes: ${remainingSnake.rows[0].count}\n`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

renameAllConstraintsAndIndexes();
