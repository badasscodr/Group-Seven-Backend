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
  created_at: string;
}

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
  deadline?: string;
  location?: string;
  requirements?: string;
  assigned_supplier_id?: string;
  assigned_employee_id?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateServiceRequestData {
  title: string;
  description: string;
  category: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  location?: string;
  requirements?: string;
}

export interface UpdateServiceRequestData {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  budget_min?: number;
  budget_max?: number;
  deadline?: string;
  location?: string;
  requirements?: string;
  status?: 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';
}

export interface ServiceRequestFilters {
  status?: string;
  category?: string;
  priority?: string;
  page?: number;
  limit?: number;
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
  valid_until?: string;
  created_at: string;
  supplier_name?: string;
  supplier_company?: string;
}

export interface ClientServiceRequestsResponse {
  serviceRequests: ServiceRequest[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ServiceRequestWithQuotations extends ServiceRequest {
  quotations: Quotation[];
}