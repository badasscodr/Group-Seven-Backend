import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as messageController from '../controllers/messageController';
import {
  sendMessageValidation,
  markMessagesAsReadValidation,
  createNotificationValidation,
  markNotificationsAsReadValidation,
  handleValidationErrors
} from '../utils/validation';

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         senderId:
 *           type: string
 *           format: uuid
 *         recipientId:
 *           type: string
 *           format: uuid
 *         subject:
 *           type: string
 *         content:
 *           type: string
 *         isRead:
 *           type: boolean
 *         messageType:
 *           type: string
 *           enum: [direct, service_request, job_application, system]
 *         referenceId:
 *           type: string
 *           format: uuid
 *         createdAt:
 *           type: string
 *           format: date-time
 *
 *     Notification:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *         userId:
 *           type: string
 *           format: uuid
 *         title:
 *           type: string
 *         content:
 *           type: string
 *         type:
 *           type: string
 *           enum: [message, application, interview, payment, document, system, reminder]
 *         isRead:
 *           type: boolean
 *         actionUrl:
 *           type: string
 *           format: uri
 *         createdAt:
 *           type: string
 *           format: date-time
 */

// Message Routes

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
 *               - recipientId
 *               - content
 *             properties:
 *               recipientId:
 *                 type: string
 *                 format: uuid
 *               subject:
 *                 type: string
 *               content:
 *                 type: string
 *               messageType:
 *                 type: string
 *                 enum: [direct, service_request, job_application, system]
 *               referenceId:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       201:
 *         description: Message sent successfully
 *       400:
 *         description: Invalid input data
 */
router.post('/',
  authenticate,
  sendMessageValidation,
  handleValidationErrors,
  messageController.sendMessage
);

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get user messages
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [sent, received]
 *         description: Filter by message type
 *       - in: query
 *         name: messageType
 *         schema:
 *           type: string
 *           enum: [direct, service_request, job_application, system]
 *         description: Filter by message category
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
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
 *     responses:
 *       200:
 *         description: Messages retrieved successfully
 */
router.get('/',
  authenticate,
  messageController.getUserMessages
);

/**
 * @swagger
 * /api/messages/stats:
 *   get:
 *     summary: Get message statistics
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Message statistics retrieved successfully
 */
router.get('/stats',
  authenticate,
  messageController.getMessageStats
);

/**
 * @swagger
 * /api/messages/mark-read:
 *   put:
 *     summary: Mark multiple messages as read
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
 *               - messageIds
 *             properties:
 *               messageIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Messages marked as read successfully
 */
router.put('/mark-read',
  authenticate,
  markMessagesAsReadValidation,
  handleValidationErrors,
  messageController.markMessagesAsRead
);

/**
 * @swagger
 * /api/messages/conversation/{otherUserId}:
 *   get:
 *     summary: Get conversation with another user
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: otherUserId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
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
 *     responses:
 *       200:
 *         description: Conversation retrieved successfully
 */
router.get('/conversation/:otherUserId',
  authenticate,
  messageController.getConversation
);

/**
 * @swagger
 * /api/messages/{id}:
 *   get:
 *     summary: Get message by ID
 *     tags: [Messages]
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
 *         description: Message retrieved successfully
 *       404:
 *         description: Message not found
 */
router.get('/:id',
  authenticate,
  messageController.getMessageById
);

/**
 * @swagger
 * /api/messages/{id}/read:
 *   put:
 *     summary: Mark message as read
 *     tags: [Messages]
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
 *         description: Message marked as read
 *       404:
 *         description: Message not found
 */
router.put('/:id/read',
  authenticate,
  messageController.markMessageAsRead
);

/**
 * @swagger
 * /api/messages/{id}:
 *   delete:
 *     summary: Delete message
 *     tags: [Messages]
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
 *         description: Message deleted successfully
 *       404:
 *         description: Message not found
 */
router.delete('/:id',
  authenticate,
  messageController.deleteMessage
);

export default router;