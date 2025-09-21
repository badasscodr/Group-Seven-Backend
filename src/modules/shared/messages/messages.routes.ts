import express from 'express';
import { authenticate } from '../../../core/middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/messages:
 *   get:
 *     summary: Get user messages (placeholder)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: Not implemented yet
 */
router.get('/', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Messages endpoint not yet implemented in new modular structure'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/messages:
 *   post:
 *     summary: Send message (placeholder)
 *     tags: [Messages]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: Not implemented yet
 */
router.post('/', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Send message endpoint not yet implemented in new modular structure'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;