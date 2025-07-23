import express from 'express';
import { fileController } from '../controllers/file.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { validateParams } from '../middleware/validation.middleware.js';
import { idSchema } from '../utils/validation.utils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Upload file
router.post('/upload',
  uploadSingle('file'),
  fileController.uploadFile
);

// Get files
router.get('/', fileController.getFiles);

// Get file by ID
router.get('/:id',
  validateParams(idSchema),
  fileController.getFile
);

// Download file
router.get('/:id/download',
  validateParams(idSchema),
  fileController.downloadFile
);

// Delete file
router.delete('/:id',
  validateParams(idSchema),
  fileController.deleteFile
);

export default router;
