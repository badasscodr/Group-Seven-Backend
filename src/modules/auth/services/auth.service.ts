import bcrypt from 'bcryptjs';
import { AuthModel, User, CreateUserData, LoginCredentials, UpdateUserData } from '../models/auth.model';
import { JwtUtils } from '../../core/utils/jwt';
import { AppError } from '../../core/middleware/errorHandler';
import { query, transaction } from '../../core/config/database';

export interface LoginResult {
  user: Omit<User, 'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'>;
  accessToken: string;
  refreshToken: string;
}

export interface RegisterData extends CreateUserData {}

export class AuthService {
  static async login(credentials: LoginCredentials): Promise<LoginResult> {
    const user = await AuthModel.findByEmail(credentials.email);
    
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    const isValidPassword = await AuthModel.validatePassword(credentials.password, user.passwordHash);
    
    if (!isValidPassword) {
      throw new AppError('Invalid email or password', 401);
    }

    // Update last login
    await AuthModel.updateLastLogin(user.id);

    // Generate tokens
    const tokens = JwtUtils.generateTokens(
      user.id,
      user.email,
      user.role,
      user.firstName,
      user.lastName
    );

    // Remove sensitive data from user object
    const { passwordHash, passwordResetToken, passwordResetExpires, ...safeUser } = user;

    return {
      user: safeUser,
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }



  static async register(userData: RegisterData): Promise<LoginResult> {
    // Check if email already exists
    const existingUser = await AuthModel.findByEmail(userData.email);
    if (existingUser) {
      throw new AppError('Email already registered', 409);
    }

    // Create user and role-specific profile in a transaction
    const result = await transaction(async (client) => {
      // Create basic user record
      const userResult = await client.query(
        `INSERT INTO users (email, password_hash, role, first_name, last_name, phone) 
         VALUES ($1, $2, $3, $4, $5, $6) 
         RETURNING *`,
        [
          userData.email,
          userData.password, // This should be hashed in the model
          userData.role,
          userData.firstName,
          userData.lastName,
          userData.phone || null
        ]
      );

      const user = userResult.rows[0];

      // Create role-specific profile
      if (userData.role === 'client') {
        await client.query(
          `INSERT INTO client_profiles (user_id, company_name, business_type) 
           VALUES ($1, $2, $3)`,
          [user.id, userData.companyName || null, userData.businessType || null]
        );
      } else if (userData.role === 'supplier') {
        await client.query(
          `INSERT INTO supplier_profiles (user_id, company_name, business_type, service_categories) 
           VALUES ($1, $2, $3, $4)`,
          [user.id, userData.companyName || null, userData.businessType || null, userData.serviceCategories || null]
        );
      } else if (userData.role === 'candidate') {
        await client.query(
          `INSERT INTO candidate_profiles (user_id, skills, experience_years) 
           VALUES ($1, $2, $3)`,
          [
            user.id, 
            userData.skills ? [userData.skills] : null, 
            userData.experience ? this.getExperienceYears(userData.experience) : null
          ]
        );
      }

      return user;
    });

    // Generate tokens
    const tokens = JwtUtils.generateTokens(
      result.id,
      result.email,
      result.role,
      result.first_name,
      result.last_name
    );

    // Remove sensitive data from user object
    const { password_hash, password_reset_token, password_reset_expires, ...safeUser } = result;

    return {
      user: {
        id: safeUser.id,
        email: safeUser.email,
        firstName: safeUser.first_name,
        lastName: safeUser.last_name,
        phone: safeUser.phone,
        role: safeUser.role,
        avatarUrl: safeUser.avatar_url,
        isActive: safeUser.is_active,
        isEmailVerified: safeUser.is_email_verified,
        createdAt: safeUser.created_at,
        updatedAt: safeUser.updated_at
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  // Helper method to convert experience level to years
  private static getExperienceYears(experience: string): number {
    const experienceMap: Record<string, number> = {
      'entry': 1,
      'junior': 3, 
      'mid': 7,
      'senior': 12,
      'expert': 20
    };
    return experienceMap[experience] || 1;
  }

  static async refreshToken(refreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const { userId } = JwtUtils.verifyRefreshToken(refreshToken);
      
      const user = await AuthModel.findById(userId);
      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', 401);
      }

      // Generate new tokens
      const tokens = JwtUtils.generateTokens(
        user.id,
        user.email,
        user.role,
        user.firstName,
        user.lastName
      );

      return tokens;
    } catch (error) {
      throw new AppError('Invalid refresh token', 401);
    }
  }

  static async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await AuthModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isValidPassword = await AuthModel.validatePassword(currentPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new AppError('Current password is incorrect', 401);
    }

    await AuthModel.updatePassword(userId, newPassword);
  }

  static async forgotPassword(email: string): Promise<string> {
    const user = await AuthModel.findByEmail(email);
    if (!user) {
      // Don't reveal if email exists or not for security
      return '';
    }

    const resetToken = JwtUtils.generatePasswordResetToken(user.id);
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

    await AuthModel.setPasswordResetToken(user.id, resetToken, expires);

    return resetToken;
  }

  static async resetPassword(token: string, newPassword: string): Promise<void> {
    try {
      const { userId } = JwtUtils.verifyPasswordResetToken(token);
      
      const user = await AuthModel.findByPasswordResetToken(token);
      if (!user) {
        throw new AppError('Invalid or expired reset token', 400);
      }

      await transaction(async (client) => {
        // Update password
        const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
        const passwordHash = await bcrypt.hash(newPassword, saltRounds);
        
        await client.query(
          'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
          [passwordHash, userId]
        );

        // Clear reset token
        await client.query(
          'UPDATE users SET password_reset_token = NULL, password_reset_expires = NULL WHERE id = $1',
          [userId]
        );
      });
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid or expired reset token', 400);
    }
  }

  static async verifyEmail(token: string): Promise<void> {
    try {
      const { userId } = JwtUtils.verifyEmailVerificationToken(token);
      
      const user = await AuthModel.findById(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      if (user.isEmailVerified) {
        return; // Already verified
      }

      const verified = await AuthModel.verifyEmail(userId);
      if (!verified) {
        throw new AppError('Failed to verify email', 500);
      }
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }
      throw new AppError('Invalid or expired verification token', 400);
    }
  }

  static async getProfile(userId: string): Promise<Omit<User, 'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'>> {
    const user = await AuthModel.findById(userId);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { passwordHash, passwordResetToken, passwordResetExpires, ...safeUser } = user;
    return safeUser;
  }

  static async updateProfile(userId: string, userData: UpdateUserData): Promise<Omit<User, 'passwordHash' | 'passwordResetToken' | 'passwordResetExpires'>> {
    const user = await AuthModel.update(userId, userData);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const { passwordHash, passwordResetToken, passwordResetExpires, ...safeUser } = user;
    return safeUser;
  }

  static async logout(userId: string): Promise<void> {
    // In a stateless JWT implementation, we don't need to do anything server-side
    // The client should discard the tokens
    // If we want to implement token blacklisting, we could add that here
    console.log(`User ${userId} logged out`);
  }

  static async deactivateAccount(userId: string): Promise<void> {
    const deactivated = await AuthModel.deactivate(userId);
    if (!deactivated) {
      throw new AppError('User not found', 404);
    }
  }

  static async convertCandidateToEmployee(candidateId: string, employeeData: any): Promise<any> {
    return await transaction(async (client) => {
      // Check if candidate exists and is actually a candidate
      const candidateResult = await client.query(
        'SELECT id, email, first_name, last_name, phone, role FROM users WHERE id = $1 AND role = $2',
        [candidateId, 'candidate']
      );

      if (candidateResult.rows.length === 0) {
        throw new AppError('Candidate not found or user is not a candidate', 404);
      }

      const candidate = candidateResult.rows[0];

      // Update user role to employee
      await client.query(
        'UPDATE users SET role = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        ['employee', candidateId]
      );

      // Create employee profile
      const employeeProfileResult = await client.query(
        `INSERT INTO employee_profiles (
          user_id, employee_id, department, position, hire_date, salary, 
          created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        RETURNING *`,
        [
          candidateId,
          employeeData.employeeId,
          employeeData.department,
          employeeData.position,
          employeeData.hireDate,
          employeeData.salary
        ]
      );

      // Get updated user data
      const updatedUserResult = await client.query(
        'SELECT id, email, first_name, last_name, phone, role, is_active, is_email_verified, created_at, updated_at, last_login FROM users WHERE id = $1',
        [candidateId]
      );

      const updatedUser = updatedUserResult.rows[0];
      const employeeProfile = employeeProfileResult.rows[0];

      return {
        user: updatedUser,
        employeeProfile: employeeProfile,
        message: `Candidate ${candidate.first_name} ${candidate.last_name} has been successfully converted to employee`
      };
    });
  }
}