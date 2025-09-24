import pool from '../../core/config/database';
import {
  ServiceRequest,
  Quotation,
  CreateQuotationData,
  UpdateQuotationData,
  SupplierServiceRequestsResponse,
  ServiceRequestFilters,
  SupplierProfile
} from './supplier.types';
import crypto from 'crypto';

export const getAvailableServiceRequests = async (
  supplierId: string,
  filters: ServiceRequestFilters
): Promise<SupplierServiceRequestsResponse> => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  let query = `
    SELECT sr.*,
           u.first_name || ' ' || u.last_name as client_name,
           cp.company_name as client_company,
           COUNT(q.id) as quotation_count,
           CASE WHEN EXISTS (
             SELECT 1 FROM quotations
             WHERE service_request_id = sr.id AND supplier_id = $1
           ) THEN true ELSE false END as has_quoted
    FROM service_requests sr
    JOIN users u ON sr.client_id = u.id
    LEFT JOIN client_profiles cp ON u.id = cp.user_id
    LEFT JOIN quotations q ON sr.id = q.service_request_id
    WHERE sr.status = 'published'
  `;

  const params: any[] = [supplierId];
  let paramCount = 1;

  if (filters.category) {
    query += ` AND sr.category = $${++paramCount}`;
    params.push(filters.category);
  }

  if (filters.priority) {
    query += ` AND sr.priority = $${++paramCount}`;
    params.push(filters.priority);
  }

  if (filters.budget_min) {
    query += ` AND (sr.budget_min IS NULL OR sr.budget_min >= $${++paramCount})`;
    params.push(filters.budget_min);
  }

  if (filters.budget_max) {
    query += ` AND (sr.budget_max IS NULL OR sr.budget_max <= $${++paramCount})`;
    params.push(filters.budget_max);
  }

  query += ` GROUP BY sr.id, u.first_name, u.last_name, cp.company_name
             ORDER BY sr.created_at DESC
             LIMIT $${++paramCount} OFFSET $${++paramCount}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  let countQuery = `SELECT COUNT(DISTINCT sr.id)
                    FROM service_requests sr
                    WHERE sr.status = 'published'`;
  const countParams: any[] = [];
  let countParamIndex = 0;

  if (filters.category) {
    countQuery += ` AND sr.category = $${++countParamIndex}`;
    countParams.push(filters.category);
  }

  if (filters.priority) {
    countQuery += ` AND sr.priority = $${++countParamIndex}`;
    countParams.push(filters.priority);
  }

  if (filters.budget_min) {
    countQuery += ` AND (sr.budget_min IS NULL OR sr.budget_min >= $${++countParamIndex})`;
    countParams.push(filters.budget_min);
  }

  if (filters.budget_max) {
    countQuery += ` AND (sr.budget_max IS NULL OR sr.budget_max <= $${++countParamIndex})`;
    countParams.push(filters.budget_max);
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

export const createQuotation = async (
  supplierId: string,
  serviceRequestId: string,
  data: CreateQuotationData
): Promise<Quotation> => {
  // Check if service request exists and is published
  const serviceRequestCheck = await pool.query(
    'SELECT id, status FROM service_requests WHERE id = $1',
    [serviceRequestId]
  );

  if (serviceRequestCheck.rows.length === 0) {
    throw new Error('Service request not found');
  }

  if (serviceRequestCheck.rows[0].status !== 'published') {
    throw new Error('Cannot quote on this service request');
  }

  // Check if supplier already has a quotation for this request
  const existingQuotation = await pool.query(
    'SELECT id FROM quotations WHERE service_request_id = $1 AND supplier_id = $2',
    [serviceRequestId, supplierId]
  );

  if (existingQuotation.rows.length > 0) {
    throw new Error('You have already submitted a quotation for this request');
  }

  const id = crypto.randomUUID();

  const result = await pool.query(
    `INSERT INTO quotations (
      id, service_request_id, supplier_id, amount, description,
      estimated_duration, terms_conditions, valid_until
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *`,
    [
      id,
      serviceRequestId,
      supplierId,
      data.amount,
      data.description || null,
      data.estimated_duration || null,
      data.terms_conditions || null,
      data.valid_until || null,
    ]
  );

  return result.rows[0];
};

export const getSupplierQuotations = async (
  supplierId: string,
  filters: { status?: string; page?: number; limit?: number }
): Promise<{ quotations: any[]; pagination: any }> => {
  const page = filters.page || 1;
  const limit = filters.limit || 10;
  const offset = (page - 1) * limit;

  let query = `
    SELECT q.*,
           sr.title as request_title,
           sr.category as request_category,
           sr.status as request_status,
           u.first_name || ' ' || u.last_name as client_name,
           cp.company_name as client_company
    FROM quotations q
    JOIN service_requests sr ON q.service_request_id = sr.id
    JOIN users u ON sr.client_id = u.id
    LEFT JOIN client_profiles cp ON u.id = cp.user_id
    WHERE q.supplier_id = $1
  `;

  const params: any[] = [supplierId];
  let paramCount = 1;

  if (filters.status) {
    query += ` AND q.status = $${++paramCount}`;
    params.push(filters.status);
  }

  query += ` ORDER BY q.created_at DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) FROM quotations WHERE supplier_id = $1';
  const countParams: any[] = [supplierId];
  let countParamIndex = 1;

  if (filters.status) {
    countQuery += ` AND status = $${++countParamIndex}`;
    countParams.push(filters.status);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  return {
    quotations: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const updateQuotation = async (
  quotationId: string,
  supplierId: string,
  data: UpdateQuotationData
): Promise<Quotation | null> => {
  // Check if quotation exists and belongs to supplier
  const existingQuotation = await pool.query(
    'SELECT id, status FROM quotations WHERE id = $1 AND supplier_id = $2',
    [quotationId, supplierId]
  );

  if (existingQuotation.rows.length === 0) {
    throw new Error('Quotation not found');
  }

  // Only allow updates if quotation is pending
  if (existingQuotation.rows[0].status !== 'pending') {
    throw new Error('Cannot update quotation that has been accepted or rejected');
  }

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

  const query = `
    UPDATE quotations
    SET ${fields.join(', ')}
    WHERE id = $${++paramCount} AND supplier_id = $${++paramCount}
    RETURNING *
  `;

  values.push(quotationId, supplierId);

  const result = await pool.query(query, values);
  return result.rows[0] || null;
};

export const getQuotationById = async (
  quotationId: string,
  supplierId: string
): Promise<any | null> => {
  const result = await pool.query(
    `SELECT q.*,
            sr.title as request_title,
            sr.description as request_description,
            sr.category as request_category,
            sr.status as request_status,
            u.first_name || ' ' || u.last_name as client_name,
            cp.company_name as client_company
     FROM quotations q
     JOIN service_requests sr ON q.service_request_id = sr.id
     JOIN users u ON sr.client_id = u.id
     LEFT JOIN client_profiles cp ON u.id = cp.user_id
     WHERE q.id = $1 AND q.supplier_id = $2`,
    [quotationId, supplierId]
  );

  return result.rows[0] || null;
};

export const getSupplierProfile = async (userId: string): Promise<SupplierProfile | null> => {
  const result = await pool.query(
    'SELECT * FROM supplier_profiles WHERE user_id = $1',
    [userId]
  );

  return result.rows[0] || null;
};

export const updateSupplierProfile = async (
  userId: string,
  profileData: Partial<SupplierProfile>
): Promise<SupplierProfile | null> => {
  const existingProfile = await getSupplierProfile(userId);

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
      UPDATE supplier_profiles
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
      `INSERT INTO supplier_profiles (
        id, user_id, company_name, business_type, license_number,
        service_categories, rating, total_reviews, is_verified
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        profileId,
        userId,
        profileData.company_name || '',
        profileData.business_type || null,
        profileData.license_number || null,
        profileData.service_categories || [],
        profileData.rating || 0.00,
        profileData.total_reviews || 0,
        profileData.is_verified || false,
      ]
    );

    return result.rows[0];
  }
};

export const getServiceCategories = async (): Promise<any[]> => {
  const result = await pool.query(
    'SELECT * FROM service_categories WHERE is_active = true ORDER BY name'
  );
  return result.rows;
};