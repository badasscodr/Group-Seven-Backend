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
    
    console.log('🔍 Backend Auth Check:');
    console.log('  - Authorization header:', req.headers.authorization);
    console.log('  - Extracted token:', token ? `${token.substring(0, 20)}...` : 'null');
    
    if (!token) {
      console.log('❌ No token found');
      res.status(401).json({
        success: false,
        error: 'Access token required'
      });
      return;
    }

    const payload = JwtUtils.verifyToken(token);
    console.log('  - Token payload:', payload);
    
    const { UserService } = await import('../../users/services/user.service');
    const user = await UserService.getUserById(payload.userId);
    
    console.log('  - User from DB:', user ? { id: user.id, email: user.email, role: user.role, isActive: user.isActive } : 'null');
    
    if (!user || !user.isActive) {
      console.log('❌ User not found or inactive');
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
    
    console.log('✅ Auth successful for:', { id: user.id, role: user.role });
    next();
  } catch (error) {
    console.log('❌ Auth error:', error.message);
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