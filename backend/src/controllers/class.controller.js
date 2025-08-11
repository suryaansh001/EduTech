import { classService } from '../services/class.service.js';
import { successResponse, paginatedResponse } from '../utils/response.utils.js';

export const classController = {
  // Create a new class
  createClass: async (req, res, next) => {
    try {
      const teacherId = req.user.id;
      const classData = req.body;
      
      const newClass = await classService.createClass(teacherId, classData);
      
      successResponse(res, newClass, 'Class created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get all classes
  getClasses: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status, subject, teacherId } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const filters = {
        ...(status && { status }),
        ...(subject && { subject }),
        ...(teacherId && { teacherId })
      };

      const result = await classService.getClasses(userId, userRole, filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.classes, result.pagination, 'Classes retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get a specific class
  getClass: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const classData = await classService.getClassById(id, userId, userRole);
      
      successResponse(res, classData, 'Class retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update a class
  updateClass: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const updateData = req.body;
      
      const updatedClass = await classService.updateClass(id, teacherId, updateData);
      
      successResponse(res, updatedClass, 'Class updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete a class
  deleteClass: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      
      await classService.deleteClass(id, teacherId);
      
      successResponse(res, null, 'Class deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Enroll in a class (for students)
  enrollInClass: async (req, res, next) => {
    try {
      const { id } = req.params;
      const studentId = req.user.id;
      
      const enrollment = await classService.enrollStudent(id, studentId);
      
      successResponse(res, enrollment, 'Enrolled in class successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get class enrollments
  getClassEnrollments: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 10, status } = req.query;
      
      // Allow both teachers and admins to view enrollments
      if (userRole === 'TEACHER') {
        const result = await classService.getClassEnrollments(id, userId, {
          status,
          page: parseInt(page),
          limit: parseInt(limit)
        });
        
        paginatedResponse(res, result.enrollments, result.pagination, 'Class enrollments retrieved successfully');
      } else if (userRole === 'ADMIN') {
        // Admin can view any class enrollments
        const result = await classService.getClassEnrollments(id, null, {
          status,
          page: parseInt(page),
          limit: parseInt(limit),
          isAdmin: true
        });
        
        paginatedResponse(res, result.enrollments, result.pagination, 'Class enrollments retrieved successfully');
      } else {
        return next(new Error('You do not have permission to view class enrollments'));
      }
    } catch (error) {
      next(error);
    }
  },

  // Update enrollment status
  updateEnrollmentStatus: async (req, res, next) => {
    try {
      const { id, enrollmentId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Allow both teachers and admins to update enrollment status
      const teacherId = userRole === 'ADMIN' ? null : userId;
      
      const enrollment = await classService.updateEnrollmentStatus(id, enrollmentId, teacherId, status);
      
      successResponse(res, enrollment, 'Enrollment status updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get available students for enrollment
  getAvailableStudents: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 20, search, grade } = req.query;

      const filters = {
        ...(search && { search }),
        ...(grade && { grade })
      };

      const result = await classService.getAvailableStudents(
        id,
        userId,
        userRole,
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );

      paginatedResponse(
        res,
        result.students,
        result.pagination,
        'Available students retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  // Bulk enroll students
  bulkEnrollStudents: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { studentIds } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return next(new Error('Please provide an array of student IDs'));
      }

      const result = await classService.bulkEnrollStudents(
        id,
        studentIds,
        userId,
        userRole
      );

      successResponse(
        res,
        result,
        `Successfully enrolled ${result.count} students in the class`
      );
    } catch (error) {
      next(error);
    }
  },

  // Remove student from class
  removeStudentFromClass: async (req, res, next) => {
    try {
      const { id, studentId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const result = await classService.removeStudentFromClass(
        id,
        studentId,
        userId,
        userRole
      );

      successResponse(
        res,
        result,
        'Student removed from class successfully'
      );
    } catch (error) {
      next(error);
    }
  }
};
