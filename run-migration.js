const fs = require('fs');
const pool = require('./dist/core/config/database.js').default;

async function runMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running job assignments migration...');

    const migrationSQL = fs.readFileSync('./src/core/database/migrations/003_job_assignments.sql', 'utf8');
    await client.query(migrationSQL);

    console.log('✅ Migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('projects', 'employee_assignments', 'task_assignments')
      ORDER BY table_name
    `);

    console.log('📋 Created tables:', result.rows.map(r => r.table_name));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(console.error);