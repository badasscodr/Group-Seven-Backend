-- Add conversationId column to messages table
ALTER TABLE messages ADD COLUMN IF NOT EXISTS "conversationId" UUID REFERENCES conversations("id") ON DELETE CASCADE;

-- Add index for faster conversation message lookups
CREATE INDEX IF NOT EXISTS "idxMessagesConversationId" ON messages ("conversationId");

-- Add messageType and file fields if they don't exist
ALTER TABLE messages ADD COLUMN IF NOT EXISTS "fileUrl" TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS "fileName" TEXT;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

SELECT 'ConversationId column added to messages table successfully' AS status;
