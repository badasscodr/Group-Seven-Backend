const { Pool } = require('pg');
const fs = require('fs');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:Abc123%21%40%23@localhost:5432/group_seven_db',
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runSoftDeleteMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running soft delete migration for conversations...');

    // Read the migration SQL file
    const migrationSQL = fs.readFileSync('./migrations/012_add_soft_delete_to_conversations.sql', 'utf8');
    
    // Execute the migration
    await client.query(migrationSQL);

    console.log('✅ Soft delete migration completed successfully!');

    // Verify the column was added
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'conversations' AND column_name = 'deletedBy'
    `);

    if (result.rows.length > 0) {
      console.log('📋 Column details:', result.rows[0]);
      console.log('✅ deletedBy column successfully added to conversations table');
    } else {
      console.log('⚠️ Warning: deletedBy column may not have been added');
    }

    // Verify the index was created
    const indexResult = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'conversations' AND indexname = 'idx_conversations_deleted_by'
    `);

    if (indexResult.rows.length > 0) {
      console.log('✅ idx_conversations_deleted_by index successfully created');
    } else {
      console.log('ℹ️ Index idx_conversations_deleted_by may not have been created (this is okay)');
    }

  } catch (error) {
    console.error('❌ Soft delete migration failed:', error.message);
    console.error('Error details:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runSoftDeleteMigration().then(() => {
  console.log('_migration completed successfully!');
  process.exit(0);
}).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});