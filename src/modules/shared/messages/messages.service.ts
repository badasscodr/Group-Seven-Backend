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
        SELECT "id" FROM conversations
        WHERE "participants"::jsonb @> $1::jsonb AND "participants"::jsonb @> $2::jsonb
        AND jsonb_array_length("participants") = 2
      `, [JSON.stringify([userId1]), JSON.stringify([userId2])]);

      if (existingConversation.rows.length > 0) {
        return existingConversation.rows[0].id;
      }

      // Create new conversation
      const conversationId = randomUUID();
      await this.db.query(`
        INSERT INTO conversations ("id", "participants", "createdAt", "updatedAt")
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
          "id", "content", "senderId", "recipientId", "conversationId",
          "messageType", "fileUrl", "fileName", "createdAt", "updatedAt"
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
        SET "lastMessageId" = $1, "updatedAt" = NOW()
        WHERE "id" = $2
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
        conversationId: message.conversationId,
        timestamp: message.createdAt,
        isRead: message.isRead || false,
        messageType: message.messageType,
        fileUrl: message.fileUrl,
        fileName: message.fileName
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

      let whereClause = 'WHERE m."conversationId" = $1';
      const params: any[] = [conversationId];

      if (before) {
        whereClause += ' AND m."createdAt" < $' + (params.length + 1);
        params.push(before);
      }

      const result = await this.db.query(`
        SELECT
          m.*,
          s."id" AS "senderId", s."firstName" AS "senderFirstName", s."lastName" AS "senderLastName",
          s."email" AS "senderEmail", s."role" AS "senderRole", s."avatarUrl" AS "senderAvatar",
          r."id" AS "recipientId", r."firstName" AS "recipientFirstName", r."lastName" AS "recipientLastName",
          r."email" AS "recipientEmail", r."role" AS "recipientRole", r."avatarUrl" AS "recipientAvatar"
        FROM messages m
        JOIN users s ON m."senderId" = s."id"
        JOIN users r ON m."recipientId" = r."id"
        ${whereClause}
        ORDER BY m."createdAt" DESC
        LIMIT $${params.length + 1} OFFSET $${params.length + 2}
      `, [...params, limit, offset]);

      return result.rows.map(row => ({
        id: row.id,
        content: row.content,
        sender: {
          id: row.senderId,
          firstName: row.senderFirstName,
          lastName: row.senderLastName,
          email: row.senderEmail,
          role: row.senderRole,
          avatar: row.senderAvatar
        },
        recipient: {
          id: row.recipientId,
          firstName: row.recipientFirstName,
          lastName: row.recipientLastName,
          email: row.recipientEmail,
          role: row.recipientRole,
          avatar: row.recipientAvatar
        },
        conversationId: row.conversationId,
        timestamp: row.createdAt,
        isRead: row.isRead || false,
        messageType: row.messageType,
        fileUrl: row.fileUrl,
        fileName: row.fileName
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

      let whereClause = 'WHERE c."participants"::jsonb ? $1::text';
      const params: any[] = [userId];

      // Add search functionality if provided
      if (search) {
        whereClause += ` AND (
          u."firstName" ILIKE $${params.length + 1} OR
          u."lastName" ILIKE $${params.length + 1} OR
          u."email" ILIKE $${params.length + 1} OR
          m."content" ILIKE $${params.length + 1}
        )`;
        params.push(`%${search}%`);
      }

      // Simplified query to avoid parameter conflicts
      const conversationsResult = await this.db.query(`
        SELECT c.*, m."content" AS "lastMessageContent",
               m."createdAt" AS "lastMessageTime",
               m."senderId" AS "lastMessageSender",
               m."messageType" AS "lastMessageType"
        FROM conversations c
        LEFT JOIN messages m ON c."lastMessageId" = m."id"
        ${whereClause}
        ORDER BY c."updatedAt" DESC
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
          SELECT "id", "firstName", "lastName", "email", "role", "avatarUrl",
                 CASE WHEN "lastLogin" > NOW() - INTERVAL '15 minutes' THEN true ELSE false END AS "isOnline",
                 "lastLogin" AS "lastSeen"
          FROM users
          WHERE "id" = ANY($1)
        `, [otherParticipantIds]);

        // Get unread count
        const unreadResult = await this.db.query(`
          SELECT COUNT(*)::int AS "unreadCount"
          FROM messages
          WHERE "conversationId" = $1
          AND "recipientId" = $2
          AND ("isRead" = false OR "isRead" IS NULL)
        `, [conv.id, userId]);

        const otherParticipants = participantsResult.rows.map(user => ({
          id: user.id,
          firstName: user.firstName || '',
          lastName: user.lastName || '',
          email: user.email,
          role: user.role,
          avatar: user.avatarUrl,
          isOnline: user.isOnline,
          lastSeen: user.lastSeen
        }));

        result.rows.push({
          ...conv,
          otherParticipants: otherParticipants,
          unreadCount: unreadResult.rows[0]?.unreadCount || 0
        });
      }

      return result.rows.map(row => {
        const lastMessage = row.lastMessageContent ? {
          id: row.lastMessageId,
          content: row.lastMessageContent,
          sender: row.otherParticipants[0], // Will be populated correctly in real implementation
          recipient: row.otherParticipants[0],
          conversationId: row.id,
          timestamp: row.lastMessageTime,
          isRead: true, // Simplified for now
          messageType: row.lastMessageType
        } : undefined;

        return {
          id: row.id,
          participants: row.otherParticipants || [],
          lastMessage,
          unreadCount: row.unreadCount || 0,
          updatedAt: row.updatedAt
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
        SET "isRead" = true, "updatedAt" = NOW()
        WHERE "conversationId" = $1
        AND "recipientId" = $2
        AND ("isRead" = false OR "isRead" IS NULL)
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
        SELECT "id", "firstName", "lastName", "email", "role", "avatarUrl",
               CASE WHEN "lastLogin" > NOW() - INTERVAL '15 minutes' THEN true ELSE false END AS "isOnline",
               "lastLogin" AS "lastSeen"
        FROM users
        WHERE "id" = $1
      `, [userId]);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = result.rows[0];
      return {
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        role: user.role,
        avatar: user.avatarUrl,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
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
      let whereClause = 'WHERE "id" != $1';
      const params: any[] = [currentUserId];

      if (query) {
        whereClause += ` AND (
          "firstName" ILIKE $${params.length + 1} OR
          "lastName" ILIKE $${params.length + 1} OR
          "email" ILIKE $${params.length + 1}
        )`;
        params.push(`%${query}%`);
      }

      if (role && role !== 'all') {
        whereClause += ` AND "role" = $${params.length + 1}`;
        params.push(role);
      }

      const result = await this.db.query(`
        SELECT "id", "firstName", "lastName", "email", "role", "avatarUrl",
               CASE WHEN "lastLogin" > NOW() - INTERVAL '15 minutes' THEN true ELSE false END AS "isOnline",
               "lastLogin" AS "lastSeen"
        FROM users
        ${whereClause}
        ORDER BY
          CASE WHEN "lastLogin" > NOW() - INTERVAL '15 minutes' THEN 0 ELSE 1 END,
          "firstName", "lastName"
        LIMIT 50
      `, params);

      return result.rows.map(user => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        role: user.role,
        avatar: user.avatarUrl,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }));
    } catch (error) {
      console.error('Error searching users:', error);
      throw new Error('Failed to search users');
    }
  }

  /**
   * Edit a message
   */
  async editMessage(messageId: string, userId: string, newContent: string): Promise<MessageResponse | null> {
    try {
      // First check if the message exists and belongs to the user
      const checkResult = await this.db.query(`
        SELECT "senderId" FROM messages WHERE "id" = $1
      `, [messageId]);

      if (checkResult.rows.length === 0) {
        throw new Error('Message not found');
      }

      if (checkResult.rows[0].senderId !== userId) {
        throw new Error('Unauthorized: You can only edit your own messages');
      }

      // Update the message
      const updateResult = await this.db.query(`
        UPDATE messages
        SET "content" = $1, "updatedAt" = NOW()
        WHERE "id" = $2
        RETURNING *
      `, [newContent, messageId]);

      if (updateResult.rows.length === 0) {
        return null;
      }

      const message = updateResult.rows[0];

      // Get sender and recipient details
      const [senderResult, recipientResult] = await Promise.all([
        this.getUserById(message.senderId),
        this.getUserById(message.recipientId)
      ]);

      return {
        id: message.id,
        content: message.content,
        sender: senderResult,
        recipient: recipientResult,
        conversationId: message.conversationId,
        timestamp: message.createdAt,
        isRead: message.isRead || false,
        messageType: message.messageType,
        fileUrl: message.fileUrl,
        fileName: message.fileName
      };
    } catch (error) {
      console.error('Error editing message:', error);
      throw error;
    }
  }

  /**
   * Delete a message
   */
  async deleteMessage(messageId: string, userId: string): Promise<void> {
    try {
      // First check if the message exists and belongs to the user
      const checkResult = await this.db.query(`
        SELECT "senderId", "conversationId" FROM messages WHERE "id" = $1
      `, [messageId]);

      if (checkResult.rows.length === 0) {
        throw new Error('Message not found');
      }

      if (checkResult.rows[0].senderId !== userId) {
        throw new Error('Unauthorized: You can only delete your own messages');
      }

      const conversationId = checkResult.rows[0].conversationId;

      // Delete the message
      await this.db.query(`
        DELETE FROM messages WHERE "id" = $1
      `, [messageId]);

      // Update conversation's last message if this was the last message
      const lastMessageResult = await this.db.query(`
        SELECT "id" FROM messages
        WHERE "conversationId" = $1
        ORDER BY "createdAt" DESC
        LIMIT 1
      `, [conversationId]);

      if (lastMessageResult.rows.length > 0) {
        await this.db.query(`
          UPDATE conversations
          SET "lastMessageId" = $1, "updatedAt" = NOW()
          WHERE "id" = $2
        `, [lastMessageResult.rows[0].id, conversationId]);
      } else {
        // No messages left, clear last message
        await this.db.query(`
          UPDATE conversations
          SET "lastMessageId" = NULL, "updatedAt" = NOW()
          WHERE "id" = $1
        `, [conversationId]);
      }
    } catch (error) {
      console.error('Error deleting message:', error);
      throw error;
    }
  }

  /**
   * Delete a conversation
   */
  async deleteConversation(conversationId: string, userId: string): Promise<void> {
    try {
      // Check if user is a participant
      const checkResult = await this.db.query(`
        SELECT "participants" FROM conversations WHERE "id" = $1
      `, [conversationId]);

      if (checkResult.rows.length === 0) {
        throw new Error('Conversation not found');
      }

      let participantIds: string[];
      try {
        if (typeof checkResult.rows[0].participants === 'string') {
          participantIds = JSON.parse(checkResult.rows[0].participants);
        } else if (Array.isArray(checkResult.rows[0].participants)) {
          participantIds = checkResult.rows[0].participants;
        } else {
          throw new Error('Invalid participants format');
        }
      } catch (error) {
        console.error('Error parsing participants:', error);
        throw new Error('Failed to parse conversation participants');
      }

      if (!participantIds.includes(userId)) {
        throw new Error('Unauthorized: You are not a participant of this conversation');
      }

      // Delete all messages in the conversation (CASCADE will handle this, but explicit for clarity)
      await this.db.query(`
        DELETE FROM messages WHERE "conversationId" = $1
      `, [conversationId]);

      // Delete the conversation
      await this.db.query(`
        DELETE FROM conversations WHERE "id" = $1
      `, [conversationId]);
    } catch (error) {
      console.error('Error deleting conversation:', error);
      throw error;
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
                 WHERE m."conversationId" = c."id"
                 AND m."recipientId" = $2
                 AND (m."isRead" = false OR m."isRead" IS NULL)
               ) AS "unreadCount"
        FROM conversations c
        WHERE c."id" = $1 AND c."participants"::jsonb ? $2::text
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
        SELECT "id", "firstName", "lastName", "email", "role", "avatarUrl",
               CASE WHEN "lastLogin" > NOW() - INTERVAL '15 minutes' THEN true ELSE false END AS "isOnline",
               "lastLogin" AS "lastSeen"
        FROM users
        WHERE "id" = ANY($1)
      `, [participantIds]);

      const participants = participantsResult.rows.map(user => ({
        id: user.id,
        firstName: user.firstName || '',
        lastName: user.lastName || '',
        email: user.email,
        role: user.role,
        avatar: user.avatarUrl,
        isOnline: user.isOnline,
        lastSeen: user.lastSeen
      }));

      return {
        id: conversation.id,
        participants,
        unreadCount: conversation.unreadCount || 0,
        updatedAt: conversation.updatedAt
      };
    } catch (error) {
      console.error('Error getting conversation by ID:', error);
      throw new Error('Failed to get conversation');
    }
  }
}
