import { pool } from '../../core/config/database';
import { Message, MessageAttachment, CreateMessageRequest, UpdateMessageRequest, MessageQuery, UnreadCount } from '../types/message.types';

export class MessageModel {
  static async create(data: CreateMessageRequest & { senderId: string }): Promise<Message> {
    const query = `
      INSERT INTO messages (
        conversation_id, sender_id, content, message_type, reply_to_id
      ) VALUES ($1, $2, $3, $4, $5)
      RETURNING *
    `;
    
    const values = [
      data.conversationId,
      data.senderId,
      data.content,
      data.messageType || 'text',
      data.replyToId || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: string): Promise<Message | null> {
    const query = `
      SELECT m.*, 
             u.first_name || ' ' || u.last_name as sender_name,
             u.email as sender_email
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.id = $1 AND m.deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByConversationId(conversationId: string, query: MessageQuery): Promise<{ messages: Message[]; total: number }> {
    const { page = 1, limit = 50, before, after, search } = query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE m.conversation_id = $1 AND m.deleted_at IS NULL';
    const queryParams: any[] = [conversationId];
    let paramIndex = 2;

    if (before) {
      whereClause += ` AND m.sent_at < $${paramIndex}`;
      queryParams.push(before);
      paramIndex++;
    }

    if (after) {
      whereClause += ` AND m.sent_at > $${paramIndex}`;
      queryParams.push(after);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND m.content ILIKE $${paramIndex}`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM messages m
      ${whereClause}
    `;

    const messagesQuery = `
      SELECT m.*, 
             u.first_name || ' ' || u.last_name as sender_name,
             u.email as sender_email
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      ${whereClause}
      ORDER BY m.sent_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const [countResult, messagesResult] = await Promise.all([
      pool.query(countQuery, queryParams.slice(0, -2)),
      pool.query(messagesQuery, queryParams)
    ]);

    return {
      messages: messagesResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async update(id: string, data: UpdateMessageRequest): Promise<Message | null> {
    const query = `
      UPDATE messages 
      SET content = $1, is_edited = true, edited_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
      RETURNING *
    `;
    
    const result = await pool.query(query, [data.content, id]);
    return result.rows[0] || null;
  }

  static async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const query = `
      UPDATE messages 
      SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [deletedBy, id]);
    return result.rowCount > 0;
  }

  static async markAsRead(messageId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE messages 
      SET read_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND sender_id != $2 AND read_at IS NULL
    `;
    
    const result = await pool.query(query, [messageId, userId]);
    return result.rowCount > 0;
  }

  static async markConversationAsRead(conversationId: string, userId: string): Promise<number> {
    const query = `
      UPDATE messages 
      SET read_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL
    `;
    
    const result = await pool.query(query, [conversationId, userId]);
    return result.rowCount;
  }

  static async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    const query = `
      SELECT COUNT(*) as count
      FROM messages
      WHERE conversation_id = $1 AND sender_id != $2 AND read_at IS NULL AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [conversationId, userId]);
    return parseInt(result.rows[0].count);
  }

  static async getAllUnreadCounts(userId: string): Promise<UnreadCount[]> {
    const query = `
      SELECT conversation_id, COUNT(*) as count
      FROM messages
      WHERE sender_id != $1 AND read_at IS NULL AND deleted_at IS NULL
      AND conversation_id IN (
        SELECT conversation_id FROM conversation_participants WHERE user_id = $1 AND left_at IS NULL
      )
      GROUP BY conversation_id
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async getLastMessage(conversationId: string): Promise<Message | null> {
    const query = `
      SELECT m.*, 
             u.first_name || ' ' || u.last_name as sender_name,
             u.email as sender_email
      FROM messages m
      JOIN users u ON m.sender_id = u.id
      WHERE m.conversation_id = $1 AND m.deleted_at IS NULL
      ORDER BY m.sent_at DESC
      LIMIT 1
    `;
    
    const result = await pool.query(query, [conversationId]);
    return result.rows[0] || null;
  }
}

export class MessageAttachmentModel {
  static async create(data: {
    messageId: string;
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    s3Key: string;
    s3Url: string;
    uploadedBy: string;
  }): Promise<MessageAttachment> {
    const query = `
      INSERT INTO message_attachments (
        message_id, file_name, original_name, mime_type, file_size, s3_key, s3_url, uploaded_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `;
    
    const values = [
      data.messageId,
      data.fileName,
      data.originalName,
      data.mimeType,
      data.fileSize,
      data.s3Key,
      data.s3Url,
      data.uploadedBy
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findByMessageId(messageId: string): Promise<MessageAttachment[]> {
    const query = `
      SELECT ma.*, u.first_name || ' ' || u.last_name as uploader_name
      FROM message_attachments ma
      JOIN users u ON ma.uploaded_by = u.id
      WHERE ma.message_id = $1
      ORDER BY ma.created_at ASC
    `;
    
    const result = await pool.query(query, [messageId]);
    return result.rows;
  }

  static async findById(id: string): Promise<MessageAttachment | null> {
    const query = `
      SELECT ma.*, u.first_name || ' ' || u.last_name as uploader_name
      FROM message_attachments ma
      JOIN users u ON ma.uploaded_by = u.id
      WHERE ma.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM message_attachments WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }
}