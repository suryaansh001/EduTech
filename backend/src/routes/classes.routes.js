import express from 'express';
import { classController } from '../controllers/class.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validation.middleware.js';
import {
  createClassSchema,
  updateClassSchema,
  idSchema,
  paginationSchema
} from '../utils/validation.utils.js';
import Joi from 'joi';

// Additional validation schemas
const bulkEnrollSchema = Joi.object({
  studentIds: Joi.array().items(Joi.string()).min(1).max(50).required()
});

const enrollmentStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ACTIVE', 'COMPLETED', 'DROPPED').required()
});

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new class (teachers and admins only)
router.post('/',
  authorize('TEACHER', 'ADMIN'),
  validate(createClassSchema),
  classController.createClass
);

// Get all classes
router.get('/', classController.getClasses);

// Get a specific class
router.get('/:id',
  validateParams(idSchema),
  classController.getClass
);

// Update a class (teachers and admins only)
router.put('/:id',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  validate(updateClassSchema),
  classController.updateClass
);

// Delete a class (teachers and admins only)
router.delete('/:id',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  classController.deleteClass
);

// Enroll in a class (students only)
router.post('/:id/enroll',
  authorize('STUDENT'),
  validateParams(idSchema),
  classController.enrollInClass
);

// Get class enrollments (teachers and admins only)
router.get('/:id/enrollments',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  classController.getClassEnrollments
);

// Update enrollment status (teachers and admins only)
router.patch('/:id/enrollments/:enrollmentId',
  authorize('TEACHER', 'ADMIN'),
  validateParams({
    id: idSchema.extract('id'),
    enrollmentId: idSchema.extract('id')
  }),
  validate(enrollmentStatusSchema),
  classController.updateEnrollmentStatus
);

// Get available students for enrollment (teachers and admins only)
router.get('/:id/available-students',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  classController.getAvailableStudents
);

// Bulk enroll students (teachers and admins only)
router.post('/:id/bulk-enroll',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  validate(bulkEnrollSchema),
  classController.bulkEnrollStudents
);

// Remove student from class (teachers and admins only)
router.delete('/:id/students/:studentId',
  authorize('TEACHER', 'ADMIN'),
  validateParams({
    id: idSchema.extract('id'),
    studentId: idSchema.extract('id')
  }),
  classController.removeStudentFromClass
);

export default router;
