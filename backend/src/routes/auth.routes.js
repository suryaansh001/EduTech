import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema
} from '../utils/validation.utils.js';
import Joi from 'joi';

// Additional validation schemas
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().allow('').optional(), // Allow empty for first login
  newPassword: Joi.string().min(6).max(128).required()
});

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('STUDENT', 'TEACHER').required(),
  phone: Joi.string().optional(),
  bio: Joi.string().max(500).optional(),
  grade: Joi.string().optional(), // For students
  specialization: Joi.string().optional() // For teachers
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required()
});

const router = express.Router();

// Public routes
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);

// Protected routes
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', 
  validate(changePasswordSchema), 
  authController.changePassword
);
router.post('/refresh-token', authController.refreshToken);

// Admin only routes
router.post('/create-user', 
  authorize('ADMIN'), 
  validate(createUserSchema), 
  authController.createUser
);

export default router;
