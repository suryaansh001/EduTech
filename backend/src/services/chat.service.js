import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

export const chatService = {
  // Get chat messages for a class
  getChatMessages: async (classId, userId, userRole, pagination = {}) => {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    // Verify user has access to the class
    const hasAccess = await verifyClassAccess(userId, userRole, classId);
    if (!hasAccess) {
      throw new Error('Access denied to this class');
    }

    const [messages, total] = await Promise.all([
      prisma.chatMessage.findMany({
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
      }),
      prisma.chatMessage.count({ where: { classId } })
    ]);

    return {
      messages: messages.reverse(), // Reverse to get chronological order
      pagination: {
        page,
        limit,
        total
      }
    };
  },

  // Send a chat message
  sendMessage: async (classId, userId, messageText) => {
    // Verify user has access to the class
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    const hasAccess = await verifyClassAccess(userId, user.role, classId);
    if (!hasAccess) {
      throw new Error('Access denied to this class');
    }

    // Create chat message
    const chatMessage = await prisma.chatMessage.create({
      data: {
        message: messageText,
        userId,
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

    logger.info(`Chat message sent by ${user.name} in class ${classId}`);
    return chatMessage;
  },

  // Delete a chat message
  deleteMessage: async (messageId, userId, userRole) => {
    // Get message details
    const message = await prisma.chatMessage.findUnique({
      where: { id: messageId },
      include: {
        class: {
          select: {
            id: true,
            teacherId: true
          }
        }
      }
    });

    if (!message) {
      throw new Error('Message not found');
    }

    // Check if user can delete this message
    const canDelete = message.userId === userId || 
                     message.class.teacherId === userId || 
                     userRole === 'ADMIN';

    if (!canDelete) {
      throw new Error('Not authorized to delete this message');
    }

    // Delete message
    await prisma.chatMessage.delete({
      where: { id: messageId }
    });

    logger.info(`Chat message ${messageId} deleted by user ${userId}`);
    
    return {
      classId: message.classId
    };
  }
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
