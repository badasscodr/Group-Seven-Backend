import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { FileService } from '../services/file.service';
import { authMiddleware } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { uploadMiddleware } from '../../core/middleware/upload';

const router = Router();

// Upload documents (multiple files support)
router.post('/',
  authMiddleware,
  uploadMiddleware.array('documents', 10), // Accept up to 10 files with field name 'documents'
  body('category').optional().isString(),
  body('isPublic').optional().isBoolean(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return res.status(400).json({ 
        success: false,
        error: 'No documents uploaded' 
      });
    }

    try {
      const uploadedDocuments = [];
      
      // Upload each file using direct database insertion for documents table
      const { query } = require('../../core/config/database');
      const S3Service = require('../../core/services/s3.service').S3Service;
      
      for (const file of req.files) {
        // Generate unique filename and S3 key
        const fileExtension = file.originalname.split('.').pop();
        const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExtension}`;
        const s3Key = `documents/${req.user!.id}/${uniqueFileName}`;
        
        // Upload to S3
        const s3Url = await S3Service.uploadFile(file.buffer, s3Key, file.mimetype);
        
        // Insert into documents table
        const insertQuery = `
          INSERT INTO documents (
            filename, original_name, mime_type, file_size, file_url, user_id, is_public
          ) VALUES ($1, $2, $3, $4, $5, $6, $7)
          RETURNING *
        `;
        
        const result = await query(insertQuery, [
          uniqueFileName,
          file.originalname,
          file.mimetype,
          file.size,
          s3Url,
          req.user!.id,
          req.body.isPublic === 'true'
        ]);
        
        uploadedDocuments.push(result.rows[0]);
      }

      res.status(201).json({
        success: true,
        data: {
          documents: uploadedDocuments,
          count: uploadedDocuments.length
        },
        message: `Successfully uploaded ${uploadedDocuments.length} document(s)`
      });
    } catch (error) {
      console.error('❌ Document upload failed:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload documents'
        }
      });
    }
  })
);

// Get user's documents
router.get('/',
  authMiddleware,
  query('category').optional().isString(),
  query('isPublic').optional().isBoolean(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { category, isPublic, limit, offset } = req.query;
    
    // Convert to FileQuery format
    const fileQuery: any = {
      page: offset ? Math.floor(offset / (limit || 10)) + 1 : 1,
      limit: limit || 10
    };
    
    if (isPublic !== undefined) {
      fileQuery.isPublic = isPublic === 'true';
    }

    try {
      const result = await FileService.getFiles(req.user!.id, fileQuery);
      
      // Transform response to match expected format
      const documents = result.files.map(file => ({
        ...file,
        category: 'document', // Default category
        uploadedAt: file.createdAt,
        downloadUrl: `/api/files/${file.id}/download`
      }));

      res.json({
        success: true,
        data: {
          documents,
          total: result.total,
          limit: fileQuery.limit,
          offset: offset || 0
        }
      });
    } catch (error) {
      console.error('❌ Failed to get documents:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch documents'
        }
      });
    }
  })
);

// Get specific document
router.get('/:documentId',
  authMiddleware,
  param('documentId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const document = await FileService.getFile(req.params.documentId, req.user!.id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found'
          }
        });
      }

      res.json({
        success: true,
        data: {
          ...document,
          category: 'document',
          uploadedAt: document.createdAt,
          downloadUrl: `/api/files/${document.id}/download`
        }
      });
    } catch (error) {
      console.error('❌ Failed to get document:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch document'
        }
      });
    }
  })
);

// Update document metadata
router.put('/:documentId',
  authMiddleware,
  param('documentId').isUUID(),
  body('category').optional().isString(),
  body('isPublic').optional().isBoolean(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const updateData: any = {};
      if (req.body.isPublic !== undefined) {
        updateData.isPublic = req.body.isPublic;
      }

      const document = await FileService.updateFile(req.params.documentId, updateData, req.user!.id);
      
      if (!document) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Document not found'
          }
        });
      }

      res.json({
        success: true,
        data: {
          ...document,
          category: 'document',
          uploadedAt: document.createdAt,
          downloadUrl: `/api/files/${document.id}/download`
        }
      });
    } catch (error) {
      console.error('❌ Failed to update document:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to update document'
        }
      });
    }
  })
);

// Delete document
router.delete('/:documentId',
  authMiddleware,
  param('documentId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    try {
      await FileService.deleteFile(req.params.documentId, req.user!.id);
      
      res.json({
        success: true,
        message: 'Document deleted successfully'
      });
    } catch (error) {
      console.error('❌ Failed to delete document:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DELETE_FAILED',
          message: 'Failed to delete document'
        }
      });
    }
  })
);

// Generate download URL
router.get('/:documentId/download',
  authMiddleware,
  param('documentId').isUUID(),
  query('expires').optional().isInt({ min: 60, max: 86400 }).toInt(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const expiresIn = req.query.expires || 3600; // Default 1 hour
      const { file, url } = await FileService.downloadFile(req.params.documentId, req.user!.id);
      
      res.json({
        success: true,
        data: {
          document: {
            ...file,
            category: 'document',
            uploadedAt: file.createdAt
          },
          downloadUrl: url,
          expiresIn
        }
      });
    } catch (error) {
      console.error('❌ Failed to generate download URL:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'DOWNLOAD_FAILED',
          message: 'Failed to generate download URL'
        }
      });
    }
  })
);

// Get document statistics
router.get('/stats/summary',
  authMiddleware,
  asyncHandler(async (req, res) => {
    try {
      const stats = await FileService.getFileStats(req.user!.id);
      
      res.json({
        success: true,
        data: {
          totalDocuments: stats.totalFiles,
          totalSize: stats.totalSize,
          storageUsed: stats.storageUsed,
          storageLimit: stats.storageLimit,
          fileTypes: stats.fileTypes
        }
      });
    } catch (error) {
      console.error('❌ Failed to get document stats:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'STATS_FAILED',
          message: 'Failed to get document statistics'
        }
      });
    }
  })
);

// Get public documents (admin only)
router.get('/public/list',
  authMiddleware,
  query('category').optional().isString(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { category, limit, offset } = req.query;
    
    // Convert to FileQuery format
    const fileQuery: any = {
      page: offset ? Math.floor(offset / (limit || 10)) + 1 : 1,
      limit: limit || 10
    };

    try {
      const result = await FileService.getPublicFiles(fileQuery);
      
      // Transform response to match expected format
      const documents = result.files.map(file => ({
        ...file,
        category: 'document',
        uploadedAt: file.createdAt,
        downloadUrl: `/api/files/${file.id}/download`
      }));

      res.json({
        success: true,
        data: {
          documents,
          total: result.total,
          limit: fileQuery.limit,
          offset: offset || 0
        }
      });
    } catch (error) {
      console.error('❌ Failed to get public documents:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'FETCH_FAILED',
          message: 'Failed to fetch public documents'
        }
      });
    }
  })
);

export default router;
