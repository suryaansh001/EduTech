import express from 'express';
import { announcementController } from '../controllers/announcement.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import Joi from 'joi';

const createAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(10).max(5000).required(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').default('NORMAL')
});

const updateAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  content: Joi.string().min(10).max(5000).optional(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').optional(),
  isActive: Joi.boolean().optional()
});

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all announcements for current user
router.get('/', announcementController.getUserAnnouncements);

// Get announcement by ID
router.get('/:id', announcementController.getAnnouncement);

// Class-specific announcements routes
router.post('/class/:classId', 
  authorize('TEACHER', 'ADMIN'),
  validate(createAnnouncementSchema),
  announcementController.createAnnouncement
);

router.get('/class/:classId', announcementController.getClassAnnouncements);

// Update announcement
router.put('/:id',
  authorize('TEACHER', 'ADMIN'),
  validate(updateAnnouncementSchema),
  announcementController.updateAnnouncement
);

// Delete announcement
router.delete('/:id',
  authorize('TEACHER', 'ADMIN'),
  announcementController.deleteAnnouncement
);

export default router;
