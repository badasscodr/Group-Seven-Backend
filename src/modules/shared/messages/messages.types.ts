export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  avatar?: string;
  isOnline?: boolean;
  lastSeen?: string;
  department?: string;
  position?: string;
  companyName?: string;
  businessType?: string;
}

export interface Message {
  id: string;
  content: string;
  senderId: string;
  recipientId: string;
  conversationId: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Conversation {
  id: string;
  participants: string[]; // User IDs
  lastMessageId?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ConversationWithDetails extends Conversation {
  participantDetails: User[];
  lastMessage?: Message;
}

export interface CreateMessageRequest {
  content: string;
  recipientId: string;
  messageType?: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
}

export interface GetMessagesQuery {
  conversationId?: string;
  limit?: number;
  offset?: number;
  before?: string;
}

export interface GetConversationsQuery {
  limit?: number;
  offset?: number;
  search?: string;
}

export interface MessageResponse {
  id: string;
  content: string;
  sender: User;
  recipient: User;
  conversationId: string;
  timestamp: string;
  isRead: boolean;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
}

export interface ConversationResponse {
  id: string;
  participants: User[];
  lastMessage?: MessageResponse;
  unreadCount: number;
  updatedAt: string;
}