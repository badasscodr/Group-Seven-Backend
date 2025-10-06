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
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.replace('Bearer ', '');

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
        socket.userId = decoded.sub;
        socket.userEmail = decoded.email;
        socket.userRole = decoded.role;
        next();
      } catch (error) {
        next(new Error('Authentication error: Invalid token'));
      }
    });
  }

  private setupEventHandlers() {
    this.io.on('connection', (socket: AuthenticatedSocket) => {
      console.log(`✅ User connected: ${socket.userId} (${socket.userEmail})`);

      // Track user's socket
      if (socket.userId) {
        if (!this.userSockets.has(socket.userId)) {
          this.userSockets.set(socket.userId, new Set());
        }
        this.userSockets.get(socket.userId)!.add(socket.id);

        // Join user's personal room
        socket.join(`user:${socket.userId}`);

        // Notify user's contacts that they're online
        this.emitUserStatus(socket.userId, true);
      }

      // Handle typing indicator
      socket.on('typing:start', ({ conversationId }) => {
        socket.to(`conversation:${conversationId}`).emit('user:typing', {
          userId: socket.userId,
          conversationId,
        });
      });

      socket.on('typing:stop', ({ conversationId }) => {
        socket.to(`conversation:${conversationId}`).emit('user:stopped_typing', {
          userId: socket.userId,
          conversationId,
        });
      });

      // Handle joining conversation rooms
      socket.on('conversation:join', ({ conversationId }) => {
        socket.join(`conversation:${conversationId}`);
      });

      socket.on('conversation:leave', ({ conversationId }) => {
        socket.leave(`conversation:${conversationId}`);
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        console.log(`❌ User disconnected: ${socket.userId}`);

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

  // Emit new message to conversation participants
  public emitNewMessage(conversationId: string, message: any) {
    this.io.to(`conversation:${conversationId}`).emit('message:new', message);
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
