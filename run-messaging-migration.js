const fs = require('fs');
const pool = require('./dist/core/config/database.js').default;

async function runMessagingMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running messaging system migration...');

    const migrationSQL = fs.readFileSync('./src/core/database/migrations/009_create_messaging_tables.sql', 'utf8');
    await client.query(migrationSQL);

    console.log('✅ Messaging migration completed successfully!');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('conversations', 'messages')
      ORDER BY table_name
    `);

    console.log('📋 Created messaging tables:', result.rows.map(r => r.table_name));

    // Check if last_seen column was added to users table
    const columnResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'users' AND column_name = 'last_seen'
    `);

    if (columnResult.rows.length > 0) {
      console.log('✅ Added last_seen column to users table');
    }

  } catch (error) {
    console.error('❌ Messaging migration failed:', error.message);
    console.error('Error details:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMessagingMigration().catch(console.error);