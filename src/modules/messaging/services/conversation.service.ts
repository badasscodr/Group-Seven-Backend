import { ConversationModel, ConversationParticipantModel } from '../models/conversation.model';
import { MessageModel } from '../models/message.model';
import { 
  Conversation, 
  CreateConversationRequest, 
  UpdateConversationRequest, 
  ConversationQuery,
  ConversationParticipant
} from '../types/message.types';

export class ConversationService {
  static async createConversation(data: CreateConversationRequest & { createdBy: string }): Promise<Conversation> {
    // For direct conversations, check if one already exists
    if (data.type === 'direct' && data.participantIds.length === 2) {
      const existingConversation = await ConversationModel.findDirectConversation(
        data.participantIds[0],
        data.participantIds[1]
      );
      
      if (existingConversation) {
        return existingConversation;
      }
    }

    // Validate participants
    if (data.participantIds.length < 2) {
      throw new Error('Conversation must have at least 2 participants');
    }

    if (data.type === 'direct' && data.participantIds.length !== 2) {
      throw new Error('Direct conversations must have exactly 2 participants');
    }

    // Validate admin IDs
    const adminIds = data.adminIds || [data.createdBy];
    for (const adminId of adminIds) {
      if (!data.participantIds.includes(adminId)) {
        throw new Error('Admin IDs must be included in participant IDs');
      }
    }

    // Create conversation
    const conversation = await ConversationModel.create({
      ...data,
      adminIds
    });

    // Add participants to conversation_participants table
    for (const participantId of data.participantIds) {
      await ConversationParticipantModel.addParticipant({
        conversationId: conversation.id,
        userId: participantId,
        role: adminIds.includes(participantId) ? 'admin' : 'member'
      });
    }

    return conversation;
  }

  static async getConversation(conversationId: string, userId: string): Promise<Conversation | null> {
    const conversation = await ConversationModel.findById(conversationId);
    
    if (!conversation) {
      return null;
    }

    // Verify user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    return conversation;
  }

  static async getConversations(userId: string, query: ConversationQuery): Promise<{ conversations: Conversation[]; total: number }> {
    return await ConversationModel.findByUserId(userId, query);
  }

  static async updateConversation(
    conversationId: string, 
    data: UpdateConversationRequest, 
    userId: string
  ): Promise<Conversation | null> {
    // Verify user is admin in conversation
    const isAdmin = await ConversationParticipantModel.isAdmin(conversationId, userId);
    
    if (!isAdmin) {
      throw new Error('Only conversation admins can update conversation');
    }

    // Validate participant IDs if provided
    if (data.participantIds) {
      if (data.participantIds.length < 2) {
        throw new Error('Conversation must have at least 2 participants');
      }

      const conversation = await ConversationModel.findById(conversationId);
      if (conversation && conversation.type === 'direct' && data.participantIds.length !== 2) {
        throw new Error('Direct conversations must have exactly 2 participants');
      }
    }

    // Validate admin IDs if provided
    if (data.adminIds && data.participantIds) {
      for (const adminId of data.adminIds) {
        if (!data.participantIds.includes(adminId)) {
          throw new Error('Admin IDs must be included in participant IDs');
        }
      }
    }

    const updatedConversation = await ConversationModel.update(conversationId, data);

    if (!updatedConversation) {
      throw new Error('Failed to update conversation');
    }

    // Update participants if changed
    if (data.participantIds) {
      const currentParticipants = await ConversationParticipantModel.findByConversationId(conversationId);
      const currentParticipantIds = currentParticipants.map(p => p.userId);

      // Add new participants
      for (const participantId of data.participantIds) {
        if (!currentParticipantIds.includes(participantId)) {
          await ConversationParticipantModel.addParticipant({
            conversationId,
            userId: participantId,
            role: data.adminIds?.includes(participantId) ? 'admin' : 'member'
          });
        }
      }

      // Remove participants no longer in conversation
      for (const participant of currentParticipants) {
        if (!data.participantIds.includes(participant.userId)) {
          await ConversationParticipantModel.removeParticipant(conversationId, participant.userId);
        }
      }

      // Update roles if admin IDs changed
      if (data.adminIds) {
        for (const participantId of data.participantIds) {
          const newRole = data.adminIds.includes(participantId) ? 'admin' : 'member';
          await ConversationParticipantModel.updateRole(conversationId, participantId, newRole);
        }
      }
    }

    return updatedConversation;
  }

  static async addParticipant(
    conversationId: string, 
    participantId: string, 
    userId: string
  ): Promise<boolean> {
    // Verify user is admin in conversation
    const isAdmin = await ConversationParticipantModel.isAdmin(conversationId, userId);
    
    if (!isAdmin) {
      throw new Error('Only conversation admins can add participants');
    }

    // Check if participant is already in conversation
    const isAlreadyParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      participantId
    );
    
    if (isAlreadyParticipant) {
      throw new Error('User is already a participant in this conversation');
    }

    // Add participant to conversation
    const added = await ConversationModel.addParticipant(conversationId, participantId);
    
    if (added) {
      await ConversationParticipantModel.addParticipant({
        conversationId,
        userId: participantId,
        role: 'member'
      });
    }

    return added;
  }

  static async removeParticipant(
    conversationId: string, 
    participantId: string, 
    userId: string
  ): Promise<boolean> {
    // User can remove themselves or admins can remove others
    const isSelf = userId === participantId;
    const isAdmin = await ConversationParticipantModel.isAdmin(conversationId, userId);
    
    if (!isSelf && !isAdmin) {
      throw new Error('Only conversation admins can remove participants');
    }

    // Check if participant is in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      participantId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Remove participant from conversation
    const removed = await ConversationModel.removeParticipant(conversationId, participantId);
    
    if (removed) {
      await ConversationParticipantModel.removeParticipant(conversationId, participantId);
    }

    return removed;
  }

  static async addAdmin(
    conversationId: string, 
    adminId: string, 
    userId: string
  ): Promise<boolean> {
    // Verify user is admin in conversation
    const isAdmin = await ConversationParticipantModel.isAdmin(conversationId, userId);
    
    if (!isAdmin) {
      throw new Error('Only conversation admins can add other admins');
    }

    // Check if user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      adminId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Add admin to conversation
    const added = await ConversationModel.addAdmin(conversationId, adminId);
    
    if (added) {
      await ConversationParticipantModel.updateRole(conversationId, adminId, 'admin');
    }

    return added;
  }

  static async removeAdmin(
    conversationId: string, 
    adminId: string, 
    userId: string
  ): Promise<boolean> {
    // User can remove themselves from admin or other admins can remove them
    const isSelf = userId === adminId;
    const isAdmin = await ConversationParticipantModel.isAdmin(conversationId, userId);
    
    if (!isSelf && !isAdmin) {
      throw new Error('Only conversation admins can remove other admins');
    }

    // Check if user is admin in conversation
    const isCurrentlyAdmin = await ConversationParticipantModel.isAdmin(
      conversationId, 
      adminId
    );
    
    if (!isCurrentlyAdmin) {
      throw new Error('User is not an admin in this conversation');
    }

    // Remove admin from conversation
    const removed = await ConversationModel.removeAdmin(conversationId, adminId);
    
    if (removed) {
      await ConversationParticipantModel.updateRole(conversationId, adminId, 'member');
    }

    return removed;
  }

  static async leaveConversation(conversationId: string, userId: string): Promise<boolean> {
    // Check if user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Remove participant from conversation
    const removed = await ConversationModel.removeParticipant(conversationId, userId);
    
    if (removed) {
      await ConversationParticipantModel.removeParticipant(conversationId, userId);
    }

    return removed;
  }

  static async deactivateConversation(conversationId: string, userId: string): Promise<boolean> {
    // Verify user is admin in conversation
    const isAdmin = await ConversationParticipantModel.isAdmin(conversationId, userId);
    
    if (!isAdmin) {
      throw new Error('Only conversation admins can deactivate conversations');
    }

    return await ConversationModel.deactivate(conversationId);
  }

  static async getParticipants(conversationId: string, userId: string): Promise<ConversationParticipant[]> {
    // Verify user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    return await ConversationParticipantModel.findByConversationId(conversationId);
  }

  static async muteConversation(conversationId: string, userId: string, isMuted: boolean): Promise<boolean> {
    // Check if user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    return await ConversationParticipantModel.toggleMute(conversationId, userId, isMuted);
  }

  static async findDirectConversation(user1Id: string, user2Id: string): Promise<Conversation | null> {
    return await ConversationModel.findDirectConversation(user1Id, user2Id);
  }
}