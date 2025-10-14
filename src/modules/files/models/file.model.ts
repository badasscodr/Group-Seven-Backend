import { pool } from '../../core/config/database';
import { 
  FileUpload, 
  FileFolder, 
  CreateFileRequest, 
  UpdateFileRequest, 
  FileQuery,
  CreateFolderRequest
} from '../types/file.types';

export class FileModel {
  static async create(data: CreateFileRequest & { uploadedBy: string }): Promise<FileUpload> {
    const query = `
      INSERT INTO file_uploads (
        file_name, original_name, mime_type, file_size, s3_key, s3_url, uploaded_by, is_public, folder_id
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    
    const values = [
      data.fileName,
      data.originalName,
      data.mimeType,
      data.fileSize,
      data.s3Key,
      data.s3Url,
      data.uploadedBy,
      data.isPublic || false,
      data.folderId || null
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: string): Promise<FileUpload | null> {
    const query = `
      SELECT f.*, 
             u.first_name || ' ' || u.last_name as uploader_name,
             u.email as uploader_email
      FROM file_uploads f
      JOIN users u ON f.uploaded_by = u.id
      WHERE f.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string, query: FileQuery): Promise<{ files: FileUpload[]; total: number }> {
    const { 
      page = 1, 
      limit = 20, 
      folderId, 
      mimeType, 
      isPublic, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE f.uploaded_by = $1';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (folderId) {
      whereClause += ` AND f.folder_id = $${paramIndex}`;
      queryParams.push(folderId);
      paramIndex++;
    }

    if (mimeType) {
      whereClause += ` AND f.mime_type ILIKE $${paramIndex}`;
      queryParams.push(`%${mimeType}%`);
      paramIndex++;
    }

    if (isPublic !== undefined) {
      whereClause += ` AND f.is_public = $${paramIndex}`;
      queryParams.push(isPublic);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (f.file_name ILIKE $${paramIndex} OR f.original_name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sort field
    const validSortFields = ['createdAt', 'updatedAt', 'fileName', 'fileSize'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM file_uploads f
      ${whereClause}
    `;

    const filesQuery = `
      SELECT f.*, 
             u.first_name || ' ' || u.last_name as uploader_name,
             u.email as uploader_email
      FROM file_uploads f
      JOIN users u ON f.uploaded_by = u.id
      ${whereClause}
      ORDER BY f.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const [countResult, filesResult] = await Promise.all([
      pool.query(countQuery, queryParams.slice(0, -2)),
      pool.query(filesQuery, queryParams)
    ]);

    return {
      files: filesResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async findPublic(query: FileQuery): Promise<{ files: FileUpload[]; total: number }> {
    const { 
      page = 1, 
      limit = 20, 
      folderId, 
      mimeType, 
      search,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE f.is_public = true';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (folderId) {
      whereClause += ` AND f.folder_id = $${paramIndex}`;
      queryParams.push(folderId);
      paramIndex++;
    }

    if (mimeType) {
      whereClause += ` AND f.mime_type ILIKE $${paramIndex}`;
      queryParams.push(`%${mimeType}%`);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (f.file_name ILIKE $${paramIndex} OR f.original_name ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sort field
    const validSortFields = ['createdAt', 'updatedAt', 'fileName', 'fileSize'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM file_uploads f
      ${whereClause}
    `;

    const filesQuery = `
      SELECT f.*, 
             u.first_name || ' ' || u.last_name as uploader_name,
             u.email as uploader_email
      FROM file_uploads f
      JOIN users u ON f.uploaded_by = u.id
      ${whereClause}
      ORDER BY f.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const [countResult, filesResult] = await Promise.all([
      pool.query(countQuery, queryParams.slice(0, -2)),
      pool.query(filesQuery, queryParams)
    ]);

    return {
      files: filesResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async update(id: string, data: UpdateFileRequest): Promise<FileUpload | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.fileName !== undefined) {
      updateFields.push(`file_name = $${paramIndex}`);
      values.push(data.fileName);
      paramIndex++;
    }

    if (data.isPublic !== undefined) {
      updateFields.push(`is_public = $${paramIndex}`);
      values.push(data.isPublic);
      paramIndex++;
    }

    if (data.folderId !== undefined) {
      updateFields.push(`folder_id = $${paramIndex}`);
      values.push(data.folderId);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE file_uploads 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM file_uploads WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async incrementDownloadCount(id: string): Promise<boolean> {
    const query = `
      UPDATE file_uploads 
      SET download_count = download_count + 1
      WHERE id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async getStats(userId: string): Promise<{
    totalFiles: number;
    totalSize: number;
    fileTypes: { [mimeType: string]: number };
  }> {
    const query = `
      SELECT 
        COUNT(*) as total_files,
        COALESCE(SUM(file_size), 0) as total_size,
        mime_type
      FROM file_uploads 
      WHERE uploaded_by = $1
      GROUP BY mime_type
    `;
    
    const result = await pool.query(query, [userId]);
    
    const stats = {
      totalFiles: 0,
      totalSize: 0,
      fileTypes: {} as { [mimeType: string]: number }
    };

    for (const row of result.rows) {
      stats.totalFiles += parseInt(row.total_files);
      stats.totalSize += parseInt(row.total_size);
      stats.fileTypes[row.mime_type] = parseInt(row.total_files);
    }

    return stats;
  }

  static async findByFolderId(folderId: string, userId?: string): Promise<FileUpload[]> {
    let query = `
      SELECT f.*, 
             u.first_name || ' ' || u.last_name as uploader_name,
             u.email as uploader_email
      FROM file_uploads f
      JOIN users u ON f.uploaded_by = u.id
      WHERE f.folder_id = $1
    `;
    
    const params: any[] = [folderId];

    if (userId) {
      query += ' AND (f.uploaded_by = $2 OR f.is_public = true)';
      params.push(userId);
    }

    query += ' ORDER BY f.file_name ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }
}

export class FileFolderModel {
  static async create(data: CreateFolderRequest & { createdBy: string; path: string }): Promise<FileFolder> {
    const query = `
      INSERT INTO file_folders (
        name, description, parent_id, path, created_by, is_public
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;
    
    const values = [
      data.name,
      data.description || null,
      data.parentId || null,
      data.path,
      data.createdBy,
      data.isPublic || false
    ];

    const result = await pool.query(query, values);
    return result.rows[0];
  }

  static async findById(id: string): Promise<FileFolder | null> {
    const query = `
      SELECT f.*, 
             u.first_name || ' ' || u.last_name as creator_name,
             u.email as creator_email
      FROM file_folders f
      JOIN users u ON f.created_by = u.id
      WHERE f.id = $1
    `;
    
    const result = await pool.query(query, [id]);
    return result.rows[0] || null;
  }

  static async findByUserId(userId: string, query: any): Promise<{ folders: FileFolder[]; total: number }> {
    const { 
      page = 1, 
      limit = 20, 
      parentId, 
      isPublic, 
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE f.created_by = $1';
    const queryParams: any[] = [userId];
    let paramIndex = 2;

    if (parentId !== undefined) {
      whereClause += ` AND f.parent_id ${parentId ? '= $' + paramIndex : 'IS NULL'}`;
      if (parentId) {
        queryParams.push(parentId);
        paramIndex++;
      }
    }

    if (isPublic !== undefined) {
      whereClause += ` AND f.is_public = $${paramIndex}`;
      queryParams.push(isPublic);
      paramIndex++;
    }

    if (search) {
      whereClause += ` AND (f.name ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sort field
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM file_folders f
      ${whereClause}
    `;

    const foldersQuery = `
      SELECT f.*, 
             u.first_name || ' ' || u.last_name as creator_name,
             u.email as creator_email
      FROM file_folders f
      JOIN users u ON f.created_by = u.id
      ${whereClause}
      ORDER BY f.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const [countResult, foldersResult] = await Promise.all([
      pool.query(countQuery, queryParams.slice(0, -2)),
      pool.query(foldersQuery, queryParams)
    ]);

    return {
      folders: foldersResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async findPublic(query: any): Promise<{ folders: FileFolder[]; total: number }> {
    const { 
      page = 1, 
      limit = 20, 
      parentId, 
      search,
      sortBy = 'name',
      sortOrder = 'asc'
    } = query;
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE f.is_public = true';
    const queryParams: any[] = [];
    let paramIndex = 1;

    if (parentId !== undefined) {
      whereClause += ` AND f.parent_id ${parentId ? '= $' + paramIndex : 'IS NULL'}`;
      if (parentId) {
        queryParams.push(parentId);
        paramIndex++;
      }
    }

    if (search) {
      whereClause += ` AND (f.name ILIKE $${paramIndex} OR f.description ILIKE $${paramIndex})`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Validate sort field
    const validSortFields = ['createdAt', 'updatedAt', 'name'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    const sortDirection = sortOrder === 'asc' ? 'ASC' : 'DESC';

    const countQuery = `
      SELECT COUNT(*) as total
      FROM file_folders f
      ${whereClause}
    `;

    const foldersQuery = `
      SELECT f.*, 
             u.first_name || ' ' || u.last_name as creator_name,
             u.email as creator_email
      FROM file_folders f
      JOIN users u ON f.created_by = u.id
      ${whereClause}
      ORDER BY f.${sortField} ${sortDirection}
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const [countResult, foldersResult] = await Promise.all([
      pool.query(countQuery, queryParams.slice(0, -2)),
      pool.query(foldersQuery, queryParams)
    ]);

    return {
      folders: foldersResult.rows,
      total: parseInt(countResult.rows[0].total)
    };
  }

  static async update(id: string, data: any): Promise<FileFolder | null> {
    const updateFields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updateFields.push(`name = $${paramIndex}`);
      values.push(data.name);
      paramIndex++;
    }

    if (data.description !== undefined) {
      updateFields.push(`description = $${paramIndex}`);
      values.push(data.description);
      paramIndex++;
    }

    if (data.parentId !== undefined) {
      updateFields.push(`parent_id = $${paramIndex}`);
      values.push(data.parentId);
      paramIndex++;
    }

    if (data.isPublic !== undefined) {
      updateFields.push(`is_public = $${paramIndex}`);
      values.push(data.isPublic);
      paramIndex++;
    }

    if (updateFields.length === 0) {
      return this.findById(id);
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    values.push(id);

    const query = `
      UPDATE file_folders 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;

    const result = await pool.query(query, values);
    return result.rows[0] || null;
  }

  static async delete(id: string): Promise<boolean> {
    const query = 'DELETE FROM file_folders WHERE id = $1';
    const result = await pool.query(query, [id]);
    return result.rowCount > 0;
  }

  static async getFolderTree(userId: string, parentId?: string): Promise<FileFolder[]> {
    let query = `
      SELECT f.*, 
             u.first_name || ' ' || u.last_name as creator_name
      FROM file_folders f
      JOIN users u ON f.created_by = u.id
      WHERE f.created_by = $1
    `;
    
    const params: any[] = [userId];

    if (parentId !== undefined) {
      query += ' AND f.parent_id ' + (parentId ? '= $2' : 'IS NULL');
      if (parentId) params.push(parentId);
    }

    query += ' ORDER BY f.name ASC';

    const result = await pool.query(query, params);
    return result.rows;
  }

  static async getPath(folderId: string): Promise<string> {
    const query = `
      WITH RECURSIVE folder_path AS (
        SELECT id, name, parent_id, name as path
        FROM file_folders
        WHERE id = $1
        
        UNION ALL
        
        SELECT f.id, f.name, f.parent_id, f.name || '/' || fp.path
        FROM file_folders f
        JOIN folder_path fp ON f.id = fp.parent_id
      )
      SELECT path FROM folder_path WHERE parent_id IS NULL
    `;
    
    const result = await pool.query(query, [folderId]);
    return result.rows[0]?.path || '';
  }
}