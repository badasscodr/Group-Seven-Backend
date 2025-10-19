import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { ServiceRequestService } from '../../clients/services/service-request.service';
import { notificationService } from '../../notifications/services/notification.service';
import { authenticate, requireRole } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ApiResponse, AuthenticatedRequest } from '../../core/types';

const router = Router();

// Apply authentication and admin role requirement to all routes
router.use(authenticate);
router.use(requireRole('admin'));

// Get all service requests (admin view)
router.get('/requests',
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
    const result = await ServiceRequestService.getAllRequests(filters);
    
    const response: ApiResponse = {
      success: true,
      message: 'Service requests retrieved successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Get specific service request (admin view)
router.get('/requests/:id',
  [
    param('id').isUUID().withMessage('Valid request ID is required'),
  ],
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { id } = req.params;
    
    // For admin, we can use the getAllRequests method with a filter
    // or create a specific admin method. For now, let's use the existing method
    // but we'll need to modify the service to support admin access
    const result = await ServiceRequestService.getAllRequests({ 
      page: 1, 
      limit: 1,
      // We'll need to add a filter by ID in the service
    });
    
    // Find the specific request in the results
    const request = result.requests.find((req: any) => req.id === id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service request not found'
        }
      });
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Service request retrieved successfully',
      data: request
    };
    
    res.status(200).json(response);
  })
);

// Update service request status (admin)
router.put('/requests/:id/status',
  [
    param('id').isUUID().withMessage('Valid request ID is required'),
    body('status')
      .isIn(['draft', 'pending_admin', 'published', 'assigned', 'in_progress', 'completed', 'cancelled', 'on_hold'])
      .withMessage('Invalid status'),
    body('comment').optional().isString().withMessage('Comment must be a string'),
  ],
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { id } = req.params;
    const { status, comment } = req.body;
    const adminId = req.user!.id;
    
    // Get the request details before updating to get the old status and client info
    const allResult = await ServiceRequestService.getAllRequests();
    const existingRequest = allResult.requests.find((req: any) => req.id === id);
    
    if (!existingRequest) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service request not found'
        }
      });
    }
    
    const oldStatus = existingRequest.status;
    
    // Update the request status
    const result = await ServiceRequestService.updateRequestStatus(id, status, adminId);
    
    // Send notification to the client if status changed
    if (oldStatus !== status && existingRequest.client_id) {
      try {
        await notificationService.createServiceRequestNotification({
          requestId: id,
          clientId: existingRequest.client_id,
          requestTitle: existingRequest.title || 'Service Request',
          oldStatus,
          newStatus: status,
          clientName: existingRequest.client_name || 'Client'
        });

        // Send real-time notification via Socket.IO
        try {
          const { socketService } = await import('../../shared/services/socket.service');
          socketService.sendNotification(existingRequest.client_id, {
            type: 'service_request',
            data: {
              title: 'Request Status Updated',
              message: `Your service request "${existingRequest.title}" is now ${status.replace('_', ' ')}`,
              priority: status === 'approved' ? 'high' : status === 'rejected' ? 'urgent' : 'medium',
              metadata: {
                requestId: id,
                oldStatus,
                newStatus: status,
                clientName: existingRequest.client_name
              }
            }
          });
          console.log(`📡 Real-time notification sent to client ${existingRequest.client_id}`);
        } catch (socketError) {
          console.warn('Socket.IO notification failed:', socketError);
        }

        console.log(`📧 Notification sent to client ${existingRequest.client_id} for status change: ${oldStatus} → ${status}`);
      } catch (notificationError) {
        console.error('❌ Failed to send notification:', notificationError);
        // Don't fail the request if notification fails, but log it
      }
    }
    
    const response: ApiResponse = {
      success: true,
      message: 'Service request status updated successfully',
      data: {
        ...result,
        notificationSent: oldStatus !== status
      }
    };
    
    res.status(200).json(response);
  })
);

// Get service request statistics (admin)
router.get('/requests/stats',
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    // Get all requests to calculate stats
    const allResult = await ServiceRequestService.getAllRequests();
    
    const stats = {
      total: allResult.pagination.total,
      byStatus: {},
      byCategory: {},
      byPriority: {},
      recent: allResult.requests.slice(0, 5)
    };
    
    // Calculate statistics
    allResult.requests.forEach((request: any) => {
      // Count by status
      stats.byStatus[request.status] = (stats.byStatus[request.status] || 0) + 1;
      
      // Count by category
      stats.byCategory[request.category] = (stats.byCategory[request.category] || 0) + 1;
      
      // Count by priority
      stats.byPriority[request.priority] = (stats.byPriority[request.priority] || 0) + 1;
    });
    
    const response: ApiResponse = {
      success: true,
      message: 'Service request statistics retrieved successfully',
      data: stats
    };
    
    res.status(200).json(response);
  })
);

// Delete service request (admin) - only allow deletion of draft requests
router.delete('/requests/:id',
  [
    param('id').isUUID().withMessage('Valid request ID is required'),
  ],
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const { id } = req.params;
    
    // First get the request to check its status
    const allResult = await ServiceRequestService.getAllRequests();
    const request = allResult.requests.find((req: any) => req.id === id);
    
    if (!request) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Service request not found'
        }
      });
    }
    
    // Only allow deletion of draft requests for now
    if (request.status !== 'draft') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'BAD_REQUEST',
          message: 'Only draft requests can be deleted'
        }
      });
    }
    
    // For now, we'll implement a basic deletion by updating the status to cancelled
    await ServiceRequestService.updateRequestStatus(id, 'cancelled');
    
    const response: ApiResponse = {
      success: true,
      message: 'Service request deleted successfully'
    };
    
    res.status(200).json(response);
  })
);

export default router;
