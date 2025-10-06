const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://neondb_owner:npg_jcmB61ryhgPk@ep-bold-surf-aeqws7il-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require',
  ssl: { rejectUnauthorized: false }
});

async function verifyDatabase() {
  console.log('🔍 Verifying database columns are camelCase...\n');

  const tables = [
    'users',
    'service_requests',
    'quotations',
    'documents',
    'messages',
    'attendance',
    'leave_requests'
  ];

  let hasSnakeCase = false;

  for (const table of tables) {
    const result = await pool.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = $1
      AND column_name LIKE '%_%'
      ORDER BY ordinal_position
    `, [table]);

    if (result.rows.length > 0) {
      console.log(`❌ ${table}: Still has ${result.rows.length} snake_case columns`);
      result.rows.slice(0, 5).forEach(row => console.log(`   - ${row.column_name}`));
      if (result.rows.length > 5) console.log(`   ... and ${result.rows.length - 5} more`);
      hasSnakeCase = true;
    } else {
      console.log(`✅ ${table}: All camelCase`);
    }
  }

  if (!hasSnakeCase) {
    console.log('\n🎉 All tables have camelCase columns!');
  }

  await pool.end();
}

verifyDatabase().catch(err => {
  console.error('❌ Error:', err.message);
  pool.end();
  process.exit(1);
});
