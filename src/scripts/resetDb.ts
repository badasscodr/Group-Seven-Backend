import { initDatabase } from '../modules/core/config/database';

async function resetDatabase() {
  console.log('🔄 Initializing database...');
  
  try {
    // First initialize the database connection
    await initDatabase();
    console.log('✅ Database initialized');
    
    // Read and execute the enhanced schema
    const fs = require('fs');
    const path = require('path');
    
    const schemaPath = path.join(__dirname, '../../migrations/002_enhanced_schema.sql');
    console.log('📄 Looking for schema at:', schemaPath);
    
    // Check if file exists
    if (!fs.existsSync(schemaPath)) {
      throw new Error(`Schema file not found at: ${schemaPath}`);
    }
    
    const schemaSQL = fs.readFileSync(schemaPath, 'utf8');
    console.log('📄 Schema file loaded successfully');
    console.log('🚀 Executing schema migration...');
    
    // Get the pool and execute the schema
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });
    
    await pool.query(schemaSQL);
    await pool.end();
    
    console.log('✅ Database schema updated successfully!');
    console.log('🎉 Enhanced schema with all tables created!');
    
  } catch (error) {
    console.error('❌ Error resetting database:', error);
    process.exit(1);
  }
}

// Run the reset
resetDatabase().then(() => {
  console.log('🔥 Database reset complete!');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Migration failed:', error);
  process.exit(1);
});