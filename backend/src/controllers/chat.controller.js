import { chatService } from '../services/chat.service.js';
import { successResponse, paginatedResponse } from '../utils/response.utils.js';

export const chatController = {
  // Get chat messages for a class
  getChatMessages: async (req, res, next) => {
    try {
      const { classId } = req.params;
      const { page = 1, limit = 50 } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const result = await chatService.getChatMessages(classId, userId, userRole, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.messages, result.pagination, 'Chat messages retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Send chat message
  sendMessage: async (req, res, next) => {
    try {
      const { classId } = req.params;
      const { message } = req.body;
      const userId = req.user.id;
      
      const chatMessage = await chatService.sendMessage(classId, userId, message);
      
      // Emit to socket.io (if available)
      const io = req.app.get('io');
      if (io) {
        io.to(`class:${classId}`).emit('new-message', {
          id: chatMessage.id,
          message: chatMessage.message,
          createdAt: chatMessage.createdAt,
          user: chatMessage.user,
          classId
        });
      }
      
      successResponse(res, chatMessage, 'Message sent successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Delete chat message
  deleteMessage: async (req, res, next) => {
    try {
      const { messageId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const result = await chatService.deleteMessage(messageId, userId, userRole);
      
      // Emit to socket.io (if available)
      const io = req.app.get('io');
      if (io) {
        io.to(`class:${result.classId}`).emit('message-deleted', {
          messageId,
          classId: result.classId,
          deletedBy: {
            id: userId,
            name: req.user.name
          }
        });
      }
      
      successResponse(res, null, 'Message deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};
