import { query, transaction } from '../../core/config/database';
import { AppError } from '../../core/middleware/errorHandler';

export interface SupplierProfile {
  id: string;
  userId: string;
  companyName: string;
  businessType?: string;
  licenseNumber?: string;
  tradeLicenseExpiry?: Date;
  insuranceDetails?: string;
  serviceCategories: string[];
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quotation {
  id: string;
  serviceRequestId: string;
  supplierId: string;
  amount: number;
  description?: string;
  estimatedDuration?: string;
  termsConditions?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  validUntil?: Date;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

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
  createdAt: Date;
  updatedAt: Date;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export class SupplierService {
  // Get available service requests for suppliers
  static async getAvailableRequests(supplierId: string, filters: any = {}) {
    const {
      category,
      priority,
      budget_min,
      budget_max,
      page = 1,
      limit = 10
    } = filters;

    const offset = (page - 1) * limit;
    const conditions: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    // Only show requests that are published and not assigned to a supplier
    conditions.push(`status = 'published'`);
    conditions.push(`assigned_supplier_id IS NULL`);

    if (category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(category);
    }

    if (priority) {
      conditions.push(`priority = $${paramIndex++}`);
      params.push(priority);
    }

    if (budget_min) {
      conditions.push(`budget_min >= $${paramIndex++}`);
      params.push(budget_min);
    }

    if (budget_max) {
      conditions.push(`budget_max <= $${paramIndex++}`);
      params.push(budget_max);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM service_requests
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated requests with client information
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

  // Create quotation for a service request
  static async createQuotation(supplierId: string, serviceRequestId: string, quotationData: any) {
    return await transaction(async (client) => {
      // Check if service request exists and is available
      const requestQuery = `
        SELECT id, client_id, title, status
        FROM service_requests
        WHERE id = $1 AND status = 'published' AND assigned_supplier_id IS NULL
      `;
      const requestResult = await client.query(requestQuery, [serviceRequestId]);
      
      if (requestResult.rows.length === 0) {
        throw new AppError('Service request not available for quotation', 404);
      }

      // Check if supplier already has a quotation for this request
      const existingQuotationQuery = `
        SELECT id FROM quotations 
        WHERE service_request_id = $1 AND supplier_id = $2
      `;
      const existingResult = await client.query(existingQuotationQuery, [serviceRequestId, supplierId]);
      
      if (existingResult.rows.length > 0) {
        throw new AppError('Quotation already exists for this service request', 409);
      }

      // Create quotation
      const quotationQuery = `
        INSERT INTO quotations (
          service_request_id, supplier_id, amount, description, 
          estimated_duration, terms_conditions, valid_until, status
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, 'pending')
        RETURNING *
      `;
      
      const quotationResult = await client.query(quotationQuery, [
        serviceRequestId,
        supplierId,
        quotationData.amount,
        quotationData.description || null,
        quotationData.estimated_duration || null,
        quotationData.terms_conditions || null,
        quotationData.valid_until || null
      ]);

      return quotationResult.rows[0];
    });
  }

  // Get supplier's quotations
  static async getQuotations(supplierId: string, filters: any = {}) {
    const {
      status,
      page = 1,
      limit = 10
    } = filters;

    const offset = (page - 1) * limit;
    const conditions: string[] = ['q.supplier_id = $1'];
    const params: any[] = [supplierId];
    let paramIndex = 2;

    if (status) {
      conditions.push(`q.status = $${paramIndex++}`);
      params.push(status);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM quotations q
      ${whereClause}
    `;
    const countResult = await query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated quotations with service request and client info
    const quotationsQuery = `
      SELECT 
        q.*,
        sr.title as service_request_title,
        sr.category,
        u.first_name as client_first_name,
        u.last_name as client_last_name,
        cp.company_name
      FROM quotations q
      JOIN service_requests sr ON q.service_request_id = sr.id
      JOIN users u ON sr.client_id = u.id
      LEFT JOIN client_profiles cp ON sr.client_id = cp.user_id
      ${whereClause}
      ORDER BY q.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex++}
    `;
    
    params.push(limit, offset);
    const quotationsResult = await query(quotationsQuery, params);

    return {
      quotations: quotationsResult.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  // Get specific quotation
  static async getQuotation(supplierId: string, quotationId: string) {
    const quotationQuery = `
      SELECT 
        q.*,
        sr.title as service_request_title,
        sr.description as service_request_description,
        sr.category,
        u.first_name as client_first_name,
        u.last_name as client_last_name,
        u.email as client_email,
        cp.company_name
      FROM quotations q
      JOIN service_requests sr ON q.service_request_id = sr.id
      JOIN users u ON sr.client_id = u.id
      LEFT JOIN client_profiles cp ON sr.client_id = cp.user_id
      WHERE q.id = $1 AND q.supplier_id = $2
    `;
    
    const result = await query(quotationQuery, [quotationId, supplierId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Quotation not found', 404);
    }

    return result.rows[0];
  }

  // Update quotation
  static async updateQuotation(supplierId: string, quotationId: string, updateData: any) {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (updateData.amount !== undefined) {
      fields.push(`amount = $${paramIndex++}`);
      values.push(updateData.amount);
    }

    if (updateData.description !== undefined) {
      fields.push(`description = $${paramIndex++}`);
      values.push(updateData.description);
    }

    if (updateData.estimated_duration !== undefined) {
      fields.push(`estimated_duration = $${paramIndex++}`);
      values.push(updateData.estimated_duration);
    }

    if (updateData.terms_conditions !== undefined) {
      fields.push(`terms_conditions = $${paramIndex++}`);
      values.push(updateData.terms_conditions);
    }

    if (updateData.valid_until !== undefined) {
      fields.push(`valid_until = $${paramIndex++}`);
      values.push(updateData.valid_until);
    }

    if (fields.length === 0) {
      throw new AppError('No valid fields to update', 400);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(quotationId, supplierId);

    const updateQuery = `
      UPDATE quotations 
      SET ${fields.join(', ')}
      WHERE id = $${paramIndex++} AND supplier_id = $${paramIndex}
      RETURNING *
    `;

    const result = await query(updateQuery, values);
    
    if (result.rows.length === 0) {
      throw new AppError('Quotation not found or access denied', 404);
    }

    return result.rows[0];
  }

  // Submit quotation
  static async submitQuotation(supplierId: string, quotationId: string) {
    const updateQuery = `
      UPDATE quotations 
      SET status = 'pending', updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND supplier_id = $2 AND status = 'draft'
      RETURNING *
    `;

    const result = await query(updateQuery, [quotationId, supplierId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Quotation not found, access denied, or already submitted', 404);
    }

    return result.rows[0];
  }

  // Get supplier profile
  static async getProfile(supplierId: string) {
    const profileQuery = `
      SELECT 
        u.id,
        u.email,
        u.first_name,
        u.last_name,
        u.phone,
        u.avatar_url,
        sp.company_name,
        sp.business_type,
        sp.license_number,
        sp.trade_license_expiry,
        sp.insurance_details,
        sp.service_categories,
        sp.rating,
        sp.total_reviews,
        sp.is_verified,
        sp.created_at as supplier_created_at
      FROM users u
      LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
      WHERE u.id = $1 AND u.role = 'supplier'
    `;

    const result = await query(profileQuery, [supplierId]);
    
    if (result.rows.length === 0) {
      throw new AppError('Supplier profile not found', 404);
    }

    return result.rows[0];
  }

  // Update supplier profile
  static async updateProfile(supplierId: string, profileData: any) {
    return await transaction(async (client) => {
      // Update user basic info if provided
      if (profileData.first_name || profileData.last_name || profileData.phone) {
        const userFields: string[] = [];
        const userValues: any[] = [];
        let paramIndex = 1;

        if (profileData.first_name) {
          userFields.push(`first_name = $${paramIndex++}`);
          userValues.push(profileData.first_name);
        }

        if (profileData.last_name) {
          userFields.push(`last_name = $${paramIndex++}`);
          userValues.push(profileData.last_name);
        }

        if (profileData.phone) {
          userFields.push(`phone = $${paramIndex++}`);
          userValues.push(profileData.phone);
        }

        if (userFields.length > 0) {
          userFields.push(`updated_at = CURRENT_TIMESTAMP`);
          userValues.push(supplierId);

          const userUpdateQuery = `
            UPDATE users 
            SET ${userFields.join(', ')}
            WHERE id = $${paramIndex}
          `;
          await client.query(userUpdateQuery, userValues);
        }
      }

      // Update supplier profile
      const supplierFields: string[] = [];
      const supplierValues: any[] = [];
      let paramIndex = 1;

      if (profileData.company_name !== undefined) {
        supplierFields.push(`company_name = $${paramIndex++}`);
        supplierValues.push(profileData.company_name);
      }

      if (profileData.business_type !== undefined) {
        supplierFields.push(`business_type = $${paramIndex++}`);
        supplierValues.push(profileData.business_type);
      }

      if (profileData.license_number !== undefined) {
        supplierFields.push(`license_number = $${paramIndex++}`);
        supplierValues.push(profileData.license_number);
      }

      if (profileData.service_categories !== undefined) {
        // Convert comma-separated string to PostgreSQL array format
        let serviceCategoriesArray = null;
        if (profileData.service_categories && profileData.service_categories.trim()) {
          const categories = profileData.service_categories.split(',').map(cat => cat.trim()).filter(cat => cat);
          serviceCategoriesArray = `{${categories.join(',')}}`;
        }
        
        supplierFields.push(`service_categories = COALESCE($${paramIndex++}::text[], $${paramIndex++}::text[])`);
        supplierValues.push(serviceCategoriesArray, serviceCategoriesArray);
      }

      if (supplierFields.length > 0) {
        supplierFields.push(`updated_at = CURRENT_TIMESTAMP`);
        supplierValues.push(supplierId);

        // Check if supplier profile exists
        const profileExistsQuery = `SELECT id FROM supplier_profiles WHERE user_id = $1`;
        const existsResult = await client.query(profileExistsQuery, [supplierId]);

        if (existsResult.rows.length > 0) {
          const supplierUpdateQuery = `
            UPDATE supplier_profiles 
            SET ${supplierFields.join(', ')}
            WHERE user_id = $${paramIndex}
            RETURNING *
          `;
          const updateResult = await client.query(supplierUpdateQuery, supplierValues);
          return updateResult.rows[0];
        } else {
          // Create supplier profile if it doesn't exist
          supplierFields.pop(); // Remove updated_at
          supplierFields.push(`user_id = $${paramIndex++}`);
          supplierFields.push(`created_at = CURRENT_TIMESTAMP`);
          supplierFields.push(`updated_at = CURRENT_TIMESTAMP`);
          
          supplierValues.push(supplierId);

          const supplierCreateQuery = `
            INSERT INTO supplier_profiles (${supplierFields.join(', ')})
            VALUES (${supplierFields.map((_, i) => `$${i + 1}`).join(', ')})
            RETURNING *
          `;
          const createResult = await client.query(supplierCreateQuery, supplierValues);
          return createResult.rows[0];
        }
      }

      // Return updated user profile
      const selectQuery = `
        SELECT 
          u.id, u.email, u.first_name, u.last_name, u.phone, u.avatar_url,
          sp.company_name, sp.business_type, sp.license_number, 
          sp.service_categories, sp.rating, sp.total_reviews, sp.is_verified
        FROM users u
        LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
        WHERE u.id = $1
      `;
      
      const finalResult = await client.query(selectQuery, [supplierId]);
      return finalResult.rows[0];
    });
  }

  // Get service categories
  static async getCategories() {
    const categoriesQuery = `
      SELECT id, name, description, icon
      FROM service_categories
      WHERE is_active = true
      ORDER BY name ASC
    `;

    const result = await query(categoriesQuery);
    return result.rows;
  }
}