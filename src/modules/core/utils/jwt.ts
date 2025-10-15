import jwt from 'jsonwebtoken';
import { AuthPayload, JwtConfig, UserRole } from '../types';

export class JwtUtils {
  private static config = {
    secret: process.env.JWT_SECRET || '68ae4bd874011cd0bc07dd3b1abbf354', // Use actual secret from production
    expiresIn: process.env.JWT_EXPIRES_IN || '24h',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  };

  // Validate JWT secret on initialization
  static {
    if (!process.env.JWT_SECRET) {
      console.warn('⚠️ JWT_SECRET not set, using default (not recommended for production)');
    }
  }

  static generateToken(payload: AuthPayload): string {
    return jwt.sign(payload, this.config.secret, {
      expiresIn: this.config.expiresIn,
    } as jwt.SignOptions);
  }

  static verifyToken(token: string): AuthPayload {
    try {
      const decoded = jwt.verify(token, this.config.secret) as AuthPayload;
      return decoded;
    } catch (error) {
      if (error instanceof jwt.TokenExpiredError) {
        throw new Error('Token expired');
      } else if (error instanceof jwt.JsonWebTokenError) {
        throw new Error('Invalid token');
      } else {
        throw new Error('Token verification failed');
      }
    }
  }

  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader) return null;
    
    // Handle various token formats
    if (authHeader.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }
    
    // Handle plain token (for Socket.IO)
    return authHeader;
  }

  static decodeToken(token: string): AuthPayload | null {
    try {
      const decoded = jwt.decode(token) as AuthPayload;
      return decoded;
    } catch (error) {
      return null;
    }
  }

  static isTokenExpired(token: string): boolean {
    try {
      const decoded = jwt.decode(token) as any;
      if (!decoded || !decoded.exp) return true;
      
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp < currentTime;
    } catch (error) {
      return true;
    }
  }

  static generateTokens(userId: string, email: string, role: UserRole, firstName: string, lastName: string) {
    const payload = { userId, email, role, firstName, lastName };
    const refreshPayload = { userId, type: 'refresh' };
    
    return {
      accessToken: this.generateToken(payload),
      refreshToken: jwt.sign(refreshPayload, this.config.secret, {
        expiresIn: this.config.refreshExpiresIn,
      } as jwt.SignOptions)
    };
  }

  static verifyAccessToken(token: string): AuthPayload {
    return this.verifyToken(token);
  }

  static verifyRefreshToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.config.secret) as any;
      
      if (decoded.type !== 'refresh') {
        throw new Error('Invalid token type');
      }
      
      return { userId: decoded.userId };
    } catch (error) {
      throw new Error('Invalid refresh token');
    }
  }

  static generatePasswordResetToken(userId: string): string {
    return jwt.sign({ userId, type: 'password_reset' }, this.config.secret, {
      expiresIn: '1h',
    });
  }

  static verifyPasswordResetToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.config.secret) as any;
      
      if (decoded.type !== 'password_reset') {
        throw new Error('Invalid token type');
      }
      
      return { userId: decoded.userId };
    } catch (error) {
      throw new Error('Invalid or expired reset token');
    }
  }

  static generateEmailVerificationToken(userId: string): string {
    return jwt.sign({ userId, type: 'email_verification' }, this.config.secret, {
      expiresIn: '24h',
    });
  }

  static verifyEmailVerificationToken(token: string): { userId: string } {
    try {
      const decoded = jwt.verify(token, this.config.secret) as any;
      
      if (decoded.type !== 'email_verification') {
        throw new Error('Invalid token type');
      }
      
      return { userId: decoded.userId };
    } catch (error) {
      throw new Error('Invalid or expired verification token');
    }
  }
}

export const jwtUtils = JwtUtils;

export const verifyToken = JwtUtils.verifyToken.bind(JwtUtils);