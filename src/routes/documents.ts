import express from 'express';
import multer from 'multer';
import { authenticate, authorize } from '../middleware/auth';
import * as documentController from '../controllers/documentController';
import {
  documentUploadValidation,
  documentUpdateValidation,
  handleValidationErrors
} from '../utils/validation';

const router = express.Router();

// Configure multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1
  },
  fileFilter: (req, file, cb) => {
    // Allowed file types
    const allowedMimes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'text/plain',
      'application/zip',
      'application/x-zip-compressed'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('File type not allowed. Allowed types: PDF, DOC, DOCX, JPG, PNG, WEBP, TXT, ZIP'));
    }
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Document:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         filename:
 *           type: string
 *         originalName:
 *           type: string
 *         fileUrl:
 *           type: string
 *           format: uri
 *         fileSize:
 *           type: integer
 *         mimeType:
 *           type: string
 *         category:
 *           type: string
 *           enum: [resume, certificate, license, contract, invoice, passport, visa, insurance, other]
 *         isPublic:
 *           type: boolean
 *         uploadedAt:
 *           type: string
 *           format: date-time
 */

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Upload a document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required:
 *               - file
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               category:
 *                 type: string
 *                 enum: [resume, certificate, license, contract, invoice, passport, visa, insurance, other]
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Document uploaded successfully
 *       400:
 *         description: Invalid file or validation error
 */
router.post('/',
  authenticate,
  upload.single('file'),
  documentUploadValidation,
  handleValidationErrors,
  documentController.uploadDocument
);

/**
 * @swagger
 * /api/documents:
 *   get:
 *     summary: Get user's documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by document category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of documents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of documents to skip
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 */
router.get('/',
  authenticate,
  documentController.getUserDocuments
);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get document by ID
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *       404:
 *         description: Document not found or access denied
 */
router.get('/:id',
  authenticate,
  documentController.getDocumentById
);

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Get document download URL
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: expires
 *         schema:
 *           type: integer
 *         description: URL expiration time in seconds (default 3600)
 *     responses:
 *       200:
 *         description: Download URL generated successfully
 *       404:
 *         description: Document not found or access denied
 */
router.get('/:id/download',
  authenticate,
  documentController.downloadDocument
);

/**
 * @swagger
 * /api/documents/{id}:
 *   put:
 *     summary: Update document metadata
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: string
 *                 enum: [resume, certificate, license, contract, invoice, passport, visa, insurance, other]
 *               isPublic:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Document metadata updated successfully
 *       404:
 *         description: Document not found or access denied
 */
router.put('/:id',
  authenticate,
  documentUpdateValidation,
  handleValidationErrors,
  documentController.updateDocumentMetadata
);

/**
 * @swagger
 * /api/documents/{id}:
 *   delete:
 *     summary: Delete document
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found or access denied
 */
router.delete('/:id',
  authenticate,
  documentController.deleteDocument
);

// Admin routes
/**
 * @swagger
 * /api/admin/documents:
 *   get:
 *     summary: Get all documents (admin only)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Filter by user ID
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by document category
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public/private status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of documents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of documents to skip
 *     responses:
 *       200:
 *         description: All documents retrieved successfully
 */
router.get('/admin/all',
  authenticate,
  authorize(['admin']),
  documentController.getAllDocuments
);

export default router;