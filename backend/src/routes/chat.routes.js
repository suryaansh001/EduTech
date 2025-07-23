import express from 'express';
import { chatController } from '../controllers/chat.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validation.middleware.js';
import { chatMessageSchema, idSchema } from '../utils/validation.utils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get chat messages for a class
router.get('/class/:classId',
  validateParams({ classId: idSchema.extract('id') }),
  chatController.getChatMessages
);

// Send message to a class
router.post('/class/:classId',
  validateParams({ classId: idSchema.extract('id') }),
  validate({ message: chatMessageSchema.extract('message') }),
  chatController.sendMessage
);

// Delete a message
router.delete('/message/:messageId',
  validateParams({ messageId: idSchema.extract('id') }),
  chatController.deleteMessage
);

export default router;
