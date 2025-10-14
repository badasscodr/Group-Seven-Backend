import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { FileService } from '../services/file.service';
import { authMiddleware } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { uploadMiddleware } from '../../core/middleware/upload';

const router = Router();

// Upload file
router.post('/upload',
  authMiddleware,
  uploadMiddleware.single('file'),
  body('isPublic').optional().isBoolean(),
  body('folderId').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const file = await FileService.uploadFile(
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user!.id,
      {
        isPublic: req.body.isPublic,
        folderId: req.body.folderId
      }
    );

    res.status(201).json(file);
  })
);

// Get file by ID
router.get('/:fileId',
  authMiddleware,
  param('fileId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const file = await FileService.getFile(req.params.fileId, req.user!.id);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    res.json(file);
  })
);

// Get user's files
router.get('/',
  authMiddleware,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('folderId').optional().isUUID(),
  query('mimeType').optional().isString(),
  query('isPublic').optional().isBoolean(),
  query('search').optional().isString().trim(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'fileName', 'fileSize']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { page, limit, folderId, mimeType, isPublic, search, sortBy, sortOrder } = req.query;
    const result = await FileService.getFiles(req.user!.id, {
      page: page as number,
      limit: limit as number,
      folderId: folderId as string,
      mimeType: mimeType as string,
      isPublic: isPublic as boolean,
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    });
    res.json(result);
  })
);

// Get public files
router.get('/public',
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('folderId').optional().isUUID(),
  query('mimeType').optional().isString(),
  query('search').optional().isString().trim(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'fileName', 'fileSize']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { page, limit, folderId, mimeType, search, sortBy, sortOrder } = req.query;
    const result = await FileService.getPublicFiles({
      page: page as number,
      limit: limit as number,
      folderId: folderId as string,
      mimeType: mimeType as string,
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    });
    res.json(result);
  })
);

// Update file
router.put('/:fileId',
  authMiddleware,
  param('fileId').isUUID(),
  body('fileName').optional().isString().trim().isLength({ min: 1, max: 255 }),
  body('isPublic').optional().isBoolean(),
  body('folderId').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const file = await FileService.updateFile(req.params.fileId, req.body, req.user!.id);
    res.json(file);
  })
);

// Delete file
router.delete('/:fileId',
  authMiddleware,
  param('fileId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    await FileService.deleteFile(req.params.fileId, req.user!.id);
    res.status(204).send();
  })
);

// Download file
router.get('/:fileId/download',
  authMiddleware,
  param('fileId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { file, url } = await FileService.downloadFile(req.params.fileId, req.user!.id);
    res.json({ file, downloadUrl: url });
  })
);

// Move file
router.post('/:fileId/move',
  authMiddleware,
  param('fileId').isUUID(),
  body('folderId').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const file = await FileService.moveFile(
      req.params.fileId,
      req.body.folderId || null,
      req.user!.id
    );
    res.json(file);
  })
);

// Copy file
router.post('/:fileId/copy',
  authMiddleware,
  param('fileId').isUUID(),
  body('folderId').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const file = await FileService.copyFile(
      req.params.fileId,
      req.body.folderId || null,
      req.user!.id
    );
    res.status(201).json(file);
  })
);

// Search files
router.get('/search/query',
  authMiddleware,
  query('q').isString().trim().isLength({ min: 1 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('folderId').optional().isUUID(),
  query('mimeType').optional().isString(),
  query('isPublic').optional().isBoolean(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { q, page, limit, folderId, mimeType, isPublic } = req.query;
    const files = await FileService.searchFiles(req.user!.id, q as string, {
      page: page as number,
      limit: limit as number,
      folderId: folderId as string,
      mimeType: mimeType as string,
      isPublic: isPublic as boolean
    });
    res.json(files);
  })
);

// Get file stats
router.get('/stats/summary',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const stats = await FileService.getFileStats(req.user!.id);
    res.json(stats);
  })
);

export default router;