const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

async function runMigration() {
  const client = await pool.connect();
  try {
    const sql = fs.readFileSync(path.join(__dirname, 'add_conversationId_to_messages.sql'), 'utf8');
    const result = await client.query(sql);
    if (result && result.rows && result.rows.length > 0) {
      console.log('\n✅', result.rows[result.rows.length - 1].status);
    } else {
      console.log('\n✅ Migration executed successfully');
    }
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
