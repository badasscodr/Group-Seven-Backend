import { Router } from 'express';
import { body, param, query } from 'express-validator';
import { UserService } from '../services/user.service';
import { authMiddleware, requireRole } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
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
  body('avatarUrl').optional().isURL(),
  validationMiddleware,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const user = await UserService.updateProfile(req.user!.id, req.body);
    
    const response: ApiResponse = {
      success: true,
      message: 'User profile updated successfully',
      data: user
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
    res.json(result);
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
  body('avatarUrl').optional().isURL(),
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
  body('avatarUrl').optional().isURL(),
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