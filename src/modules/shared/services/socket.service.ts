import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HTTPServer } from 'http';
import { User } from '../types';

interface AuthenticatedSocket extends Socket {
  user: User;
}

interface NotificationData {
  type: string;
  data: any;
}

interface TypingData {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

interface PresenceData {
  userId: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: Date;
}

class SocketService {
  private io: SocketIOServer | null = null;
  private connectedUsers: Map<string, Set<string>> = new Map(); // userId -> Set of socketIds
  private userSockets: Map<string, string> = new Map(); // socketId -> userId
  private typingUsers: Map<string, Set<string>> = new Map(); // conversationId -> Set of userIds

  initialize(server: HTTPServer): void {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: process.env.CORS_ORIGIN || "http://localhost:3000",
        methods: ["GET", "POST"],
        credentials: true
      },
      transports: ['websocket', 'polling']
    });

    this.io.use(this.authenticateSocket.bind(this));

    this.io.on('connection', this.handleConnection.bind(this));

    console.log('Socket.IO server initialized');
  }

  private async authenticateSocket(socket: any, next: any): Promise<void> {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        return next(new Error('Authentication token required'));
      }

      const { JwtUtils } = await import('../../core/utils/jwt');
      const decoded = JwtUtils.verifyAccessToken(token);
      
      const { UserModel } = await import('../../users/models/user.model');
      const user = await UserModel.findById(decoded.userId);
      
      if (!user || !user.isActive) {
        return next(new Error('User not found or inactive'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid authentication token'));
    }
  }

  private handleConnection(socket: AuthenticatedSocket): void {
    const userId = socket.user.id;
    const socketId = socket.id;

    console.log(`User ${userId} connected with socket ${socketId}`);

    // Track user connection
    if (!this.connectedUsers.has(userId)) {
      this.connectedUsers.set(userId, new Set());
    }
    this.connectedUsers.get(userId)!.add(socketId);
    this.userSockets.set(socketId, userId);

    // Join user to their personal room for notifications
    socket.join(`user:${userId}`);

    // Update user presence
    this.updateUserPresence(userId, 'online');

    // Handle joining conversation rooms
    socket.on('joinConversation', (conversationId: string) => {
      this.handleJoinConversation(socket, conversationId);
    });

    // Handle leaving conversation rooms
    socket.on('leaveConversation', (conversationId: string) => {
      this.handleLeaveConversation(socket, conversationId);
    });

    // Handle typing indicators
    socket.on('typing', (data: TypingData) => {
      this.handleTyping(socket, data);
    });

    // Handle stop typing
    socket.on('stopTyping', (data: TypingData) => {
      this.handleStopTyping(socket, data);
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      this.handleDisconnect(socket);
    });

    // Send initial connection confirmation
    socket.emit('connected', {
      userId,
      socketId,
      timestamp: new Date()
    });
  }

  private handleJoinConversation(socket: AuthenticatedSocket, conversationId: string): void {
    // Verify user is participant in conversation
    this.verifyConversationParticipant(socket.user.id, conversationId)
      .then(isParticipant => {
        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
          socket.emit('joinedConversation', { conversationId });
        } else {
          socket.emit('error', { message: 'Not a participant in this conversation' });
        }
      })
      .catch(error => {
        socket.emit('error', { message: 'Failed to join conversation' });
      });
  }

  private handleLeaveConversation(socket: AuthenticatedSocket, conversationId: string): void {
    socket.leave(`conversation:${conversationId}`);
    socket.emit('leftConversation', { conversationId });
  }

  private handleTyping(socket: AuthenticatedSocket, data: TypingData): void {
    const { conversationId, userId, isTyping } = data;

    // Only allow users to type for themselves
    if (userId !== socket.user.id) {
      return;
    }

    // Add to typing users for this conversation
    if (!this.typingUsers.has(conversationId)) {
      this.typingUsers.set(conversationId, new Set());
    }
    this.typingUsers.get(conversationId)!.add(userId);

    // Broadcast to conversation (excluding sender)
    socket.to(`conversation:${conversationId}`).emit('userTyping', {
      conversationId,
      userId,
      isTyping: true
    });
  }

  private handleStopTyping(socket: AuthenticatedSocket, data: TypingData): void {
    const { conversationId, userId } = data;

    // Only allow users to stop typing for themselves
    if (userId !== socket.user.id) {
      return;
    }

    // Remove from typing users
    const conversationTypingUsers = this.typingUsers.get(conversationId);
    if (conversationTypingUsers) {
      conversationTypingUsers.delete(userId);
      if (conversationTypingUsers.size === 0) {
        this.typingUsers.delete(conversationId);
      }
    }

    // Broadcast to conversation (excluding sender)
    socket.to(`conversation:${conversationId}`).emit('userTyping', {
      conversationId,
      userId,
      isTyping: false
    });
  }

  private handleDisconnect(socket: AuthenticatedSocket): void {
    const userId = socket.user.id;
    const socketId = socket.id;

    console.log(`User ${userId} disconnected (socket ${socketId})`);

    // Remove socket tracking
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.connectedUsers.delete(userId);
        // User is completely offline
        this.updateUserPresence(userId, 'offline');
      }
    }
    this.userSockets.delete(socketId);
  }

  private async verifyConversationParticipant(userId: string, conversationId: string): Promise<boolean> {
    try {
      const { ConversationModel } = await import('../../messages/models/conversation.model');
      return await ConversationModel.isParticipant(conversationId, userId);
    } catch (error) {
      return false;
    }
  }

  private updateUserPresence(userId: string, status: 'online' | 'offline' | 'away'): void {
    const presenceData: PresenceData = {
      userId,
      status,
      lastSeen: status === 'offline' ? new Date() : undefined
    };

    // Broadcast presence update to all connected users
    this.io?.emit('presenceUpdate', presenceData);
  }

  // Public methods for external use

  emitToUser(userId: string, event: string, data: any): void {
    this.io?.to(`user:${userId}`).emit(event, data);
  }

  emitToConversation(conversationId: string, event: string, data: any): void {
    this.io?.to(`conversation:${conversationId}`).emit(event, data);
  }

  sendNotification(userId: string, notification: NotificationData): void {
    this.emitToUser(userId, 'notification', notification);
  }

  broadcastToAll(event: string, data: any): void {
    this.io?.emit(event, data);
  }

  getConnectedUsers(): string[] {
    return Array.from(this.connectedUsers.keys());
  }

  isUserConnected(userId: string): boolean {
    return this.connectedUsers.has(userId) && this.connectedUsers.get(userId)!.size > 0;
  }

  getUserSocketCount(userId: string): number {
    return this.connectedUsers.get(userId)?.size || 0;
  }

  getTypingUsers(conversationId: string): string[] {
    return Array.from(this.typingUsers.get(conversationId) || []);
  }

  // Force disconnect a user (useful for logout, ban, etc.)
  disconnectUser(userId: string): void {
    const userSockets = this.connectedUsers.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.io?.sockets.sockets.get(socketId)?.disconnect(true);
      });
    }
  }
}

export const socketService = new SocketService();