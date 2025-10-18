const { query } = require('./dist/core/config/database');

async function checkServiceRequestsSchema() {
  try {
    console.log('🔍 Checking service_requests table schema...');
    
    // Check if service_requests table exists
    const tableResult = await query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_requests'"
    );
    
    console.log('service_requests table exists:', tableResult.rows.length > 0);
    
    if (tableResult.rows.length > 0) {
      console.log('✅ Table found');
      
      // Show structure of service_requests table
      const columns = await query(
        "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_name = 'service_requests' ORDER BY ordinal_position"
      );
      console.log('\n📋 service_requests table structure:');
      columns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
      });
      
      // Check if there are any service requests
      const requestCount = await query('SELECT COUNT(*) as count FROM service_requests');
      console.log('\n📊 Number of service requests:', requestCount.rows[0].count);
      
      // Show sample data with budget fields
      if (parseInt(requestCount.rows[0].count) > 0) {
        const sampleData = await query('SELECT id, title, budget_min, budget_max, deadline, location FROM service_requests LIMIT 3');
        console.log('\n📝 Sample service requests:');
        sampleData.rows.forEach(req => {
          console.log(`  - ID: ${req.id}, Title: ${req.title}, Budget: ${req.budget_min} - ${req.budget_max}, Location: ${req.location}`);
        });
      }
      
    } else {
      console.log('❌ service_requests table NOT found');
    }
    
    // Check service_request_documents table
    console.log('\n🔍 Checking service_request_documents table...');
    const docTableResult = await query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'service_request_documents'"
    );
    
    console.log('service_request_documents table exists:', docTableResult.rows.length > 0);
    
    if (docTableResult.rows.length > 0) {
      const docColumns = await query(
        "SELECT column_name, data_type, is_nullable FROM information_schema.columns WHERE table_name = 'service_request_documents' ORDER BY ordinal_position"
      );
      console.log('\n📋 service_request_documents table structure:');
      docColumns.rows.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
      });
      
      // Check for any documents
      const docCount = await query('SELECT COUNT(*) as count FROM service_request_documents');
      console.log('\n📄 Number of service request documents:', docCount.rows[0].count);
      
      if (parseInt(docCount.rows[0].count) > 0) {
        const sampleDocs = await.query(`
          SELECT srd.id, srd.service_request_id, srd.document_id, sr.title as request_title
          FROM service_request_documents srd
          JOIN service_requests sr ON srd.service_request_id = sr.id
          LIMIT 3
        `);
        console.log('\n📝 Sample document associations:');
        sampleDocs.rows.forEach(doc => {
          console.log(`  - ID: ${doc.id}, Request: ${doc.request_title}, Document ID: ${doc.document_id}`);
        });
      }
    } else {
      console.log('❌ service_request_documents table NOT found - need to run migration');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
    process.exit(1);
  }
}

checkServiceRequestsSchema();
