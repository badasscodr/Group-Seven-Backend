import { Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import {
  createServiceRequest,
  getServiceRequestById,
  getServiceRequests,
  updateServiceRequest,
  deleteServiceRequest,
  createQuotation,
  getQuotationsForRequest,
  updateQuotationStatus,
  CreateServiceRequestData,
  UpdateServiceRequestData,
  CreateQuotationData,
  ServiceRequestFilters,
} from '../services/serviceRequestService';

export const createServiceRequestController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const data: CreateServiceRequestData = req.body;
    const serviceRequest = await createServiceRequest(req.user.sub, data);

    res.status(201).json({
      success: true,
      data: serviceRequest,
      message: 'Service request created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'CREATE_FAILED',
        message: error.message || 'Failed to create service request',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const getServiceRequestController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Service request ID is required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const serviceRequest = await getServiceRequestById(id);

    if (!serviceRequest) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check permissions
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const canView =
      req.user.role === 'admin' ||
      serviceRequest.client_id === req.user.sub ||
      serviceRequest.assigned_supplier_id === req.user.sub ||
      serviceRequest.assigned_employee_id === req.user.sub ||
      (req.user.role === 'supplier' && serviceRequest.status === 'published');

    if (!canView) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: serviceRequest,
      message: 'Service request retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve service request',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const getServiceRequestsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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
      status: req.query.status as any,
      category: req.query.category as string,
      priority: req.query.priority as any,
      page: req.query.page ? parseInt(req.query.page as string) : 1,
      limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
    };

    // Apply role-based filtering
    if (req.user.role === 'client') {
      filters.clientId = req.user.sub;
    } else if (req.user.role === 'supplier') {
      // Suppliers can see published requests or their assigned ones
      if (!filters.status) {
        filters.status = 'published';
      }
    } else if (req.user.role === 'employee') {
      filters.assignedSupplierId = req.user.sub;
    }
    // Admin can see all requests (no additional filters)

    const result = await getServiceRequests(filters);

    res.status(200).json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      message: 'Service requests retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve service requests',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const updateServiceRequestController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Service request ID is required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const data: UpdateServiceRequestData = req.body;

    // Check if user can update this request
    const existingRequest = await getServiceRequestById(id);
    if (!existingRequest) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const canUpdate =
      req.user.role === 'admin' ||
      (req.user.role === 'client' && existingRequest.client_id === req.user.sub);

    if (!canUpdate) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const updatedRequest = await updateServiceRequest(id, data);

    if (!updatedRequest) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedRequest,
      message: 'Service request updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message || 'Failed to update service request',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const deleteServiceRequestController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Service request ID is required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if user can delete this request
    const existingRequest = await getServiceRequestById(id);
    if (!existingRequest) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const canDelete =
      req.user.role === 'admin' ||
      (req.user.role === 'client' && existingRequest.client_id === req.user.sub && existingRequest.status === 'draft');

    if (!canDelete) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const deleted = await deleteServiceRequest(id);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error.message || 'Failed to delete service request',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const createQuotationController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    if (req.user.role !== 'supplier') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Only suppliers can create quotations' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { serviceRequestId } = req.params;

    if (!serviceRequestId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Service request ID is required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const data: Omit<CreateQuotationData, 'serviceRequestId' | 'supplierId'> = req.body;

    const quotationData: CreateQuotationData = {
      ...data,
      serviceRequestId,
      supplierId: req.user.sub,
    };

    const quotation = await createQuotation(quotationData);

    res.status(201).json({
      success: true,
      data: quotation,
      message: 'Quotation created successfully',
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

export const getQuotationsController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    if (!serviceRequestId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Service request ID is required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Check if user can view quotations for this request
    const serviceRequest = await getServiceRequestById(serviceRequestId);
    if (!serviceRequest) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const canView =
      req.user.role === 'admin' ||
      serviceRequest.client_id === req.user.sub;

    if (!canView) {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const quotations = await getQuotationsForRequest(serviceRequestId);

    res.status(200).json({
      success: true,
      data: quotations,
      message: 'Quotations retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Failed to retrieve quotations',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const updateQuotationStatusController = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
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

    if (!quotationId) {
      res.status(400).json({
        success: false,
        error: { code: 'BAD_REQUEST', message: 'Quotation ID is required' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const { status } = req.body;

    // Only clients and admins can update quotation status
    if (req.user.role !== 'client' && req.user.role !== 'admin') {
      res.status(403).json({
        success: false,
        error: { code: 'FORBIDDEN', message: 'Access denied' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    const updatedQuotation = await updateQuotationStatus(quotationId, status);

    if (!updatedQuotation) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Quotation not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: updatedQuotation,
      message: 'Quotation status updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message || 'Failed to update quotation status',
      },
      timestamp: new Date().toISOString(),
    });
  }
};