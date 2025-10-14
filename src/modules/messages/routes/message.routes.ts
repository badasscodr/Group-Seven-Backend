import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { MessageService } from '../services/message.service';
import { authMiddleware } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';

const router = Router();

// Get user conversations
router.get('/conversations',
  authMiddleware,
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { limit = 20, offset = 0 } = req.query;
    const conversations = await MessageService.getUserConversations(
      req.user!.id,
      limit as number,
      offset as number
    );
    res.json(conversations);
  })
);

// Create new conversation
router.post('/conversations',
  authMiddleware,
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('type').isIn(['direct', 'group']),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('participantIds').isArray({ min: 1 }),
  body('participantIds.*').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const conversation = await MessageService.createConversation(req.user!.id, req.body);
    res.status(201).json(conversation);
  })
);

// Get specific conversation
router.get('/conversations/:conversationId',
  authMiddleware,
  param('conversationId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const conversation = await MessageService.getConversation(
      req.params.conversationId,
      req.user!.id
    );
    res.json(conversation);
  })
);

// Get messages in conversation
router.get('/conversations/:conversationId/messages',
  authMiddleware,
  param('conversationId').isUUID(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('offset').optional().isInt({ min: 0 }).toInt(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    
    const messages = await MessageService.getMessages(
      conversationId,
      req.user!.id,
      limit as number,
      offset as number
    );
    
    res.json(messages);
  })
);

// Send message
router.post('/conversations/:conversationId/messages',
  authMiddleware,
  param('conversationId').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 4000 }),
  body('type').optional().isIn(['text', 'image', 'file', 'system']),
  body('replyToId').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    
    const message = await MessageService.sendMessage(req.user!.id, {
      conversationId,
      content: req.body.content,
      type: req.body.type,
      replyToId: req.body.replyToId
    });
    
    res.status(201).json(message);
  })
);

// Get specific message
router.get('/messages/:messageId',
  authMiddleware,
  param('messageId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const message = await MessageService.getMessage(
      req.params.messageId,
      req.user!.id
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  })
);

// Edit message
router.put('/messages/:messageId',
  authMiddleware,
  param('messageId').isUUID(),
  body('content').isString().trim().isLength({ min: 1, max: 4000 }),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const message = await MessageService.editMessage(
      req.params.messageId,
      req.user!.id,
      { content: req.body.content }
    );
    
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }
    
    res.json(message);
  })
);

// Delete message
router.delete('/messages/:messageId',
  authMiddleware,
  param('messageId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    try {
      await MessageService.deleteMessage(req.params.messageId, req.user!.id);
      res.status(204).send();
    } catch (error: any) {
      if (error.message === 'Message not found') {
        return res.status(404).json({ error: 'Message not found' });
      }
      throw error;
    }
  })
);

// Mark message as read
router.post('/messages/:messageId/read',
  authMiddleware,
  param('messageId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const marked = await MessageService.markAsRead(
      req.params.messageId,
      req.user!.id
    );
    
    res.json({ marked });
  })
);

// Get unread count
router.get('/unread-count',
  authMiddleware,
  query('conversationId').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { conversationId } = req.query;
    const count = await MessageService.getUnreadCount(
      req.user!.id,
      conversationId as string
    );
    
    res.json({ count });
  })
);

// Add participants to conversation
router.post('/conversations/:conversationId/participants',
  authMiddleware,
  param('conversationId').isUUID(),
  body('participantIds').isArray({ min: 1 }),
  body('participantIds.*').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    await MessageService.addParticipants(
      req.params.conversationId,
      req.user!.id,
      req.body.participantIds
    );
    
    res.status(204).send();
  })
);

// Remove participant from conversation
router.delete('/conversations/:conversationId/participants/:participantId',
  authMiddleware,
  param('conversationId').isUUID(),
  param('participantId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    await MessageService.removeParticipant(
      req.params.conversationId,
      req.user!.id,
      req.params.participantId
    );
    
    res.status(204).send();
  })
);

export default router;