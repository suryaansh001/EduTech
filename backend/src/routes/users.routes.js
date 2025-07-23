import express from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { validateParams } from '../middleware/validation.middleware.js';
import { idSchema } from '../utils/validation.utils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/',
  authorize('ADMIN'),
  userController.getUsers
);

// Get user statistics
router.get('/stats', userController.getUserStats);

// Upload profile image
router.post('/profile-image',
  uploadSingle('image'),
  userController.uploadProfileImage
);

// Get user by ID
router.get('/:id',
  validateParams(idSchema),
  userController.getUserById
);

// Update user (admin only)
router.put('/:id',
  authorize('ADMIN'),
  validateParams(idSchema),
  userController.updateUser
);

// Delete user (admin only)
router.delete('/:id',
  authorize('ADMIN'),
  validateParams(idSchema),
  userController.deleteUser
);

export default router;
