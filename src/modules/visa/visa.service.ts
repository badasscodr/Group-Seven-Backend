import pool from '../../core/config/database';
import {
  VisaDocument,
  CreateVisaData,
  UpdateVisaData,
  VisaListQuery,
  VisaStats,
  VisaType,
  VisaStatus,
  VisaDocumentWithRelations,
  VisaExpiryNotification,
} from './visa.types';

/**
 * Create a new visa record linked to a document
 */
export const createVisaRecord = async (
  userId: string,
  visaData: CreateVisaData
): Promise<VisaDocument> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // First, verify the document belongs to the user and is a visa document
    const docQuery = `
      SELECT "id", "category"
      FROM documents
      WHERE "id" = $1 AND "userId" = $2 AND "category" = 'visa'
    `;
    const docResult = await client.query(docQuery, [visaData.documentId, userId]);

    if (docResult.rows.length === 0) {
      throw new Error('Document not found or is not a visa document');
    }

    // Check if visa record already exists for this document
    const existingVisaQuery = `
      SELECT "id" FROM "visaDocuments" WHERE "documentId" = $1
    `;
    const existingVisa = await client.query(existingVisaQuery, [visaData.documentId]);

    if (existingVisa.rows.length > 0) {
      throw new Error('Visa record already exists for this document');
    }

    // Calculate initial status based on expiry date
    const expiryDate = new Date(visaData.expiryDate);
    const now = new Date();
    const daysUntilExpiry = Math.ceil((expiryDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    let status: VisaStatus = 'active';
    if (daysUntilExpiry < 0) {
      status = 'expired';
    } else if (daysUntilExpiry <= 7) {
      status = 'expiring_critical';
    } else if (daysUntilExpiry <= 30) {
      status = 'expiring_soon';
    }

    // Create visa record
    const insertQuery = `
      INSERT INTO "visaDocuments" (
        "userId", "documentId", "visaType", "visaNumber", "issuedDate",
        "expiryDate", "issuingCountry", "status", "isActive"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const values = [
      userId,
      visaData.documentId,
      visaData.visaType,
      visaData.visaNumber,
      visaData.issuedDate,
      visaData.expiryDate,
      visaData.issuingCountry,
      status,
      true,
    ];

    const result = await client.query(insertQuery, values);
    await client.query('COMMIT');

    const visa = result.rows[0];
    return {
      id: visa.id,
      userId: visa.userId,
      documentId: visa.documentId,
      visaType: visa.visaType,
      visaNumber: visa.visaNumber,
      issuedDate: visa.issuedDate,
      expiryDate: visa.expiryDate,
      issuingCountry: visa.issuingCountry,
      status: visa.status,
      notificationsSent: visa.notificationsSent || 0,
      lastNotificationDate: visa.lastNotificationDate,
      isActive: visa.isActive,
      createdAt: visa.createdAt,
      updatedAt: visa.updatedAt,
    };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating visa record:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Get visa records with optional filtering
 */
export const getVisaRecords = async (
  query: VisaListQuery = {}
): Promise<{ visas: VisaDocumentWithRelations[]; total: number }> => {
  try {
    const { userId, visaType, status, expiringWithin, isActive, limit = 50, offset = 0 } = query;

    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (userId !== undefined) {
      whereClause += ` AND vd."userId" = $${paramIndex}`;
      params.push(userId);
      paramIndex++;
    }

    if (visaType !== undefined) {
      whereClause += ` AND vd."visaType" = $${paramIndex}`;
      params.push(visaType);
      paramIndex++;
    }

    if (status !== undefined) {
      whereClause += ` AND vd."status" = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (isActive !== undefined) {
      whereClause += ` AND vd."isActive" = $${paramIndex}`;
      params.push(isActive);
      paramIndex++;
    }

    if (expiringWithin !== undefined) {
      whereClause += ` AND vd."expiryDate" <= $${paramIndex}`;
      const expiryThreshold = new Date();
      expiryThreshold.setDate(expiryThreshold.getDate() + expiringWithin);
      params.push(expiryThreshold.toISOString());
      paramIndex++;
    }

    // Get total count
    const countQuery = `
      SELECT COUNT(*) AS "total"
      FROM "visaDocuments" vd
      ${whereClause}
    `;
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);

    // Get visa records with relations
    const visasQuery = `
      SELECT
        vd.*,
        d."filename", d."originalName", d."fileUrl", d."fileSize", d."mimeType",
        u."firstName", u."lastName", u."email", u."role"
      FROM "visaDocuments" vd
      LEFT JOIN documents d ON vd."documentId" = d."id"
      LEFT JOIN users u ON vd."userId" = u."id"
      ${whereClause}
      ORDER BY vd."expiryDate" ASC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    params.push(limit, offset);

    const visasResult = await pool.query(visasQuery, params);

    const visas: VisaDocumentWithRelations[] = visasResult.rows.map((row) => ({
      id: row.id,
      userId: row.userId,
      documentId: row.documentId,
      visaType: row.visaType,
      visaNumber: row.visaNumber,
      issuedDate: row.issuedDate,
      expiryDate: row.expiryDate,
      issuingCountry: row.issuingCountry,
      status: row.status,
      notificationsSent: row.notificationsSent || 0,
      lastNotificationDate: row.lastNotificationDate,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      document: row.filename ? {
        id: row.documentId,
        filename: row.filename,
        originalName: row.originalName,
        fileUrl: row.fileUrl,
        fileSize: row.fileSize,
        mimeType: row.mimeType,
      } : undefined,
      user: row.firstName ? {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        role: row.role,
      } : undefined,
    }));

    return { visas, total };
  } catch (error) {
    console.error('Error getting visa records:', error);
    throw new Error('Failed to retrieve visa records');
  }
};

/**
 * Get specific visa record by ID
 */
export const getVisaById = async (visaId: string, userId?: string): Promise<VisaDocumentWithRelations | null> => {
  try {
    let query = `
      SELECT
        vd.*,
        d."filename", d."originalName", d."fileUrl", d."fileSize", d."mimeType",
        u."firstName", u."lastName", u."email", u."role"
      FROM "visaDocuments" vd
      LEFT JOIN documents d ON vd."documentId" = d."id"
      LEFT JOIN users u ON vd."userId" = u."id"
      WHERE vd."id" = $1
    `;
    const params = [visaId];

    if (userId) {
      query += ` AND vd."userId" = $2`;
      params.push(userId);
    }

    const result = await pool.query(query, params);

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      id: row.id,
      userId: row.userId,
      documentId: row.documentId,
      visaType: row.visaType,
      visaNumber: row.visaNumber,
      issuedDate: row.issuedDate,
      expiryDate: row.expiryDate,
      issuingCountry: row.issuingCountry,
      status: row.status,
      notificationsSent: row.notificationsSent || 0,
      lastNotificationDate: row.lastNotificationDate,
      isActive: row.isActive,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
      document: row.filename ? {
        id: row.documentId,
        filename: row.filename,
        originalName: row.originalName,
        fileUrl: row.fileUrl,
        fileSize: row.fileSize,
        mimeType: row.mimeType,
      } : undefined,
      user: row.firstName ? {
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        role: row.role,
      } : undefined,
    };
  } catch (error) {
    console.error('Error getting visa by ID:', error);
    throw new Error('Failed to retrieve visa record');
  }
};

/**
 * Update visa record
 */
export const updateVisaRecord = async (
  visaId: string,
  userId: string,
  updateData: UpdateVisaData
): Promise<VisaDocument | null> => {
  try {
    const setClauses: string[] = [];
    const params: any[] = [];
    let paramIndex = 1;

    if (updateData.visaType !== undefined) {
      setClauses.push(`"visaType" = $${paramIndex}`);
      params.push(updateData.visaType);
      paramIndex++;
    }

    if (updateData.visaNumber !== undefined) {
      setClauses.push(`"visaNumber" = $${paramIndex}`);
      params.push(updateData.visaNumber);
      paramIndex++;
    }

    if (updateData.issuedDate !== undefined) {
      setClauses.push(`"issuedDate" = $${paramIndex}`);
      params.push(updateData.issuedDate);
      paramIndex++;
    }

    if (updateData.expiryDate !== undefined) {
      setClauses.push(`"expiryDate" = $${paramIndex}`);
      params.push(updateData.expiryDate);
      paramIndex++;
    }

    if (updateData.issuingCountry !== undefined) {
      setClauses.push(`"issuingCountry" = $${paramIndex}`);
      params.push(updateData.issuingCountry);
      paramIndex++;
    }

    if (updateData.status !== undefined) {
      setClauses.push(`"status" = $${paramIndex}`);
      params.push(updateData.status);
      paramIndex++;
    }

    if (updateData.isActive !== undefined) {
      setClauses.push(`"isActive" = $${paramIndex}`);
      params.push(updateData.isActive);
      paramIndex++;
    }

    if (setClauses.length === 0) {
      throw new Error('No update data provided');
    }

    setClauses.push(`"updatedAt" = NOW()`);

    const updateQuery = `
      UPDATE "visaDocuments"
      SET ${setClauses.join(', ')}
      WHERE "id" = $${paramIndex} AND "userId" = $${paramIndex + 1}
      RETURNING *
    `;
    params.push(visaId, userId);

    const result = await pool.query(updateQuery, params);

    if (result.rows.length === 0) {
      return null;
    }

    const visa = result.rows[0];
    return {
      id: visa.id,
      userId: visa.userId,
      documentId: visa.documentId,
      visaType: visa.visaType,
      visaNumber: visa.visaNumber,
      issuedDate: visa.issuedDate,
      expiryDate: visa.expiryDate,
      issuingCountry: visa.issuingCountry,
      status: visa.status,
      notificationsSent: visa.notificationsSent || 0,
      lastNotificationDate: visa.lastNotificationDate,
      isActive: visa.isActive,
      createdAt: visa.createdAt,
      updatedAt: visa.updatedAt,
    };
  } catch (error) {
    console.error('Error updating visa record:', error);
    throw new Error('Failed to update visa record');
  }
};

/**
 * Delete visa record
 */
export const deleteVisaRecord = async (visaId: string, userId: string): Promise<boolean> => {
  try {
    const deleteQuery = 'DELETE FROM "visaDocuments" WHERE "id" = $1 AND "userId" = $2';
    const result = await pool.query(deleteQuery, [visaId, userId]);
    return result.rowCount > 0;
  } catch (error) {
    console.error('Error deleting visa record:', error);
    throw new Error('Failed to delete visa record');
  }
};

/**
 * Get visa statistics
 */
export const getVisaStats = async (userId?: string): Promise<VisaStats> => {
  try {
    let whereClause = 'WHERE "isActive" = true';
    const params: any[] = [];

    if (userId) {
      whereClause += ' AND "userId" = $1';
      params.push(userId);
    }

    const query = `
      SELECT
        COUNT(*) AS "totalVisas",
        COUNT(CASE WHEN "status" = 'active' THEN 1 END) AS "activeVisas",
        COUNT(CASE WHEN "status" = 'expired' THEN 1 END) AS "expiredVisas",
        COUNT(CASE WHEN "status" IN ('expiring_soon', 'expiring_critical') THEN 1 END) AS "expiringWithin30Days",
        COUNT(CASE WHEN "status" = 'expiring_critical' THEN 1 END) AS "expiringWithin7Days",
        "visaType",
        "status",
        COUNT(*) AS "count"
      FROM "visaDocuments"
      ${whereClause}
      GROUP BY ROLLUP("visaType", "status")
    `;

    const result = await pool.query(query, params);

    const stats: VisaStats = {
      totalVisas: 0,
      activeVisas: 0,
      expiredVisas: 0,
      expiringWithin30Days: 0,
      expiringWithin7Days: 0,
      visasByType: {} as Record<VisaType, number>,
      visasByStatus: {} as Record<VisaStatus, number>,
    };

    result.rows.forEach((row) => {
      if (!row.visaType && !row.status) {
        // Total stats row
        stats.totalVisas = parseInt(row.totalVisas);
        stats.activeVisas = parseInt(row.activeVisas);
        stats.expiredVisas = parseInt(row.expiredVisas);
        stats.expiringWithin30Days = parseInt(row.expiringWithin30Days);
        stats.expiringWithin7Days = parseInt(row.expiringWithin7Days);
      } else if (row.visaType && !row.status) {
        // Type breakdown
        stats.visasByType[row.visaType as VisaType] = parseInt(row.count);
      } else if (!row.visaType && row.status) {
        // Status breakdown
        stats.visasByStatus[row.status as VisaStatus] = parseInt(row.count);
      }
    });

    return stats;
  } catch (error) {
    console.error('Error getting visa stats:', error);
    throw new Error('Failed to get visa statistics');
  }
};

/**
 * Update visa statuses based on expiry dates (cron job function)
 */
export const updateVisaStatuses = async (): Promise<{ updated: number; notifications: number }> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const now = new Date();
    const in7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const in30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

    // Update expired visas
    const expiredQuery = `
      UPDATE "visaDocuments"
      SET "status" = 'expired', "updatedAt" = NOW()
      WHERE "expiryDate" < $1 AND "status" != 'expired' AND "isActive" = true
    `;
    const expiredResult = await client.query(expiredQuery, [now.toISOString()]);

    // Update critically expiring visas (within 7 days)
    const criticalQuery = `
      UPDATE "visaDocuments"
      SET "status" = 'expiring_critical', "updatedAt" = NOW()
      WHERE "expiryDate" BETWEEN $1 AND $2 AND "status" NOT IN ('expired', 'expiring_critical') AND "isActive" = true
    `;
    const criticalResult = await client.query(criticalQuery, [now.toISOString(), in7Days.toISOString()]);

    // Update soon expiring visas (within 30 days)
    const soonQuery = `
      UPDATE "visaDocuments"
      SET "status" = 'expiring_soon', "updatedAt" = NOW()
      WHERE "expiryDate" BETWEEN $1 AND $2 AND "status" NOT IN ('expired', 'expiring_critical', 'expiring_soon') AND "isActive" = true
    `;
    const soonResult = await client.query(soonQuery, [in7Days.toISOString(), in30Days.toISOString()]);

    const totalUpdated = expiredResult.rowCount + criticalResult.rowCount + soonResult.rowCount;

    // TODO: Implement notification logic here
    const notifications = 0;

    await client.query('COMMIT');

    return { updated: totalUpdated, notifications };
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating visa statuses:', error);
    throw new Error('Failed to update visa statuses');
  } finally {
    client.release();
  }
};
