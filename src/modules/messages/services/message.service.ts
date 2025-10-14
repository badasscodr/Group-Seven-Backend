import { MessageModel } from '../models/message.model';
import { ConversationModel } from '../models/conversation.model';
import { Message, Conversation, CreateMessageRequest, UpdateMessageRequest, MessageType, MessageStatus, ConversationType } from '../../shared/types';
import { socketService } from '../../shared/services/socket.service';

export class MessageService {
  static async sendMessage(senderId: string, data: CreateMessageRequest): Promise<Message> {
    // Verify sender is participant in conversation
    const isParticipant = await ConversationModel.isParticipant(data.conversationId, senderId);
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Create message
    const message = await MessageModel.create({
      conversationId: data.conversationId,
      senderId,
      content: data.content,
      type: (data.type || 'text') as MessageType,
      status: 'sent' as MessageStatus
    });

    // Update conversation's last message timestamp
    await ConversationModel.updateLastMessageAt(data.conversationId);

    // Get conversation details for socket emission
    const conversation = await ConversationModel.findById(data.conversationId);
    if (conversation) {
      // Emit to all participants in the conversation
      const participantIds = conversation.participants.map(p => p.userId);
      socketService.emitToConversation(data.conversationId, 'newMessage', {
        message,
        conversation
      });

      // Send notifications to offline participants
      participantIds.forEach(participantId => {
        if (participantId !== senderId) {
          socketService.sendNotification(participantId, {
            type: 'new_message',
            data: {
              message,
              conversation,
              senderId
            }
          });
        }
      });
    }

    return message;
  }

  static async getMessages(conversationId: string, userId: string, limit: number = 50, offset: number = 0): Promise<Message[]> {
    // Verify user is participant in conversation
    const isParticipant = await ConversationModel.isParticipant(conversationId, userId);
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    return MessageModel.findByConversationId(conversationId, limit, offset);
  }

  static async getMessage(messageId: string, userId: string): Promise<Message | null> {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      return null;
    }

    // Verify user is participant in conversation
    const isParticipant = await ConversationModel.isParticipant(message.conversationId, userId);
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    return MessageModel.findWithAttachments(messageId);
  }

  static async editMessage(messageId: string, userId: string, data: UpdateMessageRequest): Promise<Message | null> {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is the sender
    if (message.senderId !== userId) {
      throw new Error('Only message sender can edit the message');
    }

    // Update message
    const updatedMessage = await MessageModel.update(messageId, {
      content: data.content,
      editedAt: new Date(),
      status: 'edited' as MessageStatus
    });

    if (updatedMessage) {
      // Emit edit event to conversation
      socketService.emitToConversation(message.conversationId, 'messageEdited', {
        messageId,
        content: data.content,
        editedAt: updatedMessage.editedAt
      });
    }

    return updatedMessage;
  }

  static async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is the sender or admin/moderator
    const conversation = await ConversationModel.findById(message.conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    const userRole = conversation.participants.find(p => p.userId === userId)?.role;
    const canDelete = message.senderId === userId || userRole === 'admin' || userRole === 'moderator';

    if (!canDelete) {
      throw new Error('Insufficient permissions to delete this message');
    }

    // Soft delete message
    const deleted = await MessageModel.softDelete(messageId, userId);

    if (deleted) {
      // Emit delete event to conversation
      socketService.emitToConversation(message.conversationId, 'messageDeleted', {
        messageId,
        deletedBy: userId
      });
    }

    return deleted;
  }

  static async markAsRead(messageId: string, userId: string): Promise<boolean> {
    const message = await MessageModel.findById(messageId);
    if (!message) {
      throw new Error('Message not found');
    }

    // Don't mark own messages as read
    if (message.senderId === userId) {
      return false;
    }

    // Verify user is participant in conversation
    const isParticipant = await ConversationModel.isParticipant(message.conversationId, userId);
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Mark as read
    const marked = await MessageModel.markAsRead(messageId, userId);

    if (marked) {
      // Update participant's last read timestamp
      await this.updateParticipantLastRead(message.conversationId, userId);

      // Emit read receipt to conversation
      socketService.emitToConversation(message.conversationId, 'messageRead', {
        messageId,
        userId,
        readAt: new Date()
      });

      // Send read receipt to message sender
      socketService.emitToUser(message.senderId, 'messageReadReceipt', {
        messageId,
        userId,
        readAt: new Date()
      });
    }

    return marked;
  }

  static async getUnreadCount(userId: string, conversationId?: string): Promise<number> {
    if (conversationId) {
      // Verify user is participant in conversation
      const isParticipant = await ConversationModel.isParticipant(conversationId, userId);
      if (!isParticipant) {
        throw new Error('User is not a participant in this conversation');
      }
    }

    return MessageModel.getUnreadCount(userId, conversationId);
  }

  static async createConversation(userId: string, data: {
    name?: string;
    type: 'direct' | 'group';
    description?: string;
    participantIds: string[];
  }): Promise<Conversation> {
    // For direct messages, check if conversation already exists
    if (data.type === 'direct' && data.participantIds.length === 1) {
      const existingConversation = await ConversationModel.findDirectMessage(userId, data.participantIds[0]);
      if (existingConversation) {
        return existingConversation;
      }
    }

    // Create conversation
    const conversation = await ConversationModel.create({
      name: data.name,
      type: data.type as ConversationType,
      description: data.description,
      createdBy: userId
    });
    
    // Add participants
    await ConversationModel.addParticipants(conversation.id, [userId, ...data.participantIds]);

    // Notify participants
    const participantIds = [userId, ...data.participantIds];
    participantIds.forEach(participantId => {
      socketService.emitToUser(participantId, 'conversationCreated', {
        conversation,
        createdBy: userId
      });
    });

    return conversation;
  }

  static async getUserConversations(userId: string, limit: number = 20, offset: number = 0): Promise<Conversation[]> {
    return ConversationModel.findByUserId(userId, limit, offset);
  }

  static async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      return null;
    }

    // Verify user is participant
    const isParticipant = conversation.participants.some(p => p.userId === userId);
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    return conversation;
  }

  static async addParticipants(conversationId: string, userId: string, participantIds: string[]): Promise<void> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check if user has permission (admin or moderator)
    const userRole = conversation.participants.find(p => p.userId === userId)?.role;
    const canAddParticipants = userRole === 'admin' || userRole === 'moderator';

    if (!canAddParticipants) {
      throw new Error('Insufficient permissions to add participants');
    }

    // Add participants
    await ConversationModel.addParticipants(conversationId, participantIds);

    // Get updated conversation
    const updatedConversation = await ConversationModel.findById(conversationId);

    // Notify existing participants
    conversation.participants.forEach(participant => {
      socketService.emitToUser(participant.userId, 'participantsAdded', {
        conversationId,
        newParticipants: participantIds,
        addedBy: userId
      });
    });

    // Notify new participants
    participantIds.forEach(participantId => {
      socketService.emitToUser(participantId, 'addedToConversation', {
        conversation: updatedConversation,
        addedBy: userId
      });
    });
  }

  static async removeParticipant(conversationId: string, userId: string, participantId: string): Promise<void> {
    const conversation = await ConversationModel.findById(conversationId);
    if (!conversation) {
      throw new Error('Conversation not found');
    }

    // Check permissions (admin/moderator can remove others, anyone can leave themselves)
    const userRole = conversation.participants.find(p => p.userId === userId)?.role;
    const canRemove = userId === participantId || userRole === 'admin' || userRole === 'moderator';

    if (!canRemove) {
      throw new Error('Insufficient permissions to remove participant');
    }

    // Remove participant
    const removed = await ConversationModel.removeParticipant(conversationId, participantId);
    if (!removed) {
      throw new Error('Participant not found in conversation');
    }

    // Notify remaining participants
    conversation.participants.forEach(participant => {
      if (participant.userId !== participantId) {
        socketService.emitToUser(participant.userId, 'participantRemoved', {
          conversationId,
          removedParticipant: participantId,
          removedBy: userId
        });
      }
    });

    // Notify removed participant
    socketService.emitToUser(participantId, 'removedFromConversation', {
      conversationId,
      removedBy: userId
    });
  }

  private static async updateParticipantLastRead(conversationId: string, userId: string): Promise<void> {
    const { pool } = await import('../../core/config/database');
    const query = `
      UPDATE conversation_participants 
      SET last_read_at = CURRENT_TIMESTAMP
      WHERE conversation_id = $1 AND user_id = $2
    `;
    
    await pool.query(query, [conversationId, userId]);
  }
}