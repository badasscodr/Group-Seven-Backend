import express from 'express';
import { authenticate } from '../../../core/middleware/auth';
import { MessagesController } from './messages.controller';
import { MessagesService } from './messages.service';
import pool from '../../../core/config/database';

const router = express.Router();

// Initialize service and controller
const messagesService = new MessagesService(pool);
const messagesController = new MessagesController(messagesService);

/**
 * @swagger
 * /api/messages/conversations:
 *   get:
 *     summary: Get user conversations
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of conversations to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of conversations to skip
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for filtering conversations
 *     responses:
 *       200:
 *         description: List of conversations
 *       401:
 *         description: Unauthorized
 */
router.get('/conversations', authenticate, messagesController.getConversations);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/messages:
 *   get:
 *     summary: Get messages for a conversation
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of messages to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of messages to skip
 *       - in: query
 *         name: before
 *         schema:
 *           type: string
 *         description: Get messages before this timestamp
 *     responses:
 *       200:
 *         description: List of messages
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.get('/conversations/:conversationId/messages', authenticate, messagesController.getMessages);

/**
 * @swagger
 * /api/messages/conversations/{conversationId}/read:
 *   post:
 *     summary: Mark conversation as read
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: conversationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Conversation ID
 *     responses:
 *       200:
 *         description: Conversation marked as read
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Conversation not found
 */
router.post('/conversations/:conversationId/read', authenticate, messagesController.markAsRead);

/**
 * @swagger
 * /api/messages/conversations/with/{otherUserId}:
 *   get:
 *     summary: Get or create conversation with specific user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: string
 *         description: Other user ID
 *     responses:
 *       200:
 *         description: Conversation details
 *       401:
 *         description: Unauthorized
 *       400:
 *         description: Invalid request
 */
router.get('/conversations/with/:otherUserId', authenticate, messagesController.getOrCreateConversation);

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send a message
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *               - recipientId
 *             properties:
 *               content:
 *                 type: string
 *                 description: Message content
 *               recipientId:
 *                 type: string
 *                 description: Recipient user ID
 *               messageType:
 *                 type: string
 *                 enum: [text, file, image]
 *                 default: text
 *               fileUrl:
 *                 type: string
 *                 description: File URL for file/image messages
 *               fileName:
 *                 type: string
 *                 description: File name for file messages
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post('/', authenticate, messagesController.sendMessage);

/**
 * @swagger
 * /api/messages/users/search:
 *   get:
 *     summary: Search users for messaging
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query
 *       - in: query
 *         name: role
 *         schema:
 *           type: string
 *         description: Filter by user role
 *     responses:
 *       200:
 *         description: List of users
 *       401:
 *         description: Unauthorized
 */
router.get('/users/search', authenticate, messagesController.searchUsers);

export default router;