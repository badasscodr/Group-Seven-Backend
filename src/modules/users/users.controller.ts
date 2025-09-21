import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import { getUserProfile, updateUserProfile } from './users.service';

export const getProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
    }

    const userProfile = await getUserProfile(req.user.sub, req.user.role);

    res.status(200).json({
      success: true,
      data: userProfile,
      message: 'Profile retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(404).json({
      success: false,
      error: {
        code: 'USER_NOT_FOUND',
        message: error.message || 'User not found'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
    }

    const userId = req.user.sub;
    const updateData = req.body;

    const updatedProfile = await updateUserProfile(userId, req.user.role, updateData);

    res.status(200).json({
      success: true,
      data: updatedProfile,
      message: 'Profile updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message || 'Failed to update profile'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const uploadAvatar = (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Upload avatar endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
};

export const deleteAvatar = (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Delete avatar endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
};

export const changePassword = (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Change password endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
};