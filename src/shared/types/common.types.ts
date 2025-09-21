export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus = 'draft' | 'published' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

export type QuotationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship';

export type JobStatus = 'draft' | 'published' | 'closed' | 'cancelled';

export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'hired' | 'rejected';

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export type DocumentCategory = 'resume' | 'certificate' | 'license' | 'contract' | 'invoice' | 'passport' | 'visa' | 'insurance' | 'other';

export type MessageType = 'direct' | 'service_request' | 'job_application' | 'system';

export type NotificationType = 'message' | 'application' | 'interview' | 'payment' | 'document' | 'system' | 'reminder';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'holiday';

export type LeaveType = 'annual' | 'sick' | 'emergency' | 'maternity' | 'paternity';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Import and re-export UserRole from user.types for convenience
import { UserRole } from './user.types';
export { UserRole };

export interface ServiceRequest {
  id: string;
  client_id: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: RequestStatus;
  budget_min?: number;
  budget_max?: number;
  deadline?: Date;
  location?: string;
  requirements?: string;
  assigned_supplier_id?: string;
  assigned_employee_id?: string;
  created_at: Date;
  updated_at: Date;
}

export interface Quotation {
  id: string;
  service_request_id: string;
  supplier_id: string;
  amount: number;
  description?: string;
  estimated_duration?: string;
  terms_conditions?: string;
  status: QuotationStatus;
  valid_until?: Date;
  created_at: Date;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  job_type: JobType;
  experience_required?: number;
  salary_min?: number;
  salary_max?: number;
  skills_required: string[];
  benefits: string[];
  status: JobStatus;
  posted_by?: string;
  application_deadline?: Date;
  created_at: Date;
}

export interface JobApplication {
  id: string;
  job_id: string;
  candidate_id: string;
  cover_letter?: string;
  resume_url?: string;
  status: ApplicationStatus;
  applied_at: Date;
}

export interface Interview {
  id: string;
  application_id: string;
  scheduled_date: Date;
  duration: number;
  interview_type?: string;
  location?: string;
  interviewer_id?: string;
  status: InterviewStatus;
  notes?: string;
  created_at: Date;
}

export interface Document {
  id: string;
  user_id: string;
  filename: string;
  original_name: string;
  file_url: string;
  file_size: number;
  mime_type: string;
  category?: DocumentCategory;
  is_public: boolean;
  uploaded_at: Date;
}

export interface Message {
  id: string;
  sender_id: string;
  recipient_id: string;
  subject?: string;
  content: string;
  is_read: boolean;
  message_type: MessageType;
  reference_id?: string;
  created_at: Date;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  content: string;
  type: NotificationType;
  is_read: boolean;
  action_url?: string;
  created_at: Date;
}

export interface Attendance {
  id: string;
  employee_id: string;
  date: Date;
  check_in?: Date;
  check_out?: Date;
  break_duration: number;
  total_hours?: number;
  status: AttendanceStatus;
  notes?: string;
  created_at: Date;
}

export interface LeaveRequest {
  id: string;
  employee_id: string;
  leave_type: LeaveType;
  start_date: Date;
  end_date: Date;
  days_requested: number;
  reason?: string;
  status: LeaveStatus;
  approved_by?: string;
  approved_at?: Date;
  created_at: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}