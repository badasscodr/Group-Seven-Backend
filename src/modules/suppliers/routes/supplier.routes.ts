import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { SupplierService } from '../services/supplier.service';
import { authenticate } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ApiResponse, AuthenticatedRequest } from '../../core/types';

const router = Router();

// Get available service requests for suppliers
router.get('/requests',
  authenticate,
  [
    query('category').optional().isString().withMessage('Category must be a string'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    query('budget_min').optional().isDecimal().withMessage('Minimum budget must be a number'),
    query('budget_max').optional().isDecimal().withMessage('Maximum budget must be a number'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const filters = req.query;
    const result = await SupplierService.getAvailableRequests(req.user!.id, filters);
    
    const response: ApiResponse = {
      success: true,
      message: 'Available service requests retrieved successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Submit quotation for a service request
router.post('/requests/:requestId/quote',
  authenticate,
  param('requestId').isUUID().withMessage('Valid request ID is required'),
  body('amount')
    .isDecimal({ decimal_digits: '0,2' })
    .withMessage('Amount must be a valid decimal number'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('estimated_duration').optional().isString().withMessage('Estimated duration must be a string'),
  body('terms_conditions').optional().isString().withMessage('Terms and conditions must be a string'),
  body('valid_until').optional().isISO8601().withMessage('Valid until date must be valid'),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { requestId } = req.params;
    const quotationData = req.body;
    
    const result = await SupplierService.createQuotation(req.user!.id, requestId, quotationData);
    
    const response: ApiResponse = {
      success: true,
      message: 'Quotation submitted successfully',
      data: result
    };
    
    res.status(201).json(response);
  })
);

// Get supplier's quotations
router.get('/quotations',
  authenticate,
  [
    query('status').optional().isIn(['pending', 'accepted', 'rejected', 'expired']).withMessage('Invalid status'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const filters = req.query;
    const result = await SupplierService.getQuotations(req.user!.id, filters);
    
    const response: ApiResponse = {
      success: true,
      message: 'Quotations retrieved successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Get specific quotation
router.get('/quotations/:quotationId',
  authenticate,
  param('quotationId').isUUID().withMessage('Valid quotation ID is required'),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { quotationId } = req.params;
    const result = await SupplierService.getQuotation(req.user!.id, quotationId);
    
    const response: ApiResponse = {
      success: true,
      message: 'Quotation retrieved successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Update quotation
router.put('/quotations/:quotationId',
  authenticate,
  param('quotationId').isUUID().withMessage('Valid quotation ID is required'),
  body('amount').optional().isDecimal({ decimal_digits: '0,2' }).withMessage('Amount must be a valid decimal number'),
  body('description').optional().isString().withMessage('Description must be a string'),
  body('estimated_duration').optional().isString().withMessage('Estimated duration must be a string'),
  body('terms_conditions').optional().isString().withMessage('Terms and conditions must be a string'),
  body('valid_until').optional().isISO8601().withMessage('Valid until date must be valid'),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { quotationId } = req.params;
    const updateData = req.body;
    
    const result = await SupplierService.updateQuotation(req.user!.id, quotationId, updateData);
    
    const response: ApiResponse = {
      success: true,
      message: 'Quotation updated successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Submit quotation (change status to submitted)
router.post('/quotations/:quotationId/submit',
  authenticate,
  param('quotationId').isUUID().withMessage('Valid quotation ID is required'),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { quotationId } = req.params;
    const result = await SupplierService.submitQuotation(req.user!.id, quotationId);
    
    const response: ApiResponse = {
      success: true,
      message: 'Quotation submitted successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Get supplier profile
router.get('/profile',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const result = await SupplierService.getProfile(req.user!.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Supplier profile retrieved successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Update supplier profile
router.put('/profile',
  authenticate,
  body('company_name').optional().isString().withMessage('Company name must be a string'),
  body('business_type').optional().isString().withMessage('Business type must be a string'),
  body('license_number').optional().isString().withMessage('License number must be a string'),
  body('service_categories').optional().isArray().withMessage('Service categories must be an array'),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const profileData = req.body;
    const result = await SupplierService.updateProfile(req.user!.id, profileData);
    
    const response: ApiResponse = {
      success: true,
      message: 'Supplier profile updated successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Get service categories
router.get('/categories',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const result = await SupplierService.getCategories();
    
    const response: ApiResponse = {
      success: true,
      message: 'Service categories retrieved successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

export default router;