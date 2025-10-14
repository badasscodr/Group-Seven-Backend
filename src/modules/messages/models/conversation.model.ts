import { pool } from '../../core/config/database';
import { Conversation, ConversationType } from '../../shared/types';

export class ConversationModel {
  static async create(conversationData: Omit<Conversation, 'id' | 'createdAt' | 'updatedAt' | 'lastMessageAt' | 'participants'>): Promise<Conversation> {
    const query = `
      INSERT INTO conversations (
        name, type, description, created_by, is_archived,
        avatar_url, metadata
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `;
    
    const values = [
      conversationData.name,
      conversationData.type,
      conversationData.description || null,
      conversationData.createdBy,
      conversationData.isArchived || false,
      conversationData.avatarUrl || null,
      conversationData.metadata ? JSON.stringify(conversationData.metadata) : null
    ];

    const result = await pool.query(query, values);
    const conversation = this.mapRowToConversation(result.rows[0]);
    
    // Note: participants are handled separately in the service layer
    
    return conversation;
  }

  static async findById(id: string): Promise<Conversation | null> {
    const query = `
      SELECT c.*, array_agg(
        json_build_object(
          'userId', cp.user_id,
          'role', cp.role,
          'joinedAt', cp.joined_at,
          'lastReadAt', cp.last_read_at
        )
      ) as participants
      FROM conversations c
      LEFT JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.id = $1 AND c.is_archived = false
      GROUP BY c.id
    `;
    
    const result = await pool.query(query, [id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToConversation(result.rows[0]);
  }

  static async findByUserId(userId: string, limit: number = 20, offset: number = 0): Promise<Conversation[]> {
    const query = `
      SELECT DISTINCT c.*, array_agg(
        json_build_object(
          'userId', cp.user_id,
          'role', cp.role,
          'joinedAt', cp.joined_at,
          'lastReadAt', cp.last_read_at
        )
      ) as participants
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE cp.user_id = $1 AND c.is_archived = false
      GROUP BY c.id
      ORDER BY c.last_message_at DESC NULLS LAST, c.created_at DESC
      LIMIT $2 OFFSET $3
    `;
    
    const result = await pool.query(query, [userId, limit, offset]);
    return result.rows.map(row => this.mapRowToConversation(row));
  }

  static async update(id: string, updates: Partial<Conversation>): Promise<Conversation | null> {
    const fields = [];
    const values = [];
    let paramIndex = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (value !== undefined && key !== 'id' && key !== 'createdAt' && key !== 'participants') {
        if (key === 'metadata') {
          fields.push(`${this.camelToSnake(key)} = $${paramIndex}`);
          values.push(JSON.stringify(value));
        } else {
          fields.push(`${this.camelToSnake(key)} = $${paramIndex}`);
          values.push(value);
        }
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE conversations 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex} AND is_archived = false
      RETURNING *
    `;

    const result = await pool.query(query, values);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.findById(id);
  }

  static async updateLastMessageAt(conversationId: string): Promise<void> {
    const query = `
      UPDATE conversations 
      SET last_message_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    await pool.query(query, [conversationId]);
  }

  static async addParticipants(conversationId: string, participantIds: string[], role: string = 'member'): Promise<void> {
    const query = `
      INSERT INTO conversation_participants (conversation_id, user_id, role)
      VALUES ${participantIds.map((_, index) => `($1, $${index + 2}, $${participantIds.length + 2})`).join(', ')}
      ON CONFLICT (conversation_id, user_id) DO NOTHING
    `;
    
    const values = [conversationId, ...participantIds, role];
    await pool.query(query, values);
  }

  static async removeParticipant(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      DELETE FROM conversation_participants 
      WHERE conversation_id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [conversationId, userId]);
    return result.rowCount > 0;
  }

  static async updateParticipantRole(conversationId: string, userId: string, role: string): Promise<boolean> {
    const query = `
      UPDATE conversation_participants 
      SET role = $1
      WHERE conversation_id = $2 AND user_id = $3
    `;
    
    const result = await pool.query(query, [role, conversationId, userId]);
    return result.rowCount > 0;
  }

  static async isParticipant(conversationId: string, userId: string): Promise<boolean> {
    const query = `
      SELECT 1 FROM conversation_participants 
      WHERE conversation_id = $1 AND user_id = $2
      LIMIT 1
    `;
    
    const result = await pool.query(query, [conversationId, userId]);
    return result.rows.length > 0;
  }

  static async getParticipantRole(conversationId: string, userId: string): Promise<string | null> {
    const query = `
      SELECT role FROM conversation_participants 
      WHERE conversation_id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [conversationId, userId]);
    return result.rows.length > 0 ? result.rows[0].role : null;
  }

  static async archive(conversationId: string): Promise<boolean> {
    const query = `
      UPDATE conversations 
      SET is_archived = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [conversationId]);
    return result.rowCount > 0;
  }

  static async findDirectMessage(user1Id: string, user2Id: string): Promise<Conversation | null> {
    const query = `
      SELECT c.*, array_agg(
        json_build_object(
          'userId', cp.user_id,
          'role', cp.role,
          'joinedAt', cp.joined_at,
          'lastReadAt', cp.last_read_at
        )
      ) as participants
      FROM conversations c
      INNER JOIN conversation_participants cp ON c.id = cp.conversation_id
      WHERE c.type = 'direct'
      AND c.id IN (
        SELECT conversation_id FROM conversation_participants WHERE user_id = $1
      )
      AND c.id IN (
        SELECT conversation_id FROM conversation_participants WHERE user_id = $2
      )
      GROUP BY c.id
      HAVING COUNT(cp.user_id) = 2
    `;
    
    const result = await pool.query(query, [user1Id, user2Id]);
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToConversation(result.rows[0]);
  }

  private static mapRowToConversation(row: any): Conversation {
    return {
      id: row.id,
      name: row.name,
      type: row.type as ConversationType,
      description: row.description,
      createdBy: row.created_by,
      isArchived: row.is_archived,
      avatarUrl: row.avatar_url,
      metadata: row.metadata ? JSON.parse(row.metadata) : undefined,
      participants: row.participants.filter(p => p.userId !== null),
      lastMessageAt: row.last_message_at,
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }

  private static camelToSnake(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
  }
}