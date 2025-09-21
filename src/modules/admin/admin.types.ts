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
  first_name: string;
  last_name: string;
  role: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
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