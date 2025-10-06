import pool from '../../core/config/database';
import {
  CreatePaymentData,
  UpdatePaymentData,
  PaymentFilters,
  PaymentStats
} from './payment.types';

/**
 * Create a new payment record
 */
export const createPayment = async (data: CreatePaymentData) => {
  const {
    quotationId,
    supplierId,
    clientId,
    amount,
    currency = 'USD',
    paymentMethod,
    dueDate,
    invoiceNumber,
    notes
  } = data;

  const query = `
    INSERT INTO payments (
      "quotationId", "supplierId", "clientId", "amount", "currency",
      "paymentMethod", "dueDate", "invoiceNumber", "notes",
      "status", "createdAt"
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'pending', CURRENT_TIMESTAMP)
    RETURNING *
  `;

  const values = [
    quotationId,
    supplierId,
    clientId,
    amount,
    currency,
    paymentMethod,
    dueDate,
    invoiceNumber,
    notes
  ];

  const result = await pool.query(query, values);
  return result.rows[0];
};

/**
 * Get payments with filters
 */
export const getPayments = async (filters: PaymentFilters = {}) => {
  const {
    status,
    supplierId,
    clientId,
    quotationId,
    startDate,
    endDate,
    page = 1,
    limit = 10
  } = filters;

  let query = `
    SELECT p.*,
           s."firstName" as "supplierFirstName", s."lastName" as "supplierLastName",
           s."email" as "supplierEmail",
           c."firstName" as "clientFirstName", c."lastName" as "clientLastName",
           c."email" as "clientEmail",
           q."amount" as "quotationAmount", q."description" as "quotationDescription",
           sr."title" as "serviceRequestTitle"
    FROM payments p
    LEFT JOIN users s ON p."supplierId" = s."id"
    LEFT JOIN users c ON p."clientId" = c."id"
    LEFT JOIN quotations q ON p."quotationId" = q."id"
    LEFT JOIN service_requests sr ON q."serviceRequestId" = sr."id"
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 1;

  if (status) {
    query += ` AND p."status" = $${paramCount}`;
    values.push(status);
    paramCount++;
  }

  if (supplierId) {
    query += ` AND p."supplierId" = $${paramCount}`;
    values.push(supplierId);
    paramCount++;
  }

  if (clientId) {
    query += ` AND p."clientId" = $${paramCount}`;
    values.push(clientId);
    paramCount++;
  }

  if (quotationId) {
    query += ` AND p."quotationId" = $${paramCount}`;
    values.push(quotationId);
    paramCount++;
  }

  if (startDate) {
    query += ` AND p."createdAt" >= $${paramCount}`;
    values.push(startDate);
    paramCount++;
  }

  if (endDate) {
    query += ` AND p."createdAt" <= $${paramCount}`;
    values.push(endDate);
    paramCount++;
  }

  query += ` ORDER BY p."createdAt" DESC`;

  const offset = (page - 1) * limit;
  query += ` LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
  values.push(limit, offset);

  const result = await pool.query(query, values);

  // Get total count
  let countQuery = `SELECT COUNT(*) FROM payments WHERE 1=1`;
  const countValues: any[] = [];
  let countParamNum = 1;

  if (status) {
    countQuery += ` AND "status" = $${countParamNum}`;
    countValues.push(status);
    countParamNum++;
  }

  if (supplierId) {
    countQuery += ` AND "supplierId" = $${countParamNum}`;
    countValues.push(supplierId);
    countParamNum++;
  }

  if (clientId) {
    countQuery += ` AND "clientId" = $${countParamNum}`;
    countValues.push(clientId);
    countParamNum++;
  }

  const countResult = await pool.query(countQuery, countValues);
  const totalCount = parseInt(countResult.rows[0].count);

  return {
    payments: result.rows,
    pagination: {
      total: totalCount,
      page,
      limit,
      totalPages: Math.ceil(totalCount / limit)
    }
  };
};

/**
 * Get payment by ID
 */
export const getPaymentById = async (payment_id: string) => {
  const query = `
    SELECT p.*,
           s."firstName" as "supplierFirstName", s."lastName" as "supplierLastName",
           s."email" as "supplierEmail", s."phone" as "supplierPhone",
           c."firstName" as "clientFirstName", c."lastName" as "clientLastName",
           c."email" as "clientEmail", c."phone" as "clientPhone",
           q."amount" as "quotationAmount", q."description" as "quotationDescription",
           sr."title" as "serviceRequestTitle", sr."description" as "serviceRequestDescription"
    FROM payments p
    LEFT JOIN users s ON p."supplierId" = s."id"
    LEFT JOIN users c ON p."clientId" = c."id"
    LEFT JOIN quotations q ON p."quotationId" = q."id"
    LEFT JOIN service_requests sr ON q."serviceRequestId" = sr."id"
    WHERE p."id" = $1
  `;

  const result = await pool.query(query, [payment_id]);

  if (result.rows.length === 0) {
    throw new Error('Payment not found');
  }

  return result.rows[0];
};

/**
 * Update payment
 */
export const updatePayment = async (
  payment_id: string,
  data: UpdatePaymentData,
  approvedBy?: string
) => {
  const fields: string[] = [];
  const values: any[] = [];
  let paramCount = 1;

  Object.entries(data).forEach(([key, value]) => {
    if (value !== undefined) {
      fields.push(`"${key}" = $${paramCount}`);
      values.push(value);
      paramCount++;
    }
  });

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  // If status is being changed to 'approved' or 'paid', record who approved it
  if (data.status === 'approved' || data.status === 'paid') {
    if (approvedBy) {
      fields.push(`"approvedBy" = $${paramCount}`);
      values.push(approvedBy);
      paramCount++;
    }
    fields.push(`"approvedAt" = CURRENT_TIMESTAMP`);
  }

  fields.push(`"updatedAt" = CURRENT_TIMESTAMP`);

  const query = `
    UPDATE payments
    SET ${fields.join(', ')}
    WHERE "id" = $${paramCount}
    RETURNING *
  `;

  values.push(payment_id);

  const result = await pool.query(query, values);

  if (result.rows.length === 0) {
    throw new Error('Payment not found');
  }

  return result.rows[0];
};

/**
 * Delete payment
 */
export const deletePayment = async (payment_id: string) => {
  const query = `DELETE FROM payments WHERE "id" = $1 RETURNING *`;
  const result = await pool.query(query, [payment_id]);

  if (result.rows.length === 0) {
    throw new Error('Payment not found');
  }

  return result.rows[0];
};

/**
 * Get payment statistics
 */
export const getPaymentStats = async (filters: { supplierId?: string; clientId?: string } = {}): Promise<PaymentStats> => {
  const { supplierId,  clientId } = filters;

  let query = `
    SELECT
      COUNT(*) as "totalPayments",
      COALESCE(SUM("amount"), 0) as "totalAmount",
      COUNT(*) FILTER (WHERE "status" = 'pending') as "pendingCount",
      COALESCE(SUM("amount") FILTER (WHERE "status" = 'pending'), 0) as "pendingAmount",
      COUNT(*) FILTER (WHERE "status" = 'approved') as "approvedCount",
      COALESCE(SUM("amount") FILTER (WHERE "status" = 'approved'), 0) as "approvedAmount",
      COUNT(*) FILTER (WHERE "status" = 'paid') as "paidCount",
      COALESCE(SUM("amount") FILTER (WHERE "status" = 'paid'), 0) as "paidAmount"
    FROM payments
    WHERE 1=1
  `;

  const values: any[] = [];
  let paramCount = 1;

  if (supplierId) {
    query += ` AND "supplierId" = $${paramCount}`;
    values.push(supplierId);
    paramCount++;
  }

  if (clientId) {
    query += ` AND "clientId" = $${paramCount}`;
    values.push(clientId);
    paramCount++;
  }

  const result = await pool.query(query, values);
  const stats = result.rows[0];

  return {
    total_payments: parseInt(stats.totalPayments),
    total_amount: parseFloat(stats.totalAmount),
    pending_count: parseInt(stats.pendingCount),
    pending_amount: parseFloat(stats.pendingAmount),
    approved_count: parseInt(stats.approvedCount),
    approved_amount: parseFloat(stats.approvedAmount),
    paid_count: parseInt(stats.paidCount),
    paid_amount: parseFloat(stats.paidAmount)
  };
};

/**
 * Get overdue payments
 */
export const getOverduePayments = async  (supplierId?: string) => {
  let query = `
    SELECT p.*,
           s."firstName" as "supplierFirstName", s."lastName" as "supplierLastName",
           c."firstName" as "clientFirstName", c."lastName" as "clientLastName",
           sr."title" as "serviceRequestTitle"
    FROM payments p
    LEFT JOIN users s ON p."supplierId" = s."id"
    LEFT JOIN users c ON p."clientId" = c."id"
    LEFT JOIN quotations q ON p."quotationId" = q."id"
    LEFT JOIN service_requests sr ON q."serviceRequestId" = sr."id"
    WHERE p."dueDate" < CURRENT_DATE
      AND p."status" NOT IN ('paid', 'cancelled', 'rejected')
  `;

  const values: any[] = [];

  if (supplierId) {
    query += ` AND p."supplierId" = $1`;
    values.push(supplierId);
  }

  query += ` ORDER BY p."dueDate" ASC`;

  const result = await pool.query(query, values);
  return result.rows;
};
