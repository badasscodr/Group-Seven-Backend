import pool from '../config/database';
import { uploadFile, getDownloadUrl } from './s3Service';
import { Document } from '../types';
import path from 'path';
import crypto from 'crypto';

// Generate UUID using Node.js crypto module
const generateUUID = () => crypto.randomUUID();

export const uploadDocument = async (
  file: Express.Multer.File,
  userId: string,
  category?: string,
  isPublic: boolean = false
): Promise<Document> => {
  try {
    // Generate unique filename
    const fileExtension = path.extname(file.originalname);
    const uniqueFilename = `${generateUUID()}${fileExtension}`;
    const s3Key = `documents/${category || 'general'}/${userId}/${uniqueFilename}`;

    // Upload to S3
    const uploadResult = await uploadFile(s3Key, file.buffer, file.mimetype);

    if (!uploadResult.success) {
      throw new Error('Failed to upload file to S3');
    }

    // Save to database
    const query = `
      INSERT INTO documents (
        user_id, filename, original_name, file_url, file_size,
        mime_type, category, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      userId,
      uniqueFilename,
      file.originalname,
      uploadResult.url,
      file.size,
      file.mimetype,
      category,
      isPublic
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  } catch (error) {
    console.error('Document upload error:', error);
    throw error;
  }
};

export const getUserDocuments = async (
  userId: string,
  filters: {
    category?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Document[]> => {
  let query = `
    SELECT * FROM documents
    WHERE user_id = $1
  `;

  const values: any[] = [userId];
  let paramCount = 1;

  if (filters.category) {
    paramCount++;
    query += ` AND category = $${paramCount}`;
    values.push(filters.category);
  }

  query += ` ORDER BY uploaded_at DESC`;

  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(filters.limit);
  }

  if (filters.offset) {
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(filters.offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};

export const getDocumentById = async (
  documentId: string,
  userId: string,
  userRole: string
): Promise<Document | null> => {
  let query = `
    SELECT d.*, u.first_name, u.last_name, u.email
    FROM documents d
    JOIN users u ON d.user_id = u.id
    WHERE d.id = $1
  `;

  const values = [documentId];

  // Access control - only owner or admin can access private documents
  if (userRole !== 'admin') {
    query += ` AND (d.user_id = $2 OR d.is_public = true)`;
    values.push(userId);
  }

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const generateDownloadUrl = async (
  documentId: string,
  userId: string,
  userRole: string,
  expiresIn: number = 3600 // 1 hour default
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // First check if user has access to the document
    const document = await getDocumentById(documentId, userId, userRole);

    if (!document) {
      return {
        success: false,
        error: 'Document not found or access denied'
      };
    }

    // Extract S3 key from the file URL
    const urlParts = document.file_url.split('/');
    const bucketIndex = urlParts.findIndex(part => part === process.env.S3_BUCKET_NAME);

    if (bucketIndex === -1) {
      return {
        success: false,
        error: 'Invalid file URL format'
      };
    }

    const s3Key = urlParts.slice(bucketIndex + 1).join('/');

    // Generate presigned URL
    const downloadResult = await getDownloadUrl(s3Key, expiresIn);

    return downloadResult;
  } catch (error) {
    console.error('Generate download URL error:', error);
    return {
      success: false,
      error: 'Failed to generate download URL'
    };
  }
};

export const deleteDocument = async (
  documentId: string,
  userId: string,
  userRole: string
): Promise<boolean> => {
  try {
    // Check if user has permission to delete
    const document = await getDocumentById(documentId, userId, userRole);

    if (!document) {
      return false;
    }

    // Only owner or admin can delete
    if (document.user_id !== userId && userRole !== 'admin') {
      return false;
    }

    // Delete from database
    const query = 'DELETE FROM documents WHERE id = $1';
    const result = await pool.query(query, [documentId]);

    // Note: We're not deleting from S3 here to prevent data loss
    // In production, you might want to implement a cleanup job

    return result.rowCount > 0;
  } catch (error) {
    console.error('Delete document error:', error);
    return false;
  }
};

export const updateDocumentMetadata = async (
  documentId: string,
  userId: string,
  userRole: string,
  updates: {
    category?: string;
    isPublic?: boolean;
  }
): Promise<Document | null> => {
  try {
    // Check if user has permission to update
    const document = await getDocumentById(documentId, userId, userRole);

    if (!document) {
      return null;
    }

    // Only owner or admin can update
    if (document.user_id !== userId && userRole !== 'admin') {
      return null;
    }

    const setClause = Object.keys(updates)
      .map((key, index) => {
        const dbKey = key === 'isPublic' ? 'is_public' : key;
        return `${dbKey} = $${index + 2}`;
      })
      .join(', ');

    const query = `
      UPDATE documents
      SET ${setClause}
      WHERE id = $1
      RETURNING *
    `;

    const values = [documentId, ...Object.values(updates)];
    const result = await pool.query(query, values);

    return result.rows[0] || null;
  } catch (error) {
    console.error('Update document metadata error:', error);
    return null;
  }
};

export const getAllDocuments = async (
  filters: {
    userId?: string;
    category?: string;
    isPublic?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Document[]> => {
  let query = `
    SELECT d.*, u.first_name, u.last_name, u.email
    FROM documents d
    JOIN users u ON d.user_id = u.id
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 0;

  if (filters.userId) {
    paramCount++;
    query += ` AND d.user_id = $${paramCount}`;
    values.push(filters.userId);
  }

  if (filters.category) {
    paramCount++;
    query += ` AND d.category = $${paramCount}`;
    values.push(filters.category);
  }

  if (filters.isPublic !== undefined) {
    paramCount++;
    query += ` AND d.is_public = $${paramCount}`;
    values.push(filters.isPublic);
  }

  query += ` ORDER BY d.uploaded_at DESC`;

  if (filters.limit) {
    paramCount++;
    query += ` LIMIT $${paramCount}`;
    values.push(filters.limit);
  }

  if (filters.offset) {
    paramCount++;
    query += ` OFFSET $${paramCount}`;
    values.push(filters.offset);
  }

  const result = await pool.query(query, values);
  return result.rows;
};