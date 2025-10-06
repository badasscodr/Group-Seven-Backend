-- Migration: Add soft delete functionality to conversations
-- This allows conversations to be hidden for specific users without affecting others

-- Add deletedBy column to track which users have deleted/hidden the conversation
ALTER TABLE conversations
ADD COLUMN IF NOT EXISTS "deletedBy" JSONB DEFAULT '[]'::jsonb;

-- Add comment for clarity
COMMENT ON COLUMN conversations."deletedBy" IS 'Array of user IDs who have deleted/hidden this conversation';

-- Create index for faster queries when filtering deleted conversations
CREATE INDEX IF NOT EXISTS idx_conversations_deleted_by ON conversations USING gin("deletedBy");
