import { quizService } from '../services/quiz.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.utils.js';

export const quizController = {
  // Create a new quiz
  createQuiz: async (req, res, next) => {
    try {
      const teacherId = req.user.id;
      const quizData = req.body;
      
      const quiz = await quizService.createQuiz(teacherId, quizData);
      
      successResponse(res, quiz, 'Quiz created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get all quizzes (with filters)
  getQuizzes: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, classId, isActive } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const filters = {
        ...(classId && { classId }),
        ...(isActive !== undefined && { isActive: isActive === 'true' })
      };

      const result = await quizService.getQuizzes(userId, userRole, filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.quizzes, result.pagination, 'Quizzes retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get a specific quiz
  getQuiz: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const quiz = await quizService.getQuizById(id, userId, userRole);
      
      successResponse(res, quiz, 'Quiz retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update a quiz
  updateQuiz: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const updateData = req.body;
      
      const quiz = await quizService.updateQuiz(id, teacherId, updateData);
      
      successResponse(res, quiz, 'Quiz updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete a quiz
  deleteQuiz: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      
      await quizService.deleteQuiz(id, teacherId);
      
      successResponse(res, null, 'Quiz deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Activate/Deactivate a quiz
  toggleQuizStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const { isActive } = req.body;
      
      const quiz = await quizService.toggleQuizStatus(id, teacherId, isActive);
      
      successResponse(res, quiz, `Quiz ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      next(error);
    }
  },

  // Submit quiz attempt
  submitQuiz: async (req, res, next) => {
    try {
      const { id } = req.params;
      const studentId = req.user.id;
      const { answers } = req.body;
      
      const result = await quizService.submitQuizAttempt(id, studentId, answers);
      
      successResponse(res, result, 'Quiz submitted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get quiz attempts for a quiz (teacher view)
  getQuizAttempts: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const result = await quizService.getQuizAttempts(id, teacherId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.attempts, result.pagination, 'Quiz attempts retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get student's quiz attempts
  getMyQuizAttempts: async (req, res, next) => {
    try {
      const studentId = req.user.id;
      const { page = 1, limit = 10, classId } = req.query;
      
      const filters = {
        ...(classId && { classId })
      };

      const result = await quizService.getStudentQuizAttempts(studentId, filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.attempts, result.pagination, 'Your quiz attempts retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get quiz attempt details
  getQuizAttempt: async (req, res, next) => {
    try {
      const { attemptId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const attempt = await quizService.getQuizAttemptById(attemptId, userId, userRole);
      
      successResponse(res, attempt, 'Quiz attempt details retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get quiz statistics (teacher view)
  getQuizStatistics: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      
      const stats = await quizService.getQuizStatistics(id, teacherId);
      
      successResponse(res, stats, 'Quiz statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};
