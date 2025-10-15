import { UserModel, User, UserFilters } from '../models/user.model';
import { AppError } from '../../core/middleware/errorHandler';
import { PaginationQuery } from '../../core/types';
import { UserRole } from '../../core/types';
import { query } from '../../core/config/database';
import { UpdateUserData } from '../types/user.types';

export class UserService {
  static async getUserById(id: string): Promise<Omit<User, 'passwordHash'>> {
    // Get complete user profile with role-specific data
    const result = await query(`
      SELECT 
        u.id, u.email, u.role, u.first_name, u.last_name, u.phone, u.avatar_url,
        u.is_active, u.is_email_verified, u.created_at, u.updated_at, u.last_login,
        -- Client profile data
        cp.company_name, cp.industry, cp.company_size, cp.address, cp.city, cp.country,
        cp.website, cp.business_license, cp.contact_person,
        -- Supplier profile data
        sp.company_name as supplier_company_name, sp.business_type as supplier_business_type,
        sp.license_number, sp.trade_license_expiry, sp.insurance_details, sp.service_categories,
        sp.rating, sp.total_reviews, sp.is_verified as supplier_verified,
        -- Employee profile data
        ep.employee_id, ep.department, ep.position, ep.hire_date, ep.salary,
        ep.visa_status, ep.visa_expiry, ep.passport_number,
        ep.emergency_contact_name, ep.emergency_contact_phone,
        -- Candidate profile data
        cand.resume_url, cand.portfolio_url, cand.linkedin_url, cand.experience_years,
        cand.desired_salary_min, cand.desired_salary_max, cand.location_preference,
        cand.job_type_preference, cand.skills, cand.languages, cand.availability_date,
        cand.gender, cand.date_of_birth
      FROM users u
      LEFT JOIN client_profiles cp ON u.id = cp.user_id
      LEFT JOIN supplier_profiles sp ON u.id = sp.user_id
      LEFT JOIN employee_profiles ep ON u.id = ep.user_id
      LEFT JOIN candidate_profiles cand ON u.id = cand.user_id
      WHERE u.id = $1
    `, [id]);
    
    if (result.rows.length === 0) {
      throw new AppError('User not found', 404);
    }
    
    // Map the row to user object
    const userData = {
      id: result.rows[0].id,
      email: result.rows[0].email,
      role: result.rows[0].role,
      firstName: result.rows[0].first_name,
      lastName: result.rows[0].last_name,
      phone: result.rows[0].phone,
      avatarUrl: result.rows[0].avatar_url,
      isActive: result.rows[0].is_active,
      isEmailVerified: result.rows[0].is_email_verified,
      createdAt: result.rows[0].created_at,
      updatedAt: result.rows[0].updated_at,
      lastLogin: result.rows[0].last_login
    };
    
    // Add role-specific profile data
    let profileData = {};
    
    if (userData.role === 'client') {
      profileData = {
        company_name: result.rows[0].company_name,
        industry: result.rows[0].industry,
        company_size: result.rows[0].company_size,
        address: result.rows[0].address,
        city: result.rows[0].city,
        country: result.rows[0].country,
        website: result.rows[0].website,
        business_license: result.rows[0].business_license,
        contact_person: result.rows[0].contact_person
      };
    } else if (userData.role === 'supplier') {
      // Convert PostgreSQL array to string for service_categories
      let serviceCategoriesString = '';
      if (result.rows[0].service_categories) {
        if (Array.isArray(result.rows[0].service_categories)) {
          serviceCategoriesString = result.rows[0].service_categories.join(', ');
        } else {
          serviceCategoriesString = result.rows[0].service_categories;
        }
      }

      profileData = {
        company_name: result.rows[0].supplier_company_name,
        business_type: result.rows[0].supplier_business_type,
        license_number: result.rows[0].license_number,
        trade_license_expiry: result.rows[0].trade_license_expiry,
        insurance_details: result.rows[0].insurance_details,
        service_categories: serviceCategoriesString,
        rating: result.rows[0].rating,
        total_reviews: result.rows[0].total_reviews,
        is_verified: result.rows[0].supplier_verified
      };
    } else if (userData.role === 'employee') {
      profileData = {
        employee_id: result.rows[0].employee_id,
        department: result.rows[0].department,
        position: result.rows[0].position,
        hire_date: result.rows[0].hire_date,
        salary: result.rows[0].salary,
        visa_status: result.rows[0].visa_status,
        visa_expiry: result.rows[0].visa_expiry,
        passport_number: result.rows[0].passport_number,
        emergency_contact_name: result.rows[0].emergency_contact_name,
        emergency_contact_phone: result.rows[0].emergency_contact_phone
      };
    } else if (userData.role === 'candidate') {
      profileData = {
        resume_url: result.rows[0].resume_url,
        portfolio_url: result.rows[0].portfolio_url,
        linkedin_url: result.rows[0].linkedin_url,
        experience_years: result.rows[0].experience_years,
        desired_salary_min: result.rows[0].desired_salary_min,
        desired_salary_max: result.rows[0].desired_salary_max,
        location_preference: result.rows[0].location_preference,
        job_type_preference: result.rows[0].job_type_preference,
        skills: result.rows[0].skills,
        languages: result.rows[0].languages,
        availability_date: result.rows[0].availability_date,
        gender: result.rows[0].gender,
        date_of_birth: result.rows[0].date_of_birth
      };
    }
    
    // Remove sensitive data and return complete profile
    const { passwordHash, ...safeUser } = userData as any;
    return { ...safeUser, profile: profileData } as any;
  }

  static async getUserByEmail(email: string): Promise<Omit<User, 'passwordHash'> | null> {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      return null;
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  static async getAllUsers(filters: UserFilters = {}, pagination: PaginationQuery = {}): Promise<{
    users: Omit<User, 'passwordHash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const result = await UserModel.findAll(filters, pagination);
    const page = pagination.page || 1;
    const limit = pagination.limit || 20;
    const totalPages = Math.ceil(result.total / limit);

    // Remove sensitive data from all users
    const safeUsers = result.users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });

    return {
      users: safeUsers,
      total: result.total,
      page,
      limit,
      totalPages
    };
  }

  static async updateUser(id: string, userData: UpdateUserData): Promise<Omit<User, 'passwordHash'>> {
    // Extract profile-specific fields
    const { 
      companyName, businessType, serviceCategories, licenseNumber, 
      address, companySize, industry, website,
      department, position, salary,
      skills, experienceYears,
      // Remove avatarUrl from extraction so it stays in basicUserData
    } = userData;
    
    // Update basic user data first (including avatarUrl)
    const { passwordHash, email, role, createdAt, updatedAt, ...allowedUpdates } = userData;
    const user = await UserModel.update(id, allowedUpdates);
    if (!user) {
      throw new AppError('User not found', 404);
    }
    
    // Get user role from updated user
    const updatedUser = await UserModel.findById(id);
    if (!updatedUser) {
      throw new AppError('User not found', 404);
    }
    
    // Update profile data if provided - USE UPSERT TO CREATE IF NOT EXISTS
    if (updatedUser.role === 'supplier' && (companyName || businessType || serviceCategories || licenseNumber)) {
      // Convert serviceCategories string to PostgreSQL array
      let processedServiceCategories = null;
      if (serviceCategories && serviceCategories.trim()) {
        // Split by comma and create proper PostgreSQL array string
        const categories = serviceCategories.split(',').map(cat => cat.trim()).filter(cat => cat);
        processedServiceCategories = `{${categories.join(',')}}`;
      }

      await query(`
        INSERT INTO supplier_profiles (user_id, company_name, business_type, service_categories, license_number)
        VALUES ($1, COALESCE($2, ''), COALESCE($3, ''), $4::text[], COALESCE($5, ''))
        ON CONFLICT (user_id) DO UPDATE SET
          company_name = COALESCE(EXCLUDED.company_name, supplier_profiles.company_name),
          business_type = COALESCE(EXCLUDED.business_type, supplier_profiles.business_type),
          service_categories = COALESCE($4::text[], supplier_profiles.service_categories),
          license_number = COALESCE(EXCLUDED.license_number, supplier_profiles.license_number)
      `, [id, companyName, businessType, processedServiceCategories || '{}', licenseNumber]);
    } else if (updatedUser.role === 'client' && (companyName || industry || companySize || address || website)) {
      await query(`
        INSERT INTO client_profiles (user_id, company_name, industry, company_size, address, website)
        VALUES ($1, COALESCE($2, ''), COALESCE($3, ''), COALESCE($4, ''), COALESCE($5, ''), COALESCE($6, ''))
        ON CONFLICT (user_id) DO UPDATE SET
          company_name = COALESCE(EXCLUDED.company_name, client_profiles.company_name),
          industry = COALESCE(EXCLUDED.industry, client_profiles.industry),
          company_size = COALESCE(EXCLUDED.company_size, client_profiles.company_size),
          address = COALESCE(EXCLUDED.address, client_profiles.address),
          website = COALESCE(EXCLUDED.website, client_profiles.website)
      `, [id, companyName, industry, companySize, address, website]);
    } else if (updatedUser.role === 'employee' && (department || position || salary)) {
      await query(`
        INSERT INTO employee_profiles (user_id, department, position, salary)
        VALUES ($1, COALESCE($2, ''), COALESCE($3, ''), COALESCE($4, 0))
        ON CONFLICT (user_id) DO UPDATE SET
          department = COALESCE(EXCLUDED.department, employee_profiles.department),
          position = COALESCE(EXCLUDED.position, employee_profiles.position),
          salary = COALESCE(EXCLUDED.salary, employee_profiles.salary)
      `, [id, department, position, salary]);
    } else if (updatedUser.role === 'candidate' && (skills || experienceYears)) {
      await query(`
        INSERT INTO candidate_profiles (user_id, skills, experience_years)
        VALUES ($1, COALESCE($2, ''), COALESCE($3, 0))
        ON CONFLICT (user_id) DO UPDATE SET
          skills = COALESCE(EXCLUDED.skills, candidate_profiles.skills),
          experience_years = COALESCE(EXCLUDED.experience_years, candidate_profiles.experience_years)
      `, [id, skills, experienceYears]);
    }
    
    // Remove sensitive data
    const { passwordHash: _, ...safeUser } = updatedUser as any;
    return safeUser;
  }

  static async deleteUser(id: string): Promise<boolean> {
    const exists = await UserModel.findById(id);
    if (!exists) {
      throw new AppError('User not found', 404);
    }

    return await UserModel.delete(id);
  }

  static async deactivateUser(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await UserModel.update(id, { isActive: false });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  static async activateUser(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await UserModel.update(id, { isActive: true });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  static async updateUserRole(id: string, role: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await UserModel.update(id, { role: role as any });
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    return safeUser;
  }

  static async verifyUserEmail(id: string): Promise<boolean> {
    const exists = await UserModel.findById(id);
    if (!exists) {
      throw new AppError('User not found', 404);
    }

    return await UserModel.updateEmailVerification(id, true);
  }

  static async searchUsersWithPagination(query: string, pagination: PaginationQuery = {}): Promise<{
    users: Omit<User, 'passwordHash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: UserFilters = { search: query };
    return this.getAllUsers(filters, pagination);
  }

  static async getUsersByRole(role: string, pagination: PaginationQuery = {}): Promise<{
    users: Omit<User, 'passwordHash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: UserFilters = { role: role as any };
    return this.getAllUsers(filters, pagination);
  }

  static async getActiveUsers(pagination: PaginationQuery = {}): Promise<{
    users: Omit<User, 'passwordHash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: UserFilters = { isActive: true };
    return this.getAllUsers(filters, pagination);
  }

  static async getInactiveUsers(pagination: PaginationQuery = {}): Promise<{
    users: Omit<User, 'passwordHash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: UserFilters = { isActive: false };
    return this.getAllUsers(filters, pagination);
  }

  static async getVerifiedUsers(pagination: PaginationQuery = {}): Promise<{
    users: Omit<User, 'passwordHash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: UserFilters = { isEmailVerified: true };
    return this.getAllUsers(filters, pagination);
  }

  static async getUnverifiedUsers(pagination: PaginationQuery = {}): Promise<{
    users: Omit<User, 'passwordHash'>[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const filters: UserFilters = { isEmailVerified: false };
    return this.getAllUsers(filters, pagination);
  }

  static async updateUserLastLogin(id: string): Promise<void> {
    const exists = await UserModel.findById(id);
    if (!exists) {
      throw new AppError('User not found', 404);
    }

    await UserModel.updateLastLogin(id);
  }

  static async checkEmailExists(email: string): Promise<boolean> {
    return await UserModel.emailExists(email);
  }

  static async getUserStats(): Promise<{
    total: number;
    active: number;
    inactive: number;
    verified: number;
    unverified: number;
    byRole: Record<string, number>;
  }> {
    const allUsers = await UserModel.findAll();
    
    const stats = {
      total: allUsers.total,
      active: 0,
      inactive: 0,
      verified: 0,
      unverified: 0,
      byRole: {} as Record<string, number>
    };

    // Get detailed stats
    const activeResult = await UserModel.findAll({ isActive: true });
    stats.active = activeResult.total;

    const inactiveResult = await UserModel.findAll({ isActive: false });
    stats.inactive = inactiveResult.total;

    const verifiedResult = await UserModel.findAll({ isEmailVerified: true });
    stats.verified = verifiedResult.total;

    const unverifiedResult = await UserModel.findAll({ isEmailVerified: false });
    stats.unverified = unverifiedResult.total;

    // Count by role
    const roles = ['admin', 'client', 'supplier', 'employee', 'candidate'];
    for (const role of roles) {
      const roleResult = await UserModel.findAll({ role: role as any });
      stats.byRole[role] = roleResult.total;
    }

    return stats;
  }

  static async updateProfile(id: string, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    avatarUrl?: string;
  }): Promise<Omit<User, 'passwordHash'>> {
    return await this.updateUser(id, data);
  }

  static async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: string;
    phone?: string;
    avatarUrl?: string;
  }): Promise<Omit<User, 'passwordHash'>> {
    // Hash password
    const bcrypt = require('bcrypt');
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '12');
    const passwordHash = await bcrypt.hash(data.password, saltRounds);

    const user = await UserModel.create({
      email: data.email,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role as any,
      phone: data.phone,
      avatarUrl: data.avatarUrl,
      isActive: true,
      isEmailVerified: false
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  static async getOnlineUsers(): Promise<Omit<User, 'passwordHash'>[]> {
    // This would typically integrate with Socket.IO to get actually online users
    // For now, return recently active users
    const result = await UserModel.findAll({ isActive: true }, { limit: 10 });
    
    return result.users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }

  static async searchUsers(query: string, limit: number = 10): Promise<Omit<User, 'passwordHash'>[]> {
    const result = await UserModel.findAll({ search: query }, { limit });
    
    return result.users.map(user => {
      const { passwordHash, ...safeUser } = user;
      return safeUser;
    });
  }
}
