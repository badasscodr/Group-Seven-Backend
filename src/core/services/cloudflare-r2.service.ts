import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, HeadObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { randomUUID } from 'crypto';
import path from 'path';

// Cloudflare R2 Configuration
const r2Client = new S3Client({
  region: process.env.S3_REGION || 'auto',
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY!,
    secretAccessKey: process.env.S3_SECRET_KEY!,
  },
});

const BUCKET_NAME = process.env.S3_BUCKET_NAME!;

export interface UploadResult {
  fileUrl: string;
  filename: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
}

export interface FileMetadata {
  originalName: string;
  mimeType: string;
  fileSize: number;
  userId: string;
  category?: string;
}

/**
 * Generate a unique filename with proper folder structure
 */
export const generateFileKey = (userId: string, category: string, originalName: string): string => {
  const fileExtension = path.extname(originalName);
  const uniqueId = randomUUID();
  const timestamp = Date.now();

  // Create folder structure: category/userId/timestamp-uniqueId.ext
  return `${category}/${userId}/${timestamp}-${uniqueId}${fileExtension}`;
};

/**
 * Upload file to Cloudflare R2
 */
export const uploadFileToR2 = async (
  buffer: Buffer,
  metadata: FileMetadata
): Promise<UploadResult> => {
  try {
    const { originalName, mimeType, fileSize, userId, category = 'documents' } = metadata;

    // Generate unique file key
    const fileKey = generateFileKey(userId, category, originalName);

    // Upload command
    const uploadCommand = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
      Body: buffer,
      ContentType: mimeType,
      ContentLength: fileSize,
      Metadata: {
        'original-name': originalName,
        'user-id': userId,
        'category': category,
        'upload-date': new Date().toISOString(),
      },
    });

    // Execute upload
      await r2Client.send(uploadCommand);

    // Generate public URL
    // If PUBLIC_R2_DOMAIN is set, use it for public access
    // Otherwise, fall back to R2 endpoint (requires presigned URLs for access)
    let fileUrl: string;

    if (process.env.PUBLIC_R2_DOMAIN) {
      // Use custom domain or R2.dev public domain
      fileUrl = `${process.env.PUBLIC_R2_DOMAIN}/${fileKey}`;
    } else {
      // Use R2 endpoint (note: this requires the bucket to be public or use presigned URLs)
      fileUrl = `${process.env.S3_ENDPOINT?.replace('//', `//${BUCKET_NAME}.`)}/${fileKey}`;
    }

    return {
      fileUrl,
      filename: fileKey,
      originalName,
      fileSize,
      mimeType,
    };
  } catch (error) {
    console.error('Error uploading file to R2:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
};

/**
 * Generate signed URL for secure file download
 */
export const generateDownloadUrl = async (
  fileKey: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<string> => {
  try {
    const command = new GetObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const signedUrl = await getSignedUrl(r2Client, command, { expiresIn });
    return signedUrl;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Delete file from Cloudflare R2
 */
export const deleteFileFromR2 = async (fileKey: string): Promise<void> => {
  try {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await r2Client.send(deleteCommand);
  } catch (error) {
    console.error('Error deleting file from R2:', error);
    throw new Error('Failed to delete file from cloud storage');
  }
};

/**
 * Check if file exists in R2
 */
export const fileExistsInR2 = async (fileKey: string): Promise<boolean> => {
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    await r2Client.send(headCommand);
    return true;
  } catch (error: any) {
    if (error.name === 'NotFound') {
      return false;
    }
    throw error;
  }
};

/**
 * Get file metadata from R2
 */
export const getFileMetadata = async (fileKey: string) => {
  try {
    const headCommand = new HeadObjectCommand({
      Bucket: BUCKET_NAME,
      Key: fileKey,
    });

    const response = await r2Client.send(headCommand);
    return {
      contentType: response.ContentType,
      contentLength: response.ContentLength,
      lastModified: response.LastModified,
      metadata: response.Metadata,
    };
  } catch (error) {
    console.error('Error getting file metadata:', error);
    throw new Error('Failed to get file metadata');
  }
};

/**
 * Validate file type and size
 */
export const validateFile = (file: Express.Multer.File): { valid: boolean; error?: string } => {
  const allowedMimeTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp',
    'text/plain',
    'text/csv',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  ];

  const maxFileSize = 10 * 1024 * 1024; // 10MB

  if (!allowedMimeTypes.includes(file.mimetype)) {
    return {
      valid: false,
      error: `File type ${file.mimetype} is not allowed. Allowed types: ${allowedMimeTypes.join(', ')}`,
    };
  }

  if (file.size > maxFileSize) {
    return {
      valid: false,
      error: `File size ${file.size} bytes exceeds maximum allowed size of ${maxFileSize} bytes (10MB)`,
    };
  }

  return { valid: true };
};

export default r2Client;