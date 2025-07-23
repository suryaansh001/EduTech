import { logger } from '../utils/logger.utils.js';
import { errorResponse } from '../utils/response.utils.js';

export const errorHandler = (err, req, res, next) => {
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });

  // Prisma errors
  if (err.code === 'P2002') {
    return errorResponse(res, 'Duplicate entry found', 409);
  }

  if (err.code === 'P2025') {
    return errorResponse(res, 'Record not found', 404);
  }

  if (err.code && err.code.startsWith('P')) {
    return errorResponse(res, 'Database error', 500);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return errorResponse(res, 'Invalid token', 401);
  }

  if (err.name === 'TokenExpiredError') {
    return errorResponse(res, 'Token expired', 401);
  }

  // Validation errors
  if (err.name === 'ValidationError') {
    return errorResponse(res, 'Validation error', 400);
  }

  // Default error
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : err.message;

  return errorResponse(res, message, statusCode);
};
