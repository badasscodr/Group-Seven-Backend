const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function createConversationsTable() {
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'create_conversations_table.sql'), 'utf-8');
    await pool.query(sql);
    console.log('\n✅ Conversations table created successfully!\n');
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

createConversationsTable();
