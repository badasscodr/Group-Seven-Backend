-- Create conversations table for messaging
CREATE TABLE IF NOT EXISTS conversations (
  "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "participants" JSONB NOT NULL,
  "lastMessageId" UUID,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for faster participant lookups
CREATE INDEX IF NOT EXISTS "idxConversationsParticipants" ON conversations USING GIN ("participants");
CREATE INDEX IF NOT EXISTS "idxConversationsUpdatedAt" ON conversations ("updatedAt" DESC);

SELECT 'Conversations table created successfully' AS status;
