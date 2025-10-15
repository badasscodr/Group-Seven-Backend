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
      // Use AuthModel.create which hashes the password properly
      const user = await AuthModel.create(userData);

      // Create role-specific profile (only if relevant data provided)
      if (userData.role === 'client') {
        
        // Only create client profile if company data is provided
        if (userData.companyName || userData.businessType) {
          await client.query(
            `INSERT INTO client_profiles (user_id, company_name, industry) 
             VALUES ($1, $2, $3)`,
            [user.id, userData.companyName || null, userData.businessType || null]
          );
          console.log('✅ Client profile created');
        } else {
          console.log('ℹ️ No company data provided, skipping client profile creation');
        }
      } else if (userData.role === 'supplier') {
        console.log('🏭 Creating supplier profile');
        // Suppliers should have at least company name
        await client.query(
          `INSERT INTO supplier_profiles (user_id, company_name, business_type, service_categories) 
           VALUES ($1, $2, $3, $4)`,
          [user.id, userData.companyName || 'Default Company', userData.businessType || null, userData.serviceCategories || null]
        );
        console.log('✅ Supplier profile created');
      } else if (userData.role === 'candidate') {
        console.log('👤 Creating candidate profile');
        // Only create candidate profile if skills or experience is provided
        if (userData.skills || userData.experience) {
          await client.query(
            `INSERT INTO candidate_profiles (user_id, skills, experience_years) 
             VALUES ($1, $2, $3)`,
            [
              user.id, 
              userData.skills ? [userData.skills] : null, 
              userData.experience ? this.getExperienceYears(userData.experience) : null
            ]
          );
          console.log('✅ Candidate profile created');
        } else {
          console.log('ℹ️ No skills/experience provided, skipping candidate profile creation');
        }
      }

      return user;
    });

    // Generate tokens
    const tokens = JwtUtils.generateTokens(
      result.id,
      result.email,
      result.role,
      result.firstName,
      result.lastName
    );

    // Remove sensitive data from user object - database returns snake_case, we need camelCase
    const { passwordHash, passwordResetToken, passwordResetExpires, ...safeUser } = result;

    return {
      user: {
        id: safeUser.id,
        email: safeUser.email,
        firstName: safeUser.firstName,
        lastName: safeUser.lastName,
        phone: safeUser.phone,
        role: safeUser.role,
        avatarUrl: safeUser.avatarUrl,
        isActive: safeUser.isActive,
        isEmailVerified: safeUser.isEmailVerified,
        createdAt: safeUser.createdAt,
        updatedAt: safeUser.updatedAt
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

  static async getProfile(userId: string): Promise<any> {
    return await transaction(async (client) => {
      // Get basic user info
      const userResult = await client.query(
        'SELECT * FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const user = userResult.rows[0];
      const userRole = user.role;

      // Get role-specific profile data
      let profileData: any = {};

      if (userRole === 'employee') {
        const profileResult = await client.query(
          'SELECT * FROM employee_profiles WHERE user_id = $1',
          [userId]
        );
        if (profileResult.rows.length > 0) {
          const profile = profileResult.rows[0];
          profileData = {
            employeeId: profile.employee_id,
            department: profile.department,
            position: profile.position,
            hireDate: profile.hire_date,
            salary: profile.salary,
            visaStatus: profile.visa_status,
            visaExpiry: profile.visa_expiry,
            passportNumber: profile.passport_number,
            emergencyContactName: profile.emergency_contact_name,
            emergencyContactPhone: profile.emergency_contact_phone,
            managerId: profile.manager_id,
          };
        }
      } else if (userRole === 'client') {
        const profileResult = await client.query(
          'SELECT * FROM client_profiles WHERE user_id = $1',
          [userId]
        );
        if (profileResult.rows.length > 0) {
          const profile = profileResult.rows[0];
          profileData = {
            companyName: profile.company_name,
            industry: profile.industry,
            address: profile.address,
            city: profile.city,
            country: profile.country,
            website: profile.website,
            businessLicense: profile.business_license,
            contactPerson: profile.contact_person,
          };
        }
      } else if (userRole === 'supplier') {
        const profileResult = await client.query(
          'SELECT * FROM supplier_profiles WHERE user_id = $1',
          [userId]
        );
        if (profileResult.rows.length > 0) {
          const profile = profileResult.rows[0];
          profileData = {
            companyName: profile.company_name,
            businessType: profile.business_type,
            licenseNumber: profile.license_number,
            tradeLicenseExpiry: profile.trade_license_expiry,
            insuranceDetails: profile.insurance_details,
            serviceCategories: profile.service_categories,
            rating: profile.rating,
            totalReviews: profile.total_reviews,
            isVerified: profile.is_verified,
          };
        }
      } else if (userRole === 'candidate') {
        const profileResult = await client.query(
          'SELECT * FROM candidate_profiles WHERE user_id = $1',
          [userId]
        );
        if (profileResult.rows.length > 0) {
          const profile = profileResult.rows[0];
          profileData = {
            resumeUrl: profile.resume_url,
            portfolioUrl: profile.portfolio_url,
            linkedinUrl: profile.linkedin_url,
            experienceYears: profile.experience_years,
            desiredSalaryMin: profile.desired_salary_min,
            desiredSalaryMax: profile.desired_salary_max,
            locationPreference: profile.location_preference,
            jobTypePreference: profile.job_type_preference,
            skills: profile.skills,
            languages: profile.languages,
            availabilityDate: profile.availability_date,
            gender: profile.gender,
            dateOfBirth: profile.date_of_birth,
          };
        }
      }

      // Combine user data with role-specific data
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        avatarUrl: user.avatar_url,
        isActive: user.is_active,
        isEmailVerified: user.is_email_verified,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
        lastLogin: user.last_login,
        ...profileData
      };
    });
  }

  static async updateProfile(userId: string, userData: UpdateUserData): Promise<any> {
    return await transaction(async (client) => {
      // Get current user to determine role
      const userResult = await client.query(
        'SELECT role FROM users WHERE id = $1 AND is_active = true',
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const userRole = userResult.rows[0].role;

      // Update basic user information
      const basicFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (userData.firstName !== undefined) {
        basicFields.push(`first_name = $${paramIndex++}`);
        values.push(userData.firstName);
      }
      if (userData.lastName !== undefined) {
        basicFields.push(`last_name = $${paramIndex++}`);
        values.push(userData.lastName);
      }
      if (userData.phone !== undefined) {
        basicFields.push(`phone = $${paramIndex++}`);
        values.push(userData.phone);
      }
      if (userData.avatarUrl !== undefined) {
        basicFields.push(`avatar_url = $${paramIndex++}`);
        values.push(userData.avatarUrl);
      }

      if (basicFields.length > 0) {
        basicFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);

        await client.query(
          `UPDATE users SET ${basicFields.join(', ')} WHERE id = $${paramIndex}`,
          values
        );
      }

      // Update role-specific profile based on user role
      if (userRole === 'employee') {
        await this.updateEmployeeProfile(client, userId, userData);
      } else if (userRole === 'client') {
        await this.updateClientProfile(client, userId, userData);
      } else if (userRole === 'supplier') {
        await this.updateSupplierProfile(client, userId, userData);
      } else if (userRole === 'candidate') {
        await this.updateCandidateProfile(client, userId, userData);
      }

      // Get complete updated profile data (including role-specific data)
      return await this.getProfile(userId);
    });
  }

  private static async updateEmployeeProfile(client: any, userId: string, userData: any): Promise<void> {
    // Check if employee profile exists
    const profileResult = await client.query(
      'SELECT id FROM employee_profiles WHERE user_id = $1',
      [userId]
    );

    const employeeFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.employeeId !== undefined) {
      employeeFields.push(`employee_id = $${paramIndex++}`);
      values.push(userData.employeeId);
    }
    if (userData.department !== undefined) {
      employeeFields.push(`department = $${paramIndex++}`);
      values.push(userData.department);
    }
    if (userData.position !== undefined) {
      employeeFields.push(`position = $${paramIndex++}`);
      values.push(userData.position);
    }
    if (userData.hireDate !== undefined) {
      employeeFields.push(`hire_date = $${paramIndex++}`);
      values.push(userData.hireDate);
    }
    if (userData.salary !== undefined) {
      employeeFields.push(`salary = $${paramIndex++}`);
      values.push(userData.salary);
    }

    if (employeeFields.length > 0) {
      employeeFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      if (profileResult.rows.length > 0) {
        // Update existing profile
        await client.query(
          `UPDATE employee_profiles SET ${employeeFields.join(', ')} WHERE user_id = $${paramIndex}`,
          values
        );
      } else {
        // Create new profile if it doesn't exist
        // Remove the last field (updated_at) from the fields list
        const insertFields = employeeFields.slice(0, -1); 
        const insertValues = values.slice(0, -1); // Remove user_id
        
        if (insertFields.length > 0) {
          await client.query(
            `INSERT INTO employee_profiles (user_id, ${insertFields.join(', ')}, created_at, updated_at) 
             VALUES ($1, ${insertFields.map((_, i) => `$${i + 2}`).join(', ')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [userId, ...insertValues]
          );
        } else {
          // If no fields to insert, just create a basic profile
          await client.query(
            `INSERT INTO employee_profiles (user_id, created_at, updated_at) 
             VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [userId]
          );
        }
      }
    }
  }

  private static async updateClientProfile(client: any, userId: string, userData: any): Promise<void> {
    const profileResult = await client.query(
      'SELECT id FROM client_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length > 0) {
      // Update existing profile
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (userData.companyName !== undefined) {
        updateFields.push(`company_name = $${paramIndex++}`);
        values.push(userData.companyName);
      }
      if (userData.industry !== undefined) {
        updateFields.push(`industry = $${paramIndex++}`);
        values.push(userData.industry);
      }
      if (userData.address !== undefined) {
        updateFields.push(`address = $${paramIndex++}`);
        values.push(userData.address);
      }
      if (userData.companySize !== undefined) {
        updateFields.push(`company_size = $${paramIndex++}`);
        values.push(userData.companySize);
      }
      if (userData.website !== undefined) {
        updateFields.push(`website = $${paramIndex++}`);
        values.push(userData.website);
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);

        const updateQuery = `UPDATE client_profiles SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex}`;
        await client.query(updateQuery, values);
      }
    } else {
      // Create new profile - simpler approach
      const insertFields: string[] = ['user_id'];
      const insertValues: any[] = [userId];
      const placeholders: string[] = ['$1'];

      if (userData.companyName !== undefined) {
        insertFields.push('company_name');
        insertValues.push(userData.companyName);
        placeholders.push(`$${insertValues.length}`);
      }
      if (userData.industry !== undefined) {
        insertFields.push('industry');
        insertValues.push(userData.industry);
        placeholders.push(`$${insertValues.length}`);
      }
      if (userData.address !== undefined) {
        insertFields.push('address');
        insertValues.push(userData.address);
        placeholders.push(`$${insertValues.length}`);
      }
      if (userData.companySize !== undefined) {
        insertFields.push('company_size');
        insertValues.push(userData.companySize);
        placeholders.push(`$${insertValues.length}`);
      }
      if (userData.website !== undefined) {
        insertFields.push('website');
        insertValues.push(userData.website);
        placeholders.push(`$${insertValues.length}`);
      }

      insertFields.push('created_at', 'updated_at');
      placeholders.push('CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP');

      const insertQuery = `INSERT INTO client_profiles (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await client.query(insertQuery, insertValues);
    }
  }

  private static async updateSupplierProfile(client: any, userId: string, userData: any): Promise<void> {
    const profileResult = await client.query(
      'SELECT id FROM supplier_profiles WHERE user_id = $1',
      [userId]
    );

    const supplierFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (userData.companyName !== undefined) {
      supplierFields.push(`company_name = $${paramIndex++}`);
      values.push(userData.companyName);
    }
    if (userData.businessType !== undefined) {
      supplierFields.push(`business_type = $${paramIndex++}`);
      values.push(userData.businessType);
    }
    if (userData.licenseNumber !== undefined) {
      supplierFields.push(`license_number = $${paramIndex++}`);
      values.push(userData.licenseNumber);
    }
    if (userData.serviceCategories !== undefined) {
      supplierFields.push(`service_categories = $${paramIndex++}`);
      // Handle both single string and array inputs
      const categories = Array.isArray(userData.serviceCategories) 
        ? userData.serviceCategories 
        : typeof userData.serviceCategories === 'string' 
          ? [userData.serviceCategories]
          : userData.serviceCategories;
      values.push(categories);
    }

    if (supplierFields.length > 0) {
      supplierFields.push(`updated_at = CURRENT_TIMESTAMP`);
      values.push(userId);

      if (profileResult.rows.length > 0) {
        await client.query(
          `UPDATE supplier_profiles SET ${supplierFields.join(', ')} WHERE user_id = $${paramIndex}`,
          values
        );
      } else {
        // Remove the last field (updated_at) from the fields list
        const insertFields = supplierFields.slice(0, -1); 
        const insertValues = values.slice(0, -1); // Remove user_id
        
        if (insertFields.length > 0) {
          await client.query(
            `INSERT INTO supplier_profiles (user_id, ${insertFields.join(', ')}, created_at, updated_at) 
             VALUES ($1, ${insertFields.map((_, i) => `$${i + 2}`).join(', ')}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [userId, ...insertValues]
          );
        } else {
          // If no fields to insert, just create a basic profile
          await client.query(
            `INSERT INTO supplier_profiles (user_id, created_at, updated_at) 
             VALUES ($1, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
            [userId]
          );
        }
      }
    }
  }

  private static async updateCandidateProfile(client: any, userId: string, userData: any): Promise<void> {
    const profileResult = await client.query(
      'SELECT id FROM candidate_profiles WHERE user_id = $1',
      [userId]
    );

    if (profileResult.rows.length > 0) {
      // Update existing profile
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (userData.skills !== undefined) {
        updateFields.push(`skills = $${paramIndex++}`);
        values.push(Array.isArray(userData.skills) ? userData.skills : [userData.skills]);
      }
      if (userData.experienceYears !== undefined) {
        updateFields.push(`experience_years = $${paramIndex++}`);
        values.push(userData.experienceYears);
      }
      if (userData.resumeUrl !== undefined) {
        updateFields.push(`resume_url = $${paramIndex++}`);
        values.push(userData.resumeUrl);
      }
      if (userData.portfolioUrl !== undefined) {
        updateFields.push(`portfolio_url = $${paramIndex++}`);
        values.push(userData.portfolioUrl);
      }
      if (userData.education !== undefined) {
        updateFields.push(`education = $${paramIndex++}`);
        values.push(userData.education);
      }

      if (updateFields.length > 0) {
        updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
        values.push(userId);

        const updateQuery = `UPDATE candidate_profiles SET ${updateFields.join(', ')} WHERE user_id = $${paramIndex}`;
        await client.query(updateQuery, values);
      }
    } else {
      // Create new profile - simpler approach
      const insertFields: string[] = ['user_id'];
      const insertValues: any[] = [userId];
      const placeholders: string[] = ['$1'];

      if (userData.skills !== undefined) {
        insertFields.push('skills');
        insertValues.push(Array.isArray(userData.skills) ? userData.skills : [userData.skills]);
        placeholders.push(`$${insertValues.length}`);
      }
      if (userData.experienceYears !== undefined) {
        insertFields.push('experience_years');
        insertValues.push(userData.experienceYears);
        placeholders.push(`$${insertValues.length}`);
      }
      if (userData.resumeUrl !== undefined) {
        insertFields.push('resume_url');
        insertValues.push(userData.resumeUrl);
        placeholders.push(`$${insertValues.length}`);
      }
      if (userData.portfolioUrl !== undefined) {
        insertFields.push('portfolio_url');
        insertValues.push(userData.portfolioUrl);
        placeholders.push(`$${insertValues.length}`);
      }
      if (userData.education !== undefined) {
        insertFields.push('education');
        insertValues.push(userData.education);
        placeholders.push(`$${insertValues.length}`);
      }

      insertFields.push('created_at', 'updated_at');
      placeholders.push('CURRENT_TIMESTAMP', 'CURRENT_TIMESTAMP');

      const insertQuery = `INSERT INTO candidate_profiles (${insertFields.join(', ')}) VALUES (${placeholders.join(', ')})`;
      await client.query(insertQuery, insertValues);
    }
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
