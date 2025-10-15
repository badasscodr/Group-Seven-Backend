import { FileModel, FileFolderModel } from '../models/file.model';
import { S3Service } from '../../core/services/s3.service';
import { 
  FileUpload, 
  FileFolder, 
  CreateFileRequest, 
  CreateFolderRequest,
  UpdateFileRequest,
  UpdateFolderRequest,
  FileQuery,
  FolderQuery,
  FileStats
} from '../types/file.types';

export class FileService {
  static async uploadFile(
    file: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    options: {
      isPublic?: boolean;
      folderId?: string;
    } = {}
  ): Promise<FileUpload> {
    // Generate unique filename
    const fileName = `${Date.now()}-${originalName.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const s3Key = `uploads/${userId}/${fileName}`;

    try {
      // Upload to S3
      const s3Url = await S3Service.uploadFile(file, s3Key, mimeType, options.isPublic);

      // Create file record
      const fileRecord = await FileModel.create({
        fileName,
        originalName,
        mimeType,
        fileSize: file.length,
        s3Key,
        s3Url,
        isPublic: options.isPublic || false,
        folderId: options.folderId,
        uploadedBy: userId
      });

      return fileRecord;
    } catch (error) {
      console.error('❌ FileService upload failed:', error.message);
      throw error;
    }
  }

  static async getFile(fileId: string, userId?: string): Promise<FileUpload | null> {
    const file = await FileModel.findById(fileId);
    
    if (!file) {
      return null;
    }

    // Check access permissions
    if (!file.isPublic && file.uploadedBy !== userId) {
      throw new Error('Access denied: You do not have permission to access this file');
    }

    return file;
  }

  static async getFiles(userId: string, query: FileQuery): Promise<{ files: FileUpload[]; total: number }> {
    return await FileModel.findByUserId(userId, query);
  }

  static async getPublicFiles(query: FileQuery): Promise<{ files: FileUpload[]; total: number }> {
    return await FileModel.findPublic(query);
  }

  static async updateFile(fileId: string, data: UpdateFileRequest, userId: string): Promise<FileUpload | null> {
    const file = await FileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    // Check ownership
    if (file.uploadedBy !== userId) {
      throw new Error('Access denied: You can only edit your own files');
    }

    return await FileModel.update(fileId, data);
  }

  static async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const file = await FileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    // Check ownership
    if (file.uploadedBy !== userId) {
      throw new Error('Access denied: You can only delete your own files');
    }

    // Delete from S3
    try {
      await S3Service.deleteFile(file.s3Key);
    } catch (error) {
      console.error('Failed to delete file from S3:', error);
      // Continue with database deletion even if S3 deletion fails
    }

    // Delete from database
    return await FileModel.delete(fileId);
  }

  static async downloadFile(fileId: string, userId?: string): Promise<{ file: FileUpload; url: string }> {
    const file = await this.getFile(fileId, userId);
    
    if (!file) {
      throw new Error('File not found');
    }

    // Generate presigned URL for download
    const downloadUrl = await S3Service.getPresignedUrl(file.s3Key, 3600); // 1 hour expiry

    // Increment download count
    await FileModel.incrementDownloadCount(fileId);

    return {
      file,
      url: downloadUrl
    };
  }

  static async createFolder(data: CreateFolderRequest, userId: string): Promise<FileFolder> {
    // Build folder path
    let path = data.name;
    if (data.parentId) {
      const parentPath = await FileFolderModel.getPath(data.parentId);
      path = parentPath ? `${parentPath}/${data.name}` : data.name;
    }

    // Create folder record
    const folder = await FileFolderModel.create({
      ...data,
      createdBy: userId,
      path
    });

    return folder;
  }

  static async getFolder(folderId: string, userId?: string): Promise<FileFolder | null> {
    const folder = await FileFolderModel.findById(folderId);
    
    if (!folder) {
      return null;
    }

    // Check access permissions
    if (!folder.isPublic && folder.createdBy !== userId) {
      throw new Error('Access denied: You do not have permission to access this folder');
    }

    return folder;
  }

  static async getFolders(userId: string, query: FolderQuery): Promise<{ folders: FileFolder[]; total: number }> {
    return await FileFolderModel.findByUserId(userId, query);
  }

  static async getPublicFolders(query: FolderQuery): Promise<{ folders: FileFolder[]; total: number }> {
    return await FileFolderModel.findPublic(query);
  }

  static async updateFolder(folderId: string, data: UpdateFolderRequest, userId: string): Promise<FileFolder | null> {
    const folder = await FileFolderModel.findById(folderId);
    
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Check ownership
    if (folder.createdBy !== userId) {
      throw new Error('Access denied: You can only edit your own folders');
    }

    // Update path if name or parent changed
    if (data.name !== undefined || data.parentId !== undefined) {
      const newName = data.name || folder.name;
      const newParentId = data.parentId !== undefined ? data.parentId : folder.parentId;
      
      let newPath = newName;
      if (newParentId) {
        const parentPath = await FileFolderModel.getPath(newParentId);
        newPath = parentPath ? `${parentPath}/${newName}` : newName;
      }

      // Update folder with new path
      return await FileFolderModel.update(folderId, { ...data, path: newPath });
    }

    return await FileFolderModel.update(folderId, data);
  }

  static async deleteFolder(folderId: string, userId: string): Promise<boolean> {
    const folder = await FileFolderModel.findById(folderId);
    
    if (!folder) {
      throw new Error('Folder not found');
    }

    // Check ownership
    if (folder.createdBy !== userId) {
      throw new Error('Access denied: You can only delete your own folders');
    }

    // Check if folder contains files
    const files = await FileModel.findByFolderId(folderId);
    if (files.length > 0) {
      throw new Error('Cannot delete folder: Folder contains files');
    }

    // Check if folder has subfolders
    const subfolders = await FileFolderModel.getFolderTree(userId, folderId);
    if (subfolders.length > 0) {
      throw new Error('Cannot delete folder: Folder contains subfolders');
    }

    return await FileFolderModel.delete(folderId);
  }

  static async getFolderContents(folderId: string, userId?: string): Promise<{
    folder: FileFolder | null;
    files: FileUpload[];
    subfolders: FileFolder[];
  }> {
    const folder = await this.getFolder(folderId, userId);
    
    if (!folder) {
      throw new Error('Folder not found');
    }

    const [files, subfolders] = await Promise.all([
      FileModel.findByFolderId(folderId, userId),
      FileFolderModel.getFolderTree(userId || folder.createdBy, folderId)
    ]);

    return {
      folder,
      files,
      subfolders
    };
  }

  static async getFolderTree(userId: string, parentId?: string): Promise<FileFolder[]> {
    return await FileFolderModel.getFolderTree(userId, parentId);
  }

  static async getFileStats(userId: string): Promise<FileStats> {
    const fileStats = await FileModel.getStats(userId);
    
    // Get folder count
    const { getPool } = await import('../../core/config/database');
    const folderCountQuery = 'SELECT COUNT(*) as count FROM file_folders WHERE created_by = $1';
    const folderResult = await getPool().query(folderCountQuery, [userId]);
    const totalFolders = parseInt(folderResult.rows[0].count);

    // Get storage limit (you might want to implement user-specific storage limits)
    const storageLimit = 1024 * 1024 * 1024; // 1GB default limit

    return {
      totalFiles: fileStats.totalFiles,
      totalSize: fileStats.totalSize,
      totalFolders,
      storageUsed: fileStats.totalSize,
      storageLimit,
      fileTypes: fileStats.fileTypes
    };
  }

  static async searchFiles(userId: string, searchTerm: string, query: FileQuery = {}): Promise<FileUpload[]> {
    const result = await FileModel.findByUserId(userId, {
      ...query,
      search: searchTerm,
      limit: 100 // Limit search results
    });

    return result.files;
  }

  static async searchFolders(userId: string, searchTerm: string, query: FolderQuery = {}): Promise<FileFolder[]> {
    const result = await FileFolderModel.findByUserId(userId, {
      ...query,
      search: searchTerm,
      limit: 50 // Limit search results
    });

    return result.folders;
  }

  static async moveFile(fileId: string, targetFolderId: string | null, userId: string): Promise<FileUpload | null> {
    const file = await FileModel.findById(fileId);
    
    if (!file) {
      throw new Error('File not found');
    }

    // Check ownership
    if (file.uploadedBy !== userId) {
      throw new Error('Access denied: You can only move your own files');
    }

    // If target folder is specified, check access
    if (targetFolderId) {
      const targetFolder = await FileFolderModel.findById(targetFolderId);
      if (!targetFolder || (!targetFolder.isPublic && targetFolder.createdBy !== userId)) {
        throw new Error('Access denied: Cannot move file to this folder');
      }
    }

    return await FileModel.update(fileId, { folderId: targetFolderId });
  }

  static async copyFile(fileId: string, targetFolderId: string | null, userId: string): Promise<FileUpload | null> {
    const originalFile = await FileModel.findById(fileId);
    
    if (!originalFile) {
      throw new Error('File not found');
    }

    // Check access permissions
    if (!originalFile.isPublic && originalFile.uploadedBy !== userId) {
      throw new Error('Access denied: You can only copy files you have access to');
    }

    // If target folder is specified, check access
    if (targetFolderId) {
      const targetFolder = await FileFolderModel.findById(targetFolderId);
      if (!targetFolder || (!targetFolder.isPublic && targetFolder.createdBy !== userId)) {
        throw new Error('Access denied: Cannot copy file to this folder');
      }
    }

    // Copy file in S3
    const newFileName = `copy-${Date.now()}-${originalFile.fileName}`;
    const newS3Key = `uploads/${userId}/${newFileName}`;
    
    try {
      const newS3Url = await S3Service.copyFile(originalFile.s3Key, newS3Key);
      
      // Create new file record
      const copiedFile = await FileModel.create({
        fileName: newFileName,
        originalName: `Copy of ${originalFile.originalName}`,
        mimeType: originalFile.mimeType,
        fileSize: originalFile.fileSize,
        s3Key: newS3Key,
        s3Url: newS3Url,
        isPublic: originalFile.isPublic,
        folderId: targetFolderId,
        uploadedBy: userId
      });

      return copiedFile;
    } catch (error) {
      throw new Error('Failed to copy file');
    }
  }
}