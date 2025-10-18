const fs = require('fs');
const path = require('path');
const { query, initDatabase } = require('../dist/modules/core/config/database');

async function runMigration006() {
  try {
    console.log('🔄 Running Migration 006: Fix service_request_documents foreign key constraint...\n');
    
    // Initialize database connection
    await initDatabase();
    console.log('✅ Database connected');

    // Read migration file
    const migrationPath = path.join(__dirname, '../migrations/006_fix_service_request_documents_fk.sql');
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
    
    console.log('📝 Executing migration...');
    
    // Execute migration
    await query(migrationSQL);
    
    console.log('✅ Migration 006 completed successfully!');
    console.log('\n📋 Changes applied:');
    console.log('   - Dropped old foreign key constraint (file_uploads reference)');
    console.log('   - Added new foreign key constraint (documents reference)');
    console.log('   - Document associations will now work correctly');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

runMigration006();
