-- Add password reset fields to users table

ALTER TABLE users
ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255),
ADD COLUMN IF NOT EXISTS reset_token_expiry TIMESTAMP,
ADD COLUMN IF NOT EXISTS last_password_change TIMESTAMP;

-- Create index for reset token lookups
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Add comment
COMMENT ON COLUMN users.reset_token IS 'Token for password reset verification';
COMMENT ON COLUMN users.reset_token_expiry IS 'Expiry timestamp for reset token';
COMMENT ON COLUMN users.last_password_change IS 'Timestamp of last password change';
