import express from 'express';
import { authenticate } from '../../core/middleware/auth';

const router = express.Router();

/**
 * @swagger
 * /api/supplier/profile:
 *   get:
 *     summary: Get supplier profile (placeholder)
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: Not implemented yet
 */
router.get('/profile', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Supplier profile endpoint not yet implemented in new modular structure'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/supplier/requests:
 *   get:
 *     summary: Browse available service requests (placeholder)
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: Not implemented yet
 */
router.get('/requests', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Supplier requests browse endpoint not yet implemented in new modular structure'
    },
    timestamp: new Date().toISOString()
  });
});

/**
 * @swagger
 * /api/supplier/quotations:
 *   get:
 *     summary: Get supplier quotations (placeholder)
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       501:
 *         description: Not implemented yet
 */
router.get('/quotations', authenticate, (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Supplier quotations endpoint not yet implemented in new modular structure'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;