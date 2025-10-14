import { Server as SocketIOServer, Socket } from 'socket.io';
import { verifyToken } from '../../core/utils/jwt';
import { UserService } from '../../users/services/user.service';
import { MessageService } from './message.service';
import { ConversationService } from './conversation.service';
import { 
  MessageEvent, 
  ConversationEvent, 
  TypingEvent, 
  PresenceEvent,
  TypingIndicator,
  OnlineUser
} from '../types/message.types';

export class SocketService {
  private io: SocketIOServer;
  private onlineUsers: Map<string, OnlineUser> = new Map();
  private typingIndicators: Map<string, Map<string, TypingIndicator>> = new Map();

  constructor(io: SocketIOServer) {
    this.io = io;
    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware(): void {
    this.io.use(async (socket, next) => {
      try {
        const token = socket.handshake.auth.token;
        if (!token) {
          return next(new Error('Authentication token required'));
        }

        const decoded = verifyToken(token);
        const user = await UserService.getUserById(decoded.userId);
        
        if (!user) {
          return next(new Error('User not found'));
        }

        socket.data.user = user;
        next();
      } catch (error) {
        next(new Error('Invalid authentication token'));
      }
    });
  }

  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      const user = socket.data.user;
      console.log(`User ${user.email} connected with socket ${socket.id}`);

      // Add user to online users
      const onlineUser: OnlineUser = {
        userId: user.id,
        userName: `${user.firstName} ${user.lastName}`,
        socketId: socket.id,
        lastSeen: new Date()
      };
      this.onlineUsers.set(user.id, onlineUser);

      // Join user to their personal room for notifications
      socket.join(`user:${user.id}`);

      // Broadcast user online status
      this.broadcastPresenceEvent({
        type: 'user:online',
        user: {
          id: user.id,
          name: onlineUser.userName
        }
      }, user.id);

      // Handle joining conversation rooms
      socket.on('join:conversation', async (conversationId: string) => {
        try {
          // Verify user is participant in conversation
          const conversation = await ConversationService.getConversation(conversationId, user.id);
          if (!conversation) {
            socket.emit('error', { message: 'Conversation not found or access denied' });
            return;
          }

          // Join conversation room
          socket.join(`conversation:${conversationId}`);
          console.log(`User ${user.email} joined conversation ${conversationId}`);

          // Send current online users in conversation
          const participants = await ConversationService.getParticipants(conversationId, user.id);
          const onlineParticipants = participants
            .filter(p => this.onlineUsers.has(p.userId))
            .map(p => this.onlineUsers.get(p.userId)!);

          socket.emit('conversation:online_users', {
            conversationId,
            users: onlineParticipants
          });

        } catch (error) {
          socket.emit('error', { message: 'Failed to join conversation' });
        }
      });

      // Handle leaving conversation rooms
      socket.on('leave:conversation', (conversationId: string) => {
        socket.leave(`conversation:${conversationId}`);
        console.log(`User ${user.email} left conversation ${conversationId}`);
      });

      // Handle typing indicators
      socket.on('typing:start', (conversationId: string) => {
        this.handleTypingStart(conversationId, user);
      });

      socket.on('typing:stop', (conversationId: string) => {
        this.handleTypingStop(conversationId, user);
      });

      // Handle message events
      socket.on('message:send', async (data: {
        conversationId: string;
        content: string;
        messageType?: 'text' | 'image' | 'file';
        replyToId?: string;
      }) => {
        try {
          const message = await MessageService.sendMessage({
            ...data,
            senderId: user.id
          });

          // Broadcast message to conversation participants
          this.broadcastMessageEvent({
            type: 'message:sent',
            message,
            conversationId: data.conversationId,
            userId: user.id
          }, data.conversationId, user.id);

        } catch (error) {
          socket.emit('error', { message: 'Failed to send message' });
        }
      });

      socket.on('message:edit', async (data: {
        messageId: string;
        content: string;
      }) => {
        try {
          const message = await MessageService.updateMessage(
            data.messageId,
            { content: data.content },
            user.id
          );

          if (message) {
            // Broadcast edit to conversation participants
            this.broadcastMessageEvent({
              type: 'message:edited',
              message,
              conversationId: message.conversationId,
              userId: user.id
            }, message.conversationId, user.id);
          }

        } catch (error) {
          socket.emit('error', { message: 'Failed to edit message' });
        }
      });

      socket.on('message:delete', async (messageId: string) => {
        try {
          const message = await MessageService.getMessage(messageId, user.id);
          if (message) {
            await MessageService.deleteMessage(messageId, user.id);

            // Broadcast deletion to conversation participants
            this.broadcastMessageEvent({
              type: 'message:deleted',
              message,
              conversationId: message.conversationId,
              userId: user.id
            }, message.conversationId, user.id);
          }

        } catch (error) {
          socket.emit('error', { message: 'Failed to delete message' });
        }
      });

      socket.on('message:read', async (messageId: string) => {
        try {
          const message = await MessageService.getMessage(messageId, user.id);
          if (message) {
            await MessageService.markMessageAsRead(messageId, user.id);

            // Broadcast read receipt to message sender
            this.broadcastMessageEvent({
              type: 'message:read',
              message,
              conversationId: message.conversationId,
              userId: user.id
            }, message.conversationId, user.id, [message.senderId]);
          }

        } catch (error) {
          socket.emit('error', { message: 'Failed to mark message as read' });
        }
      });

      // Handle conversation events
      socket.on('conversation:create', async (data: {
        type: 'direct' | 'group';
        name?: string;
        description?: string;
        participantIds: string[];
      }) => {
        try {
          const conversation = await ConversationService.createConversation({
            ...data,
            createdBy: user.id
          });

          // Broadcast conversation creation to all participants
          this.broadcastConversationEvent({
            type: 'conversation:created',
            conversation,
            userId: user.id
          }, conversation.participantIds, user.id);

        } catch (error) {
          socket.emit('error', { message: 'Failed to create conversation' });
        }
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log(`User ${user.email} disconnected`);
        
        // Remove user from online users
        this.onlineUsers.delete(user.id);

        // Clean up typing indicators
        for (const [conversationId, typingMap] of this.typingIndicators.entries()) {
          if (typingMap.has(user.id)) {
            typingMap.delete(user.id);
            this.broadcastTypingEvent({
              type: 'typing:stopped',
              conversationId,
              user: {
                id: user.id,
                name: `${user.firstName} ${user.lastName}`
              }
            }, conversationId);
          }
        }

        // Broadcast user offline status
        this.broadcastPresenceEvent({
          type: 'user:offline',
          user: {
            id: user.id,
            name: `${user.firstName} ${user.lastName}`
          }
        }, user.id);
      });
    });
  }

  private handleTypingStart(conversationId: string, user: any): void {
    if (!this.typingIndicators.has(conversationId)) {
      this.typingIndicators.set(conversationId, new Map());
    }

    const typingMap = this.typingIndicators.get(conversationId)!;
    const indicator: TypingIndicator = {
      conversationId,
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      isTyping: true,
      timestamp: new Date()
    };

    typingMap.set(user.id, indicator);

    // Broadcast typing event
    this.broadcastTypingEvent({
      type: 'typing:started',
      conversationId,
      user: {
        id: user.id,
        name: indicator.userName
      }
    }, conversationId);

    // Auto-stop typing after 3 seconds of inactivity
    setTimeout(() => {
      const currentIndicator = typingMap.get(user.id);
      if (currentIndicator && currentIndicator.isTyping) {
        this.handleTypingStop(conversationId, user);
      }
    }, 3000);
  }

  private handleTypingStop(conversationId: string, user: any): void {
    const typingMap = this.typingIndicators.get(conversationId);
    if (typingMap && typingMap.has(user.id)) {
      typingMap.delete(user.id);

      // Broadcast stop typing event
      this.broadcastTypingEvent({
        type: 'typing:stopped',
        conversationId,
        user: {
          id: user.id,
          name: `${user.firstName} ${user.lastName}`
        }
      }, conversationId);
    }
  }

  private broadcastMessageEvent(event: MessageEvent, conversationId: string, excludeUserId?: string, targetUserIds?: string[]): void {
    const room = `conversation:${conversationId}`;
    
    if (targetUserIds && targetUserIds.length > 0) {
      // Send to specific users
      targetUserIds.forEach(userId => {
        this.io.to(`user:${userId}`).emit('message:event', event);
      });
    } else {
      // Send to all in conversation room except sender
      this.io.to(room).except(`user:${excludeUserId}`).emit('message:event', event);
    }
  }

  private broadcastConversationEvent(event: ConversationEvent, participantIds: string[], excludeUserId?: string): void {
    participantIds.forEach(userId => {
      if (userId !== excludeUserId) {
        this.io.to(`user:${userId}`).emit('conversation:event', event);
      }
    });
  }

  private broadcastTypingEvent(event: TypingEvent, conversationId: string): void {
    const room = `conversation:${conversationId}`;
    this.io.to(room).emit('typing:event', event);
  }

  private broadcastPresenceEvent(event: PresenceEvent, excludeUserId?: string): void {
    // Broadcast to all connected users except the user themselves
    this.io.except(`user:${excludeUserId}`).emit('presence:event', event);
  }

  // Public methods for external use
  getOnlineUsers(): OnlineUser[] {
    return Array.from(this.onlineUsers.values());
  }

  isUserOnline(userId: string): boolean {
    return this.onlineUsers.has(userId);
  }

  getTypingUsers(conversationId: string): TypingIndicator[] {
    const typingMap = this.typingIndicators.get(conversationId);
    return typingMap ? Array.from(typingMap.values()) : [];
  }

  // Send notification to specific user
  sendNotificationToUser(userId: string, event: any): void {
    this.io.to(`user:${userId}`).emit('notification', event);
  }

  // Send notification to conversation participants
  sendNotificationToConversation(conversationId: string, event: any, excludeUserId?: string): void {
    const room = `conversation:${conversationId}`;
    if (excludeUserId) {
      this.io.to(room).except(`user:${excludeUserId}`).emit('notification', event);
    } else {
      this.io.to(room).emit('notification', event);
    }
  }
}