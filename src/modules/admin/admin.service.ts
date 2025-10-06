import pool from '../../core/config/database';
import { AdminUserResponse, AdminUsersListResponse, AdminStatsResponse } from './admin.types';

export const getAllUsers = async (
  page: number = 1,
  limit: number = 10,
  role?: string
): Promise<AdminUsersListResponse> => {
  const offset = (page - 1) * limit;

  let query = `
    SELECT
      u."id", u."email", u."role", u."firstName", u."lastName", u."phone",
      u."isActive", u."emailVerified", u."createdAt", u."lastLogin",
      CASE
        WHEN u."role" = 'client' THEN cp."companyName"
        WHEN u."role" = 'supplier' THEN sp."companyName"
        ELSE NULL
      END as "companyName"
    FROM users u
    LEFT JOIN "clientProfiles" cp ON u."id" = cp."userId" AND u."role" = 'client'
    LEFT JOIN "supplierProfiles" sp ON u."id" = sp."userId" AND u."role" = 'supplier'
  `;

  const params: any[] = [];
  let paramCount = 0;

  if (role) {
    query += ` WHERE u."role" = $${++paramCount}`;
    params.push(role);
  }

  query += ` ORDER BY u."createdAt" DESC LIMIT $${++paramCount} OFFSET $${++paramCount}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);

  // Get total count for pagination
  let countQuery = 'SELECT COUNT(*) FROM users';
  const countParams: any[] = [];
  if (role) {
    countQuery += ' WHERE "role" = $1';
    countParams.push(role);
  }

  const countResult = await pool.query(countQuery, countParams);
  const total = parseInt(countResult.rows[0].count);

  return {
    users: result.rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
};

export const getUserByIdAdmin = async (userId: string): Promise<AdminUserResponse> => {
  const userQuery = `
    SELECT
      u."id", u."email", u."role", u."firstName", u."lastName", u."phone",
      u."avatarUrl", u."isActive", u."emailVerified", u."createdAt",
      u."updatedAt", u."lastLogin"
    FROM users u
    WHERE u."id" = $1
  `;

  const userResult = await pool.query(userQuery, [userId]);

  if (userResult.rows.length === 0) {
    throw new Error('User not found');
  }

  const user = userResult.rows[0];

  // Get role-specific profile data
  let profileData = null;

  switch (user.role) {
    case 'client':
      const clientResult = await pool.query(
        'SELECT * FROM "clientProfiles" WHERE "userId" = $1',
        [userId]
      );
      profileData = clientResult.rows[0] || null;
      break;

    case 'supplier':
      const supplierResult = await pool.query(
        'SELECT * FROM "supplierProfiles" WHERE "userId" = $1',
        [userId]
      );
      profileData = supplierResult.rows[0] || null;
      break;

    case 'employee':
      const employeeResult = await pool.query(
        'SELECT * FROM "employeeProfiles" WHERE "userId" = $1',
        [userId]
      );
      profileData = employeeResult.rows[0] || null;
      break;

    case 'candidate':
      const candidateResult = await pool.query(
        'SELECT * FROM "candidateProfiles" WHERE "userId" = $1',
        [userId]
      );
      profileData = candidateResult.rows[0] || null;
      break;
  }

  return {
    ...user,
    profile: profileData,
  };
};

export const updateUserStatus = async (
  userId: string,
  isActive: boolean
): Promise<AdminUserResponse> => {
  const result = await pool.query(
    `UPDATE users
     SET "isActive" = $1, "updatedAt" = CURRENT_TIMESTAMP
     WHERE "id" = $2
     RETURNING "id", "email", "role", "firstName", "lastName", "isActive"`,
    [isActive, userId]
  );

  if (result.rows.length === 0) {
    throw new Error('User not found');
  }

  return result.rows[0];
};

export const getAdminStats = async (): Promise<AdminStatsResponse> => {
  // Get user counts by role
  const roleStatsQuery = `
    SELECT "role", COUNT(*) as count
    FROM users
    WHERE "isActive" = true
    GROUP BY "role"
  `;

  const roleStatsResult = await pool.query(roleStatsQuery);

  // Get recent registrations (last 30 days)
  const recentRegistrationsQuery = `
    SELECT COUNT(*) as count
    FROM users
    WHERE "createdAt" >= CURRENT_DATE - INTERVAL '30 days'
  `;

  const recentRegistrationsResult = await pool.query(recentRegistrationsQuery);

  // Get active sessions (users who logged in within last 24 hours)
  const activeSessionsQuery = `
    SELECT COUNT(*) as count
    FROM users
    WHERE "lastLogin" >= CURRENT_TIMESTAMP - INTERVAL '24 hours'
  `;

  const activeSessionsResult = await pool.query(activeSessionsQuery);

  const roleStats: Record<string, number> = {};
  roleStatsResult.rows.forEach(row => {
    roleStats[row.role] = parseInt(row.count);
  });

  const totalUsers = Object.values(roleStats).reduce((sum, count) => sum + count, 0);

  return {
    totalUsers,
    usersByRole: roleStats,
    recentRegistrations: parseInt(recentRegistrationsResult.rows[0].count),
    activeSessions: parseInt(activeSessionsResult.rows[0].count),
  };
};

export const deleteUser = async (userId: string): Promise<void> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Soft delete - just mark as inactive
    const result = await client.query(
      'UPDATE users SET "isActive" = false, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $1',
      [userId]
    );

    if ((result.rowCount ?? 0) === 0) {
      throw new Error('User not found');
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const getRecentServiceRequests = async (limit: number = 10) => {
  const query = `
    SELECT
      sr.id,
      sr.title,
      sr.description,
      sr.category,
      sr.priority,
      sr.status,
      sr.createdAt,
      u."firstName" || ' ' || u."lastName" as client_name,
      u.email as client_email,
      COUNT(q.id) as quotation_count
    FROM service_requests sr
    JOIN users u ON sr."clientId" = u.id
    LEFT JOIN quotations q ON sr.id = q."serviceRequestId"
    GROUP BY sr.id, sr.title, sr.description, sr.category, sr.priority, sr.status, sr.createdAt, u.firstName, u.lastName, u.email
    ORDER BY sr."createdAt" DESC
    LIMIT $1
  `;

  const result = await pool.query(query, [limit]);
  return result.rows;
};

export const convertCandidateToEmployee = async (
  userId: string,
  employeeData: {
    employeeId: string;
    department: string;
    position: string;
    hireDate: string;
    salary?: number;
    managerId?: string;
  }
): Promise<AdminUserResponse> => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // First, verify the user exists and is a candidate
    const userResult = await client.query(
      'SELECT "id", "role", "firstName", "lastName", "email" FROM users WHERE "id" = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      throw new Error('User not found');
    }

    const user = userResult.rows[0];
    if (user.role !== 'candidate') {
      throw new Error('User is not a candidate');
    }

    // Update user role to employee
    await client.query(
      'UPDATE users SET "role" = $1, "updatedAt" = CURRENT_TIMESTAMP WHERE "id" = $2',
      ['employee', userId]
    );

    // Create employee profile
    const employeeProfileResult = await client.query(
      `INSERT INTO "employeeProfiles" (
        "userId", "employeeId", "department", "position", "hireDate", "salary", "managerId"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [
        userId,
        employeeData.employeeId,
        employeeData.department,
        employeeData.position,
        employeeData.hireDate,
        employeeData.salary || null,
        employeeData.managerId || null
      ]
    );

    // Optionally keep candidate profile for reference (don't delete)
    // This preserves the candidate's CV, skills, etc. for historical records

    await client.query('COMMIT');

    return {
      ...user,
      role: 'employee',
      profile: employeeProfileResult.rows[0]
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};
