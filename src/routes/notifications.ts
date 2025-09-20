import express from 'express';
import { authenticate, authorize } from '../middleware/auth';
import * as messageController from '../controllers/messageController';
import {
  createNotificationValidation,
  markNotificationsAsReadValidation,
  handleValidationErrors
} from '../utils/validation';

const router = express.Router();

/**
 * @swagger
 * /api/notifications:
 *   post:
 *     summary: Create a notification (admin only)
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *               - title
 *               - content
 *               - type
 *             properties:
 *               userId:
 *                 type: string
 *                 format: uuid
 *               title:
 *                 type: string
 *               content:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [message, application, interview, payment, document, system, reminder]
 *               actionUrl:
 *                 type: string
 *                 format: uri
 *     responses:
 *       201:
 *         description: Notification created successfully
 *       400:
 *         description: Invalid input data
 *       403:
 *         description: Access denied
 */
router.post('/',
  authenticate,
  authorize(['admin']),
  createNotificationValidation,
  handleValidationErrors,
  messageController.createNotification
);

/**
 * @swagger
 * /api/notifications:
 *   get:
 *     summary: Get user notifications
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [message, application, interview, payment, document, system, reminder]
 *         description: Filter by notification type
 *       - in: query
 *         name: isRead
 *         schema:
 *           type: boolean
 *         description: Filter by read status
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of notifications to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *         description: Number of notifications to skip
 *     responses:
 *       200:
 *         description: Notifications retrieved successfully
 */
router.get('/',
  authenticate,
  messageController.getUserNotifications
);

/**
 * @swagger
 * /api/notifications/stats:
 *   get:
 *     summary: Get notification statistics
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Notification statistics retrieved successfully
 */
router.get('/stats',
  authenticate,
  messageController.getNotificationStats
);

/**
 * @swagger
 * /api/notifications/mark-read:
 *   put:
 *     summary: Mark multiple notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - notificationIds
 *             properties:
 *               notificationIds:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: uuid
 *     responses:
 *       200:
 *         description: Notifications marked as read successfully
 */
router.put('/mark-read',
  authenticate,
  markNotificationsAsReadValidation,
  handleValidationErrors,
  messageController.markNotificationsAsRead
);

/**
 * @swagger
 * /api/notifications/mark-all-read:
 *   put:
 *     summary: Mark all notifications as read
 *     tags: [Notifications]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All notifications marked as read successfully
 */
router.put('/mark-all-read',
  authenticate,
  messageController.markAllNotificationsAsRead
);

/**
 * @swagger
 * /api/notifications/{id}/read:
 *   put:
 *     summary: Mark notification as read
 *     tags: [Notifications]
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
 *         description: Notification marked as read
 *       404:
 *         description: Notification not found
 */
router.put('/:id/read',
  authenticate,
  messageController.markNotificationAsRead
);

/**
 * @swagger
 * /api/notifications/{id}:
 *   delete:
 *     summary: Delete notification
 *     tags: [Notifications]
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
 *         description: Notification deleted successfully
 *       404:
 *         description: Notification not found
 */
router.delete('/:id',
  authenticate,
  messageController.deleteNotification
);

export default router;