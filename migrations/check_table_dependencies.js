const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkDependencies(tableName = 'users') {
  console.log(`\n🔍 Checking dependencies for table: ${tableName}\n`);
  console.log('═'.repeat(80));

  try {
    // Find all foreign keys that reference this table
    const referencingTables = await pool.query(`
      SELECT
        tc.table_name AS dependent_table,
        kcu.column_name AS dependent_column,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND ccu.table_name = $1
      AND tc.table_schema = 'public'
      ORDER BY tc.table_name, kcu.column_name
    `, [tableName]);

    // Find all foreign keys FROM this table
    const referencedByTable = await pool.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        tc.constraint_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = $1
      AND tc.table_schema = 'public'
      ORDER BY kcu.column_name
    `, [tableName]);

    console.log(`\n📊 TABLES THAT DEPEND ON "${tableName}":`);
    console.log('─'.repeat(80));
    console.log('(These tables have foreign keys pointing TO this table)\n');

    if (referencingTables.rows.length > 0) {
      const grouped = {};
      referencingTables.rows.forEach(row => {
        if (!grouped[row.dependent_table]) {
          grouped[row.dependent_table] = [];
        }
        grouped[row.dependent_table].push(row);
      });

      Object.keys(grouped).forEach(table => {
        console.log(`❌ ${table}`);
        grouped[table].forEach(fk => {
          console.log(`   └─ ${fk.dependent_column} (${fk.constraint_name})`);
        });
      });

      console.log(`\n⚠️  Total: ${Object.keys(grouped).length} tables depend on "${tableName}"`);
    } else {
      console.log(`✅ No tables depend on "${tableName}"`);
    }

    console.log(`\n\n📊 TABLES THAT "${tableName}" DEPENDS ON:`);
    console.log('─'.repeat(80));
    console.log('(This table has foreign keys pointing TO other tables)\n');

    if (referencedByTable.rows.length > 0) {
      const grouped = {};
      referencedByTable.rows.forEach(row => {
        if (!grouped[row.foreign_table_name]) {
          grouped[row.foreign_table_name] = [];
        }
        grouped[row.foreign_table_name].push(row);
      });

      Object.keys(grouped).forEach(table => {
        console.log(`❌ ${table}`);
        grouped[table].forEach(fk => {
          console.log(`   └─ ${tableName}.${fk.column_name} → ${table}.${fk.foreign_column_name} (${fk.constraint_name})`);
        });
      });

      console.log(`\n⚠️  "${tableName}" depends on ${Object.keys(grouped).length} other tables`);
    } else {
      console.log(`✅ "${tableName}" doesn't depend on other tables`);
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n⚠️  WHAT HAPPENS IF YOU DROP THIS TABLE:\n');

    if (referencingTables.rows.length > 0) {
      console.log('❌ PostgreSQL will REJECT the DROP command with error:');
      console.log(`   "cannot drop table ${tableName} because other objects depend on it"`);
      console.log('\n💡 To drop this table, you would need to:');
      console.log('   1. Drop all dependent tables first, OR');
      console.log('   2. Use DROP TABLE CASCADE (⚠️  DANGEROUS - deletes dependent data!)');
      console.log(`\n   DROP TABLE "${tableName}" CASCADE;  -- ⚠️  This will delete data in ${Object.keys(referencingTables.rows.reduce((acc, r) => ({...acc, [r.dependent_table]: 1}), {})).length} other tables!`);
    } else {
      console.log('✅ You can safely drop this table (no dependencies)');
      console.log(`\n   DROP TABLE "${tableName}";`);
    }

    console.log('\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

// Check which table to analyze (default: users)
const tableName = process.argv[2] || 'users';
checkDependencies(tableName);
