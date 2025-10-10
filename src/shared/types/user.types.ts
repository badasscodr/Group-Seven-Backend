export type UserRole = 'admin' | 'client' | 'supplier' | 'employee' | 'candidate';

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
  emailVerified: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
}

export interface ClientProfile {
  id: string;
  userId: string;
  companyName?: string;
  industry?: string;
  companySize?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  businessLicense?: string;
  createdAt: Date;
}

export interface SupplierProfile {
  id: string;
  userId: string;
  companyName: string;
  businessType?: string;
  licenseNumber?: string;
  tradeLicenseExpiry?: Date;
  insuranceDetails?: string;
  serviceCategories: string[];
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  createdAt: Date;
}

export interface EmployeeProfile {
  id: string;
  userId: string;
  employeeId?: string;
  department?: string;
  position?: string;
  hireDate?: Date;
  salary?: number;
  visaStatus?: string;
  visaExpiry?: Date;
  passportNumber?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  managerId?: string;
  createdAt: Date;
}

export interface CandidateProfile {
  id: string;
  userId: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  linkedinUrl?: string;
  experienceYears?: number;
  desiredSalaryMin?: number;
  desiredSalaryMax?: number;
  locationPreference?: string;
  jobTypePreference?: string;
  skills: string[];
  languages: string[];
  availabilityDate?: Date;
  createdAt: Date;
}