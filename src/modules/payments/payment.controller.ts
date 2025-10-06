import { Response } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import {
  createPayment,
  getPayments,
  getPaymentById,
  updatePayment,
  deletePayment,
  getPaymentStats,
  getOverduePayments
} from './payment.service';
import {
  CreatePaymentData,
  UpdatePaymentData,
  PaymentFilters
} from './payment.types';

/**
 * Create a new payment record (Admin only)
 */
export const createPaymentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const data: CreatePaymentData = req.body;
    const payment = await createPayment(data);

    res.status(201).json({
      success: true,
      data: { payment },
      message: 'Payment record created successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message || 'Failed to create payment record'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get payments (role-based filtering)
 */
export const getPaymentsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const filters: PaymentFilters = {
      status: req.query.status as any,
      quotationId: req.query.quotation_id as string,
      startDate: req.query.start_date as string,
      endDate: req.query.end_date as string,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10
    };

    // Role-based filtering
    if (req.user.role === 'supplier') {
      filters.supplierId = req.user.sub;
    } else if (req.user.role === 'client') {
      filters.clientId = req.user.sub;
    } else if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const result = await getPayments(filters);

    res.status(200).json({
      success: true,
      data: result,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch payments'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get specific payment by ID
 */
export const getPaymentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    const payment = await getPaymentById(id);

    // Check authorization
    if (req.user.role === 'supplier' && payment.supplier_id !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.user.role === 'client' && payment.client_id !== req.user.sub) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { payment },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Payment not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'FETCH_FAILED',
        message: error.message || 'Failed to fetch payment'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Update payment status (Admin only)
 */
export const updatePaymentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    const data: UpdatePaymentData = req.body;
    const payment = await updatePayment(id, data, req.user.sub);

    res.status(200).json({
      success: true,
      data: { payment },
      message: 'Payment updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Payment not found' ? 404 : 400;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'UPDATE_FAILED',
        message: error.message || 'Failed to update payment'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Delete payment (Admin only)
 */
export const deletePaymentController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Check if user is admin
    if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Admin access required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const { id } = req.params;
    await deletePayment(id);

    res.status(200).json({
      success: true,
      message: 'Payment deleted successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    const statusCode = error.message === 'Payment not found' ? 404 : 500;
    res.status(statusCode).json({
      success: false,
      error: {
        code: statusCode === 404 ? 'NOT_FOUND' : 'DELETE_FAILED',
        message: error.message || 'Failed to delete payment'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get payment statistics
 */
export const getPaymentStatsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const filters: any = {};

    // Role-based filtering
    if (req.user.role === 'supplier') {
      filters.supplierId = req.user.sub;
    } else if (req.user.role === 'client') {
      filters.clientId = req.user.sub;
    }

    const stats = await getPaymentStats(filters);

    res.status(200).json({
      success: true,
      data: { stats },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch payment statistics'
      },
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Get overdue payments
 */
export const getOverduePaymentsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    let supplierId: string | undefined;

    // Role-based filtering
    if (req.user.role === 'supplier') {
      supplierId = req.user.sub;
    } else if (req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString()
      });
      return;
    }

    const overduePayments = await getOverduePayments(supplierId);

    res.status(200).json({
      success: true,
      data: { payments: overduePayments },
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'FETCH_FAILED',
        message: error.message || 'Failed to fetch overdue payments'
      },
      timestamp: new Date().toISOString()
    });
  }
};
