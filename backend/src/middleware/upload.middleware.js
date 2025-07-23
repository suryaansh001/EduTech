import multer from 'multer';
import path from 'path';
import { errorResponse } from '../utils/response.utils.js';

// File filter function
const fileFilter = (req, file, cb) => {
  const allowedTypes = process.env.ALLOWED_FILE_TYPES?.split(',') || [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'), false);
  }
};

// Multer configuration for memory storage (we'll upload to Cloudinary)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB default
  },
  fileFilter
});

export const uploadSingle = (fieldName) => {
  return (req, res, next) => {
    upload.single(fieldName)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return errorResponse(res, 'File too large', 400);
            case 'LIMIT_UNEXPECTED_FILE':
              return errorResponse(res, 'Unexpected file field', 400);
            default:
              return errorResponse(res, 'File upload error', 400);
          }
        }
        return errorResponse(res, err.message, 400);
      }
      next();
    });
  };
};

export const uploadMultiple = (fieldName, maxCount = 5) => {
  return (req, res, next) => {
    upload.array(fieldName, maxCount)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return errorResponse(res, 'File too large', 400);
            case 'LIMIT_UNEXPECTED_FILE':
              return errorResponse(res, 'Too many files', 400);
            default:
              return errorResponse(res, 'File upload error', 400);
          }
        }
        return errorResponse(res, err.message, 400);
      }
      next();
    });
  };
};

export const uploadFields = (fields) => {
  return (req, res, next) => {
    upload.fields(fields)(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return errorResponse(res, 'File too large', 400);
            case 'LIMIT_UNEXPECTED_FILE':
              return errorResponse(res, 'Unexpected file field', 400);
            default:
              return errorResponse(res, 'File upload error', 400);
          }
        }
        return errorResponse(res, err.message, 400);
      }
      next();
    });
  };
};
