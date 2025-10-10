import { Response } from 'express';
import { AuthenticatedRequest } from '../../core/middleware/auth';
import {
  createVisaRecord,
  getVisaRecords,
  getVisaById,
  updateVisaRecord,
  deleteVisaRecord,
  getVisaStats,
  updateVisaStatuses,
} from './visa.service';
import { VisaType, VisaStatus } from './visa.types';

/**
 * Create a new visa record
 * POST /api/visa
 */
export const createVisa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { documentId, visaType, visaNumber, issuedDate, expiryDate, issuingCountry } = req.body;

    // Validation
    if (!documentId || !visaType || !visaNumber || !issuedDate || !expiryDate || !issuingCountry) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_FIELDS',
          message: 'All fields are required: documentId, visaType, visaNumber, issuedDate, expiryDate, issuingCountry',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Validate visa type
    const validVisaTypes: VisaType[] = [
      'tourist', 'work', 'student', 'business', 'transit',
      'residence', 'family', 'medical', 'diplomatic', 'other'
    ];

    if (!validVisaTypes.includes(visaType)) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_VISA_TYPE',
          message: `Invalid visa type. Must be one of: ${validVisaTypes.join(', ')}`,
        },
        timestamp: new Date().toISOString(),
      });
    }

    // Validate dates
    const issued = new Date(issuedDate);
    const expiry = new Date(expiryDate);

    if (isNaN(issued.getTime()) || isNaN(expiry.getTime())) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE',
          message: 'Invalid date format. Use ISO date format (YYYY-MM-DD)',
        },
        timestamp: new Date().toISOString(),
      });
    }

    if (expiry <= issued) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_DATE_RANGE',
          message: 'Expiry date must be after issued date',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const visaData = {
      documentId,
      visaType,
      visaNumber: visaNumber.trim(),
      issuedDate,
      expiryDate,
      issuingCountry: issuingCountry.trim(),
    };

    const visa = await createVisaRecord(req.user.sub, visaData);

    res.status(201).json({
      success: true,
      data: { visa },
      message: 'Visa record created successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in createVisa:', error);

    const statusCode = error.message.includes('already exists') ? 409 :
                      error.message.includes('not found') ? 404 : 500;

    res.status(statusCode).json({
      success: false,
      error: {
        code: 'VISA_CREATION_ERROR',
        message: error.message || 'Failed to create visa record',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get visa records
 * GET /api/visa
 */
export const getVisas = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const {
      userId,
      visaType,
      status,
      expiringWithin,
      isActive,
      limit = '50',
      offset = '0'
    } = req.query;

    // For non-admin users, only allow accessing their own visas
    let queryUserId: string | undefined;
    if (req.user?.role === 'admin') {
      queryUserId = userId as string;
    } else {
      queryUserId = req.user?.sub;
    }

    const query = {
      userId: queryUserId,
      visaType: visaType as VisaType,
      status: status as VisaStatus,
      expiringWithin: expiringWithin ? parseInt(expiringWithin as string) : undefined,
      isActive: isActive === 'true' ? true : isActive === 'false' ? false : undefined,
      limit: parseInt(limit as string),
      offset: parseInt(offset as string),
    };

    const result = await getVisaRecords(query);

    res.status(200).json({
      success: true,
      data: {
        visas: result.visas,
        pagination: {
          total: result.total,
          limit: query.limit,
          offset: query.offset,
          hasMore: result.total > query.offset + query.limit,
        },
      },
      message: 'Visa records retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getVisas:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get specific visa record
 * GET /api/visa/:id
 */
export const getVisa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { id } = req.params;

    // For non-admin users, only allow accessing their own visas
    const userId = req.user?.role === 'admin' ? undefined : req.user?.sub;

    const visa = await getVisaById(id, userId);

    if (!visa) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VISA_NOT_FOUND',
          message: 'Visa record not found or access denied',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: { visa },
      message: 'Visa record retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getVisa:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Update visa record
 * PUT /api/visa/:id
 */
export const updateVisa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { id } = req.params;
    const { visaType, visaNumber, issuedDate, expiryDate, issuingCountry, status, isActive } = req.body;

    const updateData: any = {};

    if (visaType !== undefined) {
      const validVisaTypes: VisaType[] = [
        'tourist', 'work', 'student', 'business', 'transit',
        'residence', 'family', 'medical', 'diplomatic', 'other'
      ];

      if (!validVisaTypes.includes(visaType)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_VISA_TYPE',
            message: `Invalid visa type. Must be one of: ${validVisaTypes.join(', ')}`,
          },
          timestamp: new Date().toISOString(),
        });
      }
      updateData.visaType = visaType;
    }

    if (visaNumber !== undefined) {
      updateData.visaNumber = visaNumber.trim();
    }

    if (issuedDate !== undefined) {
      const issued = new Date(issuedDate);
      if (isNaN(issued.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Invalid issued date format',
          },
          timestamp: new Date().toISOString(),
        });
      }
      updateData.issuedDate = issuedDate;
    }

    if (expiryDate !== undefined) {
      const expiry = new Date(expiryDate);
      if (isNaN(expiry.getTime())) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_DATE',
            message: 'Invalid expiry date format',
          },
          timestamp: new Date().toISOString(),
        });
      }
      updateData.expiryDate = expiryDate;
    }

    if (issuingCountry !== undefined) {
      updateData.issuingCountry = issuingCountry.trim();
    }

    if (status !== undefined) {
      const validStatuses: VisaStatus[] = [
        'active', 'expired', 'expiringSoon', 'expiringCritical',
        'pending', 'cancelled', 'renewalRequired'
      ];

      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_STATUS',
            message: `Invalid status. Must be one of: ${validStatuses.join(', ')}`,
          },
          timestamp: new Date().toISOString(),
        });
      }
      updateData.status = status;
    }

    if (isActive !== undefined) {
      updateData.isActive = Boolean(isActive);
    }

    const updatedVisa = await updateVisaRecord(id, req.user.sub, updateData);

    if (!updatedVisa) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VISA_NOT_FOUND',
          message: 'Visa record not found or access denied',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: { visa: updatedVisa },
      message: 'Visa record updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in updateVisa:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Delete visa record
 * DELETE /api/visa/:id
 */
export const deleteVisa = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const { id } = req.params;

    const deleted = await deleteVisaRecord(id, req.user.sub);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'VISA_NOT_FOUND',
          message: 'Visa record not found or access denied',
        },
        timestamp: new Date().toISOString(),
      });
    }

    res.status(200).json({
      success: true,
      data: { deleted: true },
      message: 'Visa record deleted successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in deleteVisa:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Get visa statistics
 * GET /api/visa/stats
 */
export const getVisaStatistics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    // For non-admin users, only show their own stats
    const userId = req.user.role === 'admin' ? undefined : req.user.sub;

    const stats = await getVisaStats(userId);

    res.status(200).json({
      success: true,
      data: { stats },
      message: 'Visa statistics retrieved successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in getVisaStatistics:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Update all visa statuses (admin only - cron job endpoint)
 * POST /api/visa/update-statuses
 */
export const updateAllVisaStatuses = async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'Admin access required',
        },
        timestamp: new Date().toISOString(),
      });
    }

    const result = await updateVisaStatuses();

    res.status(200).json({
      success: true,
      data: result,
      message: 'Visa statuses updated successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error('Error in updateAllVisaStatuses:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: error.message || 'Internal server error',
      },
      timestamp: new Date().toISOString(),
    });
  }
};