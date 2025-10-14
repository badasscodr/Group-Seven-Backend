export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: 'text' | 'image' | 'file' | 'system';
  replyToId?: string;
  attachments?: MessageAttachment[];
  isEdited: boolean;
  editedAt?: Date;
  sentAt: Date;
  readAt?: Date;
  deletedAt?: Date;
  deletedBy?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface MessageAttachment {
  id: string;
  messageId: string;
  fileName: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  s3Key: string;
  s3Url: string;
  uploadedBy: string;
  createdAt: Date;
}

export interface Conversation {
  id: string;
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatarUrl?: string;
  participantIds: string[];
  adminIds: string[];
  createdBy: string;
  lastMessageId?: string;
  lastMessageAt?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ConversationParticipant {
  id: string;
  conversationId: string;
  userId: string;
  role: 'admin' | 'member';
  joinedAt: Date;
  leftAt?: Date;
  isMuted: boolean;
  lastReadAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateMessageRequest {
  conversationId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file' | 'system';
  replyToId?: string;
  attachments?: {
    fileName: string;
    originalName: string;
    mimeType: string;
    fileSize: number;
    s3Key: string;
    s3Url: string;
  }[];
}

export interface UpdateMessageRequest {
  content: string;
}

export interface CreateConversationRequest {
  type: 'direct' | 'group';
  name?: string;
  description?: string;
  avatarUrl?: string;
  participantIds: string[];
  adminIds?: string[];
}

export interface UpdateConversationRequest {
  name?: string;
  description?: string;
  avatarUrl?: string;
  participantIds?: string[];
  adminIds?: string[];
}

export interface MessageQuery {
  conversationId: string;
  page?: number;
  limit?: number;
  before?: Date;
  after?: Date;
  search?: string;
}

export interface ConversationQuery {
  page?: number;
  limit?: number;
  type?: 'direct' | 'group';
  isActive?: boolean;
  search?: string;
}

export interface UnreadCount {
  conversationId: string;
  count: number;
}

export interface TypingIndicator {
  conversationId: string;
  userId: string;
  userName: string;
  isTyping: boolean;
  timestamp: Date;
}

export interface OnlineUser {
  userId: string;
  userName: string;
  socketId: string;
  lastSeen: Date;
}

export interface MessageEvent {
  type: 'message:sent' | 'message:edited' | 'message:deleted' | 'message:read';
  message: Message;
  conversationId: string;
  userId: string;
}

export interface ConversationEvent {
  type: 'conversation:created' | 'conversation:updated' | 'conversation:participant_added' | 'conversation:participant_removed' | 'conversation:admin_added' | 'conversation:admin_removed';
  conversation: Conversation;
  userId: string;
  participantId?: string;
}

export interface TypingEvent {
  type: 'typing:started' | 'typing:stopped';
  conversationId: string;
  user: {
    id: string;
    name: string;
  };
}

export interface PresenceEvent {
  type: 'user:online' | 'user:offline';
  user: {
    id: string;
    name: string;
  };
}