export interface ServiceRequest {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
  budget_min?: number;
  budget_max?: number;
  deadline?: Date;
  location?: string;
  requirements?: string;
  assigned_supplier_id?: string;
  assigned_employee_id?: string;
  created_at: Date;
  updated_at: Date;
  // Additional fields for supplier view
  client_name?: string;
  client_company?: string;
  quotation_count?: number;
  has_quoted?: boolean;
}

export interface Quotation {
  id: string;
  service_request_id: string;
  supplier_id: string;
  amount: number;
  description?: string;
  estimated_duration?: string;
  terms_conditions?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  valid_until?: Date;
  created_at: Date;
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
  budget_min?: number;
  budget_max?: number;
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

export interface ServiceCategory {
  id: string;
  name: string;
  description?: string;
  is_active: boolean;
  created_at: Date;
}