import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ServiceRequestService } from '../services/service-request.service';
import { authenticate } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ApiResponse, AuthenticatedRequest } from '../../core/types';
import { notificationService } from '../../notifications/services/notification.service';

const router = Router();

// Get service requests (client view)
router.get('/requests',
  authenticate,
  [
    query('status').optional().isString().withMessage('Status must be a string'),
    query('category').optional().isString().withMessage('Category must be a string'),
    query('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
  ],
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const filters = req.query;
    const result = await ServiceRequestService.getClientRequests(req.user!.id, filters);
    
    const response: ApiResponse = {
      success: true,
      message: 'Service requests retrieved successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Create new service request
router.post('/requests',
  authenticate,
  body('title')
    .trim()
    .isLength({ min: 3, max: 255 })
    .withMessage('Title must be between 3 and 255 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Description must be between 10 and 2000 characters'),
  body('category')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Category is required'),
  body('priority')
    .isIn(['low', 'medium', 'high', 'urgent'])
    .withMessage('Invalid priority'),
  body('budget_min').optional().isDecimal().withMessage('Minimum budget must be a number'),
  body('budget_max').optional().isDecimal().withMessage('Maximum budget must be a number'),
  body('deadline').optional().isISO8601().withMessage('Deadline must be a valid date'),
  body('location').optional().isString().withMessage('Location must be a string'),
  body('requirements').optional().isString().withMessage('Requirements must be a string'),
  body('documentIds').optional().isArray().withMessage('Document IDs must be an array'),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const requestData = {
      ...req.body,
      clientId: req.user!.id
    };
    
    const result = await ServiceRequestService.createRequest(requestData);
    
    // Create notification for all admin users about new service request
    try {
      await notificationService.createNotificationForAdmins({
        title: 'New Service Request Created',
        message: `New service request "${requestData.title}" has been submitted by a client`,
        type: 'service_request',
        relatedId: result.id,
        relatedType: 'service_request',
        priority: requestData.priority || 'medium',
        metadata: {
          clientId: req.user!.id,
          requestTitle: requestData.title,
          category: requestData.category
        }
      });

      console.log(`📧 Notifications sent to all admins about new request: ${requestData.title}`);
    } catch (notificationError) {
      console.error('Failed to create notifications for admins:', notificationError);
      // Don't fail the request if notification creation fails
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Service request created successfully',
      data: result
    };
    
    res.status(201).json(response);
  })
);

// Get specific service request
router.get('/requests/:id',
  authenticate,
  param('id').isUUID().withMessage('Valid request ID is required'),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { id } = req.params;
    const result = await ServiceRequestService.getRequest(req.user!.id, id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Service request retrieved successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Update service request
router.put('/requests/:id',
  authenticate,
  param('id').isUUID().withMessage('Valid request ID is required'),
  body('title').optional().trim().isLength({ min: 3, max: 255 }).withMessage('Title must be between 3 and 255 characters'),
  body('description').optional().trim().isLength({ min: 10, max: 2000 }).withMessage('Description must be between 10 and 2000 characters'),
  body('category').optional().trim().isLength({ min: 1, max: 100 }).withMessage('Category is required'),
  body('priority').optional().isIn(['low', 'medium', 'high', 'urgent']).withMessage('Invalid priority'),
  body('status').optional().isString().withMessage('Status must be a string'),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { id } = req.params;
    const updateData = req.body;
    
    const result = await ServiceRequestService.updateRequest(req.user!.id, id, updateData);
    
    const response: ApiResponse = {
      success: true,
      message: 'Service request updated successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Delete service request
router.delete('/requests/:id',
  authenticate,
  param('id').isUUID().withMessage('Valid request ID is required'),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { id } = req.params;
    await ServiceRequestService.deleteRequest(req.user!.id, id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Service request deleted successfully'
    };
    
    res.status(200).json(response);
  })
);

export default router;
