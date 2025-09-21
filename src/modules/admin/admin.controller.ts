import { Request, Response } from 'express';
import {
  getAllUsers,
  getUserByIdAdmin,
  updateUserStatus,
  getAdminStats,
  deleteUser
} from './admin.service';

export const getUsersList = async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const role = req.query.role as string;

    const result = await getAllUsers(page, limit, role);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Users list retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve users list'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getUserById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const user = await getUserByIdAdmin(id);

    res.status(200).json({
      success: true,
      data: user,
      message: 'User retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'User not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: error.message === 'User not found' ? 'USER_NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve user'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const updateUserStatusController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;

    const user = await updateUserStatus(id, isActive);

    res.status(200).json({
      success: true,
      data: user,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'User not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: error.message === 'User not found' ? 'USER_NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to update user status'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const stats = await getAdminStats();

    res.status(200).json({
      success: true,
      data: stats,
      message: 'Admin statistics retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const deleteUserController = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await deleteUser(id);

    res.status(200).json({
      success: true,
      message: 'User deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'User not found' ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: error.message === 'User not found' ? 'USER_NOT_FOUND' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to delete user'
      },
      timestamp: new Date().toISOString()
    });
  }
};