// Payment Management Types

export interface Payment {
  id: string;
  quotationId: string;
  supplierId: string;
  clientId: string;
  amount: number;
  currency: string;
  status: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'cancelled';
  paymentMethod?: string;
  payment_date?: Date;
  dueDate?: Date;
  invoiceNumber?: string;
  notes?: string;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
  updatedAt?: Date;
}

export interface CreatePaymentData {
  quotationId: string;
  supplierId: string;
  clientId: string;
  amount: number;
  currency?: string;
  paymentMethod?: string;
  dueDate?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface UpdatePaymentData {
  status?: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'cancelled';
  paymentMethod?: string;
  payment_date?: string;
  dueDate?: string;
  invoiceNumber?: string;
  notes?: string;
}

export interface PaymentFilters {
  status?: 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'cancelled';
  supplierId?: string;
  clientId?: string;
  quotationId?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
}

export interface PaymentStats {
  total_payments: number;
  total_amount: number;
  pending_count: number;
  pending_amount: number;
  approved_count: number;
  approved_amount: number;
  paid_count: number;
  paid_amount: number;
}
