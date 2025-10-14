export interface User {
  id: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  avatar?: string;
  phoneNumber?: string;
  isActive: boolean;
  isEmailVerified?: boolean;
  refreshToken?: string;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum UserRole {
  ADMIN = 'admin',
  EMPLOYEE = 'employee',
  CLIENT = 'client',
  SUPPLIER = 'supplier',
  CANDIDATE = 'candidate'
}

export type UserRoleType = 'admin' | 'employee' | 'client' | 'supplier' | 'candidate';

export interface AuthPayload {
  userId: string;
  email: string;
  role: UserRole;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  phoneNumber?: string;
}

export interface AuthResponse {
  user: Omit<User, 'password' | 'refreshToken' | 'passwordResetToken' | 'passwordResetExpires'>;
  accessToken: string;
  refreshToken: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  type: MessageType;
  status: MessageStatus;
  replyToId?: string;
  attachments?: MessageAttachment[];
  editedAt?: Date;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export enum MessageType {
  TEXT = 'text',
  FILE = 'file',
  IMAGE = 'image',
  SYSTEM = 'system'
}

export type MessageTypeType = 'text' | 'file' | 'image' | 'system';

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  EDITED = 'edited',
  DELETED = 'deleted'
}

export type MessageStatusType = 'sent' | 'delivered' | 'read' | 'edited' | 'deleted';

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  s3Key: string;
  s3Url: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  name?: string;
  type: ConversationType;
  description?: string;
  createdBy: string;
  isArchived?: boolean;
  avatarUrl?: string;
  metadata?: Record<string, any>;
  participants: ConversationParticipant[];
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  userId: string;
  role: string;
  joinedAt: Date;
  lastReadAt?: Date;
}

export enum ConversationType {
  DIRECT = 'direct',
  GROUP = 'group'
}

export type ConversationTypeType = 'direct' | 'group';

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  type?: MessageType;
  replyToId?: string;
}

export interface UpdateMessageRequest {
  content: string;
}

export interface ConversationWithParticipants {
  id: string;
  name?: string;
  type: ConversationType;
  description?: string;
  createdBy: string;
  isArchived?: boolean;
  avatarUrl?: string;
  metadata?: Record<string, any>;
  participants: User[];
  lastMessageAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  lastMessage?: Message;
  unreadCount?: number;
}

export interface SendMessageRequest {
  conversationId: string;
  content: string;
  messageType?: MessageType;
  attachments?: File[];
}

export interface EditMessageRequest {
  content: string;
}

export interface TypingIndicator {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface SocketUser {
  id: string;
  userId: string;
  email: string;
  role: UserRole;
  socketIds: string[];
}

export interface SocketMessage {
  type: string;
  data: any;
  timestamp: Date;
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
}

export interface JwtConfig {
  secret: string;
  expiresIn: string;
  issuer: string;
  audience: string;
}

export interface AwsConfig {
  accessKeyId: string;
  secretAccessKey: string;
  region: string;
  bucket: string;
}

export interface EmailConfig {
  host: string;
  port: number;
  secure: boolean;
  user: string;
  password: string;
  from: string;
}

export interface AppConfig {
  port: number;
  nodeEnv: string;
  corsOrigin: string[];
  rateLimitWindowMs: number;
  rateLimitMax: number;
  database: DatabaseConfig;
  jwt: JwtConfig;
  aws: AwsConfig;
  email: EmailConfig;
}