-- =====================================================
-- FILE UPLOADS TABLE MIGRATION
-- =====================================================
-- This migration adds the file_uploads table that the FileService expects

-- Create file folders table for organization (must be created first)
CREATE TABLE IF NOT EXISTS file_folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES file_folders(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

-- Create file uploads table
CREATE TABLE IF NOT EXISTS file_uploads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    file_size INTEGER NOT NULL,
    s3_key TEXT NOT NULL,
    s3_url TEXT NOT NULL,
    uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    is_public BOOLEAN DEFAULT false,
    folder_id UUID REFERENCES file_folders(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    is_deleted BOOLEAN DEFAULT false
);

-- Indexes for file_uploads
CREATE INDEX IF NOT EXISTS idx_file_uploads_uploaded_by ON file_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_file_uploads_folder_id ON file_uploads(folder_id);
CREATE INDEX IF NOT EXISTS idx_file_uploads_is_public ON file_uploads(is_public);
CREATE INDEX IF NOT EXISTS idx_file_uploads_mime_type ON file_uploads(mime_type);
CREATE INDEX IF NOT EXISTS idx_file_uploads_created_at ON file_uploads(created_at);
CREATE INDEX IF NOT EXISTS idx_file_uploads_is_deleted ON file_uploads(is_deleted);

-- Indexes for file_folders
CREATE INDEX IF NOT EXISTS idx_file_folders_created_by ON file_folders(created_by);
CREATE INDEX IF NOT EXISTS idx_file_folders_parent_id ON file_folders(parent_id);
CREATE INDEX IF NOT EXISTS idx_file_folders_is_public ON file_folders(is_public);
CREATE INDEX IF NOT EXISTS idx_file_folders_is_deleted ON file_folders(is_deleted);

-- Trigger to update updated_at for file_uploads
CREATE TRIGGER update_file_uploads_updated_at 
    BEFORE UPDATE ON file_uploads 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger to update updated_at for file_folders
CREATE TRIGGER update_file_folders_updated_at 
    BEFORE UPDATE ON file_folders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create a default root folder for each user
INSERT INTO file_folders (name, created_by, is_public)
SELECT 'My Files', id, false
FROM users
WHERE id NOT IN (SELECT created_by FROM file_folders WHERE name = 'My Files')
ON CONFLICT DO NOTHING;

SELECT 'File uploads table migration completed successfully!' as status;