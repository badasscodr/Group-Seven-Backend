import { Response } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import {
  createServiceRequest,
  getServiceRequestById,
  getClientServiceRequests,
  updateServiceRequest,
  deleteServiceRequest,
  getServiceRequestWithQuotations,
  getClientProfile,
  updateClientProfile
} from './client.service';
import {
  CreateServiceRequestData,
  UpdateServiceRequestData,
  ServiceRequestFilters
} from './client.types';

export const createServiceRequestController = async (
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

export const getServiceRequestController = async (
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

    const { id } = req.params;
    const serviceRequest = await getServiceRequestById(id, req.user.sub);

    if (!serviceRequest) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
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
        code: 'RETRIEVE_FAILED',
        message: error.message || 'Failed to retrieve service request',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const getServiceRequestsController = async (
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
      status: req.query.status as string,
      category: req.query.category as string,
      priority: req.query.priority as string,
      page: parseInt(req.query.page as string) || 1,
      limit: parseInt(req.query.limit as string) || 10,
    };

    const result = await getClientServiceRequests(req.user.sub, filters);

    res.status(200).json({
      success: true,
      data: result,
      message: 'Service requests retrieved successfully',
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

export const updateServiceRequestController = async (
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

    const { id } = req.params;
    const data: UpdateServiceRequestData = req.body;

    const serviceRequest = await updateServiceRequest(id, req.user.sub, data);

    if (!serviceRequest) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: serviceRequest,
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

export const deleteServiceRequestController = async (
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

    const { id } = req.params;
    const deleted = await deleteServiceRequest(id, req.user.sub);

    if (!deleted) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Service request deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_FAILED',
        message: error.message || 'Failed to delete service request',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const getServiceRequestQuotationsController = async (
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

    const { id } = req.params;
    const serviceRequestWithQuotations = await getServiceRequestWithQuotations(id, req.user.sub);

    if (!serviceRequestWithQuotations) {
      res.status(404).json({
        success: false,
        error: { code: 'NOT_FOUND', message: 'Service request not found' },
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: serviceRequestWithQuotations,
      message: 'Service request with quotations retrieved successfully',
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

export const getClientProfileController = async (
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

    const profile = await getClientProfile(req.user.sub);

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Client profile retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: {
        code: 'RETRIEVE_FAILED',
        message: error.message || 'Failed to retrieve client profile',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

export const updateClientProfileController = async (
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
    const profile = await updateClientProfile(req.user.sub, profileData);

    res.status(200).json({
      success: true,
      data: profile,
      message: 'Client profile updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      error: {
        code: 'UPDATE_FAILED',
        message: error.message || 'Failed to update client profile',
      },
      timestamp: new Date().toISOString(),
    });
  }
};