import { Response } from 'express';
import { validationResult } from 'express-validator';
import * as documentService from '../services/documentService';
import { AuthenticatedRequest } from '../middleware/auth';

export const uploadDocument = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No file provided'
        },
        timestamp: new Date().toISOString()
      });
    }

    const { category, isPublic } = req.body;
    const userId = req.user!.sub;

    const document = await documentService.uploadDocument(
      req.file,
      userId,
      category,
      isPublic === 'true' || isPublic === true
    );

    res.status(201).json({
      success: true,
      data: document,
      message: 'Document uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Upload document error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to upload document'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getUserDocuments = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const userId = req.user!.sub;
    const filters = {
      category: req.query.category as string,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const documents = await documentService.getUserDocuments(userId, filters);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: documents.length
        }
      },
      message: 'Documents retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user documents error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve documents'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getDocumentById = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    const userRole = req.user!.role;

    const document = await documentService.getDocumentById(id!, userId, userRole);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found or access denied'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: document,
      message: 'Document retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get document by ID error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve document'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const downloadDocument = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    const userRole = req.user!.role;
    const expiresIn = req.query.expires ? parseInt(req.query.expires as string) : 3600;

    const result = await documentService.generateDownloadUrl(id!, userId, userRole, expiresIn);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOWNLOAD_ERROR',
          message: result.error || 'Failed to generate download URL'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: {
        downloadUrl: result.url,
        expiresIn: expiresIn
      },
      message: 'Download URL generated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Download document error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to generate download URL'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const deleteDocument = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;
    const userRole = req.user!.role;

    const deleted = await documentService.deleteDocument(id!, userId, userRole);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found or access denied'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Document deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete document error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete document'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const updateDocumentMetadata = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const { id } = req.params;
    const userId = req.user!.sub;
    const userRole = req.user!.role;
    const { category, isPublic } = req.body;

    const updates: any = {};
    if (category !== undefined) updates.category = category;
    if (isPublic !== undefined) updates.isPublic = isPublic;

    const document = await documentService.updateDocumentMetadata(id!, userId, userRole, updates);

    if (!document) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found or access denied'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: document,
      message: 'Document metadata updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Update document metadata error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to update document metadata'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Admin-only functions
export const getAllDocuments = async (req: AuthenticatedRequest, res: Response): Promise<any> => {
  try {
    const isPublicParam = req.query.isPublic as string | undefined;
    const filters: {
      userId?: string;
      category?: string;
      isPublic?: boolean;
      limit: number;
      offset: number;
    } = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    if (req.query.userId) {
      filters.userId = req.query.userId as string;
    }
    if (req.query.category) {
      filters.category = req.query.category as string;
    }
    if (isPublicParam !== undefined) {
      filters.isPublic = isPublicParam === 'true';
    }

    const documents = await documentService.getAllDocuments(filters);

    res.json({
      success: true,
      data: {
        documents,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: documents.length
        }
      },
      message: 'All documents retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get all documents error:', error);
    return res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve documents'
      },
      timestamp: new Date().toISOString()
    });
  }
};