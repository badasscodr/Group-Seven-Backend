import { Request, Response } from 'express';
import { MessagesService } from './messages.service';
import { AuthenticatedRequest } from '../../../core/middleware/auth';
import { CreateMessageRequest, GetMessagesQuery, GetConversationsQuery } from './messages.types';

export class MessagesController {
  constructor(private messagesService: MessagesService) {}

  /**
   * Get conversations for the authenticated user
   */
  getConversations = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          },
          timestamp: new Date().toISOString()
        });
      }

      const query: GetConversationsQuery = {
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        search: req.query.search as string
      };

      const conversations = await this.messagesService.getConversations(userId, query);

      res.json({
        success: true,
        data: conversations,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting conversations:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get conversations'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get messages for a specific conversation
   */
  getMessages = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          },
          timestamp: new Date().toISOString()
        });
      }

      const { conversationId } = req.params;
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Conversation ID is required'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Verify user has access to this conversation
      const conversation = await this.messagesService.getConversationById(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found or access denied'
          },
          timestamp: new Date().toISOString()
        });
      }

      const query: GetMessagesQuery = {
        conversationId,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
        before: req.query.before as string
      };

      const messages = await this.messagesService.getMessages(conversationId, query);

      res.json({
        success: true,
        data: messages,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting messages:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get messages'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Send a new message
   */
  sendMessage = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          },
          timestamp: new Date().toISOString()
        });
      }

      const messageData: CreateMessageRequest = req.body;

      // Validate required fields
      if (!messageData.content || !messageData.recipientId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Content and recipientId are required'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Prevent sending message to oneself
      if (messageData.recipientId === userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Cannot send message to yourself'
          },
          timestamp: new Date().toISOString()
        });
      }

      const message = await this.messagesService.sendMessage(userId, messageData);

      res.status(201).json({
        success: true,
        data: message,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error sending message:', error);
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

  /**
   * Mark conversation as read
   */
  markAsRead = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          },
          timestamp: new Date().toISOString()
        });
      }

      const { conversationId } = req.params;
      if (!conversationId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Conversation ID is required'
          },
          timestamp: new Date().toISOString()
        });
      }

      // Verify user has access to this conversation
      const conversation = await this.messagesService.getConversationById(conversationId, userId);
      if (!conversation) {
        return res.status(404).json({
          success: false,
          error: {
            code: 'CONVERSATION_NOT_FOUND',
            message: 'Conversation not found or access denied'
          },
          timestamp: new Date().toISOString()
        });
      }

      await this.messagesService.markConversationAsRead(conversationId, userId);

      res.json({
        success: true,
        message: 'Conversation marked as read',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error marking conversation as read:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to mark conversation as read'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Search users for starting new conversations
   */
  searchUsers = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          },
          timestamp: new Date().toISOString()
        });
      }

      const query = req.query.q as string || '';
      const role = req.query.role as string;

      const users = await this.messagesService.searchUsers(userId, query, role);

      res.json({
        success: true,
        data: users,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error searching users:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to search users'
        },
        timestamp: new Date().toISOString()
      });
    }
  };

  /**
   * Get or create conversation with a specific user
   */
  getOrCreateConversation = async (req: AuthenticatedRequest, res: Response) => {
    try {
      const userId = req.user?.sub;
      if (!userId) {
        return res.status(401).json({
          success: false,
          error: {
            code: 'UNAUTHORIZED',
            message: 'User not authenticated'
          },
          timestamp: new Date().toISOString()
        });
      }

      const { otherUserId } = req.params;
      if (!otherUserId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Other user ID is required'
          },
          timestamp: new Date().toISOString()
        });
      }

      if (otherUserId === userId) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Cannot create conversation with yourself'
          },
          timestamp: new Date().toISOString()
        });
      }

      const conversationId = await this.messagesService.createOrGetConversation(userId, otherUserId);
      const conversation = await this.messagesService.getConversationById(conversationId, userId);

      res.json({
        success: true,
        data: conversation,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error getting/creating conversation:', error);
      res.status(500).json({
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Failed to get or create conversation'
        },
        timestamp: new Date().toISOString()
      });
    }
  };
}