import { authService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.utils.js';
import { redisClient } from '../config/redis.js';

export const authController = {
  // Register a new user
  register: async (req, res, next) => {
    try {
      const { name, email, password, role, phone, bio } = req.body;
      
      const result = await authService.register({
        name,
        email,
        password,
        role,
        phone,
        bio
      });

      successResponse(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Login user
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);
      
      successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  },

  // Logout user
  logout: async (req, res, next) => {
    try {
      const token = req.token;
      
      // Add token to blacklist in Redis
      await redisClient.set(`blacklist:${token}`, true, 24 * 60 * 60); // 24 hours
      
      successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile
  getProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const user = await authService.getUserProfile(userId);
      
      successResponse(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      const user = await authService.updateProfile(userId, updateData);
      
      successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Change password
  changePassword: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      await authService.changePassword(userId, currentPassword, newPassword);
      
      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  },

  // Refresh token
  refreshToken: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const result = await authService.refreshToken(userId);
      
      successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }
};
