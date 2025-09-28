import { Pool } from 'pg';
import { randomUUID } from 'crypto';
import {
  Message,
  Conversation,
  ConversationWithDetails,
  CreateMessageRequest,
  GetMessagesQuery,
  GetConversationsQuery,
  MessageResponse,
  ConversationResponse,
  User
} from './messages.types';

export class MessagesService {
  constructor(private db: Pool) {}

  /**
   * Create or get existing conversation between two users
   */
  async createOrGetConversation(userId1: string, userId2: string): Promise<string> {
    try {
      // Check if conversation already exists
      const existingConversation = await this.db.query(`
        SELECT id FROM conversations
        WHERE participants::jsonb @> $1::jsonb AND participants::jsonb @> $2::jsonb
        AND jsonb_array_length(participants) = 2
      `, [JSON.stringify([userId1]), JSON.stringify([userId2])]);

      if (existingConversation.rows.length > 0) {
        return existingConversation.rows[0].id;
      }

      // Create new conversation
      const conversationId = randomUUID();
      await this.db.query(`
        INSERT INTO conversations (id, participants, created_at, updated_at)
        VALUES ($1, $2, NOW(), NOW())
      `, [conversationId, JSON.stringify([userId1, userId2])]);

      return conversationId;
    } catch (error) {
      console.error('Error creating/getting conversation:', error);
      throw new Error('Failed to create or get conversation');
    }
  }

  /**
   * Send a new message
   */
  async sendMessage(senderId: string, data: CreateMessageRequest): Promise<MessageResponse> {
    try {
      // Get or create conversation
      const conversationId = await this.createOrGetConversation(senderId, data.recipientId);

      // Create message
      const messageId = randomUUID();
      const messageResult = await this.db.query(`
        INSERT INTO messages (
          id, content, sender_id, recipient_id, conversation_id,
          message_type, file_url, file_name, created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [
        messageId,
        data.content,
        senderId,
        data.recipientId,
        conversationId,
        data.messageType || 'text',
        data.fileUrl || null,
        data.fileName || null
      ]);

      // Update conversation's last message and timestamp
      await this.db.query(`
        UPDATE conversations
        SET last_message_id = $1, updated_at = NOW()
        WHERE id = $2
      `, [messageId, conversationId]);

      // Get sender and recipient details
      const [senderResult, recipientResult] = await Promise.all([
        this.getUserById(senderId),
        this.getUserById(data.recipientId)
      ]);

      const message = messageResult.rows[0];
      return {
        id: message.id,
        content: message.content,
        sender: senderResult,
        recipient: recipientResult,
        conversationId: message.conversation_id,
        timestamp: message.created_at,
        isRead: message.is_read || false,
        messageType: message.message_type,
        fileUrl: message.file_url,
        fileName: message.file_name
      };
    } catch (error) {
      console.error('Error sending message:', error);
      throw new Error('Failed to send message');
    }
  }

  /**
   * Get messages for a conversation
   */
  async getMessages(conversationId: string, query: GetMessagesQuery = {}): Promise<MessageResponse[]> {
    try {
      const { limit = 50, offset = 0, before } = query;

      let whereClause = 'WHERE m.conversation_id = $1';
      const params: any[] = [conversationId];

      if (before) {
        whereClause += ' AND m.created_at < $' + (params.length + 1);
        params.push(before);
      }

      const result = await this.db.query(`
        SELECT
          m.*,
          s.id as sender_id, s.first_name as sender_first_name, s.last_name as sender_last_name,
          s.email as sender_email, s.role as sender_role, s.avatar as sender_avatar,
          r.id as recipient_id, r.first_name as recipient_first_name, r.last_name as recipient_last_name,
          r.email as recipient_email, r.role as recipient_role, r.avatar as recipient_avatar
        FROM messages m
        JOIN users s ON m.sender_id = s.id
        JOIN users r ON m.recipient_id = r.id
        ${whereClause}
        ORDER BY m.created_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);

      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        sender: {
          id: row.sender_id,
          firstName: row.sender_first_name,
          lastName: row.sender_last_name,
          email: row.sender_email,
          role: row.sender_role,
          avatar: row.sender_avatar
        },
        recipient: {
          id: row.recipient_id,
          firstName: row.recipient_first_name,
          lastName: row.recipient_last_name,
          email: row.recipient_email,
          role: row.recipient_role,
          avatar: row.recipient_avatar
        },
        conversationId: row.conversation_id,
        timestamp: row.created_at,
        isRead: row.is_read || false,
        messageType: row.message_type,
        fileUrl: row.file_url,
        fileName: row.file_name
      })).reverse(); // Reverse to get chronological order
    } catch (error) {
      console.error('Error getting messages:', error);
      throw new Error('Failed to get messages');
    }
  }

  /**
   * Get conversations for a user
   */
  async getConversations(userId: string, query: GetConversationsQuery = {}): Promise<ConversationResponse[]> {
    try {
      const { limit = 20, offset = 0, search } = query;

      let whereClause = 'WHERE c.participants::jsonb ? $1';
      const params: any[] = [userId];

      // Add search functionality if provided
      if (search) {
        whereClause += ` AND (
          u.first_name ILIKE $${params.length + 1} OR
          u.last_name ILIKE $${params.length + 1} OR
          u.email ILIKE $${params.length + 1} OR
          m.content ILIKE $${params.length + 1}
        )`;
        params.push(`%${search}%`);
      }

      // Simplified query to avoid parameter conflicts
      const conversationsResult = await this.db.query(`
        SELECT c.*, m.content as last_message_content,
               m.created_at as last_message_time,
               m.sender_id as last_message_sender,
               m.message_type as last_message_type
        FROM conversations c
        LEFT JOIN messages m ON c.last_message_id = m.id
        ${whereClause}
        ORDER BY c.updated_at DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);

      const result = { rows: [] as any[] };

      for (const conv of conversationsResult.rows) {
        // Get participants for this conversation
        let participantIds: string[];
        try {
          if (typeof conv.participants === 'string') {
            participantIds = JSON.parse(conv.participants) as string[];
          } else if (Array.isArray(conv.participants)) {
            participantIds = conv.participants;
          } else {
            console.error('Invalid participants format:', conv.participants);
            continue;
          }
        } catch (error) {
          console.error('Error parsing participants:', conv.participants, error);
          continue;
        }

        const otherParticipantIds = participantIds.filter(id => id !== userId);

        if (otherParticipantIds.length === 0) continue;

        // Get participant details
        const participantsResult = await this.db.query(`
          SELECT id, first_name, last_name, email, role, avatar,
                 CASE WHEN last_seen > NOW() - INTERVAL '15 minutes' THEN true ELSE false END as is_online,
                 last_seen
          FROM users
          WHERE id = ANY($1)
        `, [otherParticipantIds]);

        // Get unread count
        const unreadResult = await this.db.query(`
          SELECT COUNT(*)::int as unread_count
          FROM messages
          WHERE conversation_id = $1
          AND recipient_id = $2
          AND (is_read = false OR is_read IS NULL)
        `, [conv.id, userId]);

        const otherParticipants = participantsResult.rows.map(user => ({
          id: user.id,
          firstName: user.first_name || '',
          lastName: user.last_name || '',
          email: user.email,
          role: user.role,
          avatar: user.avatar,
          isOnline: user.is_online,
          lastSeen: user.last_seen
        }));

        result.rows.push({
          ...conv,
          other_participants: otherParticipants,
          unread_count: unreadResult.rows[0]?.unread_count || 0
        });
      }

      return result.rows.map(row => {
        const lastMessage = row.last_message_content ? {
          id: row.last_message_id,
          content: row.last_message_content,
          sender: row.other_participants[0], // Will be populated correctly in real implementation
          recipient: row.other_participants[0],
          conversationId: row.id,
          timestamp: row.last_message_time,
          isRead: true, // Simplified for now
          messageType: row.last_message_type
        } : undefined;

        return {
          id: row.id,
          participants: row.other_participants || [],
          lastMessage,
          unreadCount: row.unread_count || 0,
          updatedAt: row.updated_at
        };
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      throw new Error('Failed to get conversations');
    }
  }

  /**
   * Mark messages in a conversation as read
   */
  async markConversationAsRead(conversationId: string, userId: string): Promise<void> {
    try {
      await this.db.query(`
        UPDATE messages
        SET is_read = true, updated_at = NOW()
        WHERE conversation_id = $1
        AND recipient_id = $2
        AND (is_read = false OR is_read IS NULL)
      `, [conversationId, userId]);
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      throw new Error('Failed to mark conversation as read');
    }
  }

  /**
   * Get user by ID (helper method)
   */
  private async getUserById(userId: string): Promise<User> {
    try {
      const result = await this.db.query(`
        SELECT id, first_name, last_name, email, role, avatar,
               CASE WHEN last_seen > NOW() - INTERVAL '15 minutes' THEN true ELSE false END as is_online,
               last_seen, company_name, business_type
        FROM users
        WHERE id = $1
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      return {
        id: user.id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isOnline: user.is_online,
        lastSeen: user.last_seen,
        companyName: user.company_name,
        businessType: user.business_type
      };
    } catch (error) {
      console.error('Error getting user by ID:', error);
      throw new Error('Failed to get user details');
    }
  }

  /**
   * Search users for starting new conversations
   */
  async searchUsers(currentUserId: string, query: string = '', role?: string): Promise<User[]> {
    try {
      let whereClause = 'WHERE id != $1';
      const params: any[] = [currentUserId];

      if (query) {
        whereClause += ` AND (
          first_name ILIKE $${params.length + 1} OR
          last_name ILIKE $${params.length + 1} OR
          email ILIKE $${params.length + 1}
        )`;
        params.push(`%${query}%`);
      }

      if (role && role !== 'all') {
        whereClause += ` AND role = $${params.length + 1}`;
        params.push(role);
      }

      const result = await this.db.query(`
        SELECT id, first_name, last_name, email, role, avatar,
               CASE WHEN last_seen > NOW() - INTERVAL '15 minutes' THEN true ELSE false END as is_online,
               last_seen, company_name, business_type
        FROM users
        ${whereClause}
        ORDER BY
          CASE WHEN last_seen > NOW() - INTERVAL '15 minutes' THEN 0 ELSE 1 END,
          first_name, last_name
        LIMIT 50
      `, params);

      return result.rows.map(user => ({
        id: user.id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isOnline: user.is_online,
        lastSeen: user.last_seen,
        companyName: user.company_name,
        businessType: user.business_type
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Get conversation by ID with participant details
   */
  async getConversationById(conversationId: string, userId: string): Promise<ConversationResponse | null> {
    try {
      const result = await this.db.query(`
        SELECT c.*,
               (
                 SELECT COUNT(*)::int
                 FROM messages m
                 WHERE m.conversation_id = c.id
                 AND m.recipient_id = $2
                 AND (m.is_read = false OR m.is_read IS NULL)
               ) as unread_count
        FROM conversations c
        WHERE c.id = $1 AND c.participants::jsonb ? $2
      `, [conversationId, userId]);

      if (result.rows.length === 0) {
        return null;
      }

      const conversation = result.rows[0];
      let participantIds: string[];
      try {
        if (typeof conversation.participants === 'string') {
          participantIds = JSON.parse(conversation.participants);
        } else if (Array.isArray(conversation.participants)) {
          participantIds = conversation.participants;
        } else {
          throw new Error('Invalid participants format');
        }
      } catch (error) {
        console.error('Error parsing participants in getConversationById:', conversation.participants, error);
        throw new Error('Failed to parse conversation participants');
      }

      // Get participant details
      const participantsResult = await this.db.query(`
        SELECT id, first_name, last_name, email, role, avatar,
               CASE WHEN last_seen > NOW() - INTERVAL '15 minutes' THEN true ELSE false END as is_online,
               last_seen
        FROM users
        WHERE id = ANY($1)
      `, [participantIds]);

      const participants = participantsResult.rows.map(user => ({
        id: user.id,
        firstName: user.first_name || '',
        lastName: user.last_name || '',
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        isOnline: user.is_online,
        lastSeen: user.last_seen
      }));

      return {
        id: conversation.id,
        participants,
        unreadCount: conversation.unread_count || 0,
        updatedAt: conversation.updated_at
      };
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      throw new Error('Failed to get conversation');
    }
  }
}