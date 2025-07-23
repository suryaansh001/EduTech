import { fileService } from '../services/file.service.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response.utils.js';

export const fileController = {
  // Upload file
  uploadFile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { classId } = req.body;
      const file = req.file;
      
      if (!file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      const uploadedFile = await fileService.uploadFile(userId, file, classId);
      
      successResponse(res, uploadedFile, 'File uploaded successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get files
  getFiles: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, classId, userId: filterUserId } = req.query;
      const currentUserId = req.user.id;
      const userRole = req.user.role;
      
      const filters = {
        ...(classId && { classId }),
        ...(filterUserId && { userId: filterUserId })
      };

      const result = await fileService.getFiles(currentUserId, userRole, filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.files, result.pagination, 'Files retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get file by ID
  getFile: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const file = await fileService.getFileById(id, userId, userRole);
      
      successResponse(res, file, 'File retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete file
  deleteFile: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      await fileService.deleteFile(id, userId, userRole);
      
      successResponse(res, null, 'File deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Download file
  downloadFile: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const fileData = await fileService.getFileForDownload(id, userId, userRole);
      
      // Redirect to the file URL (Cloudinary URL)
      res.redirect(fileData.fileUrl);
    } catch (error) {
      next(error);
    }
  }
};
