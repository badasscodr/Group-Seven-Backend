import express from 'express';
import { authenticate } from '../middleware/auth';
import { serviceRequestValidation, handleValidationErrors } from '../utils/validation';
import { body } from 'express-validator';
import {
  createServiceRequestController,
  getServiceRequestController,
  getServiceRequestsController,
  updateServiceRequestController,
  deleteServiceRequestController,
  createQuotationController,
  getQuotationsController,
  updateQuotationStatusController,
} from '../controllers/serviceRequestController';

const router = express.Router();

// Service Request Routes
/**
 * @swagger
 * /api/client/requests:
 *   get:
 *     summary: Get client's service requests
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, in_progress, completed, cancelled, on_hold]
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
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
 *         description: Service requests retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/requests', authenticate, getServiceRequestsController);

/**
 * @swagger
 * /api/client/requests:
 *   post:
 *     summary: Create a new service request
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - description
 *               - category
 *               - priority
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 10
 *                 maxLength: 255
 *               description:
 *                 type: string
 *                 minLength: 50
 *                 maxLength: 2000
 *               category:
 *                 type: string
 *                 enum: [construction, maintenance, consulting, technology, legal, other]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               budgetMin:
 *                 type: number
 *                 minimum: 0
 *               budgetMax:
 *                 type: number
 *                 minimum: 0
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               requirements:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service request created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post('/requests', authenticate, serviceRequestValidation, handleValidationErrors, createServiceRequestController);

/**
 * @swagger
 * /api/client/requests/{id}:
 *   get:
 *     summary: Get specific service request details
 *     tags: [Service Requests]
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
 *         description: Service request retrieved successfully
 *       404:
 *         description: Service request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/requests/:id', authenticate, getServiceRequestController);

/**
 * @swagger
 * /api/client/requests/{id}:
 *   put:
 *     summary: Update service request
 *     tags: [Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *               priority:
 *                 type: string
 *               status:
 *                 type: string
 *               budgetMin:
 *                 type: number
 *               budgetMax:
 *                 type: number
 *               deadline:
 *                 type: string
 *                 format: date-time
 *               location:
 *                 type: string
 *               requirements:
 *                 type: string
 *     responses:
 *       200:
 *         description: Service request updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Service request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.put('/requests/:id', authenticate, updateServiceRequestController);

/**
 * @swagger
 * /api/client/requests/{id}:
 *   delete:
 *     summary: Delete service request
 *     tags: [Service Requests]
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
 *       204:
 *         description: Service request deleted successfully
 *       404:
 *         description: Service request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.delete('/requests/:id', authenticate, deleteServiceRequestController);

/**
 * @swagger
 * /api/client/requests/{id}/quotations:
 *   get:
 *     summary: Get quotations for a service request
 *     tags: [Service Requests]
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
 *         description: Quotations retrieved successfully
 *       404:
 *         description: Service request not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.get('/requests/:serviceRequestId/quotations', authenticate, getQuotationsController);

// Supplier Routes
/**
 * @swagger
 * /api/supplier/requests/{id}/quote:
 *   post:
 *     summary: Submit quotation for service request
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 minimum: 0
 *               description:
 *                 type: string
 *               estimatedDuration:
 *                 type: string
 *               termsConditions:
 *                 type: string
 *               validUntil:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Quotation submitted successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.post('/requests/:serviceRequestId/quote',
  authenticate,
  [
    body('amount')
      .isFloat({ min: 0 })
      .withMessage('Amount must be a positive number'),
    body('description')
      .optional()
      .trim()
      .isLength({ max: 1000 })
      .withMessage('Description must not exceed 1000 characters'),
    body('estimatedDuration')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Estimated duration must not exceed 100 characters'),
    body('validUntil')
      .optional()
      .isISO8601()
      .withMessage('Valid until must be a valid date')
      .custom((value) => {
        if (new Date(value) <= new Date()) {
          throw new Error('Valid until date must be in the future');
        }
        return true;
      }),
  ],
  handleValidationErrors,
  createQuotationController
);

// Quotation status update (for clients)
/**
 * @swagger
 * /api/quotations/{id}/status:
 *   put:
 *     summary: Update quotation status (accept/reject)
 *     tags: [Quotations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [accepted, rejected]
 *     responses:
 *       200:
 *         description: Quotation status updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Quotation not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Access denied
 */
router.put('/quotations/:quotationId/status',
  authenticate,
  [
    body('status')
      .isIn(['accepted', 'rejected'])
      .withMessage('Status must be either accepted or rejected'),
  ],
  handleValidationErrors,
  updateQuotationStatusController
);

export default router;