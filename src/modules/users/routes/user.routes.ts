import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { UserService } from '../services/user.service';
import { FileService } from '../../files/services/file.service';
import { authMiddleware, requireRole } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { uploadMiddleware } from '../../core/middleware/upload';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ApiResponse, AuthenticatedRequest, UserRole } from '../../core/types';

const router = Router();

// Get current user profile
router.get('/profile',
  authMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const user = await UserService.getUserById(req.user!.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'User profile retrieved successfully',
      data: user
    };
    
    res.status(200).json(response);
  })
);

// Update current user profile
router.put('/profile',
  authMiddleware,
  body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('phone').optional().isString().trim(),
  body('avatarUrl').optional().custom((value) => {
    if (!value || value.trim() === '') return true; // Allow empty values
    // Validate as URL if provided
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }),
  // Supplier-specific fields - relaxed validation for user flexibility
  body('companyName').optional().isString().trim().isLength({ min: 0, max: 255 }), // Allow empty
  body('businessType').optional().isString().trim().isLength({ min: 0, max: 100 }), // Allow empty
  body('serviceCategories').optional().isString().trim(), // No length restriction
  body('licenseNumber').optional().isString().trim(), // No length restriction
  // Client-specific fields - relaxed validation
  body('companySize').optional().isString().trim().isLength({ min: 0, max: 50 }), // Allow empty
  body('industry').optional().isString().trim().isLength({ min: 0, max: 100 }), // Allow empty
  body('website').optional().isURL(), // Only validate if provided
  body('address').optional().isString().trim(), // No length restriction
  // Employee-specific fields
  body('department').optional().isString().trim().isLength({ min: 0, max: 100 }), // Allow empty
  body('position').optional().isString().trim().isLength({ min: 0, max: 100 }), // Allow empty
  body('salary').optional().isNumeric(), // Numeric check only
  // Candidate-specific fields
  body('skills').optional().isString().trim(), // No length restriction
  body('experienceYears').optional().isNumeric(), // Numeric check only
  body('resumeUrl').optional().isURL(), // Only validate if provided
  body('portfolioUrl').optional().isURL(), // Only validate if provided
  body('education').optional().isString().trim(), // No length restriction
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const user = await UserService.updateUser(req.user!.id, req.body);
    
    const response: ApiResponse = {
      success: true,
      message: 'User profile updated successfully',
      data: user
    };
    
    res.status(200).json(response);
  })
);

// Upload avatar
router.put('/avatar',
  authMiddleware,
  uploadMiddleware.single('avatar'),
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: 'No file uploaded'
      };
      return res.status(400).json(response);
    }

    try {
      // Upload to S3/R2 using FileService
      const fileRecord = await FileService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        req.user!.id,
        { isPublic: true }
      );

      // Update user avatar URL
      const user = await UserService.updateUser(req.user!.id, {
        avatarUrl: fileRecord.s3Url
      });

      const response: ApiResponse = {
        success: true,
        message: 'Avatar uploaded successfully',
        data: {
          avatarUrl: fileRecord.s3Url,
          user
        }
      };

      res.status(200).json(response);
    } catch (error) {
      console.error('❌ Avatar upload failed:', error.message);
      const response: ApiResponse = {
        success: false,
        error: `Failed to upload avatar: ${error.message}`
      };
      res.status(500).json(response);
    }
  })
);

// Get all users (admin only)
router.get('/all',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  query('page').optional().isInt({ min: 1 }).toInt(),
  query('limit').optional().isInt({ min: 1, max: 100 }).toInt(),
  query('role').optional().isIn(['admin', 'employee', 'client', 'supplier']),
  query('isActive').optional().isBoolean(),
  query('search').optional().isString().trim(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { page = 1, limit = 20, role, isActive, search } = req.query;
    const result = await UserService.getAllUsers({
      role: role as any,
      isActive: isActive as boolean,
      search: search as string
    }, {
      page: page as number,
      limit: limit as number
    });
    const response: ApiResponse = {
      success: true,
      message: 'Users retrieved successfully',
      data: result
    };
    res.status(200).json(response);
  })
);

// Get user by ID (admin/employee only)
router.get('/:userId',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.EMPLOYEE),
  param('userId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const user = await UserService.getUserById(req.params.userId);
    res.json(user);
  })
);

// Create user (admin only)
router.post('/',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/),
  body('firstName').isString().trim().isLength({ min: 1, max: 50 }),
  body('lastName').isString().trim().isLength({ min: 1, max: 50 }),
  body('role').isIn(['admin', 'employee', 'client', 'supplier']),
  body('phone').optional().isString().trim(),
  body('avatarUrl').optional().custom((value) => {
    if (!value || value.trim() === '') return true; // Allow empty values
    // Validate as URL if provided
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const user = await UserService.createUser(req.body);
    res.status(201).json(user);
  })
);

// Update user (admin only)
router.put('/:userId',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  param('userId').isUUID(),
  body('firstName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('lastName').optional().isString().trim().isLength({ min: 1, max: 50 }),
  body('role').optional().isIn(['admin', 'employee', 'client', 'supplier']),
  body('phone').optional().isString().trim(),
  body('avatarUrl').optional().custom((value) => {
    if (!value || value.trim() === '') return true; // Allow empty values
    // Validate as URL if provided
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  }),
  body('isActive').optional().isBoolean(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const user = await UserService.updateUser(req.params.userId, req.body);
    res.json(user);
  })
);

// Delete user (admin only)
router.delete('/:userId',
  authMiddleware,
  requireRole(UserRole.ADMIN),
  param('userId').isUUID(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    await UserService.deleteUser(req.params.userId);
    res.status(204).send();
  })
);

// Get online users
router.get('/online/list',
  authMiddleware,
  requireRole(UserRole.ADMIN, UserRole.EMPLOYEE),
  asyncHandler(async (req, res) => {
    const onlineUsers = await UserService.getOnlineUsers();
    res.json(onlineUsers);
  })
);

// Search users
router.get('/search/query',
  authMiddleware,
  query('q').isString().trim().isLength({ min: 1 }),
  query('limit').optional().isInt({ min: 1, max: 50 }).toInt(),
  validationMiddleware,
  asyncHandler(async (req, res) => {
    const { q, limit = 10 } = req.query;
    const users = await UserService.searchUsers(q as string, limit as number);
    res.json(users);
  })
);

export default router;