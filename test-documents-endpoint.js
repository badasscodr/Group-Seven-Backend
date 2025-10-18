const fs = require('fs');
const path = require('path');

// Test the documents endpoint directly
async function testDocumentsEndpoint() {
  try {
    console.log('🔍 Testing documents endpoint directly...\n');

    // Create a test file
    const testContent = 'This is a test document for upload testing.';
    const testFilePath = path.join(__dirname, 'test-document.txt');
    fs.writeFileSync(testFilePath, testContent);
    console.log('✅ Created test file:', testFilePath);

    // Test the documents route loading
    console.log('\n1. Testing documents route loading...');
    try {
      const documentsRoutes = require('./dist/modules/files/routes/documents.routes');
      console.log('   ✅ Documents route loaded successfully');
      console.log('   ✅ Route type:', typeof documentsRoutes);
    } catch (error) {
      console.log('   ❌ Documents route loading failed:', error.message);
      return;
    }

    // Test FileService directly
    console.log('\n2. Testing FileService directly...');
    try {
      const { FileService } = require('./dist/modules/files/services/file.service');
      
      // Read test file
      const fileBuffer = fs.readFileSync(testFilePath);
      
      console.log('   ✅ FileService loaded');
      console.log('   ✅ Test file read, size:', fileBuffer.length, 'bytes');
      
      // Test database connection
      const { initDatabase } = require('./dist/modules/core/config/database');
      await initDatabase();
      console.log('   ✅ Database initialized');
      
      // Test file upload (this will test S3Service as well)
      console.log('   🔄 Testing file upload...');
      try {
        const uploadedFile = await FileService.uploadFile(
          fileBuffer,
          'test-document.txt',
          'text/plain',
          '00000000-0000-0000-0000-000000000000', // Test user ID
          {
            isPublic: false
          }
        );
        
        console.log('   ✅ File uploaded successfully!');
        console.log('   📄 File details:', {
          id: uploadedFile.id,
          fileName: uploadedFile.fileName,
          originalName: uploadedFile.originalName,
          fileSize: uploadedFile.fileSize,
          mimeType: uploadedFile.mimeType,
          s3Key: uploadedFile.s3Key,
          s3Url: uploadedFile.s3Url
        });
        
        // Test file retrieval
        console.log('   🔄 Testing file retrieval...');
        const retrievedFile = await FileService.getFile(uploadedFile.id, '00000000-0000-0000-0000-000000000000');
        console.log('   ✅ File retrieved successfully');
        console.log('   📄 Retrieved file details:', {
          id: retrievedFile.id,
          fileName: retrievedFile.fileName,
          fileSize: retrievedFile.fileSize
        });
        
        // Clean up test file
        fs.unlinkSync(testFilePath);
        console.log('   🗑️ Test file cleaned up');
        
        console.log('\n✅ Documents endpoint test completed successfully!');
        console.log('🚀 File upload and retrieval working correctly!');
        
      } catch (uploadError) {
        console.log('   ❌ File upload failed:', uploadError.message);
        console.log('   📋 Error details:', uploadError);
        
        // Check if it's an S3 configuration issue
        if (uploadError.message.includes('S3') || uploadError.message.includes('AWS') || uploadError.message.includes('Cloudflare')) {
          console.log('   🔍 This appears to be an S3/Cloudflare R2 configuration issue');
          console.log('   💡 Please check your S3 environment variables:');
          console.log('      - AWS_ACCESS_KEY_ID');
          console.log('      - AWS_SECRET_ACCESS_KEY');
          console.log('      - AWS_REGION');
          console.log('      - S3_BUCKET_NAME');
          console.log('      - AWS_ENDPOINT_URL (for Cloudflare R2)');
        }
      }
      
    } catch (serviceError) {
      console.log('   ❌ FileService test failed:', serviceError.message);
      console.log('   📋 Error details:', serviceError);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testDocumentsEndpoint();
