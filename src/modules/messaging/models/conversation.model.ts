import { pool } from '../../core/config/database';
import { Conversation, ConversationParticipant, CreateConversationRequest, UpdateConversationRequest, ConversationQuery } from '../types/message.types';

export class ConversationModel {
  static async create(data: CreateConversationRequest & { createdBy: string }): Promise<Conversation> {
    const query = `
      INSERT INTO conversations (
        type, name, description, avatar_url, participant_ids, admin_ids, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      data.type,
      data.name || null,
      data.description || null,
      data.avatarUrl || null,
      data.participantIds,
      data.adminIds || [data.createdBy],
      data.createdBy
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: string): Promise<Conversation | null> {
    const query = `
      SELECT c.*, 
             u.first_name || ' ' || u.last_name as creator_name,
             m.content as last_message_content,
             m.sender_id as last_message_sender_id,
             m.sent_at as last_message_sent_at
      FROM conversations c
      JOIN users u ON c.created_by = u.id
      LEFT JOIN messages m ON c.last_message_id = m.id
      WHERE c.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string, query: ConversationQuery): Promise<{ conversations: Conversation[]; total: number }> {
    const { page = 1, limit = 20, type, isActive, search } = query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE $1 = ANY(c.participant_ids)';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (type) {
      whereClause += ` AND c.type = $${paramIndex}`;
      queryParams.push(type);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereClause += ` AND c.is_active = $${paramIndex}`;
      queryParams.push(isActive);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (c.name ILIKE $${paramIndex} OR c.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    const countQuery = `
      SELECT COUNT(*) as total
      FROM conversations c
      ${whereClause}
    `;

    const conversationsQuery = `
      SELECT c.*, 
             u.first_name || ' ' || u.last_name as creator_name,
             m.content as last_message_content,
             m.sender_id as last_message_sender_id,
             m.sent_at as last_message_sent_at
      FROM conversations c
      JOIN users u ON c.created_by = u.id
      LEFT JOIN messages m ON c.last_message_id = m.id
      ${whereClause}
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const [countResult, conversationsResult] = await Promise.all([
      pool.query(countQuery, queryParams.slice(0, -2)),
      pool.query(conversationsQuery, queryParams)
    ]);

    return {
      conversations: conversationsResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async update(id: string, data: UpdateConversationRequest): Promise<Conversation | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(data.description);
      paramIndex++;
    }

    if (data.avatarUrl !== undefined) {
      updateFields.push(`avatar_url = $${paramIndex}`);
      values.push(data.avatarUrl);
      paramIndex++;
    }

    if (data.participantIds !== undefined) {
      updateFields.push(`participant_ids = $${paramIndex}`);
      values.push(data.participantIds);
      paramIndex++;
    }

    if (data.adminIds !== undefined) {
      updateFields.push(`admin_ids = $${paramIndex}`);
      values.push(data.adminIds);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE conversations 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async updateLastMessage(conversationId: string, messageId: string): Promise<boolean> {
    const query = `
      UPDATE conversations 
      SET last_message_id = $1, last_message_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [messageId, conversationId]);
    return result.rowCount > 0;
  }

  static async addParticipant(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE conversations 
      SET participant_ids = array_append(participant_ids, $1), updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND NOT ($1 = ANY(participant_ids))
    `;
    
    const result = await pool.query(query, [userId, conversationId]);
    return result.rowCount > 0;
  }

  static async removeParticipant(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE conversations 
      SET participant_ids = array_remove(participant_ids, $1), updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [userId, conversationId]);
    return result.rowCount > 0;
  }

  static async addAdmin(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE conversations 
      SET admin_ids = array_append(admin_ids, $1), updated_at = CURRENT_TIMESTAMP
      WHERE id = $2 AND NOT ($1 = ANY(admin_ids))
    `;
    
    const result = await pool.query(query, [userId, conversationId]);
    return result.rowCount > 0;
  }

  static async removeAdmin(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE conversations 
      SET admin_ids = array_remove(admin_ids, $1), updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
    `;
    
    const result = await pool.query(query, [userId, conversationId]);
    return result.rowCount > 0;
  }

  static async deactivate(conversationId: string): Promise<boolean> {
    const query = `
      UPDATE conversations 
      SET is_active = false, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [conversationId]);
    return result.rowCount > 0;
  }

  static async findDirectConversation(user1Id: string, user2Id: string): Promise<Conversation | null> {
    const query = `
      SELECT * FROM conversations
      WHERE type = 'direct' 
      AND is_active = true
      AND ($1 = ANY(participant_ids) AND $2 = ANY(participant_ids))
      AND array_length(participant_ids, 1) = 2
    `;
    
    const result = await pool.query(query, [user1Id, user2Id]);
    return result.rows[0] || null;
  }
}

export class ConversationParticipantModel {
  static async addParticipant(data: {
    conversationId: string;
    userId: string;
    role: 'admin' | 'member';
  }): Promise<ConversationParticipant> {
    const query = `
      INSERT INTO conversation_participants (
        conversation_id, user_id, role, joined_at
      ) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
      RETURNING *
    `;
    
    const values = [data.conversationId, data.userId, data.role];
    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async removeParticipant(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE conversation_participants 
      SET left_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
    `;
    
    const result = await pool.query(query, [conversationId, userId]);
    return result.rowCount > 0;
  }

  static async findByConversationId(conversationId: string): Promise<ConversationParticipant[]> {
    const query = `
      SELECT cp.*, 
             u.first_name || ' ' || u.last_name as user_name,
             u.email as user_email,
             u.avatar_url as user_avatar_url
      FROM conversation_participants cp
      JOIN users u ON cp.user_id = u.id
      WHERE cp.conversation_id = $1 AND cp.left_at IS NULL
      ORDER BY cp.joined_at ASC
    `;
    
    const result = await pool.query(query, [conversationId]);
    return result.rows;
  }

  static async findByUserId(userId: string): Promise<ConversationParticipant[]> {
    const query = `
      SELECT cp.*, 
             c.name as conversation_name,
             c.type as conversation_type,
             c.avatar_url as conversation_avatar_url
      FROM conversation_participants cp
      JOIN conversations c ON cp.conversation_id = c.id
      WHERE cp.user_id = $1 AND cp.left_at IS NULL
      ORDER BY cp.last_read_at DESC NULLS LAST, cp.joined_at DESC
    `;
    
    const result = await pool.query(query, [userId]);
    return result.rows;
  }

  static async updateLastReadAt(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      UPDATE conversation_participants 
      SET last_read_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
    `;
    
    const result = await pool.query(query, [conversationId, userId]);
    return result.rowCount > 0;
  }

  static async updateRole(conversationId: string, userId: string, role: 'admin' | 'member'): Promise<boolean> {
    const query = `
      UPDATE conversation_participants 
      SET role = $1, updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $2 AND user_id = $3 AND left_at IS NULL
    `;
    
    const result = await pool.query(query, [role, conversationId, userId]);
    return result.rowCount > 0;
  }

  static async toggleMute(conversationId: string, userId: string, isMuted: boolean): Promise<boolean> {
    const query = `
      UPDATE conversation_participants 
      SET is_muted = $1, updated_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $2 AND user_id = $3 AND left_at IS NULL
    `;
    
    const result = await pool.query(query, [isMuted, conversationId, userId]);
    return result.rowCount > 0;
  }

  static async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = $1 AND user_id = $2 AND left_at IS NULL
      )
    `;
    
    const result = await pool.query(query, [conversationId, userId]);
    return result.rows[0].exists;
  }

  static async isAdmin(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT EXISTS(
        SELECT 1 FROM conversation_participants 
        WHERE conversation_id = $1 AND user_id = $2 AND role = 'admin' AND left_at IS NULL
      )
    `;
    
    const result = await pool.query(query, [conversationId, userId]);
    return result.rows[0].exists;
  }
}