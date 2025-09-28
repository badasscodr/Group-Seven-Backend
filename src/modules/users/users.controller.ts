import { Request, Response } from 'express';
import multer from 'multer';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import { getUserProfile, updateUserProfile, updateUserAvatar, deleteUserAvatar } from './users.service';
import { validateFile } from '../../core/services/cloudflare-r2.service';

// Configure multer for avatar uploads
const avatarStorage = multer.memoryStorage();
export const avatarUploadMiddleware = multer({
  storage: avatarStorage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit for avatars
    files: 1, // Only 1 file allowed
  },
}).single('avatar');

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

export const uploadAvatar = async (req: AuthenticatedRequest, res: Response) => {
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

    const file = req.file;
    if (!file) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'NO_FILE',
          message: 'No avatar file provided'
        },
        timestamp: new Date().toISOString()
      });
    }

    // Validate avatar file (only images allowed)
    const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE_TYPE',
          message: `Invalid file type. Allowed types: ${allowedMimeTypes.join(', ')}`
        },
        timestamp: new Date().toISOString()
      });
    }

    const validation = validateFile(file);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_FILE',
          message: validation.error
        },
        timestamp: new Date().toISOString()
      });
    }

    const result = await updateUserAvatar(req.user.sub, file);

    res.status(200).json({
      success: true,
      data: {
        avatarUrl: result.avatarUrl,
        uploadResult: result.uploadResult
      },
      message: 'Avatar uploaded successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in uploadAvatar:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: error.message || 'Failed to upload avatar'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const deleteAvatar = async (req: AuthenticatedRequest, res: Response) => {
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

    const success = await deleteUserAvatar(req.user.sub);

    if (!success) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NO_AVATAR',
          message: 'No avatar found to delete'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: { deleted: true },
      message: 'Avatar deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('Error in deleteAvatar:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error.message || 'Failed to delete avatar'
      },
      timestamp: new Date().toISOString()
    });
  }
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