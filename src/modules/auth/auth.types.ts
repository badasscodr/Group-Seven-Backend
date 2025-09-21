export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'client' | 'supplier' | 'employee' | 'candidate';
  phone?: string;
  profileData?: any;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    role: string;
    avatar?: string;
    is_active?: boolean;
  };
  accessToken: string;
  refreshToken: string;
}