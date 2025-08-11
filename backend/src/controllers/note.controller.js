import { noteService } from '../services/note.service.js';
import { successResponse, paginatedResponse } from '../utils/response.utils.js';

export const noteController = {
  // Create new note
  createNote: async (req, res, next) => {
    try {
      const authorId = req.user.id;
      const noteData = req.body;

      const note = await noteService.createNote(authorId, noteData);

      successResponse(res, note, 'Note created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get notes with filters
  getNotes: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      const { 
        page = 1, 
        limit = 10, 
        classId, 
        subject, 
        tags, 
        search, 
        isPublic 
      } = req.query;

      const filters = {
        ...(classId && { classId }),
        ...(subject && { subject }),
        ...(tags && { tags: Array.isArray(tags) ? tags : [tags] }),
        ...(search && { search }),
        ...(typeof isPublic !== 'undefined' && { isPublic: isPublic === 'true' })
      };

      const result = await noteService.getNotes(
        userId,
        userRole,
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );

      paginatedResponse(
        res,
        result.notes,
        result.pagination,
        'Notes retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  // Get note by ID
  getNote: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const note = await noteService.getNoteById(id, userId, userRole);

      successResponse(res, note, 'Note retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update note
  updateNote: async (req, res, next) => {
    try {
      const { id } = req.params;
      const authorId = req.user.id;
      const updateData = req.body;

      const note = await noteService.updateNote(id, authorId, updateData);

      successResponse(res, note, 'Note updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete note
  deleteNote: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      await noteService.deleteNote(id, userId);

      successResponse(res, null, 'Note deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get notes for a specific class
  getClassNotes: async (req, res, next) => {
    try {
      const { classId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 10 } = req.query;

      const result = await noteService.getClassNotes(
        classId,
        userId,
        userRole,
        { page: parseInt(page), limit: parseInt(limit) }
      );

      paginatedResponse(
        res,
        result.notes,
        result.pagination,
        'Class notes retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  }
};
