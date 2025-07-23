import express from 'express';
import { quizController } from '../controllers/quiz.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validation.middleware.js';
import {
  createQuizSchema,
  submitQuizSchema,
  idSchema,
  paginationSchema
} from '../utils/validation.utils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Teacher-only routes
router.post('/', 
  authorize('TEACHER', 'ADMIN'),
  validate(createQuizSchema),
  quizController.createQuiz
);

router.put('/:id',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.updateQuiz
);

router.delete('/:id',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.deleteQuiz
);

router.patch('/:id/status',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.toggleQuizStatus
);

router.get('/:id/attempts',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.getQuizAttempts
);

router.get('/:id/statistics',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.getQuizStatistics
);

// Student routes
router.post('/:id/submit',
  authorize('STUDENT'),
  validateParams(idSchema),
  validate(submitQuizSchema),
  quizController.submitQuiz
);

router.get('/my-attempts',
  authorize('STUDENT'),
  quizController.getMyQuizAttempts
);

// Shared routes (students and teachers)
router.get('/', quizController.getQuizzes);
router.get('/:id', validateParams(idSchema), quizController.getQuiz);

// Quiz attempt details
router.get('/attempts/:attemptId',
  validateParams({ attemptId: idSchema.extract('id') }),
  quizController.getQuizAttempt
);

export default router;
