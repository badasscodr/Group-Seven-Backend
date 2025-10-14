import { UserModel, User, UserFilters } from '../models/user.model';
import { AppError } from '../../core/middleware/errorHandler';
import { PaginationQuery } from '../../core/types';

export class UserService {
  static async getUserById(id: string): Promise<Omit<User, 'passwordHash'>> {
    const user = await UserModel.findById(id);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove sensitive data
    const { passwordHash, ...safeUser } = user;
    return safeUser;
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

  static async updateUser(id: string, userData: Partial<User>): Promise<Omit<User, 'passwordHash'>> {
    // Don't allow updating sensitive fields through this method
    const { passwordHash, email, role, createdAt, updatedAt, ...allowedUpdates } = userData as any;

    const user = await UserModel.update(id, allowedUpdates);
    if (!user) {
      throw new AppError('User not found', 404);
    }

    // Remove sensitive data
    const { passwordHash: _, ...safeUser } = user;
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