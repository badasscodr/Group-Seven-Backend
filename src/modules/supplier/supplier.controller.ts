import { Response } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import {
  getAvailableServiceRequests,
  createQuotation,
  getSupplierQuotations,
  updateQuotation,
  getQuotationById,
  getSupplierProfile,
  updateSupplierProfile,
  getServiceCategories
} from './supplier.service';
import {
  CreateQuotationData,
  UpdateQuotationData,
  ServiceRequestFilters
} from './supplier.types';

export const getAvailableServiceRequestsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const filters: ServiceRequestFilters = {
      category: req.query.category as string,
      priority: req.query.priority as string,
      budgetMin: req.query.budget_min ? parseFloat(req.query.budget_min as string) : undefined,
      budgetMax: req.query.budget_max ? parseFloat(req.query.budget_max as string) : undefined,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    const result = await getAvailableServiceRequests(req.user.sub, filters);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Available service requests retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RETRIEVE_FAILED',
        message: error.message || 'Failed to retrieve service requests',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const createQuotationController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { serviceRequestId } = req.params;
    const data: CreateQuotationData = req.body;

    const quotation = await createQuotation(req.user.sub, serviceRequestId, data);

    res.status(201).json({
      success: true,
      data: quotation,
      message: 'Quotation submitted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message || 'Failed to create quotation',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const getSupplierQuotationsController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const filters = {
      status: req.query.status as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    const result = await getSupplierQuotations(req.user.sub, filters);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Quotations retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RETRIEVE_FAILED',
        message: error.message || 'Failed to retrieve quotations',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const updateQuotationController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { quotationId } = req.params;
    const data: UpdateQuotationData = req.body;

    const quotation = await updateQuotation(quotationId, req.user.sub, data);

    if (!quotation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quotation not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: quotation,
      message: 'Quotation updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message || 'Failed to update quotation',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const getQuotationController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { quotationId } = req.params;
    const quotation = await getQuotationById(quotationId, req.user.sub);

    if (!quotation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quotation not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: quotation,
      message: 'Quotation retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RETRIEVE_FAILED',
        message: error.message || 'Failed to retrieve quotation',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const getSupplierProfileController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const profile = await getSupplierProfile(req.user.sub);

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Supplier profile retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RETRIEVE_FAILED',
        message: error.message || 'Failed to retrieve supplier profile',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const updateSupplierProfileController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const profileData = req.body;
    const profile = await updateSupplierProfile(req.user.sub, profileData);

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Supplier profile updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message || 'Failed to update supplier profile',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const getServiceCategoriesController = async (
  req: AuthenticatedRequest,
  res: Response
): Promise<void> => {
  try {
    const categories = await getServiceCategories();

    res.status(200).json({
      success: true,
      data: categories,
      message: 'Service categories retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RETRIEVE_FAILED',
        message: error.message || 'Failed to retrieve service categories',
      },
      timestamp: new Date().toISOString(),
    });
  }
};
