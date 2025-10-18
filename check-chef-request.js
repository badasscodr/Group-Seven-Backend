const { query, initDatabase } = require('./dist/modules/core/config/database');

async function checkChefRequest() {
  try {
    await initDatabase();
    console.log('🔍 Checking for chef master request...');
    
    const result = await query("SELECT id, title, status, created_at FROM service_requests WHERE title ILIKE '%chef%' ORDER BY created_at DESC LIMIT 5");
    console.log('Found requests:', result.rows.length);
    
    result.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title} (ID: ${row.id}, Status: ${row.status}, Created: ${row.created_at})`);
    });
    
    // Check for recent requests
    const recentResult = await query('SELECT id, title, status, created_at FROM service_requests ORDER BY created_at DESC LIMIT 3');
    console.log('\nRecent requests:');
    recentResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. ${row.title} (ID: ${row.id}, Status: ${row.status}, Created: ${row.created_at})`);
    });
    
    // Check documents associated with Chef Master request
    const chefRequestId = '5068ef33-f101-4283-b5c8-228bad414e97';
    const docResult = await query(`
      SELECT d.filename, d.original_name, d.mime_type, d.file_size, d.uploaded_at
      FROM documents d
      JOIN service_request_documents srd ON d.id = srd.document_id
      WHERE srd.service_request_id = $1
    `, [chefRequestId]);
    
    console.log(`\nDocuments associated with Chef Master request: ${docResult.rows.length}`);
    docResult.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.original_name} (${doc.mime_type}, ${doc.file_size} bytes)`);
    });
    
    // Check all recent documents
    const allDocsResult = await query('SELECT original_name, uploaded_at FROM documents ORDER BY uploaded_at DESC LIMIT 5');
    console.log('\nRecent documents in database:');
    allDocsResult.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.original_name} (Uploaded: ${doc.uploaded_at})`);
    });
    
    // Check total documents
    const totalDocResult = await query('SELECT COUNT(*) as count FROM documents');
    console.log(`\nTotal documents in database: ${totalDocResult.rows[0].count}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkChefRequest();
