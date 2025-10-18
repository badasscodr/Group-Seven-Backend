const { query, initDatabase } = require('./dist/modules/core/config/database');
const { FileService } = require('./dist/modules/files/services/file.service');
const fs = require('fs');
const path = require('path');

async function testRealUserUpload() {
  try {
    await initDatabase();
    console.log('🔍 Getting real user ID...');
    
    // Get a real user from the database
    const userResult = await query('SELECT id, email, first_name FROM users LIMIT 3');
    console.log('Found', userResult.rows.length, 'users:');
    userResult.rows.forEach((user, index) => {
      console.log(`${index + 1}. ${user.first_name} (${user.email})`);
      console.log(`   ID: ${user.id}`);
    });
    
    if (userResult.rows.length > 0) {
      const realUserId = userResult.rows[0].id;
      console.log('\n✅ Using real user ID:', realUserId);
      
      // Create test file
      const testContent = 'This is a test document for upload testing.';
      const testFilePath = path.join(__dirname, 'test-document-real-user.txt');
      fs.writeFileSync(testFilePath, testContent);
      
      const fileBuffer = fs.readFileSync(testFilePath);
      
      console.log('\n🔄 Testing file upload with real user ID...');
      try {
        const uploadedFile = await FileService.uploadFile(
          fileBuffer,
          'test-document-real-user.txt',
          'text/plain',
          realUserId,
          { isPublic: false }
        );
        
        console.log('✅ File uploaded successfully!');
        console.log('📄 File details:', {
          id: uploadedFile.id,
          fileName: uploadedFile.fileName,
          originalName: uploadedFile.originalName,
          fileSize: uploadedFile.fileSize,
          s3Key: uploadedFile.s3Key,
          s3Url: uploadedFile.s3Url
        });
        
        // Check if it's in the database
        console.log('\n🔍 Checking database...');
        const docCheck = await query('SELECT * FROM documents WHERE id = $1', [uploadedFile.id]);
        if (docCheck.rows.length > 0) {
          console.log('✅ Document found in database!');
          console.log('📄 Database record:', {
            id: docCheck.rows[0].id,
            filename: docCheck.rows[0].filename,
            original_name: docCheck.rows[0].original_name,
            file_size: docCheck.rows[0].file_size
          });
        }
        
        // Clean up
        fs.unlinkSync(testFilePath);
        console.log('\n🗑️ Test file cleaned up');
        
      } catch (error) {
        console.log('❌ Upload still failed:', error.message);
        console.log('📋 Error details:', error);
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testRealUserUpload();
