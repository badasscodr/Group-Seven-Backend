import { query } from '../../core/config/database';
import { UserRole, PaginationQuery } from '../../core/types';

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
}

export interface UserFilters {
  role?: UserRole;
  isActive?: boolean;
  isEmailVerified?: boolean;
  search?: string;
}

export class UserModel {
  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = this.mapRowToUser(result.rows[0]);
    
    // Only return active users
    if (!user.isActive) {
      return null;
    }
    
    return user;
  }

  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    const user = this.mapRowToUser(result.rows[0]);
    
    // Only return active users
    if (!user.isActive) {
      return null;
    }
    
    return user;
  }

  static async create(userData: {
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    role: UserRole;
    phone?: string;
    avatarUrl?: string;
    isActive: boolean;
    isEmailVerified: boolean;
  }): Promise<User> {
    const result = await query(
      `INSERT INTO users (
        email, password_hash, role, first_name, last_name, phone, avatar_url, 
        is_active, is_email_verified, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      RETURNING *`,
      [
        userData.email,
        userData.passwordHash,
        userData.role,
        userData.firstName,
        userData.lastName,
        userData.phone || null,
        userData.avatarUrl || null,
        userData.isActive,
        userData.isEmailVerified
      ]
    );

    return this.mapRowToUser(result.rows[0]);
  }

  static async findAll(filters: UserFilters = {}, pagination: PaginationQuery = {}): Promise<{ users: User[]; total: number }> {
    let whereClause = 'WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (filters.role) {
      whereClause += ` AND role = $${paramIndex++}`;
      params.push(filters.role);
    }

    if (filters.isActive !== undefined) {
      whereClause += ` AND is_active = $${paramIndex++}`;
      params.push(filters.isActive);
    }

    if (filters.isEmailVerified !== undefined) {
      whereClause += ` AND is_email_verified = $${paramIndex++}`;
      params.push(filters.isEmailVerified);
    }

    if (filters.search) {
      whereClause += ` AND (first_name ILIKE $${paramIndex++} OR last_name ILIKE $${paramIndex++} OR email ILIKE $${paramIndex++})`;
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Count query
    const countResult = await query(
      `SELECT COUNT(*) FROM users ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    // Pagination
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const offset = (page - 1) * limit;

    // Sorting
    const sortBy = pagination.sortBy || 'created_at';
    const sortOrder = pagination.sortOrder || 'desc';
    const orderClause = `ORDER BY ${sortBy} ${sortOrder.toUpperCase()}`;

    const result = await query(
      `SELECT * FROM users ${whereClause} ${orderClause} LIMIT $${paramIndex++} OFFSET $${paramIndex++}`,
      [...params, limit, offset]
    );

    const users = result.rows.map(row => this.mapRowToUser(row));

    return { users, total };
  }

  static async update(id: string, userData: Partial<User>): Promise<User | null> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.firstName !== undefined) {
      fields.push(`first_name = $${paramIndex++}`);
      values.push(userData.firstName);
    }
    if (userData.lastName !== undefined) {
      fields.push(`last_name = $${paramIndex++}`);
      values.push(userData.lastName);
    }
    if (userData.phone !== undefined) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(userData.phone);
    }
    if (userData.avatarUrl !== undefined) {
      fields.push(`avatar_url = $${paramIndex++}`);
      values.push(userData.avatarUrl);
    }
    if (userData.isActive !== undefined) {
      fields.push(`is_active = $${paramIndex++}`);
      values.push(userData.isActive);
    }

    if (fields.length === 0) {
      return this.findById(id);
    }

    fields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const result = await query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return null;
    }

    return this.mapRowToUser(result.rows[0]);
  }

  static async delete(id: string): Promise<boolean> {
    const result = await query('DELETE FROM users WHERE id = $1', [id]);
    return result.rowCount > 0;
  }

  static async updateLastLogin(id: string): Promise<void> {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async updateEmailVerification(id: string, isVerified: boolean): Promise<boolean> {
    const result = await query(
      'UPDATE users SET is_email_verified = $1 WHERE id = $2',
      [isVerified, id]
    );
    return result.rowCount > 0;
  }

  static async emailExists(email: string): Promise<boolean> {
    const result = await query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    );
    
    return result.rows.length > 0;
  }

  private static mapRowToUser(row: any): User {
    return {
      id: row.id,
      email: row.email,
      passwordHash: row.password_hash,
      role: row.role,
      firstName: row.first_name,
      lastName: row.last_name,
      phone: row.phone,
      avatarUrl: row.avatar_url,
      isActive: row.is_active,
      isEmailVerified: row.is_email_verified,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
      lastLogin: row.last_login,
    };
  }
}