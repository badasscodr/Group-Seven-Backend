import { Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import { validateFile } from '../../core/services/cloudflare-r2.service';
import {
  uploadDocument,
  getUserDocuments,
  getDocumentById,
  updateDocument,
  deleteDocument,
  generateDocumentDownloadUrl,
  getDocumentStats,
  getPublicDocuments,
} from './documents.service';
import { DocumentCategory } from './documents.types';

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 5, // Maximum 5 files per request
  },
});

export const uploadMiddleware = upload.array('documents', 5);

/**
 * Upload document(s)
 * POST /api/documents
 */
export const uploadDocuments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILES',
          message: 'No files provided for upload',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { category = 'other', isPublic = false } = req.body;

    // Validate category
    const validCategories: DocumentCategory[] = [
      'resume',
      'certificate',
      'license',
      'contract',
      'invoice',
      'passport',
      'visa',
      'insurance',
      'other',
    ];

    if (!validCategories.includes(category)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_CATEGORY',
          message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Validate all files
    for (const file of files) {
      const validation = validateFile(file);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_FILE',
            message: validation.error,
          },
          timestamp: new Date().toISOString(),
        });
      }
    }

    // Upload all files
    const uploadResults = [];
    for (const file of files) {
      try {
        const result = await uploadDocument(req.user.sub, file, category, isPublic === 'true');
        uploadResults.push(result);
      } catch (error) {
        console.error('Error uploading file:', error);
        // Continue with other files, but log the error
      }
    }

    if (uploadResults.length === 0) {
      return res.status(500).json({
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: 'Failed to upload any files',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(201).json({
      success: true,
      data: {
        uploadedFiles: uploadResults.length,
        totalFiles: files.length,
        documents: uploadResults.map((result) => result.document),
      },
      message: `Successfully uploaded ${uploadResults.length} of ${files.length} files`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in uploadDocuments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get user's documents
 * GET /api/documents
 */
export const getDocuments = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { category, isPublic, limit = '50', offset = '0' } = req.query;

    const query = {
      category: category as DocumentCategory,
      isPublic: isPublic === 'true' ? true : isPublic === 'false' ? false : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await getUserDocuments(req.user.sub, query);

    res.status(200).json({
      success: true,
      data: {
        documents: result.documents,
        pagination: {
          total: result.total,
          limit: query.limit,
          offset: query.offset,
          hasMore: result.total > query.offset + query.limit,
        },
      },
      message: 'Documents retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getDocuments:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get specific document
 * GET /api/documents/:id
 */
export const getDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.sub;

    const document = await getDocumentById(id, userId);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found or access denied',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: { document },
      message: 'Document retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getDocument:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Update document metadata
 * PUT /api/documents/:id
 */
export const updateDocumentMetadata = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { id } = req.params;
    const { category, isPublic } = req.body;

    const updateData: any = {};

    if (category !== undefined) {
      const validCategories: DocumentCategory[] = [
        'resume',
        'certificate',
        'license',
        'contract',
        'invoice',
        'passport',
        'visa',
        'insurance',
        'other',
      ];

      if (!validCategories.includes(category)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_CATEGORY',
            message: `Invalid category. Must be one of: ${validCategories.join(', ')}`,
          },
          timestamp: new Date().toISOString(),
        });
      }

      updateData.category = category;
    }

    if (isPublic !== undefined) {
      updateData.isPublic = Boolean(isPublic);
    }

    const updatedDocument = await updateDocument(id, req.user.sub, updateData);

    if (!updatedDocument) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found or access denied',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: { document: updatedDocument },
      message: 'Document updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in updateDocumentMetadata:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Delete document
 * DELETE /api/documents/:id
 */
export const deleteDocumentById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { id } = req.params;

    const deleted = await deleteDocument(id, req.user.sub);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found or access denied',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: { deleted: true },
      message: 'Document deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in deleteDocumentById:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Generate secure download URL
 * GET /api/documents/:id/download
 */
export const downloadDocument = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { expires = '3600' } = req.query;
    const userId = req.user?.sub;

    const downloadUrl = await generateDocumentDownloadUrl(id, userId, parseInt(expires as string));

    if (!downloadUrl) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCUMENT_NOT_FOUND',
          message: 'Document not found or access denied',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: {
        downloadUrl,
        expiresIn: parseInt(expires as string),
        expiresAt: new Date(Date.now() + parseInt(expires as string) * 1000).toISOString(),
      },
      message: 'Download URL generated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in downloadDocument:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get document statistics
 * GET /api/documents/stats
 */
export const getDocumentStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const stats = await getDocumentStats(req.user.sub);

    res.status(200).json({
      success: true,
      data: { stats },
      message: 'Document statistics retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getDocumentStatistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get public documents (for admin)
 * GET /api/documents/public
 */
export const getPublicDocumentsList = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { category, limit = '50', offset = '0' } = req.query;

    const query = {
      category: category as DocumentCategory,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await getPublicDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        documents: result.documents,
        pagination: {
          total: result.total,
          limit: query.limit,
          offset: query.offset,
          hasMore: result.total > query.offset + query.limit,
        },
      },
      message: 'Public documents retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getPublicDocumentsList:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};