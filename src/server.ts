import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { initDatabase } from './modules/core/config/database';
import { SocketService } from './modules/messaging/services/socket.service';
import { errorHandler, notFoundHandler } from './modules/core/middleware/errorHandler';

import authRoutes from './modules/auth/routes/auth.routes';
import userRoutes from './modules/users/routes/user.routes';
import { messageRoutes, conversationRoutes } from './modules/messaging';
import { fileRoutes, folderRoutes } from './modules/files';
import supplierRoutes from './modules/suppliers/routes/supplier.routes';
import clientRoutes from './modules/clients/routes/client.routes';

dotenv.config();

// CORS configuration - allow multiple origins including Vercel previews
const getAllowedOrigins = () => {
  const corsOrigin = process.env.CORS_ORIGIN;
  if (corsOrigin) {
    return corsOrigin.split(',');
  }
  
  // Default origins for development and production
  return [
    'http://localhost:3000',
    'https://group-seven-beeovbt6y-aaashir128s-projects.vercel.app',
    // Allow all Vercel preview domains
    /\.vercel\.app$/
  ];
};

const app = express();
const PORT = process.env.PORT || 8000;

// Initialize Socket.IO
const httpServer = createServer(app);
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: getAllowedOrigins(),
    credentials: true
  }
});

// Initialize Socket Service
const socketService = new SocketService(io);

// Temporarily disable rate limiting for development
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
  max: parseInt(process.env.RATE_LIMIT_MAX || '1000'), // Increased from 100 to 1000
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    return req.path.startsWith('/socket.io') || 
           req.path === '/health' || 
           req.path === '/ready' ||
           req.path.startsWith('/auth/'); // Skip rate limiting for auth endpoints
  }
});

app.use(helmet());
app.use(cors({
  origin: getAllowedOrigins(),
  credentials: true
}));
app.use(limiter);
app.use(compression());
app.use(morgan('combined'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Group Seven Initiatives API',
      version: '1.0.0',
      description: 'Backend API for Group Seven Initiatives business management platform',
    },
    servers: [
      {
        url: process.env.API_URL || 'http://localhost:8000',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/modules/**/routes/*.ts'],
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (req, res) => {
  res.json({
    success: true,
    message: 'Server is ready',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/conversations', conversationRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/folders', folderRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/client', clientRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

const startServer = async () => {
  try {
    await initDatabase();
    
    console.log('✅ Socket.IO initialized for real-time messaging');
    
    httpServer.listen(PORT, () => {
      console.log(`🚀 Group Seven Initiatives API server running on port ${PORT}`);
      console.log(`📚 API Documentation available at: http://localhost:${PORT}/api-docs`);
      console.log(`🏥 Health check available at: http://localhost:${PORT}/health`);
      console.log(`🔌 WebSocket available at: ws://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

startServer();

export default app;