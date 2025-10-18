const { query, initDatabase } = require('./dist/modules/core/config/database');

async function testServiceRequests() {
  try {
    console.log('🔍 Testing service requests system...\n');
    
    // Initialize database connection
    await initDatabase();
    console.log('✅ Database initialized\n');
    
    // 1. Check if service_requests table exists and has data
    console.log('1. Checking service_requests table...');
    const tableCheck = await query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_requests')"
    );
    console.log('   Table exists:', tableCheck.rows[0].exists);
    
    let countResult = { rows: [{ count: 0 }] };
    if (tableCheck.rows[0].exists) {
      countResult = await query('SELECT COUNT(*) as count FROM service_requests');
      console.log('   Total requests:', countResult.rows[0].count);
      
      // Get sample requests with budget fields
      const sampleRequests = await query(`
        SELECT id, title, budget_min, budget_max, deadline, location, created_at
        FROM service_requests 
        ORDER BY created_at DESC 
        LIMIT 3
      `);
      
      console.log('\n   Sample requests:');
      sampleRequests.rows.forEach((req, index) => {
        console.log(`   ${index + 1}. ${req.title}`);
        console.log(`      Budget: $${req.budget_min || '0'} - $${req.budget_max || '0'}`);
        console.log(`      Location: ${req.location || 'Not specified'}`);
        console.log(`      Created: ${req.created_at}`);
      });
    }
    
    // 2. Check service_request_documents table
    console.log('\n2. Checking service_request_documents table...');
    const docTableCheck = await query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'service_request_documents')"
    );
    console.log('   Table exists:', docTableCheck.rows[0].exists);
    
    if (docTableCheck.rows[0].exists) {
      const docCountResult = await query('SELECT COUNT(*) as count FROM service_request_documents');
      console.log('   Total document associations:', docCountResult.rows[0].count);
      
      if (parseInt(docCountResult.rows[0].count) > 0) {
        const docAssociations = await query(`
          SELECT srd.id, srd.service_request_id, srd.document_id, sr.title as request_title
          FROM service_request_documents srd
          JOIN service_requests sr ON srd.service_request_id = sr.id
          LIMIT 3
        `);
        
        console.log('\n   Sample document associations:');
        docAssociations.rows.forEach((assoc, index) => {
          console.log(`   ${index + 1}. Request: ${assoc.request_title}`);
          console.log(`      Document ID: ${assoc.document_id}`);
        });
      }
    }
    
    // 3. Check documents table
    console.log('\n3. Checking documents table...');
    const documentsTableCheck = await query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'documents')"
    );
    console.log('   Table exists:', documentsTableCheck.rows[0].exists);
    
    if (documentsTableCheck.rows[0].exists) {
      const docCount = await query('SELECT COUNT(*) as count FROM documents');
      console.log('   Total documents:', docCount.rows[0].count);
      
      if (parseInt(docCount.rows[0].count) > 0) {
        const recentDocs = await query(`
          SELECT id, filename, original_name, file_size, mime_type, uploaded_at
          FROM documents 
          ORDER BY uploaded_at DESC 
          LIMIT 3
        `);
        
        console.log('\n   Recent documents:');
        recentDocs.rows.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.original_name}`);
          console.log(`      Size: ${(doc.file_size / 1024).toFixed(2)} KB`);
          console.log(`      Type: ${doc.mime_type}`);
          console.log(`      Uploaded: ${doc.uploaded_at}`);
        });
      }
    }
    
    // 4. Test API response format
    console.log('\n4. Testing service request data format...');
    if (tableCheck.rows[0].exists && countResult.rows[0].count > 0) {
      const testRequest = await query(`
        SELECT 
          sr.*,
          u.first_name as client_first_name,
          u.last_name as client_last_name,
          u.email as client_email
        FROM service_requests sr
        JOIN users u ON sr.client_id = u.id
        LIMIT 1
      `);
      
      if (testRequest.rows.length > 0) {
        const req = testRequest.rows[0];
        console.log('   Sample API response format:');
        console.log('   ', JSON.stringify({
          id: req.id,
          title: req.title,
          budget_min: req.budget_min,
          budget_max: req.budget_max,
          client_first_name: req.client_first_name,
          client_last_name: req.client_last_name,
          client_email: req.client_email
        }, null, 2));
      }
    }
    
    console.log('\n✅ Service requests system test completed');
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

testServiceRequests();
