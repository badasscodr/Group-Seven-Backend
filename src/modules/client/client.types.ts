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
  createdAt: string;
}

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
  deadline?: string;
  location?: string;
  requirements?: string;
  assigned_supplier_id?: string;
  assigned_employee_id?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateServiceRequestData {
  title: string;
  description: string;
  category: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  budgetMin?: number;
  budgetMax?: number;
  deadline?: string;
  location?: string;
  requirements?: string;
}

export interface UpdateServiceRequestData {
  title?: string;
  description?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  budgetMin?: number;
  budgetMax?: number;
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
  serviceRequestId: string;
  supplierId: string;
  amount: number;
  description?: string;
  estimated_duration?: string;
  terms_conditions?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  valid_until?: string;
  createdAt: string;
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