import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import {
  clockIn,
  clockOut,
  getAttendanceRecords,
  getTodayAttendance,
  submitLeaveRequest,
  getLeaveRequests,
  getEmployeeProfile,
  createEmployeeProfile
} from './employee.service';

// Attendance Controllers
export const clockInController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.sub;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found in token'
        },
        timestamp: new Date().toISOString()
      });
    }

    const attendanceRecord = await clockIn(employeeId);

    res.status(200).json({
      success: true,
      data: attendanceRecord,
      message: 'Successfully clocked in',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message.includes('Already clocked in') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 400 ? 'ALREADY_CLOCKED_IN' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to clock in'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const clockOutController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.sub;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found in token'
        },
        timestamp: new Date().toISOString()
      });
    }

    const attendanceRecord = await clockOut(employeeId);

    res.status(200).json({
      success: true,
      data: attendanceRecord,
      message: 'Successfully clocked out',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message.includes('Must clock in') || error.message.includes('Already clocked out') ? 400 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 400 ? 'INVALID_CLOCK_OUT' : 'INTERNAL_ERROR',
        message: error.message || 'Failed to clock out'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getAttendanceController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.sub;
    const { startDate, endDate, limit } = req.query;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found in token'
        },
        timestamp: new Date().toISOString()
      });
    }

    const attendanceRecords = await getAttendanceRecords(
      employeeId,
      startDate as string,
      endDate as string,
      parseInt(limit as string) || 30
    );

    res.status(200).json({
      success: true,
      data: attendanceRecords,
      message: 'Attendance records retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve attendance records'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getTodayAttendanceController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.sub;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found in token'
        },
        timestamp: new Date().toISOString()
      });
    }

    const todayAttendance = await getTodayAttendance(employeeId);

    res.status(200).json({
      success: true,
      data: todayAttendance,
      message: 'Today\'s attendance retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve today\'s attendance'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Leave Management Controllers
export const submitLeaveRequestController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.sub;
    const { leaveType, startDate, endDate, reason } = req.body;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found in token'
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!leaveType || !startDate || !endDate || !reason) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'leaveType, startDate, endDate, and reason are required'
        },
        timestamp: new Date().toISOString()
      });
    }

    const leaveRequest = await submitLeaveRequest(employeeId, {
      leave_type: leaveType,
      start_date: startDate,
      end_date: endDate,
      reason
    });

    res.status(201).json({
      success: true,
      data: leaveRequest,
      message: 'Leave request submitted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to submit leave request'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const getLeaveRequestsController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const employeeId = req.user!.sub;

    if (!employeeId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found in token'
        },
        timestamp: new Date().toISOString()
      });
    }

    const leaveRequests = await getLeaveRequests(employeeId);

    res.status(200).json({
      success: true,
      data: leaveRequests,
      message: 'Leave requests retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve leave requests'
      },
      timestamp: new Date().toISOString()
    });
  }
};

// Employee Profile Controllers
export const getProfileController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.sub;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found in token'
        },
        timestamp: new Date().toISOString()
      });
    }

    const profile = await getEmployeeProfile(userId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'PROFILE_NOT_FOUND',
          message: 'Employee profile not found'
        },
        timestamp: new Date().toISOString()
      });
    }

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Employee profile retrieved successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve employee profile'
      },
      timestamp: new Date().toISOString()
    });
  }
};

export const createProfileController = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const userId = req.user?.sub;
    const { employeeId, department, position, hireDate, salary, managerId } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'User ID not found in token'
        },
        timestamp: new Date().toISOString()
      });
    }

    if (!employeeId || !department || !position || !hireDate) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'employeeId, department, position, and hireDate are required'
        },
        timestamp: new Date().toISOString()
      });
    }

    const profile = await createEmployeeProfile(userId, {
      employee_id: employeeId,
      department,
      position,
      hire_date: hireDate,
      salary,
      manager_id: managerId
    });

    res.status(201).json({
      success: true,
      data: profile,
      message: 'Employee profile created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to create employee profile'
      },
      timestamp: new Date().toISOString()
    });
  }
};