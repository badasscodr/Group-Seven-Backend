-- Migration: Fix service_request_documents foreign key constraint
-- Description: Update foreign key to reference documents table instead of file_uploads

-- Drop the existing foreign key constraint
ALTER TABLE service_request_documents DROP CONSTRAINT IF EXISTS service_request_documents_document_id_fkey;

-- Add the correct foreign key constraint to documents table
ALTER TABLE service_request_documents 
ADD CONSTRAINT service_request_documents_document_id_fkey 
FOREIGN KEY (document_id) REFERENCES documents(id) ON DELETE CASCADE;

-- Add comments for documentation
COMMENT ON CONSTRAINT service_request_documents_document_id_fkey ON service_request_documents IS 'Foreign key reference to documents table';
