import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth';
import {
  uploadMiddleware,
  uploadDocuments,
  getDocuments,
  getDocument,
  updateDocumentMetadata,
  deleteDocumentById,
  downloadDocument,
  getDocumentStatistics,
  getPublicDocumentsList,
} from './documents.controller';

const router = Router();

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
 *           description: Document unique identifier
 *         userId:
 *           type: string
 *           format: uuid
 *           description: User ID who owns the document
 *         filename:
 *           type: string
 *           description: Unique filename in storage
 *         originalName:
 *           type: string
 *           description: Original filename uploaded by user
 *         fileUrl:
 *           type: string
 *           description: URL to access the file
 *         fileSize:
 *           type: integer
 *           description: File size in bytes
 *         mimeType:
 *           type: string
 *           description: MIME type of the file
 *         category:
 *           type: string
 *           enum: [resume, certificate, license, contract, invoice, passport, visa, insurance, other]
 *           description: Document category
 *         isPublic:
 *           type: boolean
 *           description: Whether the document is publicly accessible
 *         uploadedAt:
 *           type: string
 *           format: date-time
 *           description: Upload timestamp
 *
 *     DocumentUpload:
 *       type: object
 *       properties:
 *         category:
 *           type: string
 *           enum: [resume, certificate, license, contract, invoice, passport, visa, insurance, other]
 *           description: Document category
 *         isPublic:
 *           type: boolean
 *           description: Whether the document should be publicly accessible
 */

/**
 * @swagger
 * /api/documents:
 *   post:
 *     summary: Upload documents
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               documents:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Files to upload (max 5 files, 10MB each)
 *               category:
 *                 type: string
 *                 enum: [resume, certificate, license, contract, invoice, passport, visa, insurance, other]
 *                 default: other
 *               isPublic:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Documents uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     uploadedFiles:
 *                       type: integer
 *                     totalFiles:
 *                       type: integer
 *                     documents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Document'
 *       400:
 *         description: Invalid request or file validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, uploadMiddleware, uploadDocuments);

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
 *           enum: [resume, certificate, license, contract, invoice, passport, visa, insurance, other]
 *         description: Filter by document category
 *       - in: query
 *         name: isPublic
 *         schema:
 *           type: boolean
 *         description: Filter by public/private documents
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Maximum number of documents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of documents to skip
 *     responses:
 *       200:
 *         description: Documents retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     documents:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Document'
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         total:
 *                           type: integer
 *                         limit:
 *                           type: integer
 *                         offset:
 *                           type: integer
 *                         hasMore:
 *                           type: boolean
 *       401:
 *         description: Unauthorized
 */
router.get('/', authenticate, getDocuments);

/**
 * @swagger
 * /api/documents/stats:
 *   get:
 *     summary: Get document statistics for current user
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Document statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     stats:
 *                       type: object
 *                       properties:
 *                         totalDocuments:
 *                           type: integer
 *                         totalSize:
 *                           type: integer
 *                         documentsByCategory:
 *                           type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/stats', authenticate, getDocumentStatistics);

/**
 * @swagger
 * /api/documents/public:
 *   get:
 *     summary: Get public documents (admin only)
 *     tags: [Documents]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           enum: [resume, certificate, license, contract, invoice, passport, visa, insurance, other]
 *         description: Filter by document category
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *           maximum: 100
 *         description: Maximum number of documents to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of documents to skip
 *     responses:
 *       200:
 *         description: Public documents retrieved successfully
 *       403:
 *         description: Admin access required
 *       401:
 *         description: Unauthorized
 */
router.get('/public', authenticate, getPublicDocumentsList);

/**
 * @swagger
 * /api/documents/{id}:
 *   get:
 *     summary: Get specific document
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
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     document:
 *                       $ref: '#/components/schemas/Document'
 *       404:
 *         description: Document not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.get('/:id', authenticate, getDocument);

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
 *         description: Document ID
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
 *         description: Document updated successfully
 *       404:
 *         description: Document not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.put('/:id', authenticate, updateDocumentMetadata);

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
 *         description: Document ID
 *     responses:
 *       200:
 *         description: Document deleted successfully
 *       404:
 *         description: Document not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.delete('/:id', authenticate, deleteDocumentById);

/**
 * @swagger
 * /api/documents/{id}/download:
 *   get:
 *     summary: Generate secure download URL
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
 *         description: Document ID
 *       - in: query
 *         name: expires
 *         schema:
 *           type: integer
 *           default: 3600
 *         description: URL expiration time in seconds
 *     responses:
 *       200:
 *         description: Download URL generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     downloadUrl:
 *                       type: string
 *                     expiresIn:
 *                       type: integer
 *                     expiresAt:
 *                       type: string
 *                       format: date-time
 *       404:
 *         description: Document not found or access denied
 *       401:
 *         description: Unauthorized
 */
router.get('/:id/download', authenticate, downloadDocument);

export { router as documentsRoutes };