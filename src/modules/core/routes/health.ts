import { Router } from 'express';
import { getPool } from '../config/database';
import { query } from '../config/database';

const router = Router();

// Comprehensive health check endpoint
router.get('/', async (req, res) => {
  interface HealthCheck {
    status: string;
    timestamp: string;
    uptime: number;
    version: string;
    checks: {
      database: string;
      memory: string;
      authentication: string;
    };
    databaseResponseTime?: string;
    memoryUsage?: string;
    error?: string;
  }

  const healthCheck: HealthCheck = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    checks: {
      database: 'unknown',
      memory: 'unknown',
      authentication: 'unknown'
    }
  };

  try {
    // Check database connectivity and performance
    const startTime = Date.now();
    await query('SELECT COUNT(*) FROM users WHERE is_active = true');
    const dbResponseTime = Date.now() - startTime;

    healthCheck.checks.database = dbResponseTime < 1000 ? 'healthy' : 'slow';
    healthCheck.databaseResponseTime = `${dbResponseTime}ms`;

    // Check memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = Math.round(memUsage.heapUsed / 1024 / 1024);
    healthCheck.checks.memory = memUsageMB < 500 ? 'healthy' : 'high';
    healthCheck.memoryUsage = `${memUsageMB}MB`;

    // Check authentication system by verifying JWT secret is set
    const jwtSecret = process.env.JWT_SECRET;
    healthCheck.checks.authentication = jwtSecret ? 'healthy' : 'misconfigured';

    // Overall status determination
    const allHealthy = Object.values(healthCheck.checks).every(check => check === 'healthy');
    healthCheck.status = allHealthy ? 'healthy' : 'degraded';

    const statusCode = allHealthy ? 200 : 503;
    return res.status(statusCode).json(healthCheck);

  } catch (error: any) {
    console.error('❌ Health check failed:', error);
    healthCheck.status = 'unhealthy';
    healthCheck.checks.database = 'failed';
    healthCheck.error = error.message;

    return res.status(503).json(healthCheck);
  }
});

// Simple ping endpoint
router.get('/ping', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    message: 'pong'
  });
});

export default router;