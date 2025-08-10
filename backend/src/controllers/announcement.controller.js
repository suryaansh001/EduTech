import { announcementService } from '../services/announcement.service.js';
import { successResponse, paginatedResponse } from '../utils/response.utils.js';

export const announcementController = {
  // Create new announcement
  createAnnouncement: async (req, res, next) => {
    try {
      const { classId } = req.params;
      const authorId = req.user.id;
      const announcementData = req.body;

      const announcement = await announcementService.createAnnouncement(
        classId,
        authorId,
        announcementData
      );

      successResponse(res, announcement, 'Announcement created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get announcements for a class
  getClassAnnouncements: async (req, res, next) => {
    try {
      const { classId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 10 } = req.query;

      const result = await announcementService.getAnnouncementsByClass(
        classId,
        userId,
        userRole,
        { page: parseInt(page), limit: parseInt(limit) }
      );

      paginatedResponse(
        res,
        result.announcements,
        result.pagination,
        'Class announcements retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  // Get all announcements for current user
  getUserAnnouncements: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 10, priority, classId } = req.query;

      const filters = {
        ...(priority && { priority }),
        ...(classId && { classId })
      };

      const result = await announcementService.getUserAnnouncements(
        userId,
        userRole,
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );

      paginatedResponse(
        res,
        result.announcements,
        result.pagination,
        'User announcements retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  // Get announcement by ID
  getAnnouncement: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const announcement = await announcementService.getAnnouncementById(
        id,
        userId,
        userRole
      );

      successResponse(res, announcement, 'Announcement retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update announcement
  updateAnnouncement: async (req, res, next) => {
    try {
      const { id } = req.params;
      const authorId = req.user.id;
      const updateData = req.body;

      const announcement = await announcementService.updateAnnouncement(
        id,
        authorId,
        updateData
      );

      successResponse(res, announcement, 'Announcement updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete announcement
  deleteAnnouncement: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await announcementService.deleteAnnouncement(id, userId);

      successResponse(res, null, 'Announcement deleted successfully');
    } catch (error) {
      next(error);
    }
  }
};
