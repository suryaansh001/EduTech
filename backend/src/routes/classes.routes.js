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

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Create a new class (teachers only)
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

// Update a class (teachers only)
router.put('/:id',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  validate(updateClassSchema),
  classController.updateClass
);

// Delete a class (teachers only)
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

// Get class enrollments (teachers only)
router.get('/:id/enrollments',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  classController.getClassEnrollments
);

// Update enrollment status (teachers only)
router.patch('/:id/enrollments/:enrollmentId',
  authorize('TEACHER', 'ADMIN'),
  validateParams({
    id: idSchema.extract('id'),
    enrollmentId: idSchema.extract('id')
  }),
  classController.updateEnrollmentStatus
);

export default router;
