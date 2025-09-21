import { Request, Response } from 'express';
import { registerUser, loginUser } from './auth.service';

export const register = async (req: Request, res: Response) => {
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
};

export const login = async (req: Request, res: Response) => {
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
};

export const logout = (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Logout endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
};

export const refreshToken = (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Token refresh endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
};

export const forgotPassword = (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Forgot password endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
};

export const resetPassword = (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Reset password endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
};

export const verifyEmail = (req: Request, res: Response) => {
  res.status(501).json({
    success: false,
    error: {
      code: 'NOT_IMPLEMENTED',
      message: 'Email verification endpoint not yet implemented'
    },
    timestamp: new Date().toISOString()
  });
};