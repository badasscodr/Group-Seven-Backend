const pool = require('./dist/core/config/database.js').default;

async function fixMessagesTable() {
  const client = await pool.connect();

  try {
    console.log('🔄 Fixing messages table schema...');

    // Drop old messages table
    console.log('Dropping old messages table...');
    await client.query('DROP TABLE IF EXISTS messages CASCADE;');

    // Create new messages table with correct schema
    console.log('Creating new messages table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS messages (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          content TEXT NOT NULL,
          sender_id UUID NOT NULL,
          recipient_id UUID NOT NULL,
          conversation_id UUID NOT NULL,
          message_type VARCHAR(20) DEFAULT 'text',
          file_url TEXT,
          file_name TEXT,
          is_read BOOLEAN DEFAULT FALSE,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Messages table fixed successfully');

  } catch (error) {
    console.error('❌ Failed to fix messages table:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixMessagesTable().catch(console.error);