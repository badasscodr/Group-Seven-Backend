export interface AdminUserListQuery {
  page?: number;
  limit?: number;
  role?: string;
  search?: string;
  isActive?: boolean;
}

export interface AdminUserResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  email_verified: boolean;
  createdAt: string;
  updatedAt: string;
  last_login?: string;
  profile?: any;
}

export interface AdminUsersListResponse {
  users: AdminUserResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdminStatsResponse {
  totalUsers: number;
  usersByRole: {
    [role: string]: number;
  };
  recentRegistrations: number;
  activeSessions: number;
}