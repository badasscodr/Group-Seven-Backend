const fs = require('fs');
const { Pool } = require('pg');
const path = require('path');

// Load environment variables
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Abc123%21%40%23@localhost:5432/group_seven_db',
});

async function runVisaMigration() {
  try {
    console.log('🏃 Running visa documents migration...');

    const migrationPath = path.join(__dirname, '../migrations/009_create_visa_documents.sql');
    const migration = fs.readFileSync(migrationPath, 'utf8');

    await pool.query(migration);
    console.log('✅ Visa documents migration completed successfully');

    // Test if tables were created
    const result = await pool.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('visa_documents', 'visa_notifications')
    `);

    console.log('📋 Created tables:', result.rows.map(r => r.table_name));

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    throw error;
  } finally {
    await pool.end();
  }
}

runVisaMigration()
  .then(() => {
    console.log('✅ Migration completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Migration failed:', error);
    process.exit(1);
  });