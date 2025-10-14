import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ConversationService } from '../services/conversation.service';
import { authMiddleware } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';

const router = Router();

// Create conversation
router.post('/',
  authMiddleware,
  body('type').isIn(['direct', 'group']),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('avatarUrl').optional().isURL(),
  body('participantIds').isArray({ min: 2 }),
  body('participantIds.*').isUUID(),
  body('adminIds').optional().isArray(),
  body('adminIds.*').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const conversation = await ConversationService.createConversation({
      ...req.body,
      createdBy: req.user!.id
    });
    res.status(201).json(conversation);
  })
);

// Get conversation by ID
router.get('/:conversationId',
  authMiddleware,
  param('conversationId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const conversation = await ConversationService.getConversation(
      req.params.conversationId, 
      req.user!.id
    );
    if (!conversation) {
      return res.status(404).json({ error: 'Conversation not found' });
    }
    res.json(conversation);
  })
);

// Get user's conversations
router.get('/',
  authMiddleware,
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('type').optional().isIn(['direct', 'group']),
  query('isActive').optional().isBoolean(),
  query('search').optional().isString().trim(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { page, limit, type, isActive, search } = req.query;
    const result = await ConversationService.getConversations(req.user!.id, {
      page: page as number,
      limit: limit as number,
      type: type as 'direct' | 'group',
      isActive: isActive as boolean,
      search: search as string
    });
    res.json(result);
  })
);

// Update conversation
router.put('/:conversationId',
  authMiddleware,
  param('conversationId').isUUID(),
  body('name').optional().isString().trim().isLength({ min: 1, max: 100 }),
  body('description').optional().isString().trim().isLength({ max: 500 }),
  body('avatarUrl').optional().isURL(),
  body('participantIds').optional().isArray({ min: 2 }),
  body('participantIds.*').optional().isUUID(),
  body('adminIds').optional().isArray(),
  body('adminIds.*').optional().isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const conversation = await ConversationService.updateConversation(
      req.params.conversationId,
      req.body,
      req.user!.id
    );
    res.json(conversation);
  })
);

// Add participant to conversation
router.post('/:conversationId/participants',
  authMiddleware,
  param('conversationId').isUUID(),
  body('participantId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const success = await ConversationService.addParticipant(
      req.params.conversationId,
      req.body.participantId,
      req.user!.id
    );
    res.json({ success });
  })
);

// Remove participant from conversation
router.delete('/:conversationId/participants/:participantId',
  authMiddleware,
  param('conversationId').isUUID(),
  param('participantId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const success = await ConversationService.removeParticipant(
      req.params.conversationId,
      req.params.participantId,
      req.user!.id
    );
    res.json({ success });
  })
);

// Add admin to conversation
router.post('/:conversationId/admins',
  authMiddleware,
  param('conversationId').isUUID(),
  body('adminId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const success = await ConversationService.addAdmin(
      req.params.conversationId,
      req.body.adminId,
      req.user!.id
    );
    res.json({ success });
  })
);

// Remove admin from conversation
router.delete('/:conversationId/admins/:adminId',
  authMiddleware,
  param('conversationId').isUUID(),
  param('adminId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const success = await ConversationService.removeAdmin(
      req.params.conversationId,
      req.params.adminId,
      req.user!.id
    );
    res.json({ success });
  })
);

// Leave conversation
router.post('/:conversationId/leave',
  authMiddleware,
  param('conversationId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const success = await ConversationService.leaveConversation(
      req.params.conversationId,
      req.user!.id
    );
    res.json({ success });
  })
);

// Deactivate conversation
router.post('/:conversationId/deactivate',
  authMiddleware,
  param('conversationId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const success = await ConversationService.deactivateConversation(
      req.params.conversationId,
      req.user!.id
    );
    res.json({ success });
  })
);

// Get conversation participants
router.get('/:conversationId/participants',
  authMiddleware,
  param('conversationId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const participants = await ConversationService.getParticipants(
      req.params.conversationId,
      req.user!.id
    );
    res.json(participants);
  })
);

// Mute/unmute conversation
router.post('/:conversationId/mute',
  authMiddleware,
  param('conversationId').isUUID(),
  body('isMuted').isBoolean(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const success = await ConversationService.muteConversation(
      req.params.conversationId,
      req.user!.id,
      req.body.isMuted
    );
    res.json({ success });
  })
);

// Find direct conversation with another user
router.get('/direct/:userId',
  authMiddleware,
  param('userId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const conversation = await ConversationService.findDirectConversation(
      req.user!.id,
      req.params.userId
    );
    res.json(conversation);
  })
);

export default router;