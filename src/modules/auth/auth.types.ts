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
    firstName: string;
    lastName: string;
    role: string;
    avatar?: string;
    isActive?: boolean;
  };
  accessToken: string;
  refreshToken: string;
}