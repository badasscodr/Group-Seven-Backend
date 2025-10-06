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
           u."firstName" || ' ' || u."lastName" as "clientName",
           cp."companyName" as "clientCompany",
           COUNT(q."id") as "quotationCount",
           CASE WHEN EXISTS (
             SELECT 1 FROM quotations
             WHERE "serviceRequestId" = sr."id" AND "supplierId" = $1
           ) THEN true ELSE false END as "hasQuoted"
    FROM "serviceRequests" sr
    JOIN users u ON sr."clientId" = u."id"
    LEFT JOIN "clientProfiles" cp ON u."id" = cp."userId"
    LEFT JOIN quotations q ON sr."id" = q."serviceRequestId"
    WHERE sr."status" = 'published'
  `;

  const params: any[] = [supplierId];
  let paramCount = 1;

  if (filters.category) {
    query += ` AND sr."category" = $${++paramCount}`;
    params.push(filters.category);
  }

  if (filters.priority) {
    query += ` AND sr."priority" = $${++paramCount}`;
    params.push(filters.priority);
  }

  if (filters.budgetMin) {
    query += ` AND (sr."budgetMin" IS NULL OR sr."budgetMin" >= $${++paramCount})`;
    params.push(filters.budgetMin);
  }

  if (filters.budgetMax) {
    query += ` AND (sr."budgetMax" IS NULL OR sr."budgetMax" <= $${++paramCount})`;
    params.push(filters.budgetMax);
  }

  query += ` GROUP BY sr."id", u."firstName", u."lastName", cp."companyName"
             ORDER BY sr."createdAt" DESC
             LIMIT $${++paramCount} OFFSET $${++paramCount}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  let countQuery = `SELECT COUNT(DISTINCT sr."id")
                    FROM "serviceRequests" sr
                    WHERE sr."status" = 'published'`;
  const countParams: any[] = [];
  let countParamIndex = 0;

  if (filters.category) {
    countQuery += ` AND sr."category" = $${++countParamIndex}`;
    countParams.push(filters.category);
  }

  if (filters.priority) {
    countQuery += ` AND sr."priority" = $${++countParamIndex}`;
    countParams.push(filters.priority);
  }

  if (filters.budgetMin) {
    countQuery += ` AND (sr."budgetMin" IS NULL OR sr."budgetMin" >= $${++countParamIndex})`;
    countParams.push(filters.budgetMin);
  }

  if (filters.budgetMax) {
    countQuery += ` AND (sr."budgetMax" IS NULL OR sr."budgetMax" <= $${++countParamIndex})`;
    countParams.push(filters.budgetMax);
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
    'SELECT "id", "status" FROM "serviceRequests" WHERE "id" = $1',
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
    'SELECT "id" FROM quotations WHERE "serviceRequestId" = $1 AND "supplierId" = $2',
    [serviceRequestId, supplierId]
  );

  if (existingQuotation.rows.length > 0) {
    throw new Error('You have already submitted a quotation for this request');
  }

  const id = crypto.randomUUID();

  const result = await pool.query(
    `INSERT INTO quotations (
      "id", "serviceRequestId", "supplierId", "amount", "description",
      "estimatedDuration", "termsConditions", "validUntil"
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
           sr."title" as "requestTitle",
           sr."category" as "requestCategory",
           sr."status" as "requestStatus",
           u."firstName" || ' ' || u."lastName" as "clientName",
           cp."companyName" as "clientCompany"
    FROM quotations q
    JOIN "serviceRequests" sr ON q."serviceRequestId" = sr."id"
    JOIN users u ON sr."clientId" = u."id"
    LEFT JOIN "clientProfiles" cp ON u."id" = cp."userId"
    WHERE q."supplierId" = $1
  `;

  const params: any[] = [supplierId];
  let paramCount = 1;

  if (filters.status) {
    query += ` AND q."status" = $${++paramCount}`;
    params.push(filters.status);
  }

  query += ` ORDER BY q."createdAt" DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) FROM quotations WHERE "supplierId" = $1';
  const countParams: any[] = [supplierId];
  let countParamIndex = 1;

  if (filters.status) {
    countQuery += ` AND "status" = $${++countParamIndex}`;
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
    'SELECT "id", "status" FROM quotations WHERE "id" = $1 AND "supplierId" = $2',
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
      fields.push(`"${key}" = $${++paramCount}`);
      values.push(value);
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  const query = `
    UPDATE quotations
    SET ${fields.join(', ')}
    WHERE "id" = $${++paramCount} AND "supplierId" = $${++paramCount}
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
            sr."title" as "requestTitle",
            sr."description" as "requestDescription",
            sr."category" as "requestCategory",
            sr."status" as "requestStatus",
            u."firstName" || ' ' || u."lastName" as "clientName",
            cp."companyName" as "clientCompany"
     FROM quotations q
     JOIN "serviceRequests" sr ON q."serviceRequestId" = sr."id"
     JOIN users u ON sr."clientId" = u."id"
     LEFT JOIN "clientProfiles" cp ON u."id" = cp."userId"
     WHERE q."id" = $1 AND q."supplierId" = $2`,
    [quotationId, supplierId]
  );

  return result.rows[0] || null;
};

export const getSupplierProfile = async (userId: string): Promise<SupplierProfile | null> => {
  const result = await pool.query(
    'SELECT * FROM "supplierProfiles" WHERE "userId" = $1',
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
      if (value !== undefined && key !== 'id' && key !== 'userId' && key !== 'createdAt') {
        fields.push(`"${key}" = $${++paramCount}`);
        values.push(value);
      }
    });

    if (fields.length === 0) {
      return existingProfile;
    }

    const query = `
      UPDATE "supplierProfiles"
      SET ${fields.join(', ')}
      WHERE "userId" = $${++paramCount}
      RETURNING *
    `;

    values.push(userId);

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  } else {
    // Create new profile
    const profileId = crypto.randomUUID();
    const result = await pool.query(
      `INSERT INTO "supplierProfiles" (
        "id", "userId", "companyName", "businessType", "licenseNumber",
        "serviceCategories", "rating", "totalReviews", "isVerified"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *`,
      [
        profileId,
        userId,
        profileData.companyName || '',
        profileData.businessType || null,
        profileData.licenseNumber || null,
        profileData.serviceCategories || [],
        profileData.rating || 0.00,
        profileData.totalReviews || 0,
        profileData.isVerified || false,
      ]
    );

    return result.rows[0];
  }
};

export const getServiceCategories = async (): Promise<any[]> => {
  const result = await pool.query(
    'SELECT * FROM "serviceCategories" WHERE "isActive" = true ORDER BY "name"'
  );
  return result.rows;
};