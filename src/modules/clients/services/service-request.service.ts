import { query, transaction } from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface ServiceRequest {
  id: string;
  clientId: string;
  assignedAdminId?: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: string;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: Date;
  location?: string;
  requirements?: string;
  assignedSupplierId?: string;
  assignedEmployeeId?: string;
  adminApprovedAt?: Date;
  supplierAssignedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceRequestWithDetails extends ServiceRequest {
  client: {
    firstName: string;
    lastName: string;
    email: string;
    companyName?: string;
  };
  assignedAdmin?: {
    firstName: string;
    lastName: string;
    email: string;
  };
  quotations?: Array<{
    id: string;
    amount: number;
    status: string;
    createdAt: Date;
  }>;
}

export class ServiceRequestService {
  // Get client's service requests
  static async getClientRequests(clientId: string, filters: any = {}) {
    const {
      status,
      category,
      priority,
      page = 1,
      limit = 10
    } = filters;

    const offset = (page - 1) * limit;
    const conditions: string[] = ['sr.client_id = $1'];
    const params: any[] = [clientId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`sr.status = $${paramIndex++}`);
      params.push(status);
    }

    if (category) {
      conditions.push(`sr.category = $${paramIndex++}`);
      params.push(category);
    }

    if (priority) {
      conditions.push(`sr.priority = $${paramIndex++}`);
      params.push(priority);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_requests sr
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated requests with details
    const requestsQuery = `
      SELECT 
        sr.*,
        u.first_name,
        u.last_name,
        u.email,
        cp.company_name
      FROM service_requests sr
      JOIN users u ON sr.client_id = u.id
      LEFT JOIN client_profiles cp ON sr.client_id = cp.user_id
      ${whereClause}
      ORDER BY sr.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(limit, offset);
    const requestsResult = await query(requestsQuery, params);

    return {
      requests: requestsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Create new service request
  static async createRequest(requestData: any) {
    const {
      clientId,
      title,
      description,
      category,
      priority,
      budget_min,
      budget_max,
      deadline,
      location,
      requirements,
      documentIds
    } = requestData;

    // Start a transaction to ensure data consistency
    const { transaction } = await import('../../core/config/database');

    return await transaction(async (client) => {
      // Create the service request
      const createQuery = `
        INSERT INTO service_requests (
          client_id, title, description, category, priority,
          budget_min, budget_max, deadline, location, requirements, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, 'draft')
        RETURNING *
      `;

      const result = await client.query(createQuery, [
        clientId,
        title,
        description,
        category,
        priority,
        budget_min || null,
        budget_max || null,
        deadline || null,
        location || null,
        requirements || null
      ]);

      const serviceRequest = result.rows[0];

      // If there are document IDs, create associations
      if (documentIds && Array.isArray(documentIds) && documentIds.length > 0) {
        const documentAssociationQuery = `
          INSERT INTO service_request_documents (service_request_id, document_id, created_by)
          VALUES ($1, $2, $3)
        `;

        for (const documentId of documentIds) {
          await client.query(documentAssociationQuery, [serviceRequest.id, documentId, clientId]);
        }
      }

      return serviceRequest;
    });
  }

  // Get specific service request
  static async getRequest(clientId: string, requestId: string) {
    const requestQuery = `
      SELECT 
        sr.*,
        u.first_name,
        u.last_name,
        u.email,
        cp.company_name
      FROM service_requests sr
      JOIN users u ON sr.client_id = u.id
      LEFT JOIN client_profiles cp ON sr.client_id = cp.user_id
      WHERE sr.id = $1 AND sr.client_id = $2
    `;
    
    const result = await query(requestQuery, [requestId, clientId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Service request not found', 404);
    }

    // Get quotations for this request
    const quotationsQuery = `
      SELECT q.id, q.amount, q.status, q.created_at,
        u.first_name as supplier_first_name,
        u.last_name as supplier_last_name,
        sp.company_name as supplier_company_name
      FROM quotations q
      JOIN users u ON q.supplier_id = u.id
      LEFT JOIN supplier_profiles sp ON q.supplier_id = sp.user_id
      WHERE q.service_request_id = $1
      ORDER BY q.created_at DESC
    `;
    
    const quotationsResult = await query(quotationsQuery, [requestId]);

    // Get documents for this request
    const documentsQuery = `
      SELECT f.id, f.filename, f.original_name, f.mime_type, f.file_size, f.file_url, f.uploaded_at
      FROM documents f
      JOIN service_request_documents srd ON f.id = srd.document_id
      WHERE srd.service_request_id = $1
      ORDER BY f.uploaded_at DESC
    `;
    
    const documentsResult = await query(documentsQuery, [requestId]);

    const request = result.rows[0];
    request.quotations = quotationsResult.rows;
    request.documents = documentsResult.rows;

    return request;
  }

  // Update service request
  static async updateRequest(clientId: string, requestId: string, updateData: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      'title', 'description', 'category', 'priority', 'status',
      'budget_min', 'budget_max', 'deadline', 'location', 'requirements'
    ];

    for (const field of allowedFields) {
      if (updateData[field] !== undefined) {
        // Convert camelCase to snake_case for database
        const dbField = field.replace(/([A-Z])/g, '_$1').toLowerCase();
        fields.push(`${dbField} = $${paramIndex++}`);
        values.push(updateData[field]);
      }
    }

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(requestId, clientId);

    const updateQuery = `
      UPDATE service_requests 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND client_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, values);
    
    if (result.rows.length === 0) {
      throw new AppError('Service request not found or access denied', 404);
    }

    return result.rows[0];
  }

  // Delete service request
  static async deleteRequest(clientId: string, requestId: string) {
    // Check if request exists and belongs to client
    const checkQuery = `
      SELECT id, status FROM service_requests 
      WHERE id = $1 AND client_id = $2
    `;
    const checkResult = await query(checkQuery, [requestId, clientId]);
    
    if (checkResult.rows.length === 0) {
      throw new AppError('Service request not found', 404);
    }

    const request = checkResult.rows[0];
    
    // Only allow deletion of draft requests
    if (request.status !== 'draft') {
      throw new AppError('Cannot delete service request that is not in draft status', 400);
    }

    // Delete related quotations first
    const deleteQuotationsQuery = `
      DELETE FROM quotations WHERE service_request_id = $1
    `;
    await query(deleteQuotationsQuery, [requestId]);

    // Delete the service request
    const deleteQuery = `
      DELETE FROM service_requests WHERE id = $1 AND client_id = $2
    `;
    await query(deleteQuery, [requestId, clientId]);
  }

  // Get all service requests (admin view)
  static async getAllRequests(filters: any = {}) {
    const {
      status,
      category,
      priority,
      page = 1,
      limit = 10
    } = filters;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (status) {
      conditions.push(`sr.status = $${paramIndex++}`);
      params.push(status);
    }

    if (category) {
      conditions.push(`sr.category = $${paramIndex++}`);
      params.push(category);
    }

    if (priority) {
      conditions.push(`sr.priority = $${paramIndex++}`);
      params.push(priority);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_requests sr
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated requests with client info
    const requestsQuery = `
      SELECT 
        sr.*,
        u.first_name as client_first_name,
        u.last_name as client_last_name,
        u.email as client_email,
        cp.company_name as client_company_name
      FROM service_requests sr
      JOIN users u ON sr.client_id = u.id
      LEFT JOIN client_profiles cp ON sr.client_id = cp.user_id
      ${whereClause}
      ORDER BY sr.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(limit, offset);
    const requestsResult = await query(requestsQuery, params);

    // Get documents for each request
    const requestsWithDocuments = await Promise.all(
      requestsResult.rows.map(async (request) => {
        const documentsQuery = `
          SELECT f.id, f.filename, f.original_name, f.mime_type, f.file_size, f.file_url, f.uploaded_at
          FROM documents f
          JOIN service_request_documents srd ON f.id = srd.document_id
          WHERE srd.service_request_id = $1
          ORDER BY f.uploaded_at DESC
        `;
        
        const documentsResult = await query(documentsQuery, [request.id]);
        request.documents = documentsResult.rows;
        return request;
      })
    );

    return {
      requests: requestsWithDocuments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Update request status (admin)
  static async updateRequestStatus(requestId: string, status: string, adminId?: string) {
    const updateQuery = `
      UPDATE service_requests 
      SET status = $1, updated_at = CURRENT_TIMESTAMP
      WHERE id = $2
      RETURNING *
    `;

    const result = await query(updateQuery, [status, requestId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Service request not found', 404);
    }

    return result.rows[0];
  }
}
