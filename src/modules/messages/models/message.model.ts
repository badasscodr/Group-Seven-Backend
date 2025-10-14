import { pool } from '../../core/config/database';
import { Message, MessageStatus, MessageType } from '../../shared/types';

export class MessageModel {
  static async create(messageData: Omit<Message, 'id' | 'createdAt' | 'updatedAt'>): Promise<Message> {
    const query = `
      INSERT INTO messages (
        conversation_id, sender_id, content, type, status,
        reply_to_id, edited_at, deleted_at, deleted_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      messageData.conversationId,
      messageData.senderId,
      messageData.content,
      messageData.type,
      messageData.status,
      messageData.replyToId || null,
      messageData.editedAt || null,
      messageData.deletedAt || null,
      messageData.deletedBy || null
    ];

    const result = await pool.query(query, values);
    return this.mapRowToMessage(result.rows[0]);
  }

  static async findById(id: string): Promise<Message | null> {
    const query = 'SELECT * FROM messages WHERE id = $1 AND deleted_at IS NULL';
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToMessage(result.rows[0]);
  }

  static async findByConversationId(
    conversationId: string,
    limit: number = 50,
    offset: number = 0
  ): Promise<Message[]> {
    const query = `
      SELECT * FROM messages 
      WHERE conversation_id = $1 AND deleted_at IS NULL
      ORDER BY created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [conversationId, limit, offset]);
    return result.rows.map(row => this.mapRowToMessage(row));
  }

  static async update(id: string, updates: Partial<Message>): Promise<Message | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'id' && key !== 'createdAt') {
        fields.push(`${this.camelToSnake(key)} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE messages 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND deleted_at IS NULL
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToMessage(result.rows[0]);
  }

  static async softDelete(id: string, deletedBy: string): Promise<boolean> {
    const query = `
      UPDATE messages 
      SET deleted_at = CURRENT_TIMESTAMP, deleted_by = $1
      WHERE id = $2 AND deleted_at IS NULL
    `;
    
    const result = await pool.query(query, [deletedBy, id]);
    return result.rowCount > 0;
  }

  static async markAsRead(messageId: string, userId: string): Promise<boolean> {
    const query = `
      INSERT INTO message_reads (message_id, user_id, read_at)
      VALUES ($1, $2, CURRENT_TIMESTAMP)
      ON CONFLICT (message_id, user_id) DO UPDATE
      SET read_at = CURRENT_TIMESTAMP
    `;
    
    const result = await pool.query(query, [messageId, userId]);
    return result.rowCount > 0;
  }

  static async getUnreadCount(userId: string, conversationId?: string): Promise<number> {
    let query = `
      SELECT COUNT(*) as count
      FROM messages m
      LEFT JOIN message_reads mr ON m.id = mr.message_id AND mr.user_id = $1
      WHERE m.sender_id != $1 
      AND m.deleted_at IS NULL
      AND mr.message_id IS NULL
    `;
    
    const values = [userId];
    
    if (conversationId) {
      query += ' AND m.conversation_id = $2';
      values.push(conversationId);
    }
    
    const result = await pool.query(query, values);
    return parseInt(result.rows[0].count);
  }

  static async findWithAttachments(messageId: string): Promise<Message | null> {
    const query = `
      SELECT m.*, array_agg(
        json_build_object(
          'id', ma.id,
          'messageId', ma.message_id,
          'fileName', ma.file_name,
          'originalName', ma.original_name,
          'mimeType', ma.mime_type,
          'size', ma.size,
          'url', ma.url
        )
      ) as attachments
      FROM messages m
      LEFT JOIN message_attachments ma ON m.id = ma.message_id
      WHERE m.id = $1 AND m.deleted_at IS NULL
      GROUP BY m.id
    `;
    
    const result = await pool.query(query, [messageId]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const row = result.rows[0];
    const message = this.mapRowToMessage(row);
    message.attachments = row.attachments.filter(att => att.id !== null);
    
    return message;
  }

  private static mapRowToMessage(row: any): Message {
    return {
      id: row.id,
      conversationId: row.conversation_id,
      senderId: row.sender_id,
      content: row.content,
      type: row.type as MessageType,
      status: row.status as MessageStatus,
      replyToId: row.reply_to_id,
      editedAt: row.edited_at,
      deletedAt: row.deleted_at,
      deletedBy: row.deleted_by,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}