const { query, initDatabase } = require('./dist/modules/core/config/database');

async function checkDocumentsSchema() {
  try {
    await initDatabase();
    console.log('🔍 Checking documents table schema...');
    
    const result = await query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'documents' 
      ORDER BY ordinal_position
    `);
    
    console.log('Documents table columns:');
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.column_name} (${row.data_type})`);
    });
    
    // Also check if the table exists and has any data
    const tableCheck = await query(`
      SELECT COUNT(*) as count FROM documents
    `);
    
    console.log(`\n📄 Total documents in table: ${tableCheck.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDocumentsSchema();
