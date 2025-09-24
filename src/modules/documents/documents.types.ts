export interface Document {
  id: string;
  userId: string;
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category: DocumentCategory;
  isPublic: boolean;
  uploadedAt: Date;
}

export type DocumentCategory =
  | 'resume'
  | 'certificate'
  | 'license'
  | 'contract'
  | 'invoice'
  | 'passport'
  | 'visa'
  | 'insurance'
  | 'other';

export interface CreateDocumentData {
  filename: string;
  originalName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  category?: DocumentCategory;
  isPublic?: boolean;
}

export interface UpdateDocumentData {
  category?: DocumentCategory;
  isPublic?: boolean;
}

export interface DocumentListQuery {
  category?: DocumentCategory;
  isPublic?: boolean;
  limit?: number;
  offset?: number;
}

export interface DocumentUploadResult {
  document: Document;
  uploadResult: {
    fileUrl: string;
    filename: string;
    originalName: string;
    fileSize: number;
    mimeType: string;
  };
}

export interface DocumentStats {
  totalDocuments: number;
  totalSize: number;
  documentsByCategory: Record<DocumentCategory, number>;
}