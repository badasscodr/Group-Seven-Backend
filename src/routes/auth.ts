import express from 'express';
import { registerUser, loginUser } from '../services/userService';
import { registerValidation, loginValidation, handleValidationErrors } from '../utils/validation';

const router = express.Router();

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *               - role
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               role:
 *                 type: string
 *                 enum: [admin, client, supplier, employee, candidate]
 *               phone:
 *                 type: string
 *     responses:
 *       201:
 *         description: User registered successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: Email already exists
 */
router.post('/register', registerValidation, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { email, password, firstName, lastName, role, phone, profileData } = req.body;

    const result = await registerUser({
      email,
      password,
      firstName,
      lastName,
      role,
      phone,
      profileData,
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'User registered successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: error.message || 'Registration failed',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', loginValidation, handleValidationErrors, async (req: express.Request, res: express.Response) => {
  try {
    const { email, password } = req.body;

    const result = await loginUser({ email, password });

    res.status(200).json({
      success: true,
      data: result,
      message: 'Login successful',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(401).json({
      success: false,
      error: {
        code: 'AUTHENTICATION_FAILED',
        message: error.message || 'Authentication failed',
      },
      timestamp: new Date().toISOString(),
    });
  }
});

router.post('/logout', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Logout endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

router.post('/refresh', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Token refresh endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

router.post('/forgot', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Forgot password endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

router.post('/reset', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Reset password endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

router.get('/verify/:token', (req, res) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Email verification endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
});

export default router;