const { query, initDatabase } = require('./dist/modules/core/config/database');

async function checkDocAssociation() {
  try {
    await initDatabase();
    console.log('🔍 Checking document association issue...');
    
    // Get the most recent request
    const recentRequest = await query('SELECT id, title, created_at FROM service_requests ORDER BY created_at DESC LIMIT 1');
    if (recentRequest.rows.length === 0) {
      console.log('No requests found');
      return;
    }
    
    const requestId = recentRequest.rows[0].id;
    console.log(`Most recent request: ${recentRequest.rows[0].title} (ID: ${requestId})`);
    console.log(`Created at: ${recentRequest.rows[0].created_at}`);
    
    // Check documents associated with this request
    const docResult = await query(`
      SELECT d.id, d.filename, d.original_name, d.mime_type, d.file_size, d.uploaded_at
      FROM documents d
      JOIN service_request_documents srd ON d.id = srd.document_id
      WHERE srd.service_request_id = $1
    `, [requestId]);
    
    console.log(`\nDocuments associated with this request: ${docResult.rows.length}`);
    docResult.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.original_name} (ID: ${doc.id})`);
    });
    
    // Check documents uploaded around the same time (within 10 minutes)
    const requestTime = new Date(recentRequest.rows[0].created_at);
    const timeBefore = new Date(requestTime.getTime() - 10 * 60 * 1000);
    const timeAfter = new Date(requestTime.getTime() + 10 * 60 * 1000);
    
    const recentDocs = await query(`
      SELECT id, original_name, uploaded_at, category, file_size
      FROM documents 
      WHERE uploaded_at BETWEEN $1 AND $2
      ORDER BY uploaded_at DESC
    `, [timeBefore.toISOString(), timeAfter.toISOString()]);
    
    console.log(`\nDocuments uploaded within 10 minutes of request: ${recentDocs.rows.length}`);
    recentDocs.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.original_name} (${doc.file_size} bytes, Category: ${doc.category})`);
      console.log(`   Uploaded: ${doc.uploaded_at}`);
    });
    
    // Check service_request_documents table for this request
    const srdResult = await query('SELECT * FROM service_request_documents WHERE service_request_id = $1', [requestId]);
    console.log(`\nservice_request_documents entries for this request: ${srdResult.rows.length}`);
    srdResult.rows.forEach((row, index) => {
      console.log(`${index + 1}. Request: ${row.service_request_id}, Document: ${row.document_id}`);
    });
    
    // Check if there are any unassociated documents
    const unassociatedDocs = await query(`
      SELECT d.id, d.original_name, d.uploaded_at
      FROM documents d
      LEFT JOIN service_request_documents srd ON d.id = srd.document_id
      WHERE srd.document_id IS NULL
      ORDER BY d.uploaded_at DESC
      LIMIT 5
    `);
    
    console.log(`\nUnassociated documents (not linked to any request): ${unassociatedDocs.rows.length}`);
    unassociatedDocs.rows.forEach((doc, index) => {
      console.log(`${index + 1}. ${doc.original_name} (ID: ${doc.id}, Uploaded: ${doc.uploaded_at})`);
    });
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

checkDocAssociation();
