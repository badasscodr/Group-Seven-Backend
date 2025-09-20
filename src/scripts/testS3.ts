import dotenv from 'dotenv';
import { testS3Connection } from '../services/s3Service';

dotenv.config();

const testS3 = async () => {
  console.log('🔄 Testing S3/Cloudflare R2 connection...');
  console.log(`📊 Endpoint: ${process.env.S3_ENDPOINT}`);
  console.log(`📊 Bucket: ${process.env.S3_BUCKET_NAME}`);
  console.log(`📊 Region: ${process.env.S3_REGION}`);

  try {
    const result = await testS3Connection();

    if (result.success) {
      console.log('✅ S3/Cloudflare R2 connection successful!');
      console.log(`📄 Test file uploaded: ${result.testFile}`);
    } else {
      console.log('❌ S3/Cloudflare R2 connection failed:');
      console.log(`   Error: ${result.error}`);
    }
  } catch (error) {
    console.error('❌ S3 test failed:', error);
  }
};

testS3().then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Test script failed:', error);
  process.exit(1);
});