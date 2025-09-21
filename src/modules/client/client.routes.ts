import express from 'express';
import { authenticate } from '../../core/middleware/auth';
import {
  createServiceRequestController,
  getServiceRequestController,
  getServiceRequestsController,
  updateServiceRequestController,
  deleteServiceRequestController,
  getServiceRequestQuotationsController,
  getClientProfileController,
  updateClientProfileController
} from './client.controller';

const router = express.Router();

// Profile routes
/**
 * @swagger
 * /api/client/profile:
 *   get:
 *     summary: Get client profile
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Client profile retrieved successfully
 *       401:
 *         description: Unauthorized
 */
router.get('/profile', authenticate, getClientProfileController);

/**
 * @swagger
 * /api/client/profile:
 *   put:
 *     summary: Update client profile
 *     tags: [Client]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               company_name:
 *                 type: string
 *               industry:
 *                 type: string
 *               company_size:
 *                 type: string
 *               address:
 *                 type: string
 *               city:
 *                 type: string
 *               country:
 *                 type: string
 *               website:
 *                 type: string
 *               business_license:
 *                 type: string
 *     responses:
 *       200:
 *         description: Client profile updated successfully
 *       401:
 *         description: Unauthorized
 */
router.put('/profile', authenticate, updateClientProfileController);

// Service Request routes
/**
 * @swagger
 * /api/client/requests:
 *   get:
 *     summary: Get client's service requests
 *     tags: [Client - Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [draft, published, in_progress, completed, cancelled, on_hold]
 *         description: Filter by status
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of items per page
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
 *     summary: Create new service request
 *     tags: [Client - Service Requests]
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
 *                 enum: [construction, maintenance, consulting, technology, legal]
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               budget_min:
 *                 type: number
 *                 minimum: 0
 *               budget_max:
 *                 type: number
 *                 minimum: 0
 *               deadline:
 *                 type: string
 *                 format: date
 *               location:
 *                 type: string
 *                 maxLength: 255
 *               requirements:
 *                 type: string
 *     responses:
 *       201:
 *         description: Service request created successfully
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized
 */
router.post('/requests', authenticate, createServiceRequestController);

/**
 * @swagger
 * /api/client/requests/{id}:
 *   get:
 *     summary: Get specific service request details
 *     tags: [Client - Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service request ID
 *     responses:
 *       200:
 *         description: Service request retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service request not found
 */
router.get('/requests/:id', authenticate, getServiceRequestController);

/**
 * @swagger
 * /api/client/requests/{id}:
 *   put:
 *     summary: Update service request
 *     tags: [Client - Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
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
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               budget_min:
 *                 type: number
 *                 minimum: 0
 *               budget_max:
 *                 type: number
 *                 minimum: 0
 *               deadline:
 *                 type: string
 *                 format: date
 *               location:
 *                 type: string
 *               requirements:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [draft, published, in_progress, completed, cancelled, on_hold]
 *     responses:
 *       200:
 *         description: Service request updated successfully
 *       400:
 *         description: Bad request - validation errors
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service request not found
 */
router.put('/requests/:id', authenticate, updateServiceRequestController);

/**
 * @swagger
 * /api/client/requests/{id}:
 *   delete:
 *     summary: Delete service request
 *     tags: [Client - Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service request ID
 *     responses:
 *       200:
 *         description: Service request deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service request not found
 */
router.delete('/requests/:id', authenticate, deleteServiceRequestController);

/**
 * @swagger
 * /api/client/requests/{id}/quotations:
 *   get:
 *     summary: Get quotations for service request
 *     tags: [Client - Service Requests]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Service request ID
 *     responses:
 *       200:
 *         description: Service request with quotations retrieved successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Service request not found
 */
router.get('/requests/:id/quotations', authenticate, getServiceRequestQuotationsController);

export default router;