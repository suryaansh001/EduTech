import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';
import { verifyClassAccess } from './socketUtils.js';

export const chatHandler = (socket, io) => {
  // Send chat message
  socket.on('send-message', async (data) => {
    try {
      const { message, type = 'BATCH', classId, recipientId } = data;

      let room;
      let hasAccess = false;

      // Validation and Room determination based on type
      switch (type) {
        case 'BATCH':
          if (!classId) return socket.emit('message-error', { error: 'Class ID is required for batch chat' });
          hasAccess = await verifyClassAccess(socket.userId, socket.user.role, classId);
          room = `class:${classId}`;
          break;

        case 'FACULTY_LOUNGE':
          if (socket.user.role !== 'TEACHER' && socket.user.role !== 'ADMIN') {
            return socket.emit('message-error', { error: 'Only faculty can access the lounge' });
          }
          hasAccess = true;
          room = 'faculty_lounge';
          break;

        case 'GLOBAL':
          if (socket.user.role !== 'ADMIN') {
            return socket.emit('message-error', { error: 'Only admins can send global announcements' });
          }
          hasAccess = true;
          room = 'global';
          break;

        case 'PRIVATE':
          if (!recipientId) return socket.emit('message-error', { error: 'Recipient ID is required for private chat' });
          hasAccess = true; // Simple implementation: everyone can DM for now
          // Private room is always the sorted combination of both user IDs
          const participants = [socket.userId, recipientId].sort();
          room = `private:${participants[0]}:${participants[1]}`;
          break;

        default:
          return socket.emit('message-error', { error: 'Invalid chat type' });
      }

      if (!hasAccess) {
        socket.emit('message-error', { error: 'Access denied' });
        return;
      }

      // Save message to database
      const chatMessage = await prisma.chatMessage.create({
        data: {
          message,
          userId: socket.userId,
          type,
          classId: type === 'BATCH' ? classId : null,
          recipientId: type === 'PRIVATE' ? recipientId : null
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              profileImage: true
            }
          }
        }
      });

      // Send message to the appropriate room
      if (type === 'GLOBAL') {
        io.emit('new-message', {
          ...chatMessage,
          roomType: 'GLOBAL'
        });
      } else {
        io.to(room).emit('new-message', {
          ...chatMessage,
          roomType: type,
          classId,
          recipientId
        });
      }

      logger.info(`Chat message (${type}) sent by ${socket.user.name}`);
    } catch (error) {
      logger.error('Error sending chat message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  // Get chat history
  socket.on('get-chat-history', async (data) => {
    try {
      const { type = 'BATCH', classId, recipientId, page = 1, limit = 50 } = data;

      let where = { type };
      let hasAccess = false;

      switch (type) {
        case 'BATCH':
          if (!classId) return socket.emit('chat-history-error', { error: 'Class ID is required' });
          hasAccess = await verifyClassAccess(socket.userId, socket.user.role, classId);
          where.classId = classId;
          break;

        case 'FACULTY_LOUNGE':
          if (socket.user.role !== 'TEACHER' && socket.user.role !== 'ADMIN') {
            return socket.emit('chat-history-error', { error: 'Access denied' });
          }
          hasAccess = true;
          break;

        case 'GLOBAL':
          hasAccess = true;
          break;

        case 'PRIVATE':
          if (!recipientId) return socket.emit('chat-history-error', { error: 'Recipient ID is required' });
          hasAccess = true;
          where.OR = [
            { userId: socket.userId, recipientId: recipientId },
            { userId: recipientId, recipientId: socket.userId }
          ];
          break;
      }

      if (!hasAccess) {
        socket.emit('chat-history-error', { error: 'Access denied' });
        return;
      }

      const skip = (page - 1) * limit;

      const messages = await prisma.chatMessage.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true,
              profileImage: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      });

      socket.emit('chat-history', {
        type,
        classId,
        recipientId,
        messages: messages.reverse(),
        hasMore: messages.length === limit
      });
    } catch (error) {
      logger.error('Error getting chat history:', error);
      socket.emit('chat-history-error', { error: 'Failed to get chat history' });
    }
  });

  // Delete message (only message author or teacher can delete)
  socket.on('delete-message', async (data) => {
    try {
      const { messageId, classId } = data;

      // Get message details
      const message = await prisma.chatMessage.findUnique({
        where: { id: messageId },
        include: {
          class: {
            select: {
              teacherId: true
            }
          }
        }
      });

      if (!message) {
        socket.emit('delete-message-error', { error: 'Message not found' });
        return;
      }

      // Check if user can delete this message
      const canDelete = message.userId === socket.userId ||
        message.class.teacherId === socket.userId ||
        socket.user.role === 'ADMIN';

      if (!canDelete) {
        socket.emit('delete-message-error', { error: 'Not authorized to delete this message' });
        return;
      }

      // Delete message
      await prisma.chatMessage.delete({
        where: { id: messageId }
      });

      // Notify all users in the class
      io.to(`class:${classId}`).emit('message-deleted', {
        messageId,
        classId,
        deletedBy: {
          id: socket.user.id,
          name: socket.user.name
        }
      });

      logger.info(`Chat message ${messageId} deleted by ${socket.user.name}`);
    } catch (error) {
      logger.error('Error deleting chat message:', error);
      socket.emit('delete-message-error', { error: 'Failed to delete message' });
    }
  });
};
