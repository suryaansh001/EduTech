import express from 'express';
import { analyticsController } from '../controllers/analytics.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validateParams } from '../middleware/validation.middleware.js';
import { idSchema } from '../utils/validation.utils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Track analytics event
router.post('/track', analyticsController.trackEvent);

// Get platform analytics (admin only)
router.get('/platform',
  authorize('ADMIN'),
  analyticsController.getPlatformAnalytics
);

// Get teacher analytics
router.get('/teacher',
  authorize('TEACHER', 'ADMIN'),
  analyticsController.getTeacherAnalytics
);

// Get student analytics
router.get('/student',
  authorize('STUDENT', 'ADMIN'),
  analyticsController.getStudentAnalytics
);

// Get class analytics
router.get('/class/:classId',
  validateParams({ classId: idSchema.extract('id') }),
  analyticsController.getClassAnalytics
);

export default router;
