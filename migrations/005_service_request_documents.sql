-- Migration: Create service_request_documents table
-- Description: Associates documents with service requests

-- Create service_request_documents table
CREATE TABLE IF NOT EXISTS service_request_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_request_id UUID NOT NULL REFERENCES service_requests(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES file_uploads(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    
    -- Ensure each document is only associated once with a service request
    UNIQUE(service_request_id, document_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_request_documents_request_id ON service_request_documents(service_request_id);
CREATE INDEX IF NOT EXISTS idx_service_request_documents_document_id ON service_request_documents(document_id);
CREATE INDEX IF NOT EXISTS idx_service_request_documents_created_at ON service_request_documents(created_at);

-- Add comments for documentation
COMMENT ON TABLE service_request_documents IS 'Associates uploaded documents with service requests';
COMMENT ON COLUMN service_request_documents.service_request_id IS 'The service request this document belongs to';
COMMENT ON COLUMN service_request_documents.document_id IS 'The uploaded file associated with the service request';
COMMENT ON COLUMN service_request_documents.created_by IS 'The user who associated the document with the request';
