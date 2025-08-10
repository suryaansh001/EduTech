import express from 'express';
import { noteController } from '../controllers/note.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import Joi from 'joi';

const createNoteSchema = Joi.object({
  title: Joi.string().min(3).max(200).required(),
  content: Joi.string().min(10).required(),
  subject: Joi.string().max(100).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  isPublic: Joi.boolean().default(false),
  classId: Joi.string().optional(),
  attachments: Joi.array().items(Joi.string()).optional()
});

const updateNoteSchema = Joi.object({
  title: Joi.string().min(3).max(200).optional(),
  content: Joi.string().min(10).optional(),
  subject: Joi.string().max(100).optional(),
  tags: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  isPublic: Joi.boolean().optional(),
  attachments: Joi.array().items(Joi.string()).optional()
});

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get notes with filters
router.get('/', noteController.getNotes);

// Create new note
router.post('/', 
  validate(createNoteSchema),
  noteController.createNote
);

// Get note by ID
router.get('/:id', noteController.getNote);

// Update note
router.put('/:id',
  validate(updateNoteSchema),
  noteController.updateNote
);

// Delete note
router.delete('/:id', noteController.deleteNote);

// Get notes for a specific class
router.get('/class/:classId', noteController.getClassNotes);

export default router;
