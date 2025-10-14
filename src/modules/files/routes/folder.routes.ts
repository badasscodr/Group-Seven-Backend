import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { FileService } from '../services/file.service';
import { authMiddleware } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';

const router = Router();

// Create folder
router.post('/',
  authMiddleware,
  body('name').isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('parentId').optional().isUUID(),
  body('isPublic').optional().isBoolean(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const folder = await FileService.createFolder(req.body, req.user!.id);
    res.status(201).json(folder);
  })
);

// Get folder by ID
router.get('/:folderId',
  authMiddleware,
  param('folderId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const folder = await FileService.getFolder(req.params.folderId, req.user!.id);
    if (!folder) {
      return res.status(404).json({ error: 'Folder not found' });
    }
    res.json(folder);
  })
);

// Get folder contents
router.get('/:folderId/contents',
  authMiddleware,
  param('folderId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const contents = await FileService.getFolderContents(req.params.folderId, req.user!.id);
    res.json(contents);
  })
);

// Get user's folders
router.get('/',
  authMiddleware,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('parentId').optional().isUUID(),
  query('isPublic').optional().isBoolean(),
  query('search').optional().isString().trim(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { page, limit, parentId, isPublic, search, sortBy, sortOrder } = req.query;
    const result = await FileService.getFolders(req.user!.id, {
      page: page as number,
      limit: limit as number,
      parentId: parentId as string,
      isPublic: isPublic as boolean,
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    });
    res.json(result);
  })
);

// Get public folders
router.get('/public/list',
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('parentId').optional().isUUID(),
  query('search').optional().isString().trim(),
  query('sortBy').optional().isIn(['createdAt', 'updatedAt', 'name']),
  query('sortOrder').optional().isIn(['asc', 'desc']),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { page, limit, parentId, search, sortBy, sortOrder } = req.query;
    const result = await FileService.getPublicFolders({
      page: page as number,
      limit: limit as number,
      parentId: parentId as string,
      search: search as string,
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    });
    res.json(result);
  })
);

// Update folder
router.put('/:folderId',
  authMiddleware,
  param('folderId').isUUID(),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('parentId').optional().isUUID(),
  body('isPublic').optional().isBoolean(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const folder = await FileService.updateFolder(req.params.folderId, req.body, req.user!.id);
    res.json(folder);
  })
);

// Delete folder
router.delete('/:folderId',
  authMiddleware,
  param('folderId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    await FileService.deleteFolder(req.params.folderId, req.user!.id);
    res.status(204).send();
  })
);

// Get folder tree
router.get('/tree/structure',
  authMiddleware,
  query('parentId').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const tree = await FileService.getFolderTree(req.user!.id, req.query.parentId as string);
    res.json(tree);
  })
);

// Search folders
router.get('/search/query',
  authMiddleware,
  query('q').isString().trim().isLength({ min: 1 }),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('parentId').optional().isUUID(),
  query('isPublic').optional().isBoolean(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { q, page, limit, parentId, isPublic } = req.query;
    const folders = await FileService.searchFolders(req.user!.id, q as string, {
      page: page as number,
      limit: limit as number,
      parentId: parentId as string,
      isPublic: isPublic as boolean
    });
    res.json(folders);
  })
);

export default router;