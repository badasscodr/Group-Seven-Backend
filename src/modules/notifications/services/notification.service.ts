import { pool } from '../../core/config/database';
import { 
  Notification, 
  CreateNotificationDto, 
  UpdateNotificationDto, 
  NotificationQueryOptions,
  NotificationResponse,
  SingleNotificationResponse,
  UnreadCountResponse,
  ServiceRequestNotificationData,
  AdminActionNotificationData,
  SystemNotificationData
} from '../models/notification.model';

export class NotificationService {
  // Create a new notification
  async createNotification(data: CreateNotificationDto): Promise<SingleNotificationResponse> {
    try {
      const query = `
        INSERT INTO notifications (user_id, title, message, type, related_id, related_type, priority, metadata)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING *
      `;
      
      const values = [
        data.userId,
        data.title,
        data.message,
        data.type,
        data.relatedId || null,
        data.relatedType || null,
        data.priority || 'medium',
        JSON.stringify(data.metadata || {})
      ];

      const result = await pool.query(query, values);
      const notification = this.mapRowToNotification(result.rows[0]);

      return {
        success: true,
        data: notification
      };
    } catch (error: any) {
      console.error('Error creating notification:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to create notification',
          code: error.code
        }
      };
    }
  }

  // Get notifications for a user with pagination and filtering
  async getUserNotifications(userId: string, options: NotificationQueryOptions = {}): Promise<NotificationResponse> {
    try {
      // Build WHERE clause
      const conditions: string[] = ['user_id = $1'];
      const values: any[] = [userId];
      let paramCount = 1;

      if (options.status && options.status !== 'all') {
        paramCount++;
        conditions.push(`status = $${paramCount}`);
        values.push(options.status);
      }

      if (options.type && options.type !== 'all') {
        paramCount++;
        conditions.push(`type = $${paramCount}`);
        values.push(options.type);
      }

      if (options.priority && options.priority !== 'all') {
        paramCount++;
        conditions.push(`priority = $${paramCount}`);
        values.push(options.priority);
      }

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

            // Build ORDER BY clause - Map camelCase to snake_case
            const sortByMap: { [key: string]: string } = {
                'createdAt': 'created_at',
                'readAt': 'read_at',
                'updatedAt': 'updated_at'
            };
            const sortByDbColumn = sortByMap[options.sortBy as string] || 'created_at';
            const sortOrder = options.sortOrder || 'desc';
            const orderClause = `ORDER BY ${sortByDbColumn} ${sortOrder}`;

      // Build LIMIT and OFFSET
      const limit = options.limit || 50;
      const offset = options.offset || 0;

      // Get total count
      const countQuery = `SELECT COUNT(*) FROM notifications ${whereClause}`;
      const countResult = await pool.query(countQuery, values);
      const total = parseInt(countResult.rows[0].count);

      // Get notifications
      const query = `
        SELECT * FROM notifications 
        ${whereClause} 
        ${orderClause} 
        LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
      `;
      values.push(limit, offset);

      const result = await pool.query(query, values);
      const notifications = result.rows.map(row => this.mapRowToNotification(row));

      return {
        success: true,
        data: notifications,
        pagination: {
          total,
          page: Math.floor(offset / limit) + 1,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error: any) {
      console.error('Error getting notifications:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get notifications',
          code: error.code
        }
      };
    }
  }

  // Get unread count for a user
  async getUnreadCount(userId: string): Promise<UnreadCountResponse> {
    try {
      const query = `
        SELECT COUNT(*) as unread_count 
        FROM notifications 
        WHERE user_id = $1 AND status = 'unread'
      `;
      
      const result = await pool.query(query, [userId]);
      const unreadCount = parseInt(result.rows[0].unread_count);

      return {
        success: true,
        data: { unreadCount }
      };
    } catch (error: any) {
      console.error('Error getting unread count:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to get unread count',
          code: error.code
        }
      };
    }
  }

  // Mark a notification as read
  async markAsRead(notificationId: string, userId: string): Promise<SingleNotificationResponse> {
    try {
      const query = `
        UPDATE notifications 
        SET status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [notificationId, userId]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: {
            message: 'Notification not found or access denied',
            code: 'NOT_FOUND'
          }
        };
      }

      const notification = this.mapRowToNotification(result.rows[0]);

      return {
        success: true,
        data: notification
      };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to mark notification as read',
          code: error.code
        }
      };
    }
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: string): Promise<NotificationResponse> {
    try {
      const query = `
        UPDATE notifications 
        SET status = 'read', read_at = CURRENT_TIMESTAMP
        WHERE user_id = $1 AND status = 'unread'
        RETURNING *
      `;
      
      const result = await pool.query(query, [userId]);
      const notifications = result.rows.map(row => this.mapRowToNotification(row));

      return {
        success: true,
        data: notifications
      };
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to mark all notifications as read',
          code: error.code
        }
      };
    }
  }

  // Delete a notification
  async deleteNotification(notificationId: string, userId: string): Promise<SingleNotificationResponse> {
    try {
      const query = `
        DELETE FROM notifications 
        WHERE id = $1 AND user_id = $2
        RETURNING *
      `;
      
      const result = await pool.query(query, [notificationId, userId]);
      
      if (result.rows.length === 0) {
        return {
          success: false,
          error: {
            message: 'Notification not found or access denied',
            code: 'NOT_FOUND'
          }
        };
      }

      const notification = this.mapRowToNotification(result.rows[0]);

      return {
        success: true,
        data: notification
      };
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return {
        success: false,
        error: {
          message: error.message || 'Failed to delete notification',
          code: error.code
        }
      };
    }
  }

  // Helper methods for creating specific types of notifications

  // Create service request notification
  async createServiceRequestNotification(data: ServiceRequestNotificationData): Promise<SingleNotificationResponse> {
    const { requestId, clientId, requestTitle, oldStatus, newStatus, clientName } = data;

    let title = '';
    let message = '';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    if (oldStatus && newStatus) {
      // Status change notification
      title = `Request Status Updated`;
      message = `Your service request "${requestTitle}" is now ${newStatus.replace('_', ' ')}`;
      priority = newStatus === 'approved' ? 'high' : newStatus === 'rejected' ? 'urgent' : 'medium';
    } else {
      // New request notification (for admins)
      title = `New Service Request`;
      message = `New service request "${requestTitle}" from ${clientName || 'a client'}`;
      priority = 'medium';
    }

    return this.createNotification({
      userId: clientId,
      title,
      message,
      type: 'service_request',
      relatedId: requestId,
      relatedType: 'service_request',
      priority,
      metadata: {
        requestId,
        oldStatus,
        newStatus,
        clientName
      }
    });
  }

  // Create admin action notification
  async createAdminActionNotification(data: AdminActionNotificationData): Promise<SingleNotificationResponse> {
    const { targetUserId, action, targetType, targetId, details } = data;

    let title = '';
    let message = '';
    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';

    switch (action) {
      case 'approved':
        title = 'Account Approved';
        message = 'Your account has been approved by an administrator';
        priority = 'high';
        break;
      case 'rejected':
        title = 'Account Rejected';
        message = 'Your account registration has been rejected';
        priority = 'urgent';
        break;
      case 'updated':
        title = 'Profile Updated';
        message = 'Your profile has been updated by an administrator';
        priority = 'medium';
        break;
    }

    return this.createNotification({
      userId: targetUserId,
      title,
      message,
      type: 'admin_action',
      relatedId: targetId,
      relatedType: targetType,
      priority,
      metadata: {
        action,
        targetType,
        targetId,
        details
      }
    });
  }

  // Create system notification
  async createSystemNotification(data: SystemNotificationData, targetUserId?: string): Promise<SingleNotificationResponse> {
    const { message, severity = 'info', actionUrl } = data;

    let priority: 'low' | 'medium' | 'high' | 'urgent' = 'medium';
    switch (severity) {
      case 'error':
        priority = 'urgent';
        break;
      case 'warning':
        priority = 'high';
        break;
      case 'info':
        priority = 'medium';
        break;
    }

    if (!targetUserId) {
      throw new Error('Target user ID is required for system notifications');
    }

    return this.createNotification({
      userId: targetUserId,
      title: 'System Notification',
      message,
      type: 'system',
      priority,
      metadata: {
        severity,
        actionUrl
      }
    });
  }

  // Private helper method to map database row to Notification interface
  private mapRowToNotification(row: any): Notification {
    return {
      id: row.id,
      userId: row.user_id,
      title: row.title,
      message: row.message,
      type: row.type,
      relatedId: row.related_id,
      relatedType: row.related_type,
      status: row.status,
      priority: row.priority,
      metadata: row.metadata || {},
      createdAt: new Date(row.created_at),
      readAt: row.read_at ? new Date(row.read_at) : undefined
    };
  }
}

// Export singleton instance
export const notificationService = new NotificationService();
