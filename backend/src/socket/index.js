import { verifyToken } from '../utils/jwt.utils.js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';
import { chatHandler } from './chatHandler.js';
import { quizHandler } from './quizHandler.js';

export const initializeSocket = (io) => {
  // Authentication middleware for socket connections
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true
        }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      logger.error('Socket authentication error:', error);
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`User connected: ${socket.user.name} (${socket.user.id})`);

    // Join user to their personal room
    socket.join(`user:${socket.userId}`);

    // Handle joining class rooms
    socket.on('join-class', async (classId) => {
      try {
        // Verify user has access to this class
        const hasAccess = await verifyClassAccess(socket.userId, socket.user.role, classId);
        
        if (hasAccess) {
          socket.join(`class:${classId}`);
          socket.emit('joined-class', { classId, success: true });
          
          // Notify others in the class
          socket.to(`class:${classId}`).emit('user-joined-class', {
            user: {
              id: socket.user.id,
              name: socket.user.name,
              role: socket.user.role
            },
            classId
          });
          
          logger.info(`User ${socket.user.name} joined class ${classId}`);
        } else {
          socket.emit('joined-class', { classId, success: false, error: 'Access denied' });
        }
      } catch (error) {
        logger.error('Error joining class:', error);
        socket.emit('joined-class', { classId, success: false, error: 'Failed to join class' });
      }
    });

    // Handle leaving class rooms
    socket.on('leave-class', (classId) => {
      socket.leave(`class:${classId}`);
      socket.to(`class:${classId}`).emit('user-left-class', {
        user: {
          id: socket.user.id,
          name: socket.user.name,
          role: socket.user.role
        },
        classId
      });
      logger.info(`User ${socket.user.name} left class ${classId}`);
    });

    // Initialize chat handler
    chatHandler(socket, io);

    // Initialize quiz handler
    quizHandler(socket, io);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`User disconnected: ${socket.user.name} (${reason})`);
      
      // Notify all connected rooms that user went offline
      socket.rooms.forEach(room => {
        if (room.startsWith('class:')) {
          const classId = room.split(':')[1];
          socket.to(room).emit('user-left-class', {
            user: {
              id: socket.user.id,
              name: socket.user.name,
              role: socket.user.role
            },
            classId,
            reason: 'disconnected'
          });
        }
      });
    });

    // Handle typing indicators
    socket.on('typing-start', ({ classId }) => {
      socket.to(`class:${classId}`).emit('user-typing', {
        userId: socket.userId,
        userName: socket.user.name,
        classId
      });
    });

    socket.on('typing-stop', ({ classId }) => {
      socket.to(`class:${classId}`).emit('user-stopped-typing', {
        userId: socket.userId,
        classId
      });
    });

    // Handle online status
    socket.on('get-online-users', (classId) => {
      const room = io.sockets.adapter.rooms.get(`class:${classId}`);
      const onlineUsers = [];
      
      if (room) {
        room.forEach(socketId => {
          const socket = io.sockets.sockets.get(socketId);
          if (socket && socket.user) {
            onlineUsers.push({
              id: socket.user.id,
              name: socket.user.name,
              role: socket.user.role
            });
          }
        });
      }
      
      socket.emit('online-users', { classId, users: onlineUsers });
    });
  });

  logger.info('Socket.IO initialized successfully');
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
