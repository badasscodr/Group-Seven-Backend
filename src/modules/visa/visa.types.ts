export interface VisaDocument {
  id: string;
  userId: string;
  documentId: string;
  visaType: VisaType;
  visaNumber: string;
  issuedDate: Date;
  expiryDate: Date;
  issuingCountry: string;
  status: VisaStatus;
  notificationsSent: number;
  lastNotificationDate?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type VisaType =
  | 'tourist'
  | 'work'
  | 'student'
  | 'business'
  | 'transit'
  | 'residence'
  | 'family'
  | 'medical'
  | 'diplomatic'
  | 'other';

export type VisaStatus =
  | 'active'
  | 'expired'
  | 'expiringSoon'
  | 'expiringCritical'
  | 'pending'
  | 'cancelled'
  | 'renewalRequired';

export interface CreateVisaData {
  documentId: string;
  visaType: VisaType;
  visaNumber: string;
  issuedDate: string;
  expiryDate: string;
  issuingCountry: string;
}

export interface UpdateVisaData {
  visaType?: VisaType;
  visaNumber?: string;
  issuedDate?: string;
  expiryDate?: string;
  issuingCountry?: string;
  status?: VisaStatus;
  isActive?: boolean;
}

export interface VisaListQuery {
  userId?: string;
  visaType?: VisaType;
  status?: VisaStatus;
  expiringWithin?: number;
  isActive?: boolean;
  limit?: number;
  offset?: number;
}

export interface VisaStats {
  totalVisas: number;
  activeVisas: number;
  expiredVisas: number;
  expiringWithin30Days: number;
  expiringWithin7Days: number;
  visasByType: Record<VisaType, number>;
  visasByStatus: Record<VisaStatus, number>;
}

export interface VisaExpiryNotification {
  id: string;
  userId: string;
  visaId: string;
  notificationType: 'email' | 'system' | 'both';
  daysBeforeExpiry: number;
  sentAt: Date;
  status: 'sent' | 'failed' | 'pending';
  errorMessage?: string;
}

export interface VisaDocumentWithRelations extends VisaDocument {
  document?: {
    id: string;
    filename: string;
    originalName: string;
    fileUrl: string;
    fileSize: number;
    mimeType: string;
  };
  user?: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
}