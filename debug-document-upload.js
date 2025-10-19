const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

// Test document upload endpoint directly
async function testDocumentUpload() {
  try {
    console.log('🔍 Testing Document Upload Endpoint');
    console.log('=====================================');

    // Create a test file
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, 'This is a test document for upload testing.');

    // Create form data
    const form = new FormData();
    form.append('documents', fs.createReadStream(testFilePath));
    form.append('category', 'service_request');
    form.append('isPublic', 'false');

    // Get auth token (you'll need to replace this with a valid token)
    const authToken = 'YOUR_AUTH_TOKEN_HERE'; // Replace with actual token

    console.log('📤 Sending request to: http://localhost:8000/api/documents');
    console.log('📋 Form data:');
    console.log('   - documents: test-document.txt');
    console.log('   - category: service_request');
    console.log('   - isPublic: false');

    const response = await fetch('http://localhost:8000/api/documents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${authToken}`,
        ...form.getHeaders()
      },
      body: form
    });

    console.log(`📥 Response status: ${response.status}`);
    console.log('📥 Response headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('📥 Response body:', responseText);

    try {
      const responseData = JSON.parse(responseText);
      console.log('✅ Parsed response:', JSON.stringify(responseData, null, 2));
    } catch (e) {
      console.log('❌ Response is not valid JSON');
    }

    // Clean up test file
    fs.unlinkSync(testFilePath);

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

// Test if backend is running
async function testBackendHealth() {
  try {
    console.log('🏥 Testing backend health...');
    const response = await fetch('http://localhost:8000/api/health');
    console.log(`Health check status: ${response.status}`);
    const data = await response.json();
    console.log('Health check response:', data);
  } catch (error) {
    console.error('❌ Backend health check failed:', error.message);
    console.log('💡 Make sure the backend is running on port 8000');
  }
}

async function main() {
  await testBackendHealth();
  console.log('\n');
  await testDocumentUpload();
}

if (require.main === module) {
  main();
}

module.exports = { testDocumentUpload, testBackendHealth };
