import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

export const quizHandler = (socket, io) => {
  // Join quiz session
  socket.on('join-quiz', async (data) => {
    try {
      const { quizId } = data;
      
      // Verify user has access to this quiz
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          isActive: true,
          class: {
            enrollments: {
              some: {
                userId: socket.userId,
                status: 'ACTIVE'
              }
            }
          }
        },
        include: {
          class: {
            select: {
              id: true,
              title: true,
              teacherId: true
            }
          }
        }
      });

      if (!quiz && socket.user.role !== 'TEACHER' && socket.user.role !== 'ADMIN') {
        socket.emit('quiz-join-error', { error: 'Quiz not found or access denied' });
        return;
      }

      // For teachers, verify ownership
      if (socket.user.role === 'TEACHER' && quiz.class.teacherId !== socket.userId) {
        socket.emit('quiz-join-error', { error: 'Access denied' });
        return;
      }

      socket.join(`quiz:${quizId}`);
      socket.emit('quiz-joined', { 
        quizId, 
        quiz: {
          id: quiz.id,
          title: quiz.title,
          timeLimit: quiz.timeLimit,
          totalMarks: quiz.totalMarks
        }
      });

      // Notify teacher about student joining
      if (socket.user.role === 'STUDENT') {
        socket.to(`quiz:${quizId}`).emit('student-joined-quiz', {
          student: {
            id: socket.user.id,
            name: socket.user.name
          },
          quizId
        });
      }

      logger.info(`User ${socket.user.name} joined quiz ${quizId}`);
    } catch (error) {
      logger.error('Error joining quiz:', error);
      socket.emit('quiz-join-error', { error: 'Failed to join quiz' });
    }
  });

  // Start quiz timer (teacher only)
  socket.on('start-quiz-timer', async (data) => {
    try {
      const { quizId, duration } = data;
      
      // Verify teacher ownership
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          class: {
            teacherId: socket.userId
          }
        }
      });

      if (!quiz) {
        socket.emit('quiz-timer-error', { error: 'Quiz not found or access denied' });
        return;
      }

      // Broadcast timer start to all participants
      io.to(`quiz:${quizId}`).emit('quiz-timer-started', {
        quizId,
        duration,
        startTime: new Date().toISOString()
      });

      logger.info(`Quiz timer started for quiz ${quizId} by teacher ${socket.user.name}`);
    } catch (error) {
      logger.error('Error starting quiz timer:', error);
      socket.emit('quiz-timer-error', { error: 'Failed to start timer' });
    }
  });

  // Quiz submission notification
  socket.on('quiz-submitted', async (data) => {
    try {
      const { quizId, attemptId } = data;
      
      // Get quiz attempt details
      const attempt = await prisma.quizAttempt.findUnique({
        where: { id: attemptId },
        include: {
          user: {
            select: {
              id: true,
              name: true
            }
          },
          quiz: {
            select: {
              id: true,
              title: true,
              totalMarks: true,
              class: {
                select: {
                  teacherId: true
                }
              }
            }
          }
        }
      });

      if (!attempt) {
        return;
      }

      // Notify teacher about submission
      io.to(`user:${attempt.quiz.class.teacherId}`).emit('quiz-submission-received', {
        quizId,
        attemptId,
        student: attempt.user,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: ((attempt.score / attempt.totalMarks) * 100).toFixed(2),
        submittedAt: attempt.completedAt
      });

      // Notify other students in quiz room (without scores)
      socket.to(`quiz:${quizId}`).emit('student-submitted-quiz', {
        student: attempt.user,
        quizId
      });

      logger.info(`Quiz submission notification sent for attempt ${attemptId}`);
    } catch (error) {
      logger.error('Error handling quiz submission:', error);
    }
  });

  // Get quiz participants (teacher only)
  socket.on('get-quiz-participants', async (data) => {
    try {
      const { quizId } = data;
      
      // Verify teacher ownership
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          class: {
            teacherId: socket.userId
          }
        }
      });

      if (!quiz) {
        socket.emit('quiz-participants-error', { error: 'Access denied' });
        return;
      }

      // Get online participants in this quiz room
      const room = io.sockets.adapter.rooms.get(`quiz:${quizId}`);
      const participants = [];
      
      if (room) {
        room.forEach(socketId => {
          const participantSocket = io.sockets.sockets.get(socketId);
          if (participantSocket && participantSocket.user && participantSocket.user.role === 'STUDENT') {
            participants.push({
              id: participantSocket.user.id,
              name: participantSocket.user.name,
              online: true
            });
          }
        });
      }

      socket.emit('quiz-participants', { quizId, participants });
    } catch (error) {
      logger.error('Error getting quiz participants:', error);
      socket.emit('quiz-participants-error', { error: 'Failed to get participants' });
    }
  });

  // Leave quiz session
  socket.on('leave-quiz', (data) => {
    const { quizId } = data;
    socket.leave(`quiz:${quizId}`);
    
    // Notify others about leaving
    socket.to(`quiz:${quizId}`).emit('participant-left-quiz', {
      user: {
        id: socket.user.id,
        name: socket.user.name,
        role: socket.user.role
      },
      quizId
    });
    
    logger.info(`User ${socket.user.name} left quiz ${quizId}`);
  });

  // Real-time quiz progress updates (for teachers)
  socket.on('quiz-progress-update', async (data) => {
    try {
      const { quizId, questionIndex, totalQuestions } = data;
      
      // Only students can send progress updates
      if (socket.user.role !== 'STUDENT') {
        return;
      }

      // Get quiz and verify access
      const quiz = await prisma.quiz.findFirst({
        where: {
          id: quizId,
          class: {
            enrollments: {
              some: {
                userId: socket.userId,
                status: 'ACTIVE'
              }
            }
          }
        },
        include: {
          class: {
            select: {
              teacherId: true
            }
          }
        }
      });

      if (!quiz) {
        return;
      }

      // Send progress update to teacher
      io.to(`user:${quiz.class.teacherId}`).emit('student-quiz-progress', {
        quizId,
        student: {
          id: socket.user.id,
          name: socket.user.name
        },
        progress: {
          currentQuestion: questionIndex + 1,
          totalQuestions,
          percentage: Math.round(((questionIndex + 1) / totalQuestions) * 100)
        }
      });
    } catch (error) {
      logger.error('Error handling quiz progress update:', error);
    }
  });
};
