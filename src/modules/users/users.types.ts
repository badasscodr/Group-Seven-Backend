export interface UpdateProfileRequest {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profileData?: any;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface UserProfileResponse {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  email_verified: boolean;
  createdAt: Date;
  updatedAt: Date;
  last_login?: Date;
  profile?: any;
}