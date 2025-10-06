const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jcmB61ryhgPk@ep-bold-surf-aeqws7il-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function checkActual() {
  console.log('🔍 Checking actual database column names...\n');

  const result = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'users'
    ORDER BY ordinal_position
  `);

  console.log('Users table columns:');
  result.rows.forEach((row, i) => {
    const hasUnderscore = row.column_name.includes('_');
    const icon = hasUnderscore ? '❌' : '✅';
    console.log(`  ${icon} ${(i + 1).toString().padStart(2)}. ${row.column_name}`);
  });

  // Check service_requests
  const sr = await pool.query(`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'service_requests'
    ORDER BY ordinal_position
    LIMIT 10
  `);

  console.log('\nService_requests table (first 10 columns):');
  sr.rows.forEach((row, i) => {
    const hasUnderscore = row.column_name.includes('_');
    const icon = hasUnderscore ? '❌' : '✅';
    console.log(`  ${icon} ${(i + 1).toString().padStart(2)}. ${row.column_name}`);
  });

  await pool.end();
}

checkActual().catch(err => {
  console.error('❌ Error:', err.message);
  pool.end();
  process.exit(1);
});
