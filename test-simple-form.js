const fs = require('fs');
const FormData = require('form-data');
const http = require('http');

function makeRequest(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => {
        body += chunk;
      });
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          resolve({ status: res.statusCode, data: result });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    if (data) {
      data.pipe(req);
    } else {
      req.end();
    }
  });
}

async function testCompleteFormSubmission() {
  try {
    console.log('🔍 Testing complete form submission flow...');
    
    // Step 1: Test document upload
    console.log('\n📤 Step 1: Testing document upload...');
    
    // Create test files
    const testContent1 = 'Test document 1 content';
    const testContent2 = 'Test document 2 content';
    fs.writeFileSync('test-doc-1.pdf', testContent1);
    fs.writeFileSync('test-doc-2.pdf', testContent2);
    
    // Create form data exactly like frontend
    const formData = new FormData();
    formData.append('documents', fs.createReadStream('test-doc-1.pdf'), {
      filename: 'test-document-1.pdf',
      contentType: 'application/pdf'
    });
    formData.append('documents', fs.createReadStream('test-doc-2.pdf'), {
      filename: 'test-document-2.pdf',
      contentType: 'application/pdf'
    });
    formData.append('category', 'service_request');
    formData.append('isPublic', 'false');
    
    console.log('📤 Sending document upload request...');
    
    const uploadOptions = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/documents',
      method: 'POST',
      headers: {
        ...formData.getHeaders(),
        'Authorization': 'Bearer fake-token-for-test'
      }
    };
    
    const uploadResponse = await makeRequest(uploadOptions, formData);
    console.log('📥 Upload response status:', uploadResponse.status);
    console.log('📥 Upload response body:', JSON.stringify(uploadResponse.data, null, 2));
    
    let uploadedDocumentIds = [];
    if (uploadResponse.data.success && uploadResponse.data.data) {
      if (uploadResponse.data.data.documents && Array.isArray(uploadResponse.data.data.documents)) {
        uploadedDocumentIds = uploadResponse.data.data.documents.map(doc => doc.id);
      } else if (Array.isArray(uploadResponse.data.data)) {
        uploadedDocumentIds = uploadResponse.data.data.map(doc => doc.id);
      } else if (uploadResponse.data.data.id) {
        uploadedDocumentIds = [uploadResponse.data.data.id];
      }
      console.log('✅ Extracted document IDs:', uploadedDocumentIds);
    }
    
    // Clean up test files
    fs.unlinkSync('test-doc-1.pdf');
    fs.unlinkSync('test-doc-2.pdf');
    
    // Step 2: Test service request creation with documents
    console.log('\n📝 Step 2: Testing service request creation with documents...');
    
    const requestData = {
      type: 'visa',
      title: 'Test Request with Documents',
      description: 'This is a test request with uploaded documents',
      priority: 'medium',
      budget_min: 100,
      budget_max: 500,
      deadline: '2025-12-30',
      location: 'Test City',
      requirements: 'Test requirements',
      documentIds: uploadedDocumentIds
    };
    
    console.log('📤 Sending service request creation request...');
    console.log('📋 Request data:', JSON.stringify(requestData, null, 2));
    
    const createOptions = {
      hostname: 'localhost',
      port: 8000,
      path: '/api/client/requests',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer fake-token-for-test',
        'Content-Length': Buffer.byteLength(JSON.stringify(requestData))
      }
    };
    
    const createResponse = await makeRequest(createOptions);
    console.log('📥 Create response status:', createResponse.status);
    console.log('📥 Create response body:', JSON.stringify(createResponse.data, null, 2));
    
    // Step 3: Verify the documents are associated with the request
    if (createResponse.data.success && createResponse.data.data) {
      const requestId = createResponse.data.data.id || createResponse.data.data.request?.id;
      if (requestId) {
        console.log('\n🔍 Step 3: Verifying document association...');
        console.log(`📋 Request ID: ${requestId}`);
        
        // Check database for document associations
        const { query, initDatabase } = require('./dist/modules/core/config/database');
        await initDatabase();
        
        const docResult = await query(`
          SELECT d.id, d.original_name, d.uploaded_at
          FROM documents d
          JOIN service_request_documents srd ON d.id = srd.document_id
          WHERE srd.service_request_id = $1
        `, [requestId]);
        
        console.log(`✅ Documents associated with request: ${docResult.rows.length}`);
        docResult.rows.forEach((doc, index) => {
          console.log(`  ${index + 1}. ${doc.original_name} (ID: ${doc.id})`);
        });
        
        if (docResult.rows.length === uploadedDocumentIds.length) {
          console.log('🎉 SUCCESS: All documents are properly associated with the request!');
        } else {
          console.log('❌ ERROR: Document count mismatch!');
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack trace:', error.stack);
  }
}

testCompleteFormSubmission();
