import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  userEmail?: string;
  userRole?: string;
}

export class SocketService {
  private io: Server;
  private userSockets: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs

  constructor(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        credentials: true,
      },
      path: '/socket.io',
    });

    this.setupMiddleware();
    this.setupEventHandlers();
  }

  private setupMiddleware() {
    // Authentication middleware
    this.io.use((socket: AuthenticatedSocket, next) => {
      let token = socket.handshake.auth.token || socket.handshake.headers.authorization;

      // If token has "Bearer " prefix, remove it
      if (token && typeof token === 'string' && token.startsWith('Bearer ')) {
        token = token.substring(7);
      }

      if (!token) {
        console.log('Authentication error: No token provided');
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        socket.userId = decoded.sub;
        socket.userEmail = decoded.email;
        socket.userRole = decoded.role;
        console.log(`✅ Socket authenticated for user: ${socket.userId} (${socket.userEmail})`);
        next();
      } catch (error) {
        console.log('Authentication error: Invalid token', error);
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ User connected with socket ID: ${socket.id}, userId: ${socket.userId} (${socket.userEmail})`);

      // Track user's socket
      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)!.add(socket.id);

        // Join user's personal room
        socket.join(`user:${socket.userId}`);
        console.log(`User ${socket.userId} joined personal room: user:${socket.userId}`);

        // Notify user's contacts that they're online
        this.emitUserStatus(socket.userId, true);
      } else {
        console.log('⚠️ Connected socket without valid userId - authentication may have failed');
      }

      // Handle typing indicator
      socket.on('typing:start', ({ conversationId }) => {
        console.log(`User ${socket.userId} started typing in conversation ${conversationId}`);
        socket.to(`conversation:${conversationId}`).emit('user:typing', {
          userId: socket.userId,
          conversationId,
        });
      });

      socket.on('typing:stop', ({ conversationId }) => {
        console.log(`User ${socket.userId} stopped typing in conversation ${conversationId}`);
        socket.to(`conversation:${conversationId}`).emit('user:stopped_typing', {
          userId: socket.userId,
          conversationId,
        });
      });

      // Handle joining conversation rooms
      socket.on('conversation:join', ({ conversationId }) => {
        console.log(`User ${socket.userId} joining conversation room: conversation:${conversationId}`);
        socket.join(`conversation:${conversationId}`);
        console.log(`User ${socket.userId} joined conversation room: conversation:${conversationId}`);
      });

      socket.on('conversation:leave', ({ conversationId }) => {
        console.log(`User ${socket.userId} leaving conversation room: conversation:${conversationId}`);
        socket.leave(`conversation:${conversationId}`);
      });

      // Handle disconnect
      socket.on('disconnect', (reason) => {
        console.log(`❌ User disconnected: ${socket.userId}, reason: ${reason}, socket ID: ${socket.id}`);

        if (socket.userId) {
          const userSocketIds = this.userSockets.get(socket.userId);
          if (userSocketIds) {
            userSocketIds.delete(socket.id);

            // If no more sockets for this user, mark as offline
            if (userSocketIds.size === 0) {
              this.userSockets.delete(socket.userId);
              this.emitUserStatus(socket.userId, false);
            }
          }
        }
      });
    });
  }

  // Emit new message to conversation participants and both users' personal rooms
  public emitNewMessage(conversationId: string, message: any) {
    console.log('🔔 SocketService: Emitting new message event');
    console.log(`📍 Conversation room: conversation:${conversationId}`);
    console.log(`📊 Conversation room size: ${this.io.sockets.adapter.rooms.get(`conversation:${conversationId}`)?.size || 0}`);

    // Emit to conversation room (for users currently viewing this conversation)
    this.io.to(`conversation:${conversationId}`).emit('message:new', message);
    console.log('✅ Emitted to conversation room');

    // Emit to both sender and recipient personal rooms to ensure they receive the message
    // This ensures real-time delivery even if they're not currently viewing the conversation
    const recipientId = message.recipient?.id;
    const senderId = message.sender?.id;

    if (recipientId) {
      const recipientRoom = this.io.sockets.adapter.rooms.get(`user:${recipientId}`);
      console.log(`👤 Emitting to recipient's room: user:${recipientId}`);
      console.log(`📊 Recipient room size: ${recipientRoom?.size || 0}`);
      if (recipientRoom) {
        console.log(`🔌 Recipient sockets:`, Array.from(recipientRoom));
      }
      this.io.to(`user:${recipientId}`).emit('message:new', message);
      console.log('✅ Emitted to recipient room');
    }

    if (senderId) {
      const senderRoom = this.io.sockets.adapter.rooms.get(`user:${senderId}`);
      console.log(`👤 Emitting to sender's room: user:${senderId}`);
      console.log(`📊 Sender room size: ${senderRoom?.size || 0}`);
      if (senderRoom) {
        console.log(`🔌 Sender sockets:`, Array.from(senderRoom));
      }
      this.io.to(`user:${senderId}`).emit('message:new', message);
      console.log('✅ Emitted to sender room');
    }

    // Debug: log which users are in the conversation room
    const conversationRoom = this.io.sockets.adapter.rooms.get(`conversation:${conversationId}`);
    if (conversationRoom) {
      console.log(`👥 Users in conversation ${conversationId}:`, Array.from(conversationRoom));
    } else {
      console.log(`⚠️ No users in conversation ${conversationId} room`);
    }

    // Log all connected users for debugging
    console.log(`📊 Total connected users: ${this.userSockets.size}`);
    console.log(`👥 Connected user IDs:`, Array.from(this.userSockets.keys()));
  }

  // Emit message edit to conversation participants
  public emitMessageEdit(conversationId: string, message: any) {
    this.io.to(`conversation:${conversationId}`).emit('message:edited', message);
  }

  // Emit message delete to conversation participants
  public emitMessageDelete(conversationId: string, messageId: string) {
    this.io.to(`conversation:${conversationId}`).emit('message:deleted', {
      conversationId,
      messageId,
    });
  }

  // Emit conversation delete to participant
  public emitConversationDelete(userId: string, conversationId: string) {
    this.io.to(`user:${userId}`).emit('conversation:deleted', {
      conversationId,
    });
  }

  // Emit user status (online/offline) to their contacts
  private emitUserStatus(userId: string, isOnline: boolean) {
    this.io.emit('user:status', {
      userId,
      isOnline,
      timestamp: new Date().toISOString(),
    });
  }

  // Get online status of a user
  public isUserOnline(userId: string): boolean {
    return this.userSockets.has(userId);
  }

  // Get all online users
  public getOnlineUsers(): string[] {
    return Array.from(this.userSockets.keys());
  }

  // Get Socket.IO instance for advanced usage
  public getIO(): Server {
    return this.io;
  }
}

// Export singleton instance
let socketService: SocketService | null = null;

export function initializeSocketService(httpServer: HttpServer): SocketService {
  if (!socketService) {
    socketService = new SocketService(httpServer);
  }
  return socketService;
}

export function getSocketService(): SocketService {
  if (!socketService) {
    throw new Error('Socket service not initialized');
  }
  return socketService;
}
