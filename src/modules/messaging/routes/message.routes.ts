import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { MessageService } from '../services/message.service';
import { authMiddleware } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { uploadMiddleware } from '../../core/middleware/upload';

const router = Router();

// Send message
router.post('/',
  authMiddleware,
  body('conversationId').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 4000 }),
  body('messageType').optional().isIn(['text', 'image', 'file', 'system']),
  body('replyToId').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const message = await MessageService.sendMessage({
      ...req.body,
      senderId: req.user!.id
    });
    res.status(201).json(message);
  })
);

// Get message by ID
router.get('/:messageId',
  authMiddleware,
  param('messageId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const message = await MessageService.getMessage(req.params.messageId, req.user!.id);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    res.json(message);
  })
);

// Get messages in conversation
router.get('/conversation/:conversationId',
  authMiddleware,
  param('conversationId').isUUID(),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('before').optional().isISO8601().toDate(),
  query('after').optional().isISO8601().toDate(),
  query('search').optional().isString().trim(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { page, limit, before, after, search } = req.query;
    const result = await MessageService.getMessages(req.params.conversationId, {
      conversationId: req.params.conversationId,
      page: page as number,
      limit: limit as number,
      before: before as Date,
      after: after as Date,
      search: search as string
    }, req.user!.id);
    res.json(result);
  })
);

// Update message
router.put('/:messageId',
  authMiddleware,
  param('messageId').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 4000 }),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const message = await MessageService.updateMessage(
      req.params.messageId, 
      req.body, 
      req.user!.id
    );
    res.json(message);
  })
);

// Delete message
router.delete('/:messageId',
  authMiddleware,
  param('messageId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    await MessageService.deleteMessage(req.params.messageId, req.user!.id);
    res.status(204).send();
  })
);

// Mark message as read
router.post('/:messageId/read',
  authMiddleware,
  param('messageId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const success = await MessageService.markMessageAsRead(req.params.messageId, req.user!.id);
    res.json({ success });
  })
);

// Mark conversation as read
router.post('/conversation/:conversationId/read',
  authMiddleware,
  param('conversationId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const count = await MessageService.markConversationAsRead(req.params.conversationId, req.user!.id);
    res.json({ markedCount: count });
  })
);

// Get unread count for conversation
router.get('/conversation/:conversationId/unread',
  authMiddleware,
  param('conversationId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const count = await MessageService.getUnreadCount(req.params.conversationId, req.user!.id);
    res.json({ count });
  })
);

// Get all unread counts
router.get('/unread/all',
  authMiddleware,
  asyncHandler(async (req, res) => {
    const counts = await MessageService.getAllUnreadCounts(req.user!.id);
    res.json(counts);
  })
);

// Upload attachment
router.post('/:messageId/attachments',
  authMiddleware,
  param('messageId').isUUID(),
  uploadMiddleware.single('file'),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const attachment = await MessageService.uploadAttachment(
      req.params.messageId,
      req.file.buffer,
      req.file.originalname,
      req.file.mimetype,
      req.user!.id
    );

    res.status(201).json(attachment);
  })
);

// Delete attachment
router.delete('/attachments/:attachmentId',
  authMiddleware,
  param('attachmentId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    await MessageService.deleteAttachment(req.params.attachmentId, req.user!.id);
    res.status(204).send();
  })
);

// Search messages in conversation
router.get('/conversation/:conversationId/search',
  authMiddleware,
  param('conversationId').isUUID(),
  query('q').isString().trim().isLength({ min: 1 }),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const messages = await MessageService.searchMessages(
      req.params.conversationId,
      req.query.q as string,
      req.user!.id
    );
    res.json(messages);
  })
);

export default router;