import { Router } from 'express';
import { body } from 'express-validator';
import { AuthService } from '../services/auth.service';
import { authenticate } from '../../core/middleware/auth';
import { validationMiddleware } from '../../core/middleware/validation';
import { asyncHandler } from '../../core/utils/asyncHandler';
import { ApiResponse, AuthenticatedRequest } from '../../core/types';

const router = Router();

// Register - Minimal validation for frontend forms
router.post('/register',
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('firstName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('role')
    .isIn(['client', 'supplier', 'candidate'])
    .withMessage('Role must be client, supplier, or candidate'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number format required'),
  // Role-specific fields (all optional for registration)
  body('companyName')
    .optional()
    .isLength({ min: 1, max: 255 })
    .withMessage('Company name must be between 1 and 255 characters'),
  body('businessType')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Business type must be between 1 and 100 characters'),
  body('serviceCategories')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Service categories must be between 1 and 500 characters'),
  body('skills')
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage('Skills must be between 1 and 500 characters'),
  body('experience')
    .optional()
    .isIn(['entry', 'junior', 'mid', 'senior', 'expert'])
    .withMessage('Valid experience level is required'),
  validationMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const result = await AuthService.register(req.body);
    
    const response: ApiResponse = {
      success: true,
      message: 'User registered successfully',
      data: result
    };
    
    res.status(201).json(response);
  })
);

// Universal login (works for all roles)
router.post('/login',
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  validationMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const result = await AuthService.login(req.body);
    
    const response: ApiResponse = {
      success: true,
      message: 'Login successful',
      data: result
    };
    
    res.status(200).json(response);
  })
);



// Refresh token
router.post('/refresh',
  body('refreshToken')
    .isLength({ min: 1 })
    .withMessage('Refresh token is required'),
  validationMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const { refreshToken } = req.body;
    const result = await AuthService.refreshToken(refreshToken);
    
    const response: ApiResponse = {
      success: true,
      message: 'Tokens refreshed successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

// Logout
router.post('/logout',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    await AuthService.logout(req.user!.id);
    
    const response: ApiResponse = {
      success: true,
      message: 'Logout successful'
    };
    
    res.status(200).json(response);
  })
);

// Change password
router.post('/change-password',
  authenticate,
  body('currentPassword')
    .isLength({ min: 1 })
    .withMessage('Current password is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validationMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const { currentPassword, newPassword } = req.body;
    await AuthService.changePassword(req.user!.id, currentPassword, newPassword);
    
    const response: ApiResponse = {
      success: true,
      message: 'Password changed successfully'
    };
    
    res.status(200).json(response);
  })
);

// Request password reset
router.post('/forgot-password',
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  validationMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const { email } = req.body;
    await AuthService.forgotPassword(email);
    
    const response: ApiResponse = {
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent'
    };
    
    res.status(200).json(response);
  })
);

// Reset password
router.post('/reset-password',
  body('token')
    .isLength({ min: 1 })
    .withMessage('Reset token is required'),
  body('newPassword')
    .isLength({ min: 6 })
    .withMessage('New password must be at least 6 characters long'),
  validationMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const { token, newPassword } = req.body;
    await AuthService.resetPassword(token, newPassword);
    
    const response: ApiResponse = {
      success: true,
      message: 'Password reset successful'
    };
    
    res.status(200).json(response);
  })
);

// Verify email
router.post('/verify-email',
  body('token')
    .isLength({ min: 1 })
    .withMessage('Verification token is required'),
  validationMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const { token } = req.body;
    await AuthService.verifyEmail(token);
    
    const response: ApiResponse = {
      success: true,
      message: 'Email verified successfully'
    };
    
    res.status(200).json(response);
  })
);

// Get profile
router.get('/profile',
  authenticate,
  asyncHandler(async (req: AuthenticatedRequest, res: any) => {
    const user = await AuthService.getProfile(req.user!.id);
    
    const response: ApiResponse = {
      success: true,
      data: user
    };
    
    res.status(200).json(response);
  })
);

// Update profile
router.put('/profile',
  authenticate,
  body('firstName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('First name must be between 1 and 50 characters'),
  body('lastName')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Last name must be between 1 and 50 characters'),
  body('phone')
    .optional()
    .isMobilePhone('any')
    .withMessage('Valid phone number format required'),
  body('avatarUrl')
    .optional()
    .isURL()
    .withMessage('Avatar must be a valid URL'),
  validationMiddleware,
  asyncHandler(async (req: any, res: any) => {
    const user = await AuthService.updateProfile(req.user!.id, req.body);
    
    const response: ApiResponse = {
      success: true,
      message: 'Profile updated successfully',
      data: user
    };
    
    res.status(200).json(response);
  })
);

// Admin only: Convert candidate to employee
router.post('/convert-candidate-to-employee',
  authenticate,
  body('candidateId')
    .isUUID()
    .withMessage('Valid candidate ID is required'),
  body('employeeData')
    .isObject()
    .withMessage('Employee data is required'),
  body('employeeData.employeeId')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Employee ID is required'),
  body('employeeData.department')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Department is required'),
  body('employeeData.position')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Position is required'),
  body('employeeData.hireDate')
    .isISO8601()
    .withMessage('Valid hire date is required'),
  body('employeeData.salary')
    .isDecimal()
    .withMessage('Valid salary is required'),
  validationMiddleware,
  asyncHandler(async (req: any, res: any) => {
    // Check if user is admin
    if (req.user!.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Only admins can convert candidates to employees'
      });
    }

    const { candidateId, employeeData } = req.body;
    const result = await AuthService.convertCandidateToEmployee(candidateId, employeeData);
    
    const response: ApiResponse = {
      success: true,
      message: 'Candidate converted to employee successfully',
      data: result
    };
    
    res.status(200).json(response);
  })
);

export default router;