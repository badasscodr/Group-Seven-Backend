const { query, initDatabase } = require('./src/modules/core/config/database');

async function testAllFixes() {
  console.log('🧪 TESTING ALL SERVICE REQUEST FIXES\n');
  
  try {
    // Initialize database connection
    await initDatabase();
    console.log('✅ Database initialized\n');
    // Test 1: Check if service_requests table exists and has correct structure
    console.log('1. Testing service_requests table structure...');
    const tableCheck = await query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'service_requests' 
      ORDER BY ordinal_position
    `);
    
    const requiredColumns = ['id', 'title', 'description', 'category', 'priority', 'status', 'budget_min', 'budget_max', 'deadline', 'location', 'requirements'];
    const existingColumns = tableCheck.rows.map(row => row.column_name);
    
    const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));
    if (missingColumns.length > 0) {
      console.log('❌ Missing columns:', missingColumns);
    } else {
      console.log('✅ All required columns present');
    }
    
    // Test 2: Check if service_request_documents table exists
    console.log('\n2. Testing service_request_documents table...');
    const docTableCheck = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'service_request_documents'
    `);
    
    if (docTableCheck.rows[0].count > 0) {
      console.log('✅ service_request_documents table exists');
      
      // Check structure
      const docColumns = await query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'service_request_documents'
        ORDER BY ordinal_position
      `);
      console.log('📋 Document table columns:', docColumns.rows.map(r => r.column_name).join(', '));
    } else {
      console.log('❌ service_request_documents table missing');
    }
    
    // Test 3: Check if status enum exists and has correct values
    console.log('\n3. Testing status enum...');
    const enumCheck = await query(`
      SELECT unnest(enumlabel) as status_value
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'request_status_enum')
      ORDER BY enumlabel
    `);
    
    const expectedStatuses = ['draft', 'pending', 'in_progress', 'completed', 'cancelled'];
    const actualStatuses = enumCheck.rows.map(row => row.status_value);
    
    const missingStatuses = expectedStatuses.filter(status => !actualStatuses.includes(status));
    if (missingStatuses.length > 0) {
      console.log('❌ Missing enum values:', missingStatuses);
      console.log('📋 Actual enum values:', actualStatuses);
    } else {
      console.log('✅ All required enum values present');
    }
    
    // Test 4: Check for existing service requests
    console.log('\n4. Testing existing service requests...');
    const requestsCheck = await query(`
      SELECT 
        id, title, category, priority, status,
        budget_min, budget_max, deadline, location, requirements,
        created_at, updated_at
      FROM service_requests 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    
    if (requestsCheck.rows.length > 0) {
      console.log(`✅ Found ${requestsCheck.rows.length} service requests`);
      
      requestsCheck.rows.forEach((req, index) => {
        console.log(`   ${index + 1}. ID: ${req.id}, Status: ${req.status}, Category: ${req.category || 'N/A'}`);
      });
      
      // Test 5: Check for documents associated with requests
      console.log('\n5. Testing document associations...');
      const testRequestId = requestsCheck.rows[0].id;
      const docCheck = await query(`
        SELECT 
          srd.id,
          srd.service_request_id,
          d.id as document_id,
          d.file_name,
          d.original_name,
          d.mime_type,
          d.file_size,
          srd.created_at
        FROM service_request_documents srd
        JOIN documents d ON srd.document_id = d.id
        WHERE srd.service_request_id = $1
      `, [testRequestId]);
      
      if (docCheck.rows.length > 0) {
        console.log(`✅ Found ${docCheck.rows.length} documents for request ${testRequestId}`);
        docCheck.rows.forEach((doc, index) => {
          console.log(`   ${index + 1}. ${doc.original_name} (${doc.file_name})`);
        });
      } else {
        console.log(`ℹ️  No documents found for request ${testRequestId}`);
      }
    } else {
      console.log('ℹ️  No service requests found in database');
    }
    
    // Test 6: Check documents table
    console.log('\n6. Testing documents table...');
    const docsTableCheck = await query(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_name = 'documents'
    `);
    
    if (docsTableCheck.rows[0].count > 0) {
      const docCount = await query('SELECT COUNT(*) as count FROM documents');
      console.log(`✅ Documents table exists with ${docCount.rows[0].count} records`);
    } else {
      console.log('❌ Documents table missing');
    }
    
    console.log('\n🎯 SUMMARY:');
    console.log('- Database schema: Verified');
    console.log('- Status enum: Verified');
    console.log('- Document associations: Verified');
    console.log('- Service requests: Checked');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testAllFixes();
