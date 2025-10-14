export interface FileUpload {
  id: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
  s3Url: string;
  uploadedBy: string;
  isPublic: boolean;
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface FileFolder {
  id: string;
  name: string;
  description?: string;
  parentId?: string;
  path: string;
  createdBy: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateFileRequest {
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
  s3Url: string;
  isPublic?: boolean;
  folderId?: string;
}

export interface CreateFolderRequest {
  name: string;
  description?: string;
  parentId?: string;
  isPublic?: boolean;
}

export interface UpdateFileRequest {
  fileName?: string;
  isPublic?: boolean;
  folderId?: string;
}

export interface UpdateFolderRequest {
  name?: string;
  description?: string;
  parentId?: string;
  isPublic?: boolean;
}

export interface FileQuery {
  page?: number;
  limit?: number;
  folderId?: string;
  mimeType?: string;
  isPublic?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'fileName' | 'fileSize';
  sortOrder?: 'asc' | 'desc';
}

export interface FolderQuery {
  page?: number;
  limit?: number;
  parentId?: string;
  isPublic?: boolean;
  search?: string;
  sortBy?: 'createdAt' | 'updatedAt' | 'name';
  sortOrder?: 'asc' | 'desc';
}

export interface FileStats {
  totalFiles: number;
  totalSize: number;
  totalFolders: number;
  storageUsed: number;
  storageLimit: number;
  fileTypes: {
    [mimeType: string]: number;
  };
}