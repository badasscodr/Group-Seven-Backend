import { Router } from 'express';
import { authenticate, authorize } from '../../core/middleware/auth';
import {
  getAvailableServiceRequestsController,
  createQuotationController,
  getSupplierQuotationsController,
  updateQuotationController,
  getQuotationController,
  getSupplierProfileController,
  updateSupplierProfileController,
  getServiceCategoriesController
} from './supplier.controller';

const router = Router();

/**
 * @swagger
 * /api/supplier/requests:
 *   get:
 *     summary: Get available service requests for suppliers
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Filter by service category
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *         description: Filter by priority
 *       - in: query
 *         name: budget_min
 *         schema:
 *           type: number
 *         description: Minimum budget filter
 *       - in: query
 *         name: budget_max
 *         schema:
 *           type: number
 *         description: Maximum budget filter
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Available service requests retrieved successfully
 */
router.get('/requests', authenticate, authorize(['supplier']), getAvailableServiceRequestsController);

/**
 * @swagger
 * /api/supplier/requests/{serviceRequestId}/quote:
 *   post:
 *     summary: Submit a quotation for a service request
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: serviceRequestId
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
 *             required:
 *               - amount
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Quotation amount
 *               description:
 *                 type: string
 *                 description: Quotation description
 *               estimated_duration:
 *                 type: string
 *                 description: Estimated project duration
 *               terms_conditions:
 *                 type: string
 *                 description: Terms and conditions
 *               valid_until:
 *                 type: string
 *                 format: date
 *                 description: Quotation validity date
 *     responses:
 *       201:
 *         description: Quotation submitted successfully
 */
router.post('/requests/:serviceRequestId/quote', authenticate, authorize(['supplier']), createQuotationController);

/**
 * @swagger
 * /api/supplier/quotations:
 *   get:
 *     summary: Get supplier's quotations
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, accepted, rejected, expired]
 *         description: Filter by quotation status
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *     responses:
 *       200:
 *         description: Quotations retrieved successfully
 */
router.get('/quotations', authenticate, authorize(['supplier']), getSupplierQuotationsController);

/**
 * @swagger
 * /api/supplier/quotations/{quotationId}:
 *   get:
 *     summary: Get specific quotation details
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID
 *     responses:
 *       200:
 *         description: Quotation retrieved successfully
 *   put:
 *     summary: Update a quotation
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: quotationId
 *         required: true
 *         schema:
 *           type: string
 *         description: Quotation ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *                 description: Updated quotation amount
 *               description:
 *                 type: string
 *                 description: Updated description
 *               estimated_duration:
 *                 type: string
 *                 description: Updated estimated duration
 *               terms_conditions:
 *                 type: string
 *                 description: Updated terms and conditions
 *               valid_until:
 *                 type: string
 *                 format: date
 *                 description: Updated validity date
 *     responses:
 *       200:
 *         description: Quotation updated successfully
 */
router.get('/quotations/:quotationId', authenticate, authorize(['supplier']), getQuotationController);
router.put('/quotations/:quotationId', authenticate, authorize(['supplier']), updateQuotationController);

/**
 * @swagger
 * /api/supplier/profile:
 *   get:
 *     summary: Get supplier profile
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Supplier profile retrieved successfully
 *   put:
 *     summary: Update supplier profile
 *     tags: [Supplier]
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
 *                 description: Company name
 *               business_type:
 *                 type: string
 *                 description: Type of business
 *               license_number:
 *                 type: string
 *                 description: Business license number
 *               service_categories:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: Services offered
 *     responses:
 *       200:
 *         description: Supplier profile updated successfully
 */
router.get('/profile', authenticate, authorize(['supplier']), getSupplierProfileController);
router.put('/profile', authenticate, authorize(['supplier']), updateSupplierProfileController);

/**
 * @swagger
 * /api/supplier/categories:
 *   get:
 *     summary: Get available service categories
 *     tags: [Supplier]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Service categories retrieved successfully
 */
router.get('/categories', getServiceCategoriesController);

export default router;