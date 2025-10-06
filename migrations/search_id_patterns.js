const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function searchIdPatterns() {
  console.log('\n🔍 Searching for id_* patterns...\n');
  console.log('═'.repeat(80));

  const patterns = [
    'id_employeeAssignments_assignedBy',
    'id_employeeAssignments_employeeId',
    'id_employeeProfiles_managerId',
    'id_employeeProfiles_userId',
    'id_leaveRequests_approvedBy',
    'id_leaveRequests_employeeId',
    'id_messages_recipientId',
    'id_messages_senderId',
    'id_payments_approvedBy',
    'id_payments_clientId',
    'id_payments_supplierId',
    'id_projects_clientId',
    'id_projects_projectManagerId',
    'id_serviceRequests_assignedEmployeeId',
    'id_serviceRequests_assignedSupplierId',
    'id_serviceRequests_clientId'
  ];

  try {
    for (const pattern of patterns) {
      console.log(`\n🔎 Searching for: "${pattern}"`);
      console.log('─'.repeat(80));

      // Check constraints
      const constraints = await pool.query(`
        SELECT conname, conrelid::regclass AS table_name
        FROM pg_constraint
        WHERE connamespace = 'public'::regnamespace
        AND conname = $1
      `, [pattern]);

      // Check indexes
      const indexes = await pool.query(`
        SELECT indexname, tablename
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND indexname = $1
      `, [pattern]);

      let found = false;

      if (constraints.rows.length > 0) {
        constraints.rows.forEach(r => {
          console.log(`  ❌ Found as CONSTRAINT: ${r.table_name} → ${r.conname}`);
          found = true;
        });
      }

      if (indexes.rows.length > 0) {
        indexes.rows.forEach(r => {
          console.log(`  ❌ Found as INDEX: ${r.tablename} → ${r.indexname}`);
          found = true;
        });
      }

      if (!found) {
        console.log('  ✅ NOT FOUND (Neon UI visualization only)');
      }
    }

    // Check for any object starting with "id_"
    console.log('\n\n📊 ALL objects starting with "id_":\n');
    console.log('─'.repeat(80));

    const allIdConstraints = await pool.query(`
      SELECT conname, conrelid::regclass AS table_name
      FROM pg_constraint
      WHERE connamespace = 'public'::regnamespace
      AND conname LIKE 'id\\_%'
      ORDER BY conname
    `);

    const allIdIndexes = await pool.query(`
      SELECT indexname, tablename
      FROM pg_indexes
      WHERE schemaname = 'public'
      AND indexname LIKE 'id\\_%'
      ORDER BY indexname
    `);

    if (allIdConstraints.rows.length > 0) {
      console.log('CONSTRAINTS starting with "id_":');
      allIdConstraints.rows.forEach(r => {
        console.log(`  • ${r.table_name} → ${r.conname}`);
      });
    } else {
      console.log('✅ No constraints starting with "id_"');
    }

    if (allIdIndexes.rows.length > 0) {
      console.log('\nINDEXES starting with "id_":');
      allIdIndexes.rows.forEach(r => {
        console.log(`  • ${r.tablename} → ${r.indexname}`);
      });
    } else {
      console.log('✅ No indexes starting with "id_"');
    }

    console.log('\n' + '═'.repeat(80));
    console.log('\n📝 CONCLUSION:\n');
    console.log('These "id_tableName_columnName" patterns are Neon\'s way of displaying');
    console.log('foreign key relationships. They combine:');
    console.log('  • "id" (indicating it\'s a foreign key to an ID column)');
    console.log('  • Table name where the FK exists');
    console.log('  • Column name of the FK\n');
    console.log('They are NOT actual database object names.\n');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

searchIdPatterns();
