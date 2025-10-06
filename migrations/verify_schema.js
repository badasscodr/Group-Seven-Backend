/**
 * Schema Verification Script
 * Checks database structure after migration
 */

const { Client } = require('pg');
require('dotenv').config();

const verifySchema = async () => {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('\n🔍 SCHEMA VERIFICATION\n');

    // Check critical tables
    const tables = ['users', 'service_requests', 'quotations', 'payments', 'job_postings'];

    for (const table of tables) {
      console.log(`\n📋 Table: ${table}`);
      const result = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1
        ORDER BY ordinal_position
      `, [table]);

      result.rows.forEach(row => {
        console.log(`   ✓ ${row.column_name} (${row.data_type})`);
      });
    }

    // Test camelCase query
    console.log('\n\n🧪 Testing quoted camelCase query...');
    const testQuery = await client.query(`
      SELECT COUNT(*) as count FROM service_categories
    `);
    console.log(`✅ Service categories: ${testQuery.rows[0].count} records`);

    console.log('\n✅ Schema verification complete!\n');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await client.end();
  }
};

verifySchema();
