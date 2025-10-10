export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus = 'draft' | 'published' | 'inProgress' | 'completed' | 'cancelled' | 'onHold';

export type QuotationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type JobType = 'fullTime' | 'partTime' | 'contract' | 'internship';

export type JobStatus = 'draft' | 'published' | 'closed' | 'cancelled';

export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'hired' | 'rejected';

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export type DocumentCategory = 'resume' | 'certificate' | 'license' | 'contract' | 'invoice' | 'passport' | 'visa' | 'insurance' | 'other';

export type MessageType = 'direct' | 'serviceRequest' | 'jobApplication' | 'system';

export type NotificationType = 'message' | 'application' | 'interview' | 'payment' | 'document' | 'system' | 'reminder';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'halfDay' | 'holiday';

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
  clientId: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  status: RequestStatus;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: Date;
  location?: string;
  requirements?: string;
  assignedSupplierId?: string;
  assignedEmployeeId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Quotation {
  id: string;
  serviceRequestId: string;
  supplierId: string;
  amount: number;
  description?: string;
  estimatedDuration?: string;
  termsConditions?: string;
  status: QuotationStatus;
  validUntil?: Date;
  createdAt: Date;
}

export interface JobPosting {
  id: string;
  title: string;
  description: string;
  company?: string;
  location?: string;
  jobType: JobType;
  experienceRequired?: number;
  salaryMin?: number;
  salaryMax?: number;
  skillsRequired: string[];
  benefits: string[];
  status: JobStatus;
  postedBy?: string;
  applicationDeadline?: Date;
  createdAt: Date;
}

export interface JobApplication {
  id: string;
  jobId: string;
  candidateId: string;
  coverLetter?: string;
  resumeUrl?: string;
  status: ApplicationStatus;
  appliedAt: Date;
}

export interface Interview {
  id: string;
  applicationId: string;
  scheduledDate: Date;
  duration: number;
  interviewType?: string;
  location?: string;
  interviewerId?: string;
  status: InterviewStatus;
  notes?: string;
  createdAt: Date;
}

export interface Document {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category?: DocumentCategory;
  isPublic: boolean;
  uploadedAt: Date;
}

export interface Message {
  id: string;
  senderId: string;
  recipientId: string;
  subject?: string;
  content: string;
  isRead: boolean;
  messageType: MessageType;
  referenceId?: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  actionUrl?: string;
  createdAt: Date;
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakDuration: number;
  totalHours?: number;
  status: AttendanceStatus;
  notes?: string;
  createdAt: Date;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  daysRequested: number;
  reason?: string;
  status: LeaveStatus;
  approvedBy?: string;
  approvedAt?: Date;
  createdAt: Date;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: UserRole;
  permissions: string[];
  iat: number;
  exp: number;
}