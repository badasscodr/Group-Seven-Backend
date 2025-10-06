export interface ServiceRequest {
  id: string;
  clientId: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  budgetMin?: number;
  budgetMax?: number;
  deadline?: Date;
  location?: string;
  requirements?: string;
  assigned_supplier_id?: string;
  assigned_employee_id?: string;
  createdAt: Date;
  updatedAt: Date;
  // Additional fields for supplier view
  client_name?: string;
  client_company?: string;
  quotation_count?: number;
  has_quoted?: boolean;
}

export interface Quotation {
  id: string;
  serviceRequestId: string;
  supplierId: string;
  amount: number;
  description?: string;
  estimated_duration?: string;
  terms_conditions?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  valid_until?: Date;
  createdAt: Date;
  // Additional fields for quotation list view
  request_title?: string;
  request_category?: string;
  request_status?: string;
  client_name?: string;
  client_company?: string;
}

export interface CreateQuotationData {
  amount: number;
  description?: string;
  estimated_duration?: string;
  terms_conditions?: string;
  valid_until?: Date;
}

export interface UpdateQuotationData {
  amount?: number;
  description?: string;
  estimated_duration?: string;
  terms_conditions?: string;
  valid_until?: Date;
}

export interface ServiceRequestFilters {
  category?: string;
  priority?: string;
  budgetMin?: number;
  budgetMax?: number;
  page?: number;
  limit?: number;
}

export interface SupplierServiceRequestsResponse {
  serviceRequests: ServiceRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SupplierProfile {
  id: string;
  userId: string;
  companyName: string;
  businessType?: string;
  licenseNumber?: string;
  trade_license_expiry?: Date;
  insurance_details?: string;
  serviceCategories: string[];
  rating: number;
  totalReviews: number;
  isVerified: boolean;
  createdAt: Date;
}

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt: Date;
}