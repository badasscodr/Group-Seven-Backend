import pool from '../core/config/database';

async function checkTables() {
  try {
    console.log('🔍 Checking database tables...\n');

    // Check for required tables
    const requiredTables = [
      'users',
      'service_requests',
      'quotations',
      'job_postings',
      'job_applications',
      'interviews',
      'payments',
      'visa_documents',
      'documents'
    ];

    const query = `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name = ANY($1::text[])
      ORDER BY table_name;
    `;

    const result = await pool.query(query, [requiredTables]);
    const existingTables = result.rows.map((row: any) => row.table_name);

    console.log('✅ Existing tables:');
    existingTables.forEach((table: string) => {
      console.log(`   - ${table}`);
    });

    const missingTables = requiredTables.filter(t => !existingTables.includes(t));

    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:');
      missingTables.forEach((table: string) => {
        console.log(`   - ${table}`);
      });
      console.log('\n💡 Run migrations to create missing tables');
    } else {
      console.log('\n✨ All required tables exist!');
    }

    // Check table counts
    console.log('\n📊 Table row counts:');
    for (const table of existingTables) {
      const countResult = await pool.query(`SELECT COUNT(*) FROM ${table}`);
      console.log(`   ${table}: ${countResult.rows[0].count} rows`);
    }

    await pool.end();
  } catch (error) {
    console.error('❌ Error checking tables:', error);
    process.exit(1);
  }
}

checkTables();
