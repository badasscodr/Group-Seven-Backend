export type UserRole = 'admin' | 'client' | 'supplier' | 'employee' | 'candidate';

export interface User {
  id: string;
  email: string;
  password_hash: string;
  role: UserRole;
  first_name: string;
  last_name: string;
  phone?: string;
  avatar_url?: string;
  is_active: boolean;
  email_verified: boolean;
  created_at: Date;
  updated_at: Date;
  last_login?: Date;
}

export interface ClientProfile {
  id: string;
  user_id: string;
  company_name?: string;
  industry?: string;
  company_size?: string;
  address?: string;
  city?: string;
  country?: string;
  website?: string;
  business_license?: string;
  created_at: Date;
}

export interface SupplierProfile {
  id: string;
  user_id: string;
  company_name: string;
  business_type?: string;
  license_number?: string;
  trade_license_expiry?: Date;
  insurance_details?: string;
  service_categories: string[];
  rating: number;
  total_reviews: number;
  is_verified: boolean;
  created_at: Date;
}

export interface EmployeeProfile {
  id: string;
  user_id: string;
  employee_id?: string;
  department?: string;
  position?: string;
  hire_date?: Date;
  salary?: number;
  visa_status?: string;
  visa_expiry?: Date;
  passport_number?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  manager_id?: string;
  created_at: Date;
}

export interface CandidateProfile {
  id: string;
  user_id: string;
  resume_url?: string;
  portfolio_url?: string;
  linkedin_url?: string;
  experience_years?: number;
  desired_salary_min?: number;
  desired_salary_max?: number;
  location_preference?: string;
  job_type_preference?: string;
  skills: string[];
  languages: string[];
  availability_date?: Date;
  created_at: Date;
}