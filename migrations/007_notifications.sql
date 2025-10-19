-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('service_request', 'admin_action', 'system')),
    related_id UUID, -- ID of related entity (request_id, user_id, etc.)
    related_type VARCHAR(50), -- 'service_request', 'user', 'quotation', etc.
    status VARCHAR(20) DEFAULT 'unread' CHECK (status IN ('read', 'unread')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    metadata JSONB DEFAULT '{}', -- Additional data as JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    read_at TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_status ON notifications(status);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_related ON notifications(related_type, related_id);

-- Add comments for documentation
COMMENT ON TABLE notifications IS 'Stores system notifications for users';
COMMENT ON COLUMN notifications.id IS 'Unique identifier for the notification';
COMMENT ON COLUMN notifications.user_id IS 'User who receives this notification';
COMMENT ON COLUMN notifications.title IS 'Notification title (short description)';
COMMENT ON COLUMN notifications.message IS 'Full notification message';
COMMENT ON COLUMN notifications.type IS 'Type of notification: service_request, admin_action, system';
COMMENT ON COLUMN notifications.related_id IS 'ID of related entity (if applicable)';
COMMENT ON COLUMN notifications.related_type IS 'Type of related entity (if applicable)';
COMMENT ON COLUMN notifications.status IS 'read/unread status';
COMMENT ON COLUMN notifications.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN notifications.metadata IS 'Additional data stored as JSON';
COMMENT ON COLUMN notifications.created_at IS 'When notification was created';
COMMENT ON COLUMN notifications.read_at IS 'When notification was marked as read';
