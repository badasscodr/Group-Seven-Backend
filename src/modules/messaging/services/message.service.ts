import { MessageModel, MessageAttachmentModel } from '../models/message.model';
import { ConversationModel, ConversationParticipantModel } from '../models/conversation.model';
import { 
  Message, 
  CreateMessageRequest, 
  UpdateMessageRequest, 
  MessageQuery,
  UnreadCount,
  MessageEvent,
  MessageAttachment
} from '../types/message.types';
import { S3Service } from '../../core/services/s3.service';

export class MessageService {
  static async sendMessage(data: CreateMessageRequest & { senderId: string }): Promise<Message> {
    // Verify user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      data.conversationId, 
      data.senderId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Create message
    const message = await MessageModel.create(data);

    // Update conversation's last message
    await ConversationModel.updateLastMessage(data.conversationId, message.id);

    // Create attachments if provided
    if (data.attachments && data.attachments.length > 0) {
      for (const attachment of data.attachments) {
        await MessageAttachmentModel.create({
          messageId: message.id,
          fileName: attachment.fileName,
          originalName: attachment.originalName,
          mimeType: attachment.mimeType,
          fileSize: attachment.fileSize,
          s3Key: attachment.s3Key,
          s3Url: attachment.s3Url,
          uploadedBy: data.senderId
        });
      }
    }

    // Fetch complete message with attachments
    const completeMessage = await MessageModel.findById(message.id);
    if (!completeMessage) {
      throw new Error('Failed to retrieve created message');
    }

    completeMessage.attachments = await MessageAttachmentModel.findByMessageId(message.id);

    return completeMessage;
  }

  static async getMessage(messageId: string, userId: string): Promise<Message | null> {
    const message = await MessageModel.findById(messageId);
    
    if (!message) {
      return null;
    }

    // Verify user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      message.conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Add attachments
    message.attachments = await MessageAttachmentModel.findByMessageId(messageId);

    return message;
  }

  static async getMessages(conversationId: string, query: MessageQuery, userId: string): Promise<{ messages: Message[]; total: number }> {
    // Verify user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    const result = await MessageModel.findByConversationId(conversationId, query);

    // Add attachments to each message
    for (const message of result.messages) {
      message.attachments = await MessageAttachmentModel.findByMessageId(message.id);
    }

    return result;
  }

  static async updateMessage(messageId: string, data: UpdateMessageRequest, userId: string): Promise<Message | null> {
    const message = await MessageModel.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is the sender
    if (message.senderId !== userId) {
      throw new Error('Only message sender can edit message');
    }

    // Check if message is too old to edit (24 hours)
    const editTimeLimit = 24 * 60 * 60 * 1000; // 24 hours in milliseconds
    if (Date.now() - new Date(message.sentAt).getTime() > editTimeLimit) {
      throw new Error('Message can only be edited within 24 hours of sending');
    }

    const updatedMessage = await MessageModel.update(messageId, data);
    
    if (!updatedMessage) {
      throw new Error('Failed to update message');
    }

    // Add attachments
    updatedMessage.attachments = await MessageAttachmentModel.findByMessageId(messageId);

    return updatedMessage;
  }

  static async deleteMessage(messageId: string, userId: string): Promise<boolean> {
    const message = await MessageModel.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is the sender or conversation admin
    const isSender = message.senderId === userId;
    const isAdmin = await ConversationParticipantModel.isAdmin(message.conversationId, userId);
    
    if (!isSender && !isAdmin) {
      throw new Error('Only message sender or conversation admin can delete message');
    }

    return await MessageModel.softDelete(messageId, userId);
  }

  static async markMessageAsRead(messageId: string, userId: string): Promise<boolean> {
    const message = await MessageModel.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      message.conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    // Don't mark own messages as read
    if (message.senderId === userId) {
      return false;
    }

    const marked = await MessageModel.markAsRead(messageId, userId);
    
    if (marked) {
      // Update participant's last read timestamp
      await ConversationParticipantModel.updateLastReadAt(message.conversationId, userId);
    }

    return marked;
  }

  static async markConversationAsRead(conversationId: string, userId: string): Promise<number> {
    // Verify user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    const markedCount = await MessageModel.markConversationAsRead(conversationId, userId);
    
    if (markedCount > 0) {
      // Update participant's last read timestamp
      await ConversationParticipantModel.updateLastReadAt(conversationId, userId);
    }

    return markedCount;
  }

  static async getUnreadCount(conversationId: string, userId: string): Promise<number> {
    // Verify user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    return await MessageModel.getUnreadCount(conversationId, userId);
  }

  static async getAllUnreadCounts(userId: string): Promise<UnreadCount[]> {
    return await MessageModel.getAllUnreadCounts(userId);
  }

  static async uploadAttachment(
    messageId: string,
    file: Buffer,
    originalName: string,
    mimeType: string,
    userId: string
  ): Promise<MessageAttachment> {
    const message = await MessageModel.findById(messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is the sender
    if (message.senderId !== userId) {
      throw new Error('Only message sender can upload attachments');
    }

    // Upload file to S3
    const fileName = `${Date.now()}-${originalName}`;
    const s3Key = `messages/${messageId}/${fileName}`;
    
    const s3Url = await S3Service.uploadFile(file, s3Key, mimeType);

    // Create attachment record
    const attachment = await MessageAttachmentModel.create({
      messageId,
      fileName,
      originalName,
      mimeType,
      fileSize: file.length,
      s3Key,
      s3Url,
      uploadedBy: userId
    });

    return attachment;
  }

  static async deleteAttachment(attachmentId: string, userId: string): Promise<boolean> {
    const attachment = await MessageAttachmentModel.findById(attachmentId);
    
    if (!attachment) {
      throw new Error('Attachment not found');
    }

    const message = await MessageModel.findById(attachment.messageId);
    
    if (!message) {
      throw new Error('Message not found');
    }

    // Verify user is the sender or conversation admin
    const isSender = message.senderId === userId;
    const isAdmin = await ConversationParticipantModel.isAdmin(message.conversationId, userId);
    
    if (!isSender && !isAdmin) {
      throw new Error('Only message sender or conversation admin can delete attachments');
    }

    // Delete from S3
    await S3Service.deleteFile(attachment.s3Key);

    // Delete attachment record
    return await MessageAttachmentModel.delete(attachmentId);
  }

  static async searchMessages(conversationId: string, searchTerm: string, userId: string): Promise<Message[]> {
    // Verify user is participant in conversation
    const isParticipant = await ConversationParticipantModel.isParticipant(
      conversationId, 
      userId
    );
    
    if (!isParticipant) {
      throw new Error('User is not a participant in this conversation');
    }

    const result = await MessageModel.findByConversationId(conversationId, {
      conversationId,
      search: searchTerm,
      limit: 50
    });

    // Add attachments to each message
    for (const message of result.messages) {
      message.attachments = await MessageAttachmentModel.findByMessageId(message.id);
    }

    return result.messages;
  }
}