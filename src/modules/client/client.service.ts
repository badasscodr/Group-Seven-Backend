import pool from '../../core/config/database';
import {
  ServiceRequest,
  CreateServiceRequestData,
  UpdateServiceRequestData,
  ServiceRequestFilters,
  ClientServiceRequestsResponse,
  ServiceRequestWithQuotations,
  Quotation,
  ClientProfile
} from './client.types';
import crypto from 'crypto';

export const createServiceRequest = async (
  clientId: string,
  data: CreateServiceRequestData
): Promise<ServiceRequest> => {
  const id = crypto.randomUUID();

  const result = await pool.query(
    `INSERT INTO service_requests (
      id, client_id, title, description, category, priority,
      budget_min, budget_max, deadline, location, requirements
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    RETURNING *`,
    [
      id,
      clientId,
      data.title,
      data.description,
      data.category,
      data.priority || 'medium',
      data.budget_min || null,
      data.budget_max || null,
      data.deadline || null,
      data.location || null,
      data.requirements || null,
    ]
  );

  return result.rows[0];
};

export const getServiceRequestById = async (
  requestId: string,
  clientId: string
): Promise<ServiceRequest | null> => {
  const result = await pool.query(
    'SELECT * FROM service_requests WHERE id = $1 AND client_id = $2',
    [requestId, clientId]
  );

  return result.rows[0] || null;
};

export const getClientServiceRequests = async (
  clientId: string,
  filters: ServiceRequestFilters
): Promise<ClientServiceRequestsResponse> => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  let query = `
    SELECT sr.*,
           COUNT(q.id) as quotation_count
    FROM service_requests sr
    LEFT JOIN quotations q ON sr.id = q.service_request_id
    WHERE sr.client_id = $1
  `;

  const params: any[] = [clientId];
  let paramCount = 1;

  if (filters.status) {
    query += ` AND sr.status = $${++paramCount}`;
    params.push(filters.status);
  }

  if (filters.category) {
    query += ` AND sr.category = $${++paramCount}`;
    params.push(filters.category);
  }

  if (filters.priority) {
    query += ` AND sr.priority = $${++paramCount}`;
    params.push(filters.priority);
  }

  query += ` GROUP BY sr.id ORDER BY sr.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) FROM service_requests WHERE client_id = $1';
  const countParams: any[] = [clientId];
  let countParamIndex = 1;

  if (filters.status) {
    countQuery += ` AND status = $${++countParamIndex}`;
    countParams.push(filters.status);
  }

  if (filters.category) {
    countQuery += ` AND category = $${++countParamIndex}`;
    countParams.push(filters.category);
  }

  if (filters.priority) {
    countQuery += ` AND priority = $${++countParamIndex}`;
    countParams.push(filters.priority);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  return {
    serviceRequests: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateServiceRequest = async (
  requestId: string,
  clientId: string,
  data: UpdateServiceRequestData
): Promise<ServiceRequest | null> => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 0;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`${key} = $${++paramCount}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  fields.push(`updated_at = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE service_requests
    SET ${fields.join(', ')}
    WHERE id = $${++paramCount} AND client_id = $${++paramCount}
    RETURNING *
  `;

  values.push(requestId, clientId);

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const deleteServiceRequest = async (
  requestId: string,
  clientId: string
): Promise<boolean> => {
  const result = await pool.query(
    'DELETE FROM service_requests WHERE id = $1 AND client_id = $2',
    [requestId, clientId]
  );

  return (result.rowCount ?? 0) > 0;
};

export const getServiceRequestWithQuotations = async (
  requestId: string,
  clientId: string
): Promise<ServiceRequestWithQuotations | null> => {
  // Get service request
  const serviceRequest = await getServiceRequestById(requestId, clientId);
  if (!serviceRequest) {
    return null;
  }

  // Get quotations for this request
  const quotationsResult = await pool.query(
    `SELECT q.*,
            u.first_name || ' ' || u.last_name as supplier_name,
            sp.company_name as supplier_company
     FROM quotations q
     JOIN users u ON q.supplier_id = u.id
     LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
     WHERE q.service_request_id = $1
     ORDER BY q.created_at DESC`,
    [requestId]
  );

  return {
    ...serviceRequest,
    quotations: quotationsResult.rows,
  };
};

export const getClientProfile = async (userId: string): Promise<ClientProfile | null> => {
  const result = await pool.query(
    'SELECT * FROM client_profiles WHERE user_id = $1',
    [userId]
  );

  return result.rows[0] || null;
};

export const updateClientProfile = async (
  userId: string,
  profileData: Partial<ClientProfile>
): Promise<ClientProfile | null> => {
  const existingProfile = await getClientProfile(userId);

  if (existingProfile) {
    // Update existing profile
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 0;

    Object.entries(profileData).forEach(([key, value]) => {
      if (value !== undefined && key !== 'id' && key !== 'user_id' && key !== 'created_at') {
        fields.push(`${key} = $${++paramCount}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return existingProfile;
    }

    const query = `
      UPDATE client_profiles
      SET ${fields.join(', ')}
      WHERE user_id = $${++paramCount}
      RETURNING *
    `;

    values.push(userId);

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } else {
    // Create new profile
    const profileId = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO client_profiles (
        id, user_id, company_name, industry, company_size,
        address, city, country, website, business_license
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *`,
      [
        profileId,
        userId,
        profileData.company_name || null,
        profileData.industry || null,
        profileData.company_size || null,
        profileData.address || null,
        profileData.city || null,
        profileData.country || null,
        profileData.website || null,
        profileData.business_license || null,
      ]
    );

    return result.rows[0];
  }
};