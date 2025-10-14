export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface PaginationQuery {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface DatabaseConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl: boolean;
  maxConnections: number;
  idleTimeoutMillis: number;
  connectionTimeoutMillis: number;
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  refreshExpiresIn: string;
}

export interface S3Config {
  endpoint: string;
  accessKey: string;
  secretKey: string;
  bucketName: string;
  region: string;
  tokenValue?: string;
  publicDomain: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
  bcryptRounds: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  s3: S3Config;
  email: {
    host: string;
    port: number;
    user: string;
    pass: string;
  };
}

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
  firstName?: string;
  lastName?: string;
}

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
}

export interface AuthenticatedRequest extends Express.Request {
  user?: RequestUser;
  body: any;
  params: any;
  query: any;
}

export type UserRole = 'admin' | 'client' | 'supplier' | 'employee' | 'candidate';

// UserRole enum for runtime usage
export const UserRole = {
  ADMIN: 'admin' as UserRole,
  CLIENT: 'client' as UserRole,
  SUPPLIER: 'supplier' as UserRole,
  EMPLOYEE: 'employee' as UserRole,
  CANDIDATE: 'candidate' as UserRole,
} as const;

export type Priority = 'low' | 'medium' | 'high' | 'urgent';

export type RequestStatus = 'draft' | 'pending_admin' | 'published' | 'assigned' | 'in_progress' | 'completed' | 'cancelled' | 'on_hold';

export type QuotationStatus = 'pending' | 'accepted' | 'rejected' | 'expired';

export type DocumentCategory = 'resume' | 'certificate' | 'license' | 'contract' | 'invoice' | 'passport' | 'visa' | 'insurance' | 'other';

export type MessageType = 'direct' | 'service_request' | 'job_application' | 'system' | 'admin_approval';

export type NotificationType = 'message' | 'application' | 'interview' | 'payment' | 'document' | 'system' | 'reminder' | 'admin_action';

export type AttendanceStatus = 'present' | 'absent' | 'late' | 'half_day' | 'holiday';

export type LeaveType = 'annual' | 'sick' | 'emergency' | 'maternity' | 'paternity';

export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export type JobType = 'full_time' | 'part_time' | 'contract' | 'internship';

export type JobStatus = 'draft' | 'published' | 'closed' | 'cancelled';

export type ApplicationStatus = 'applied' | 'screening' | 'interview' | 'hired' | 'rejected';

export type InterviewStatus = 'scheduled' | 'completed' | 'cancelled' | 'rescheduled';

export type AssignmentStatus = 'assigned' | 'in_progress' | 'completed' | 'on_hold' | 'cancelled';

export type AssignmentPriority = 'low' | 'medium' | 'high' | 'critical';

export type VisaType = 'tourist' | 'work' | 'student' | 'business' | 'transit' | 'residence' | 'family' | 'medical' | 'diplomatic' | 'other';

export type VisaStatus = 'active' | 'expired' | 'expiring_soon' | 'expiring_critical' | 'pending' | 'cancelled' | 'renewal_required';

export type VisaNotificationType = 'email' | 'system' | 'both';

export type PaymentStatus = 'pending' | 'approved' | 'processing' | 'paid' | 'rejected' | 'cancelled';

export type Gender = 'male' | 'female' | 'other' | 'prefer_not_to_say';

export type ConversationContext = 'service_request' | 'job_application' | 'payment' | 'document' | 'general' | 'admin_review';

export interface SocketUser {
  id: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  socketId: string;
  isOnline: boolean;
  lastSeen: Date;
}

export interface SocketMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  messageType: MessageType;
  isRead: boolean;
  createdAt: Date;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  isTyping: boolean;
}

export interface OnlineUsers {
  [userId: string]: SocketUser;
}

export interface ConversationRoom {
  conversationId: string;
  participants: string[];
  adminId?: string;
}

export interface FileUploadResult {
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category?: DocumentCategory;
}

export interface EmailOptions {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export interface NotificationData {
  userId: string;
  title: string;
  content: string;
  type: NotificationType;
  actionUrl?: string;
  referenceId?: string;
}

export interface ServiceRequestData {
  clientId: string;
  assignedAdminId?: string;
  title: string;
  description: string;
  category: string;
  priority: Priority;
  budgetMin?: number;
  budgetMax?: number;
  deadline?: Date;
  location?: string;
  requirements?: string;
}

export interface QuotationData {
  serviceRequestId: string;
  supplierId: string;
  amount: number;
  description?: string;
  estimatedDuration?: string;
  termsConditions?: string;
  validUntil?: Date;
}

export interface JobPostingData {
  title: string;
  description: string;
  company?: string;
  location?: string;
  jobType: JobType;
  experienceRequired?: number;
  salaryMin?: number;
  salaryMax?: number;
  skillsRequired?: string[];
  benefits?: string[];
  applicationDeadline?: Date;
}

export interface JobApplicationData {
  jobId: string;
  candidateId: string;
  coverLetter?: string;
  resumeUrl?: string;
}

export interface InterviewData {
  applicationId: string;
  scheduledDate: Date;
  duration?: number;
  interviewType?: string;
  location?: string;
  interviewerId?: string;
  notes?: string;
}

export interface PaymentData {
  quotationId?: string;
  supplierId: string;
  clientId: string;
  amount: number;
  currency?: string;
  dueDate?: Date;
  invoiceNumber?: string;
  notes?: string;
}

export interface VisaDocumentData {
  userId: string;
  documentId: string;
  visaType: VisaType;
  visaNumber: string;
  issuedDate: Date;
  expiryDate: Date;
  issuingCountry: string;
}

export interface LeaveRequestData {
  employeeId: string;
  leaveType: LeaveType;
  startDate: Date;
  endDate: Date;
  daysRequested: number;
  reason?: string;
}

export interface AttendanceData {
  employeeId: string;
  date: Date;
  checkIn?: Date;
  checkOut?: Date;
  breakDuration?: number;
  totalHours?: number;
  status: AttendanceStatus;
  notes?: string;
}

export interface ProjectData {
  title: string;
  description?: string;
  clientId?: string;
  projectManagerId?: string;
  startDate?: Date;
  endDate?: Date;
  budget?: number;
  status: AssignmentStatus;
  priority: AssignmentPriority;
}

export interface EmployeeAssignmentData {
  employeeId: string;
  projectId: string;
  roleInProject?: string;
  startDate?: Date;
  endDate?: Date;
  hoursAllocated?: number;
  notes?: string;
}

export interface TaskAssignmentData {
  assignmentId: string;
  title: string;
  description?: string;
  dueDate?: Date;
  status: AssignmentStatus;
  priority: AssignmentPriority;
  estimatedHours?: number;
  actualHours?: number;
  completionPercentage?: number;
}