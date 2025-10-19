export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'service_request' | 'admin_action' | 'system';
  relatedId?: string;
  relatedType?: string;
  status: 'read' | 'unread';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
  createdAt: Date;
  readAt?: Date;
}

export interface CreateNotificationDto {
  userId: string;
  title: string;
  message: string;
  type: 'service_request' | 'admin_action' | 'system';
  relatedId?: string;
  relatedType?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  metadata?: Record<string, any>;
}

export interface UpdateNotificationDto {
  status?: 'read' | 'unread';
  readAt?: Date;
}

export interface NotificationQueryOptions {
  status?: 'read' | 'unread' | 'all';
  type?: 'service_request' | 'admin_action' | 'system' | 'all';
  priority?: 'low' | 'medium' | 'high' | 'urgent' | 'all';
  limit?: number;
  offset?: number;
  sortBy?: 'createdAt' | 'readAt';
  sortOrder?: 'asc' | 'desc';
}

export interface NotificationResponse {
  success: boolean;
  data?: Notification[];
  pagination?: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

export interface SingleNotificationResponse {
  success: boolean;
  data?: Notification;
  error?: {
    message: string;
    code?: string;
  };
}

export interface UnreadCountResponse {
  success: boolean;
  data?: {
    unreadCount: number;
  };
  error?: {
    message: string;
    code?: string;
  };
}

// Notification types for different events
export interface ServiceRequestNotificationData {
  requestId: string;
  clientId: string;
  requestTitle: string;
  oldStatus?: string;
  newStatus: string;
  clientName?: string;
}

export interface AdminActionNotificationData {
  targetUserId: string;
  action: 'approved' | 'rejected' | 'updated';
  targetType: 'user' | 'service_request' | 'quotation';
  targetId?: string;
  details?: Record<string, any>;
}

export interface SystemNotificationData {
  message: string;
  severity?: 'info' | 'warning' | 'error';
  actionUrl?: string;
}
