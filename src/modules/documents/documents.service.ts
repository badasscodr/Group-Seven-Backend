import pool from '../../core/config/database';
import { uploadFileToR2, deleteFileFromR2, generateDownloadUrl, FileMetadata } from '../../core/services/cloudflare-r2.service';
import {
  Document,
  CreateDocumentData,
  UpdateDocumentData,
  DocumentListQuery,
  DocumentUploadResult,
  DocumentStats,
  DocumentCategory,
} from './documents.types';

/**
 * Upload a document file and save metadata to database
 */
export const uploadDocument = async (
  userId: string,
  file: Express.Multer.File,
  category: DocumentCategory = 'other',
  isPublic: boolean = false
): Promise<DocumentUploadResult> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Upload file to Cloudflare R2
    const fileMetadata: FileMetadata = {
      originalName: file.originalname,
      mimeType: file.mimetype,
      fileSize: file.size,
      userId,
      category,
    };

    const uploadResult = await uploadFileToR2(file.buffer, fileMetadata);

    // Save document metadata to database
    const insertQuery = `
      INSERT INTO documents (
        "userId", "filename", "originalName", "fileUrl", "fileSize",
        "mimeType", "category", "isPublic"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;

    const values = [
      userId,
      uploadResult.filename,
      uploadResult.originalName,
      uploadResult.fileUrl,
      uploadResult.fileSize,
      uploadResult.mimeType,
      category,
      isPublic,
    ];

    const result = await client.query(insertQuery, values);
    await client.query('COMMIT');

    const document = result.rows[0];

    return {
      document: {
        id: document.id,
        userId: document.userId,
        filename: document.filename,
        originalName: document.originalName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        category: document.category,
        isPublic: document.isPublic,
        uploadedAt: document.uploadedAt,
      },
      uploadResult,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error uploading document:', error);
    throw new Error('Failed to upload document');
  } finally {
    client.release();
  }
};

/**
 * Get user's documents with optional filtering
 */
export const getUserDocuments = async (
  userId: string,
  query: DocumentListQuery = {}
): Promise<{ documents: Document[]; total: number }> => {
  try {
    const { category, isPublic, limit = 50, offset = 0 } = query;

    let whereClause = 'WHERE "userId" = $1';
    const params: any[] = [userId];
    let paramIndex = 2;

    if (category !== undefined) {
      whereClause += ` AND "category" = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    if (isPublic !== undefined) {
      whereClause += ` AND "isPublic" = $${paramIndex}`;
      params.push(isPublic);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS "total"
      FROM documents
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get documents with pagination
    const documentsQuery = `
      SELECT *
      FROM documents
      ${whereClause}
      ORDER BY "uploadedAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const documentsResult = await pool.query(documentsQuery, params);

    const documents: Document[] = documentsResult.rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      filename: row.filename,
      originalName: row.originalName,
      fileUrl: row.fileUrl,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      category: row.category,
      isPublic: row.isPublic,
      uploadedAt: row.uploadedAt,
    }));

    return { documents, total };
  } catch (error) {
    console.error('Error getting user documents:', error);
    throw new Error('Failed to retrieve documents');
  }
};

/**
 * Get a specific document by ID
 */
export const getDocumentById = async (documentId: string, userId?: string): Promise<Document | null> => {
  try {
    let query = `
      SELECT d.*, u."firstName", u."lastName", u."role"
      FROM documents d
      JOIN users u ON d."userId" = u."id"
      WHERE d."id" = $1
    `;
    const params = [documentId];

    // If userId is provided, ensure user can only access their own documents or public ones
    if (userId) {
      query += ` AND (d."userId" = $2 OR d."isPublic" = true)`;
      params.push(userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      filename: row.filename,
      originalName: row.originalName,
      fileUrl: row.fileUrl,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      category: row.category,
      isPublic: row.isPublic,
      uploadedAt: row.uploadedAt,
    };
  } catch (error) {
    console.error('Error getting document by ID:', error);
    throw new Error('Failed to retrieve document');
  }
};

/**
 * Update document metadata
 */
export const updateDocument = async (
  documentId: string,
  userId: string,
  updateData: UpdateDocumentData
): Promise<Document | null> => {
  try {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updateData.category !== undefined) {
      setClauses.push(`"category" = $${paramIndex}`);
      params.push(updateData.category);
      paramIndex++;
    }

    if (updateData.isPublic !== undefined) {
      setClauses.push(`"isPublic" = $${paramIndex}`);
      params.push(updateData.isPublic);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      throw new Error('No update data provided');
    }

    const updateQuery = `
      UPDATE documents
      SET ${setClauses.join(', ')}
      WHERE "id" = $${paramIndex} AND "userId" = $${paramIndex + 1}
      RETURNING *
    `;
    params.push(documentId, userId);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      filename: row.filename,
      originalName: row.originalName,
      fileUrl: row.fileUrl,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      category: row.category,
      isPublic: row.isPublic,
      uploadedAt: row.uploadedAt,
    };
  } catch (error) {
    console.error('Error updating document:', error);
    throw new Error('Failed to update document');
  }
};

/**
 * Delete a document
 */
export const deleteDocument = async (documentId: string, userId: string): Promise<boolean> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get document details first
    const getDocQuery = 'SELECT * FROM documents WHERE "id" = $1 AND "userId" = $2';
    const docResult = await client.query(getDocQuery, [documentId, userId]);

    if (docResult.rows.length === 0) {
      return false;
    }

    const document = docResult.rows[0];

    // Delete from database
    const deleteQuery = 'DELETE FROM documents WHERE "id" = $1 AND "userId" = $2';
    await client.query(deleteQuery, [documentId, userId]);

    // Delete from Cloudflare R2
    try {
      await deleteFileFromR2(document.filename);
    } catch (error) {
      console.warn('Failed to delete file from R2, continuing with database deletion:', error);
    }

    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error deleting document:', error);
    throw new Error('Failed to delete document');
  } finally {
    client.release();
  }
};

/**
 * Generate secure download URL for a document
 */
export const generateDocumentDownloadUrl = async (
  documentId: string,
  userId?: string,
  expiresIn: number = 3600
): Promise<string | null> => {
  try {
    const document = await getDocumentById(documentId, userId);

    if (!document) {
      return null;
    }

    // Generate signed URL for secure download
    const downloadUrl = await generateDownloadUrl(document.filename, expiresIn);
    return downloadUrl;
  } catch (error) {
    console.error('Error generating download URL:', error);
    throw new Error('Failed to generate download URL');
  }
};

/**
 * Get document statistics for a user
 */
export const getDocumentStats = async (userId: string): Promise<DocumentStats> => {
  try {
    const query = `
      SELECT
        COUNT(*) AS "totalDocuments",
        SUM("fileSize") AS "totalSize",
        "category",
        COUNT(*) AS "categoryCount"
      FROM documents
      WHERE "userId" = $1
      GROUP BY "category"
    `;

    const result = await pool.query(query, [userId]);

    const stats: DocumentStats = {
      totalDocuments: 0,
      totalSize: 0,
      documentsByCategory: {} as Record<DocumentCategory, number>,
    };

    result.rows.forEach((row) => {
      stats.totalDocuments += parseInt(row.categoryCount);
      stats.totalSize += parseInt(row.totalSize || 0);
      stats.documentsByCategory[row.category as DocumentCategory] = parseInt(row.categoryCount);
    });

    return stats;
  } catch (error) {
    console.error('Error getting document stats:', error);
    throw new Error('Failed to get document statistics');
  }
};

/**
 * Get all public documents (for admin/public viewing)
 */
export const getPublicDocuments = async (
  query: DocumentListQuery = {}
): Promise<{ documents: Document[]; total: number }> => {
  try {
    const { category, limit = 50, offset = 0 } = query;

    let whereClause = 'WHERE "isPublic" = true';
    const params: any[] = [];
    let paramIndex = 1;

    if (category !== undefined) {
      whereClause += ` AND "category" = $${paramIndex}`;
      params.push(category);
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS "total"
      FROM documents
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get documents with pagination
    const documentsQuery = `
      SELECT d.*, u."firstName", u."lastName", u."role"
      FROM documents d
      JOIN users u ON d."userId" = u."id"
      ${whereClause}
      ORDER BY d."uploadedAt" DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const documentsResult = await pool.query(documentsQuery, params);

    const documents: Document[] = documentsResult.rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      filename: row.filename,
      originalName: row.originalName,
      fileUrl: row.fileUrl,
      fileSize: row.fileSize,
      mimeType: row.mimeType,
      category: row.category,
      isPublic: row.isPublic,
      uploadedAt: row.uploadedAt,
    }));

    return { documents, total };
  } catch (error) {
    console.error('Error getting public documents:', error);
    throw new Error('Failed to retrieve public documents');
  }
};