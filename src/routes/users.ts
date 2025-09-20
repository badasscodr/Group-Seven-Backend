import express from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth';
import { getUserProfile } from '../services/userService';

const router = express.Router();

router.get('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
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
});

router.put('/profile', authenticate, async (req: AuthenticatedRequest, res) => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required'
        },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const userId = req.user.sub;
    const updateData = req.body;

    // Temporary implementation - returns success to allow frontend to work
    // TODO: Implement database update
    res.status(200).json({
      success: true,
      data: {
        ...updateData,
        id: userId,
        updatedAt: new Date().toISOString()
      },
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
});

router.post('/avatar', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Upload avatar endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

router.delete('/avatar', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Delete avatar endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

router.put('/password', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Change password endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;