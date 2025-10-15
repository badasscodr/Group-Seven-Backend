import { query } from '../../core/config/database';
import bcrypt from 'bcryptjs';
import { UserRole } from '../../core/types';

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
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export interface CreateUserData {
  email: string;
  password: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phone?: string;
  companyName?: string;
  businessType?: string;
  serviceCategories?: string;
  skills?: string;
  experience?: string;
}

export interface UpdateUserData {
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatarUrl?: string;
  // Employee-specific fields
  employeeId?: string;
  department?: string;
  position?: string;
  hireDate?: string;
  salary?: number;
  // Client-specific fields
  companyName?: string;
  industry?: string;
  address?: string;
  companySize?: string;
  website?: string;
  // Supplier-specific fields
  businessType?: string;
  licenseNumber?: string;
  serviceCategories?: string | string[];
  // Candidate-specific fields
  skills?: string | string[];
  experienceYears?: number;
  resumeUrl?: string;
  portfolioUrl?: string;
  education?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export class AuthModel {
  static async findByEmail(email: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE email = $1 AND is_active = true',
      [email]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  static async findById(id: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE id = $1 AND is_active = true',
      [id]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  static async create(userData: CreateUserData): Promise<User> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(userData.password, saltRounds);
    
    const result = await query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        userData.email,
        passwordHash,
        userData.role,
        userData.firstName,
        userData.lastName,
        userData.phone || null
      ]
    );
    
    return this.mapRowToUser(result.rows[0]);
  }

  static async update(id: string, userData: UpdateUserData): Promise<User | null> {
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

  static async updatePassword(id: string, newPassword: string): Promise<boolean> {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(newPassword, saltRounds);
    
    const result = await query(
      'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [passwordHash, id]
    );
    
    return result.rowCount > 0;
  }

  static async updateLastLogin(id: string): Promise<void> {
    await query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
  }

  static async setPasswordResetToken(id: string, token: string, expires: Date): Promise<boolean> {
    const result = await query(
      'UPDATE users SET password_reset_token = $1, password_reset_expires = $2 WHERE id = $3',
      [token, expires, id]
    );
    
    return result.rowCount > 0;
  }

  static async findByPasswordResetToken(token: string): Promise<User | null> {
    const result = await query(
      'SELECT * FROM users WHERE password_reset_token = $1 AND password_reset_expires > CURRENT_TIMESTAMP AND is_active = true',
      [token]
    );
    
    if (result.rows.length === 0) {
      return null;
    }
    
    return this.mapRowToUser(result.rows[0]);
  }

  static async clearPasswordResetToken(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = $1',
      [id]
    );
    
    return result.rowCount > 0;
  }

  static async verifyEmail(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE users SET is_email_verified = true WHERE id = $1',
      [id]
    );
    
    return result.rowCount > 0;
  }

  static async deactivate(id: string): Promise<boolean> {
    const result = await query(
      'UPDATE users SET is_active = false WHERE id = $1',
      [id]
    );
    
    return result.rowCount > 0;
  }

  static async validatePassword(plainPassword: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, hashedPassword);
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
      passwordResetToken: row.password_reset_token,
      passwordResetExpires: row.password_reset_expires,
    };
  }
}
