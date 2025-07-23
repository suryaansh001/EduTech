import { userService } from '../services/user.service.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response.utils.js';

export const userController = {
  // Get all users (admin only)
  getUsers: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      
      const filters = {
        ...(role && { role }),
        ...(search && { search })
      };

      const result = await userService.getUsers(filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.users, result.pagination, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;
      const currentUserRole = req.user.role;
      
      const user = await userService.getUserById(id, currentUserId, currentUserRole);
      
      successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update user (admin only)
  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await userService.updateUser(id, updateData);
      
      successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete user (admin only)
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;
      
      await userService.deleteUser(id, currentUserId);
      
      successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Upload profile image
  uploadProfileImage: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      
      if (!file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      const user = await userService.uploadProfileImage(userId, file);
      
      successResponse(res, user, 'Profile image uploaded successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get user statistics
  getUserStats: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const stats = await userService.getUserStatistics(userId, userRole);
      
      successResponse(res, stats, 'User statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};
