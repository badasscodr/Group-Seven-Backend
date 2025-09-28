const pool = require('./dist/core/config/database.js').default;

async function runSimpleMessagingMigration() {
  const client = await pool.connect();

  try {
    console.log('🔄 Running simple messaging migration...');

    // Create conversations table
    await client.query(`
      CREATE TABLE IF NOT EXISTS conversations (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          participants JSONB NOT NULL,
          last_message_id UUID,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    console.log('✅ Created conversations table');

    // Create messages table
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

    console.log('✅ Created messages table');

    // Add last_seen column to users table if it doesn't exist
    await client.query(`
      DO $$
      BEGIN
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                         WHERE table_name = 'users' AND column_name = 'last_seen') THEN
              ALTER TABLE users ADD COLUMN last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW();
          END IF;
      END $$;
    `);

    console.log('✅ Added last_seen column to users table');

    // Create basic indexes
    await client.query(`CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON conversations (updated_at DESC);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages (conversation_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages (created_at DESC);`);

    console.log('✅ Created indexes');

    // Verify tables were created
    const result = await client.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('conversations', 'messages')
      ORDER BY table_name
    `);

    console.log('📋 Created messaging tables:', result.rows.map(r => r.table_name));

  } catch (error) {
    console.error('❌ Simple messaging migration failed:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runSimpleMessagingMigration().catch(console.error);