import { analyticsService } from '../services/analytics.service.js';
import { successResponse } from '../utils/response.utils.js';

export const analyticsController = {
  // Track an analytics event
  trackEvent: async (req, res, next) => {
    try {
      const { event, data, classId } = req.body;
      const userId = req.user.id;
      
      await analyticsService.trackEvent(userId, event, data, classId);
      
      successResponse(res, null, 'Event tracked successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get platform analytics (admin only)
  getPlatformAnalytics: async (req, res, next) => {
    try {
      const { startDate, endDate } = req.query;
      
      const analytics = await analyticsService.getPlatformAnalytics(startDate, endDate);
      
      successResponse(res, analytics, 'Platform analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get teacher analytics
  getTeacherAnalytics: async (req, res, next) => {
    try {
      const teacherId = req.user.id;
      const { startDate, endDate, classId } = req.query;
      
      const analytics = await analyticsService.getTeacherAnalytics(teacherId, {
        startDate,
        endDate,
        classId
      });
      
      successResponse(res, analytics, 'Teacher analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get student analytics
  getStudentAnalytics: async (req, res, next) => {
    try {
      const studentId = req.user.id;
      const { startDate, endDate, classId } = req.query;
      
      const analytics = await analyticsService.getStudentAnalytics(studentId, {
        startDate,
        endDate,
        classId
      });
      
      successResponse(res, analytics, 'Student analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get class analytics
  getClassAnalytics: async (req, res, next) => {
    try {
      const { classId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { startDate, endDate } = req.query;
      
      const analytics = await analyticsService.getClassAnalytics(classId, userId, userRole, {
        startDate,
        endDate
      });
      
      successResponse(res, analytics, 'Class analytics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};
