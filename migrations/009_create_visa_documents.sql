-- Migration: Create visa_documents table for enhanced visa management
-- This table extends the basic document management with visa-specific features

-- Create visa_documents table
CREATE TABLE IF NOT EXISTS visa_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    visa_type VARCHAR(20) NOT NULL CHECK (visa_type IN (
        'tourist', 'work', 'student', 'business', 'transit',
        'residence', 'family', 'medical', 'diplomatic', 'other'
    )),
    visa_number VARCHAR(100) NOT NULL,
    issued_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    issuing_country VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN (
        'active', 'expired', 'expiring_soon', 'expiring_critical',
        'pending', 'cancelled', 'renewal_required'
    )),
    notifications_sent INTEGER DEFAULT 0,
    last_notification_date TIMESTAMP,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    -- Constraints
    CONSTRAINT visa_expiry_after_issued CHECK (expiry_date > issued_date),
    CONSTRAINT unique_document_visa UNIQUE (document_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_visa_documents_user_id ON visa_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_visa_documents_expiry_date ON visa_documents(expiry_date);
CREATE INDEX IF NOT EXISTS idx_visa_documents_status ON visa_documents(status);
CREATE INDEX IF NOT EXISTS idx_visa_documents_visa_type ON visa_documents(visa_type);
CREATE INDEX IF NOT EXISTS idx_visa_documents_is_active ON visa_documents(is_active);
CREATE INDEX IF NOT EXISTS idx_visa_documents_expiry_status ON visa_documents(expiry_date, status) WHERE is_active = true;

-- Create visa_notifications table for tracking notification history
CREATE TABLE IF NOT EXISTS visa_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visa_id UUID NOT NULL REFERENCES visa_documents(id) ON DELETE CASCADE,
    notification_type VARCHAR(10) NOT NULL CHECK (notification_type IN ('email', 'system', 'both')),
    days_before_expiry INTEGER NOT NULL,
    sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(10) NOT NULL DEFAULT 'pending' CHECK (status IN ('sent', 'failed', 'pending')),
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for visa_notifications
CREATE INDEX IF NOT EXISTS idx_visa_notifications_user_id ON visa_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_visa_notifications_visa_id ON visa_notifications(visa_id);
CREATE INDEX IF NOT EXISTS idx_visa_notifications_sent_at ON visa_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_visa_notifications_status ON visa_notifications(status);

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_visa_documents_updated_at
    BEFORE UPDATE ON visa_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data (optional - can be removed in production)
-- This assumes there are existing users and documents
DO $$
BEGIN
    -- Only insert if there are users and visa documents available
    IF (SELECT COUNT(*) FROM users WHERE role = 'employee') > 0 AND
       (SELECT COUNT(*) FROM documents WHERE category = 'visa') > 0 THEN

        -- Insert sample visa records for testing
        INSERT INTO visa_documents (
            user_id,
            document_id,
            visa_type,
            visa_number,
            issued_date,
            expiry_date,
            issuing_country,
            status,
            is_active
        )
        SELECT
            u.id as user_id,
            d.id as document_id,
            'work' as visa_type,
            'WK' || LPAD(CAST(RANDOM() * 1000000 AS INT)::TEXT, 6, '0') as visa_number,
            CURRENT_DATE - INTERVAL '1 year' as issued_date,
            CURRENT_DATE + INTERVAL '6 months' as expiry_date,
            'United States' as issuing_country,
            'active' as status,
            true as is_active
        FROM users u
        CROSS JOIN LATERAL (
            SELECT id
            FROM documents
            WHERE user_id = u.id AND category = 'visa'
            LIMIT 1
        ) d
        WHERE u.role = 'employee'
        LIMIT 3
        ON CONFLICT (document_id) DO NOTHING;

    END IF;
END $$;

-- Add helpful comments
COMMENT ON TABLE visa_documents IS 'Enhanced visa document management with expiry tracking and status management';
COMMENT ON TABLE visa_notifications IS 'Tracks notification history for visa expiry alerts';
COMMENT ON COLUMN visa_documents.status IS 'Auto-calculated based on expiry date: active, expiring_soon (30 days), expiring_critical (7 days), expired';
COMMENT ON COLUMN visa_documents.notifications_sent IS 'Counter for number of expiry notifications sent';
COMMENT ON COLUMN visa_documents.visa_type IS 'Type of visa: tourist, work, student, business, etc.';
COMMENT ON INDEX idx_visa_documents_expiry_status IS 'Optimized index for visa expiry status queries';