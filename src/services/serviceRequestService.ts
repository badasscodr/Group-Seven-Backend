import pool from '../config/database';
import { ServiceRequest, Priority, RequestStatus, Quotation } from '../types';
import crypto from 'crypto';

export interface CreateServiceRequestData {
  title: string;
  description: string;
  category: string;
  priority: Priority;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: Date;
  location?: string;
  requirements?: string;
}

export interface UpdateServiceRequestData extends Partial<CreateServiceRequestData> {
  status?: RequestStatus;
  assignedSupplierId?: string;
  assignedEmployeeId?: string;
}

export interface ServiceRequestFilters {
  status?: RequestStatus;
  category?: string;
  priority?: Priority;
  clientId?: string;
  assignedSupplierId?: string;
  page?: number;
  limit?: number;
}

export interface CreateQuotationData {
  serviceRequestId: string;
  supplierId: string;
  amount: number;
  description?: string;
  estimatedDuration?: string;
  termsConditions?: string;
  validUntil?: Date;
}

export const createServiceRequest = async (clientId: string, data: CreateServiceRequestData): Promise<ServiceRequest> => {
  const client = await pool.connect();

  try {
    const requestId = crypto.randomUUID();

    const result = await client.query(
      `INSERT INTO service_requests (
        id, client_id, title, description, category, priority,
        budget_min, budget_max, deadline, location, requirements
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *`,
      [
        requestId,
        clientId,
        data.title,
        data.description,
        data.category,
        data.priority,
        data.budgetMin || null,
        data.budgetMax || null,
        data.deadline || null,
        data.location || null,
        data.requirements || null,
      ]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getServiceRequestById = async (requestId: string): Promise<ServiceRequest | null> => {
  const result = await pool.query(
    `SELECT sr.*,
      u_client.first_name || ' ' || u_client.last_name as client_name,
      u_supplier.first_name || ' ' || u_supplier.last_name as supplier_name,
      u_employee.first_name || ' ' || u_employee.last_name as employee_name
     FROM service_requests sr
     LEFT JOIN users u_client ON sr.client_id = u_client.id
     LEFT JOIN users u_supplier ON sr.assigned_supplier_id = u_supplier.id
     LEFT JOIN users u_employee ON sr.assigned_employee_id = u_employee.id
     WHERE sr.id = $1`,
    [requestId]
  );

  return result.rows[0] || null;
};

export const getServiceRequests = async (filters: ServiceRequestFilters) => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  let whereConditions = [];
  let queryParams = [];
  let paramIndex = 1;

  if (filters.status) {
    whereConditions.push(`sr.status = $${paramIndex}`);
    queryParams.push(filters.status);
    paramIndex++;
  }

  if (filters.category) {
    whereConditions.push(`sr.category = $${paramIndex}`);
    queryParams.push(filters.category);
    paramIndex++;
  }

  if (filters.priority) {
    whereConditions.push(`sr.priority = $${paramIndex}`);
    queryParams.push(filters.priority);
    paramIndex++;
  }

  if (filters.clientId) {
    whereConditions.push(`sr.client_id = $${paramIndex}`);
    queryParams.push(filters.clientId);
    paramIndex++;
  }

  if (filters.assignedSupplierId) {
    whereConditions.push(`sr.assigned_supplier_id = $${paramIndex}`);
    queryParams.push(filters.assignedSupplierId);
    paramIndex++;
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

  const query = `
    SELECT sr.*,
      u_client.first_name || ' ' || u_client.last_name as client_name,
      u_supplier.first_name || ' ' || u_supplier.last_name as supplier_name,
      u_employee.first_name || ' ' || u_employee.last_name as employee_name
    FROM service_requests sr
    LEFT JOIN users u_client ON sr.client_id = u_client.id
    LEFT JOIN users u_supplier ON sr.assigned_supplier_id = u_supplier.id
    LEFT JOIN users u_employee ON sr.assigned_employee_id = u_employee.id
    ${whereClause}
    ORDER BY sr.created_at DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
  `;

  queryParams.push(limit, offset);

  const countQuery = `
    SELECT COUNT(*) as total
    FROM service_requests sr
    ${whereClause}
  `;

  const [dataResult, countResult] = await Promise.all([
    pool.query(query, queryParams),
    pool.query(countQuery, queryParams.slice(0, -2)) // Remove limit and offset for count
  ]);

  const total = parseInt(countResult.rows[0].total);
  const totalPages = Math.ceil(total / limit);

  return {
    data: dataResult.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages,
    },
  };
};

export const updateServiceRequest = async (
  requestId: string,
  data: UpdateServiceRequestData
): Promise<ServiceRequest | null> => {
  const client = await pool.connect();

  try {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      values.push(data.title);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      values.push(data.description);
      paramIndex++;
    }

    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex}`);
      values.push(data.category);
      paramIndex++;
    }

    if (data.priority !== undefined) {
      updates.push(`priority = $${paramIndex}`);
      values.push(data.priority);
      paramIndex++;
    }

    if (data.status !== undefined) {
      updates.push(`status = $${paramIndex}`);
      values.push(data.status);
      paramIndex++;
    }

    if (data.budgetMin !== undefined) {
      updates.push(`budget_min = $${paramIndex}`);
      values.push(data.budgetMin);
      paramIndex++;
    }

    if (data.budgetMax !== undefined) {
      updates.push(`budget_max = $${paramIndex}`);
      values.push(data.budgetMax);
      paramIndex++;
    }

    if (data.deadline !== undefined) {
      updates.push(`deadline = $${paramIndex}`);
      values.push(data.deadline);
      paramIndex++;
    }

    if (data.location !== undefined) {
      updates.push(`location = $${paramIndex}`);
      values.push(data.location);
      paramIndex++;
    }

    if (data.requirements !== undefined) {
      updates.push(`requirements = $${paramIndex}`);
      values.push(data.requirements);
      paramIndex++;
    }

    if (data.assignedSupplierId !== undefined) {
      updates.push(`assigned_supplier_id = $${paramIndex}`);
      values.push(data.assignedSupplierId);
      paramIndex++;
    }

    if (data.assignedEmployeeId !== undefined) {
      updates.push(`assigned_employee_id = $${paramIndex}`);
      values.push(data.assignedEmployeeId);
      paramIndex++;
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(requestId);

    const query = `
      UPDATE service_requests
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await client.query(query, values);
    return result.rows[0] || null;
  } finally {
    client.release();
  }
};

export const deleteServiceRequest = async (requestId: string): Promise<boolean> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check if request has quotations
    const quotationsResult = await client.query(
      'SELECT COUNT(*) as count FROM quotations WHERE service_request_id = $1',
      [requestId]
    );

    const quotationCount = parseInt(quotationsResult.rows[0].count);

    if (quotationCount > 0) {
      throw new Error('Cannot delete service request with existing quotations');
    }

    const result = await client.query(
      'DELETE FROM service_requests WHERE id = $1',
      [requestId]
    );

    await client.query('COMMIT');
    return (result.rowCount || 0) > 0;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const createQuotation = async (data: CreateQuotationData): Promise<Quotation> => {
  const client = await pool.connect();

  try {
    const quotationId = crypto.randomUUID();

    // Check if supplier already has a quotation for this request
    const existingQuotation = await client.query(
      'SELECT id FROM quotations WHERE service_request_id = $1 AND supplier_id = $2',
      [data.serviceRequestId, data.supplierId]
    );

    if (existingQuotation.rows.length > 0) {
      throw new Error('Supplier has already submitted a quotation for this request');
    }

    const result = await client.query(
      `INSERT INTO quotations (
        id, service_request_id, supplier_id, amount, description,
        estimated_duration, terms_conditions, valid_until
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *`,
      [
        quotationId,
        data.serviceRequestId,
        data.supplierId,
        data.amount,
        data.description || null,
        data.estimatedDuration || null,
        data.termsConditions || null,
        data.validUntil || null,
      ]
    );

    return result.rows[0];
  } finally {
    client.release();
  }
};

export const getQuotationsForRequest = async (serviceRequestId: string) => {
  const result = await pool.query(
    `SELECT q.*,
      u.first_name || ' ' || u.last_name as supplier_name,
      sp.company_name as supplier_company,
      sp.rating as supplier_rating
     FROM quotations q
     LEFT JOIN users u ON q.supplier_id = u.id
     LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
     WHERE q.service_request_id = $1
     ORDER BY q.created_at ASC`,
    [serviceRequestId]
  );

  return result.rows;
};

export const updateQuotationStatus = async (
  quotationId: string,
  status: 'pending' | 'accepted' | 'rejected' | 'expired'
): Promise<Quotation | null> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // If accepting a quotation, reject all others for the same request
    if (status === 'accepted') {
      const quotationResult = await client.query(
        'SELECT service_request_id FROM quotations WHERE id = $1',
        [quotationId]
      );

      if (quotationResult.rows.length === 0) {
        throw new Error('Quotation not found');
      }

      const serviceRequestId = quotationResult.rows[0].service_request_id;

      // Reject all other quotations for this request
      await client.query(
        'UPDATE quotations SET status = $1 WHERE service_request_id = $2 AND id != $3',
        ['rejected', serviceRequestId, quotationId]
      );

      // Update service request status to in_progress
      await client.query(
        'UPDATE service_requests SET status = $1 WHERE id = $2',
        ['in_progress', serviceRequestId]
      );
    }

    const result = await client.query(
      'UPDATE quotations SET status = $1 WHERE id = $2 RETURNING *',
      [status, quotationId]
    );

    await client.query('COMMIT');
    return result.rows[0] || null;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};