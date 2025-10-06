import { Router } from 'express';
import { authenticate } from '../../core/middleware/auth';
import {
  createPaymentController,
  getPaymentsController,
  getPaymentController,
  updatePaymentController,
  deletePaymentController,
  getPaymentStatsController,
  getOverduePaymentsController
} from './payment.controller';

const router = Router();

/**
 * @swagger
 * /api/payments:
 *   post:
 *     summary: Create new payment record (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - quotationId
 *               - supplierId
 *               - clientId
 *               - amount
 *             properties:
 *               quotationId:
 *                 type: string
 *               supplierId:
 *                 type: string
 *               clientId:
 *                 type: string
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *                 default: USD
 *               paymentMethod:
 *                 type: string
 *               dueDate:
 *                 type: string
 *                 format: date
 *               invoiceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment record created successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Admin access required
 */
router.post('/', authenticate, createPaymentController);

/**
 * @swagger
 * /api/payments:
 *   get:
 *     summary: Get payments (role-based filtering)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, approved, processing, paid, rejected, cancelled]
 *       - in: query
 *         name: quotationId
 *         schema:
 *           type: string
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *     responses:
 *       200:
 *         description: Payments retrieved successfully
 */
router.get('/', authenticate, getPaymentsController);

/**
 * @swagger
 * /api/payments/stats:
 *   get:
 *     summary: Get payment statistics (role-based)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 */
router.get('/stats', authenticate, getPaymentStatsController);

/**
 * @swagger
 * /api/payments/overdue:
 *   get:
 *     summary: Get overdue payments (Admin/Supplier)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Overdue payments retrieved successfully
 */
router.get('/overdue', authenticate, getOverduePaymentsController);

/**
 * @swagger
 * /api/payments/{id}:
 *   get:
 *     summary: Get specific payment
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment retrieved successfully
 *       404:
 *         description: Payment not found
 */
router.get('/:id', authenticate, getPaymentController);

/**
 * @swagger
 * /api/payments/{id}:
 *   put:
 *     summary: Update payment (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, approved, processing, paid, rejected, cancelled]
 *               paymentMethod:
 *                 type: string
 *               paymentDate:
 *                 type: string
 *                 format: date
 *               dueDate:
 *                 type: string
 *                 format: date
 *               invoiceNumber:
 *                 type: string
 *               notes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment updated successfully
 *       404:
 *         description: Payment not found
 */
router.put('/:id', authenticate, updatePaymentController);

/**
 * @swagger
 * /api/payments/{id}:
 *   delete:
 *     summary: Delete payment (Admin only)
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment deleted successfully
 *       404:
 *         description: Payment not found
 */
router.delete('/:id', authenticate, deletePaymentController);

export default router;
