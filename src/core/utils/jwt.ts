import jwt from 'jsonwebtoken';
import { JWTPayload, UserRole } from '../../shared/types';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '7d';

export const generateTokens = (userId: string, email: string, role: UserRole) => {
  const permissions = getPermissionsForRole(role);

  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    sub: userId,
    email,
    role,
    permissions,
  };

  const accessToken = jwt.sign(
    payload,
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );

  const refreshToken = jwt.sign(
    { sub: userId },
    JWT_SECRET,
    { expiresIn: JWT_REFRESH_EXPIRES_IN } as jwt.SignOptions
  );

  return { accessToken, refreshToken };
};

export const verifyToken = (token: string): JWTPayload => {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

export const getPermissionsForRole = (role: UserRole): string[] => {
  const basePermissions = ['read:profile', 'write:profile'];

  switch (role) {
    case 'admin':
      return [
        ...basePermissions,
        'read:users',
        'write:users',
        'delete:users',
        'read:all_requests',
        'write:all_requests',
        'read:all_jobs',
        'write:all_jobs',
        'read:all_documents',
        'write:all_documents',
        'read:all_messages',
        'write:all_messages',
        'read:analytics',
        'write:analytics',
      ];

    case 'client':
      return [
        ...basePermissions,
        'read:own_requests',
        'write:own_requests',
        'read:quotations',
        'write:quotations',
        'read:own_documents',
        'write:own_documents',
        'read:own_messages',
        'write:messages',
      ];

    case 'supplier':
      return [
        ...basePermissions,
        'read:published_requests',
        'write:quotations',
        'read:own_quotations',
        'read:own_documents',
        'write:own_documents',
        'read:own_messages',
        'write:messages',
      ];

    case 'employee':
      return [
        ...basePermissions,
        'read:own_attendance',
        'write:own_attendance',
        'read:own_leave',
        'write:own_leave',
        'read:assigned_requests',
        'read:own_documents',
        'write:own_documents',
        'read:own_messages',
        'write:messages',
      ];

    case 'candidate':
      return [
        ...basePermissions,
        'read:jobs',
        'write:applications',
        'read:own_applications',
        'read:own_interviews',
        'read:own_documents',
        'write:own_documents',
        'read:own_messages',
        'write:messages',
      ];

    default:
      return basePermissions;
  }
};