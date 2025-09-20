import { S3Client, PutObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  endpoint: process.env.S3_ENDPOINT!,
  region: process.env.S3_REGION || 'auto',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
  forcePathStyle: true, // Required for Cloudflare R2
});

export const uploadFile = async (key: string, body: Buffer, contentType: string) => {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  try {
    const result = await s3Client.send(command);
    return {
      success: true,
      url: `${process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${key}`,
      etag: result.ETag,
    };
  } catch (error) {
    console.error('S3 upload error:', error);
    throw error;
  }
};

export const getDownloadUrl = async (key: string, expiresIn: number = 3600) => {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });

  try {
    const url = await getSignedUrl(s3Client, command, { expiresIn });
    return { success: true, url };
  } catch (error) {
    console.error('S3 presigned URL error:', error);
    throw error;
  }
};

export const testS3Connection = async () => {
  try {
    // Test with a simple text file upload
    const testKey = `test/connection-test-${Date.now()}.txt`;
    const testContent = Buffer.from('S3 connection test');

    const result = await uploadFile(testKey, testContent, 'text/plain');
    return {
      success: true,
      message: 'S3/Cloudflare R2 connection successful',
      testFile: result.url,
    };
  } catch (error) {
    return {
      success: false,
      message: 'S3/Cloudflare R2 connection failed',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
};