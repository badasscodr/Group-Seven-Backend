import express from 'express';
import { authenticate } from '../../core/middleware/auth';
import { AuthenticatedRequest } from '../../core/types';
import { notificationService } from '../services/notification.service';

const router = express.Router();

// Create notification (for testing and admin use)
router.post('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const { title, message, type, priority, relatedId, relatedType, metadata } = req.body;

    if (!title || !message) {
      return res.status(400).json({
        success: false,
        error: { message: 'Title and message are required' }
      });
    }

    const result = await notificationService.createNotification({
      userId,
      title,
      message,
      type: type || 'system',
      priority: priority || 'medium',
      relatedId,
      relatedType,
      metadata: metadata || {}
    });
    
    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in POST /notifications:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get user notifications with pagination and filtering
router.get('/', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const {
      status,
      type,
      priority,
      limit = '50',
      offset = '0',
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const options = {
      status: status as any,
      type: type as any,
      priority: priority as any,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
      sortBy: sortBy as any,
      sortOrder: sortOrder as any
    };

    const result = await notificationService.getUserNotifications(userId, options);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in GET /notifications:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Get unread count for user
router.get('/unread', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const result = await notificationService.getUnreadCount(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in GET /notifications/unread:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Mark notification as read
router.put('/:id/read', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const result = await notificationService.markAsRead(id, userId);
    
    if (result.success) {
      res.json(result);
    } else if (result.error?.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in PUT /notifications/:id/read:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Mark all notifications as read
router.put('/read-all', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const result = await notificationService.markAllAsRead(userId);
    
    if (result.success) {
      res.json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in PUT /notifications/read-all:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

// Delete notification
router.delete('/:id', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user?.id;
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: { message: 'User not authenticated' }
      });
    }

    const result = await notificationService.deleteNotification(id, userId);
    
    if (result.success) {
      res.json(result);
    } else if (result.error?.code === 'NOT_FOUND') {
      res.status(404).json(result);
    } else {
      res.status(500).json(result);
    }
  } catch (error: any) {
    console.error('Error in DELETE /notifications/:id:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Internal server error' }
    });
  }
});

export default router;
