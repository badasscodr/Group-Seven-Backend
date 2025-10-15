import { Request, Response, NextFunction } from 'express';
import { JwtUtils } from '../utils/jwt';
import { AuthPayload, UserRole } from '../types';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export const authenticate = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = JwtUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (!token) {
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const payload = JwtUtils.verifyToken(token);
    
    const { UserService } = await import('../../users/services/user.service');
    const user = await UserService.getUserById(payload.userId);
    
    if (!user || !user.isActive) {
      res.status(401).json({
        success: false,
        error: 'User not found or inactive'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('❌ Auth error:', error.message);
    res.status(401).json({
      success: false,
      error: error instanceof Error ? error.message : 'Authentication failed'
    });
  }
};

export const authorize = (...roles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
      return;
    }

    if (roles.length > 0 && !roles.includes(req.user.role)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions'
      });
      return;
    }

    next();
  };
};

export const optionalAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = JwtUtils.extractTokenFromHeader(req.headers.authorization);
    
    if (token) {
      const payload = JwtUtils.verifyToken(token);
      const { UserService } = await import('../../users/services/user.service');
      const user = await UserService.getUserById(payload.userId);
      
      if (user && user.isActive) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role
        };
      }
    }

    next();
  } catch (error) {
    // For optional auth, we continue even if token is invalid
    next();
  }
};

export { authenticate as authMiddleware, authorize as requireRole };