import { Response } from 'express';
import { validationResult } from 'express-validator';
import * as messageService from '../services/messageService';
import { AuthenticatedRequest } from '../middleware/auth';
import { MessageType, NotificationType } from '../types';

export const sendMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const senderId = req.user!.sub;
    const { recipientId, subject, content, messageType, referenceId } = req.body;

    const message = await messageService.sendMessage(
      senderId,
      recipientId,
      content,
      subject,
      messageType as MessageType,
      referenceId
    );

    // Create notification for recipient
    await messageService.createNotification(
      recipientId,
      `New message${subject ? `: ${subject}` : ''}`,
      `You received a new message from ${req.user!.email}`,
      'message',
      `/messages/${message.id}`
    );

    res.status(201).json({
      success: true,
      data: message,
      message: 'Message sent successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to send message'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getUserMessages = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const filters = {
      type: req.query.type as 'sent' | 'received' | undefined,
      messageType: req.query.messageType as MessageType | undefined,
      isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const messages = await messageService.getUserMessages(userId, filters);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: messages.length
        }
      },
      message: 'Messages retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user messages error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve messages'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getMessageById = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    const message = await messageService.getMessageById(id!, userId);

    if (!message) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      data: message,
      message: 'Message retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get message by ID error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve message'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const markMessageAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    const updated = await messageService.markMessageAsRead(id!, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found or not authorized'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Message marked as read',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mark message as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark message as read'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const markMessagesAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const userId = req.user!.sub;
    const { messageIds } = req.body;

    const updatedCount = await messageService.markMessagesAsRead(messageIds, userId);

    res.json({
      success: true,
      data: { updatedCount },
      message: `${updatedCount} messages marked as read`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mark messages as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark messages as read'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const deleteMessage = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    const deleted = await messageService.deleteMessage(id!, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Message not found or not authorized'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Message deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete message'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getMessageStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const stats = await messageService.getMessageStats(userId);

    res.json({
      success: true,
      data: stats,
      message: 'Message statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get message stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve message statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getConversation = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const { otherUserId } = req.params;

    const filters = {
      limit: req.query.limit ? parseInt(req.query.limit as string) : 50,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const messages = await messageService.getConversation(userId, otherUserId!, filters);

    res.json({
      success: true,
      data: {
        messages,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: messages.length
        }
      },
      message: 'Conversation retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get conversation error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve conversation'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Notification Controllers
export const createNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const { userId, title, content, type, actionUrl } = req.body;

    const notification = await messageService.createNotification(
      userId,
      title,
      content,
      type as NotificationType,
      actionUrl
    );

    res.status(201).json({
      success: true,
      data: notification,
      message: 'Notification created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Create notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to create notification'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getUserNotifications = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;
    const filters = {
      type: req.query.type as NotificationType | undefined,
      isRead: req.query.isRead ? req.query.isRead === 'true' : undefined,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
      offset: req.query.offset ? parseInt(req.query.offset as string) : 0
    };

    const notifications = await messageService.getUserNotifications(userId, filters);

    res.json({
      success: true,
      data: {
        notifications,
        pagination: {
          limit: filters.limit,
          offset: filters.offset,
          total: notifications.length
        }
      },
      message: 'Notifications retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get user notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve notifications'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const markNotificationAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    const updated = await messageService.markNotificationAsRead(id!, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found or not authorized'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Notification marked as read',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark notification as read'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const markNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'The given data was invalid',
          details: errors.array()
        },
        timestamp: new Date().toISOString()
      });
    }

    const userId = req.user!.sub;
    const { notificationIds } = req.body;

    const updatedCount = await messageService.markNotificationsAsRead(notificationIds, userId);

    res.json({
      success: true,
      data: { updatedCount },
      message: `${updatedCount} notifications marked as read`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark notifications as read'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const markAllNotificationsAsRead = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const updatedCount = await messageService.markAllNotificationsAsRead(userId);

    res.json({
      success: true,
      data: { updatedCount },
      message: `All ${updatedCount} notifications marked as read`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to mark all notifications as read'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const deleteNotification = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user!.sub;

    const deleted = await messageService.deleteNotification(id!, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Notification not found or not authorized'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.json({
      success: true,
      message: 'Notification deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to delete notification'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getNotificationStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user!.sub;

    const stats = await messageService.getNotificationStats(userId);

    res.json({
      success: true,
      data: stats,
      message: 'Notification statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Get notification stats error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Failed to retrieve notification statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};