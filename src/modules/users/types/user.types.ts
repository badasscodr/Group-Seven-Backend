import { User } from '../../auth/models/auth.model';

export interface UpdateUserData extends Partial<User> {
  // Employee-specific fields
  department?: string;
  position?: string;
  salary?: number;
  
  // Candidate-specific fields
  skills?: string;
  experienceYears?: number;
  
  // Client-specific fields
  companyName?: string;
  businessType?: string;
  serviceCategories?: string;
  address?: string;
  companySize?: string;
  industry?: string;
  website?: string;
  
  // Supplier-specific fields
  licenseNumber?: string;
}