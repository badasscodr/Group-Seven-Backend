import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { errorHandler } from './core/middleware/errorHandler';
import { notFoundHandler } from './core/middleware/notFoundHandler';
import { responseTransformer, requestTransformer } from './core/middleware/responseTransformer';
import { initializeDatabase, checkDatabaseConnection } from './core/database/init';
import { initializeSocketService } from './core/services/socket.service';
import { authRoutes } from './modules/auth';
import { usersRoutes } from './modules/users';
import { adminRoutes } from './modules/admin';
import { clientRoutes } from './modules/client';
import { supplierRoutes } from './modules/supplier';
import { employeeRoutes } from './modules/employee';
import { documentsRoutes } from './modules/documents';
import { messagesRoutes } from './modules/shared/messages';
import { notificationsRoutes } from './modules/shared/notifications';
import assignmentRoutes from './modules/assignments/assignment.routes';
import visaRoutes from './modules/visa/visa.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;

// Rate limiting
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests from this IP, please try again later.'
    }
  }
});

// Security middleware
app.use(helmet());
app.use(cors({
  origin: [
    process.env.APP_URL || 'http://localhost:3001',
    'http://localhost:3000',
    'https://localhost:3000',
    process.env.FRONTEND_URL || 'http://localhost:3000',
    // Vercel deployment URLs
    'https://group-seven-frontend-rnwovesmz-awais-alwaisys-projects.vercel.app',
    'https://group-seven-frontend.vercel.app',
    'https://g-7.vercel.app',
    // Allow all Vercel preview domains for this project
    /^https:\/\/group-seven-frontend-.*\.vercel\.app$/,
    // Allow production domain when available
    process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null
  ].filter(Boolean),
  credentials: true
}));
app.use(limiter);

// General middleware
app.use(compression());
app.use(morgan('combined'));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Apply JSON middleware to all routes except document uploads
app.use((req, res, next) => {
  // Skip JSON parsing for document upload endpoint
  if (req.path === '/api/documents' && req.method === 'POST') {
    return next();
  }
  return express.json({ limit: '10mb' })(req, res, next);
});

// NOTE: Response transformer disabled - database now uses camelCase column names
// No transformation needed since frontend, backend, and database all use camelCase
// app.use(responseTransformer);

// NOTE: Request transformer REMOVED - caused validation errors
// Frontend sends camelCase → Backend receives camelCase → Database uses camelCase
// No transformation needed at any layer

// Swagger documentation
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
  apis: ['./src/routes/*.ts', './src/modules/*/*.routes.ts'], // paths to files containing OpenAPI definitions
};

const specs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

// Health check endpoints
app.get('/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy',
    timestamp: new Date().toISOString()
  });
});

app.get('/ready', (req, res) => {
  // Add database health check here when implemented
  res.json({
    success: true,
    message: 'Server is ready',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/client', clientRoutes);
app.use('/api/supplier', supplierRoutes);
app.use('/api/employee', employeeRoutes);
app.use('/api/documents', documentsRoutes);
app.use('/api/messages', messagesRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/visa', visaRoutes);

// Error handling middleware (must be last)
app.use(notFoundHandler);
app.use(errorHandler);

// Initialize database and start server
const startServer = async () => {
  try {
    // Check database connection
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }

    // Initialize database schema (skip to avoid conflicts with existing data)
    // await initializeDatabase();

    // Create HTTP server
    const httpServer = createServer(app);

    // Initialize Socket.IO
    const socketService = initializeSocketService(httpServer);
    console.log('✅ Socket.IO initialized for real-time messaging');

    // Start the server
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