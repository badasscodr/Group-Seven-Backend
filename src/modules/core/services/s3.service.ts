import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand, CopyObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export class S3Service {
  private static client: S3Client;

  static initialize() {
    // Validate required environment variables
    const requiredVars = ['S3_ACCESS_KEY', 'S3_SECRET_KEY', 'S3_BUCKET_NAME'];
    const missing = requiredVars.filter(key => !process.env[key]);
    
    if (missing.length > 0) {
      console.error('❌ Missing S3 environment variables:', missing);
      throw new Error(`Missing required S3 configuration: ${missing.join(', ')}`);
    }
    
    this.client = new S3Client({
      region: process.env.AWS_REGION || 'auto',
      endpoint: process.env.S3_ENDPOINT,
      credentials: {
        accessKeyId: process.env.S3_ACCESS_KEY!,
        secretAccessKey: process.env.S3_SECRET_KEY!
      },
      forcePathStyle: true // Required for Cloudflare R2
    });
  }

  static async uploadFile(
    buffer: Buffer,
    key: string,
    contentType: string,
    isPublic: boolean = false
  ): Promise<string> {
    if (!this.client) {
      this.initialize();
    }

    const command = new PutObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key,
      Body: buffer,
      ContentType: contentType,
      ACL: isPublic ? 'public-read' : undefined
    });

    try {
      await this.client.send(command);
      
      // Return public URL if file is public, otherwise return key
      if (isPublic) {
        const publicDomain = process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT;
        // For Cloudflare R2, public URL should NOT include bucket name
        const url = `${publicDomain}/${key}`;
        return url;
      }
      
      return key; // Return key for private files
    } catch (error) {
      console.error('❌ S3 upload failed:', error.message);
      throw new Error(`Failed to upload file to S3: ${error.message}`);
    }
  }

  static async deleteFile(key: string): Promise<void> {
    if (!this.client) {
      this.initialize();
    }

    const command = new DeleteObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key
    });

    try {
      await this.client.send(command);
    } catch (error) {
      console.error('S3 delete error:', error);
      throw new Error('Failed to delete file from S3');
    }
  }

  static async getPresignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    if (!this.client) {
      this.initialize();
    }

    const command = new GetObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      Key: key
    });

    try {
      return await getSignedUrl(this.client, command, { expiresIn });
    } catch (error) {
      console.error('S3 presigned URL error:', error);
      throw new Error('Failed to generate presigned URL');
    }
  }

  static async copyFile(sourceKey: string, destinationKey: string): Promise<string> {
    if (!this.client) {
      this.initialize();
    }

    const command = new CopyObjectCommand({
      Bucket: process.env.S3_BUCKET_NAME!,
      CopySource: `${process.env.S3_BUCKET_NAME}/${sourceKey}`,
      Key: destinationKey
    });

    try {
      await this.client.send(command);
      
      // Return public URL
      return `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${destinationKey}`;
    } catch (error) {
      console.error('S3 copy error:', error);
      throw new Error('Failed to copy file in S3');
    }
  }

  static getPublicUrl(key: string): string {
    return `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/${key}`;
  }

  static getFileKeyFromUrl(url: string): string {
    const baseUrl = `${process.env.S3_PUBLIC_URL || process.env.S3_ENDPOINT}/${process.env.S3_BUCKET_NAME}/`;
    return url.replace(baseUrl, '');
  }
}