import pool from '../config/database';
import { Message, MessageType, Notification, NotificationType } from '../types';

export const sendMessage = async (
  senderId: string,
  recipientId: string,
  content: string,
  subject?: string,
  messageType: MessageType = 'direct',
  referenceId?: string
): Promise<Message> => {
  try {
    const query = `
      INSERT INTO messages (sender_id, recipient_id, subject, content, message_type, reference_id)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [senderId, recipientId, subject, content, messageType, referenceId];
    const result = await pool.query(query, values);

    return result.rows[0];
  } catch (error) {
    console.error('Send message error:', error);
    throw error;
  }
};

export const getUserMessages = async (
  userId: string,
  filters: {
    type?: 'sent' | 'received';
    messageType?: MessageType;
    isRead?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Message[]> => {
  try {
    let query = `
      SELECT m.*,
        u_sender.first_name as sender_first_name,
        u_sender.last_name as sender_last_name,
        u_sender.email as sender_email,
        u_recipient.first_name as recipient_first_name,
        u_recipient.last_name as recipient_last_name,
        u_recipient.email as recipient_email
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      JOIN users u_recipient ON m.recipient_id = u_recipient.id
      WHERE 1=1
    `;

    const values: any[] = [];
    let paramCount = 0;

    if (filters.type === 'sent') {
      paramCount++;
      query += ` AND m.sender_id = $${paramCount}`;
      values.push(userId);
    } else if (filters.type === 'received') {
      paramCount++;
      query += ` AND m.recipient_id = $${paramCount}`;
      values.push(userId);
    } else {
      paramCount++;
      query += ` AND (m.sender_id = $${paramCount} OR m.recipient_id = $${paramCount})`;
      values.push(userId);
    }

    if (filters.messageType) {
      paramCount++;
      query += ` AND m.message_type = $${paramCount}`;
      values.push(filters.messageType);
    }

    if (filters.isRead !== undefined) {
      paramCount++;
      query += ` AND m.is_read = $${paramCount}`;
      values.push(filters.isRead);
    }

    query += ` ORDER BY m.created_at DESC`;

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Get user messages error:', error);
    throw error;
  }
};

export const getMessageById = async (
  messageId: string,
  userId: string
): Promise<Message | null> => {
  try {
    const query = `
      SELECT m.*,
        u_sender.first_name as sender_first_name,
        u_sender.last_name as sender_last_name,
        u_sender.email as sender_email,
        u_recipient.first_name as recipient_first_name,
        u_recipient.last_name as recipient_last_name,
        u_recipient.email as recipient_email
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      JOIN users u_recipient ON m.recipient_id = u_recipient.id
      WHERE m.id = $1 AND (m.sender_id = $2 OR m.recipient_id = $2)
    `;

    const result = await pool.query(query, [messageId, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Get message by ID error:', error);
    throw error;
  }
};

export const markMessageAsRead = async (
  messageId: string,
  userId: string
): Promise<boolean> => {
  try {
    const query = `
      UPDATE messages
      SET is_read = true
      WHERE id = $1 AND recipient_id = $2
    `;

    const result = await pool.query(query, [messageId, userId]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Mark message as read error:', error);
    return false;
  }
};

export const markMessagesAsRead = async (
  messageIds: string[],
  userId: string
): Promise<number> => {
  try {
    const query = `
      UPDATE messages
      SET is_read = true
      WHERE id = ANY($1) AND recipient_id = $2
    `;

    const result = await pool.query(query, [messageIds, userId]);
    return result.rowCount || 0;
  } catch (error) {
    console.error('Mark messages as read error:', error);
    return 0;
  }
};

export const deleteMessage = async (
  messageId: string,
  userId: string
): Promise<boolean> => {
  try {
    const query = `
      DELETE FROM messages
      WHERE id = $1 AND (sender_id = $2 OR recipient_id = $2)
    `;

    const result = await pool.query(query, [messageId, userId]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Delete message error:', error);
    return false;
  }
};

export const getMessageStats = async (userId: string): Promise<{
  total: number;
  unread: number;
  sent: number;
  received: number;
}> => {
  try {
    const query = `
      SELECT
        COUNT(*) FILTER (WHERE sender_id = $1 OR recipient_id = $1) as total,
        COUNT(*) FILTER (WHERE recipient_id = $1 AND is_read = false) as unread,
        COUNT(*) FILTER (WHERE sender_id = $1) as sent,
        COUNT(*) FILTER (WHERE recipient_id = $1) as received
      FROM messages
    `;

    const result = await pool.query(query, [userId]);
    const stats = result.rows[0];

    return {
      total: parseInt(stats.total) || 0,
      unread: parseInt(stats.unread) || 0,
      sent: parseInt(stats.sent) || 0,
      received: parseInt(stats.received) || 0
    };
  } catch (error) {
    console.error('Get message stats error:', error);
    throw error;
  }
};

export const createNotification = async (
  userId: string,
  title: string,
  content: string,
  type: NotificationType,
  actionUrl?: string
): Promise<Notification> => {
  try {
    const query = `
      INSERT INTO notifications (user_id, title, content, type, action_url)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;

    const values = [userId, title, content, type, actionUrl];
    const result = await pool.query(query, values);

    return result.rows[0];
  } catch (error) {
    console.error('Create notification error:', error);
    throw error;
  }
};

export const getUserNotifications = async (
  userId: string,
  filters: {
    type?: NotificationType;
    isRead?: boolean;
    limit?: number;
    offset?: number;
  } = {}
): Promise<Notification[]> => {
  try {
    let query = `
      SELECT n.*, u.first_name, u.last_name, u.email
      FROM notifications n
      JOIN users u ON n.user_id = u.id
      WHERE n.user_id = $1
    `;

    const values: any[] = [userId];
    let paramCount = 1;

    if (filters.type) {
      paramCount++;
      query += ` AND n.type = $${paramCount}`;
      values.push(filters.type);
    }

    if (filters.isRead !== undefined) {
      paramCount++;
      query += ` AND n.is_read = $${paramCount}`;
      values.push(filters.isRead);
    }

    query += ` ORDER BY n.created_at DESC`;

    if (filters.limit) {
      paramCount++;
      query += ` LIMIT $${paramCount}`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      paramCount++;
      query += ` OFFSET $${paramCount}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Get user notifications error:', error);
    throw error;
  }
};

export const markNotificationAsRead = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  try {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [notificationId, userId]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Mark notification as read error:', error);
    return false;
  }
};

export const markNotificationsAsRead = async (
  notificationIds: string[],
  userId: string
): Promise<number> => {
  try {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE id = ANY($1) AND user_id = $2
    `;

    const result = await pool.query(query, [notificationIds, userId]);
    return result.rowCount || 0;
  } catch (error) {
    console.error('Mark notifications as read error:', error);
    return 0;
  }
};

export const markAllNotificationsAsRead = async (
  userId: string
): Promise<number> => {
  try {
    const query = `
      UPDATE notifications
      SET is_read = true
      WHERE user_id = $1 AND is_read = false
    `;

    const result = await pool.query(query, [userId]);
    return result.rowCount || 0;
  } catch (error) {
    console.error('Mark all notifications as read error:', error);
    return 0;
  }
};

export const deleteNotification = async (
  notificationId: string,
  userId: string
): Promise<boolean> => {
  try {
    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND user_id = $2
    `;

    const result = await pool.query(query, [notificationId, userId]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Delete notification error:', error);
    return false;
  }
};

export const getNotificationStats = async (userId: string): Promise<{
  total: number;
  unread: number;
  byType: Record<NotificationType, number>;
}> => {
  try {
    const totalQuery = `
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE is_read = false) as unread
      FROM notifications
      WHERE user_id = $1
    `;

    const typeQuery = `
      SELECT type, COUNT(*) as count
      FROM notifications
      WHERE user_id = $1
      GROUP BY type
    `;

    const [totalResult, typeResult] = await Promise.all([
      pool.query(totalQuery, [userId]),
      pool.query(typeQuery, [userId])
    ]);

    const stats = totalResult.rows[0];
    const byType: Record<NotificationType, number> = {} as any;

    const types: NotificationType[] = ['message', 'application', 'interview', 'payment', 'document', 'system', 'reminder'];
    types.forEach(type => {
      byType[type] = 0;
    });

    typeResult.rows.forEach(row => {
      byType[row.type as NotificationType] = parseInt(row.count);
    });

    return {
      total: parseInt(stats.total) || 0,
      unread: parseInt(stats.unread) || 0,
      byType
    };
  } catch (error) {
    console.error('Get notification stats error:', error);
    throw error;
  }
};

export const getConversation = async (
  userId: string,
  otherUserId: string,
  filters: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<Message[]> => {
  try {
    let query = `
      SELECT m.*,
        u_sender.first_name as sender_first_name,
        u_sender.last_name as sender_last_name,
        u_sender.email as sender_email,
        u_recipient.first_name as recipient_first_name,
        u_recipient.last_name as recipient_last_name,
        u_recipient.email as recipient_email
      FROM messages m
      JOIN users u_sender ON m.sender_id = u_sender.id
      JOIN users u_recipient ON m.recipient_id = u_recipient.id
      WHERE ((m.sender_id = $1 AND m.recipient_id = $2) OR (m.sender_id = $2 AND m.recipient_id = $1))
      ORDER BY m.created_at DESC
    `;

    const values: any[] = [userId, otherUserId];

    if (filters.limit) {
      query += ` LIMIT $3`;
      values.push(filters.limit);
    }

    if (filters.offset) {
      const limitIndex = filters.limit ? 3 : 3;
      query += ` OFFSET $${limitIndex + 1}`;
      values.push(filters.offset);
    }

    const result = await pool.query(query, values);
    return result.rows.reverse(); // Return in chronological order
  } catch (error) {
    console.error('Get conversation error:', error);
    throw error;
  }
};

export const bulkCreateNotifications = async (
  notifications: {
    userId: string;
    title: string;
    content: string;
    type: NotificationType;
    actionUrl?: string;
  }[]
): Promise<Notification[]> => {
  try {
    if (notifications.length === 0) return [];

    const placeholders = notifications.map((_, index) => {
      const base = index * 5;
      return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5})`;
    }).join(', ');

    const query = `
      INSERT INTO notifications (user_id, title, content, type, action_url)
      VALUES ${placeholders}
      RETURNING *
    `;

    const values: any[] = [];
    notifications.forEach(notif => {
      values.push(notif.userId, notif.title, notif.content, notif.type, notif.actionUrl || null);
    });

    const result = await pool.query(query, values);
    return result.rows;
  } catch (error) {
    console.error('Bulk create notifications error:', error);
    throw error;
  }
};