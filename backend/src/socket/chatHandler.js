import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

export const chatHandler = (socket, io) => {
  // Send chat message
  socket.on('send-message', async (data) => {
    try {
      const { message, classId } = data;
      
      // Verify user has access to this class
      const hasAccess = await verifyClassAccess(socket.userId, socket.user.role, classId);
      
      if (!hasAccess) {
        socket.emit('message-error', { error: 'Access denied to this class' });
        return;
      }

      // Save message to database
      const chatMessage = await prisma.chatMessage.create({
        data: {
          message,
          userId: socket.userId,
          classId
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

      // Send message to all users in the class
      io.to(`class:${classId}`).emit('new-message', {
        id: chatMessage.id,
        message: chatMessage.message,
        createdAt: chatMessage.createdAt,
        user: chatMessage.user,
        classId
      });

      logger.info(`Chat message sent by ${socket.user.name} in class ${classId}`);
    } catch (error) {
      logger.error('Error sending chat message:', error);
      socket.emit('message-error', { error: 'Failed to send message' });
    }
  });

  // Get chat history
  socket.on('get-chat-history', async (data) => {
    try {
      const { classId, page = 1, limit = 50 } = data;
      
      // Verify user has access to this class
      const hasAccess = await verifyClassAccess(socket.userId, socket.user.role, classId);
      
      if (!hasAccess) {
        socket.emit('chat-history-error', { error: 'Access denied to this class' });
        return;
      }

      const skip = (page - 1) * limit;

      const messages = await prisma.chatMessage.findMany({
        where: { classId },
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
        classId,
        messages: messages.reverse(), // Reverse to get chronological order
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

// Helper function to verify class access
const verifyClassAccess = async (userId, userRole, classId) => {
  try {
    if (userRole === 'TEACHER') {
      const classData = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: userId
        }
      });
      return !!classData;
    } else if (userRole === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          classId,
          status: 'ACTIVE'
        }
      });
      return !!enrollment;
    } else if (userRole === 'ADMIN') {
      return true;
    }
    
    return false;
  } catch (error) {
    logger.error('Error verifying class access:', error);
    return false;
  }
};
