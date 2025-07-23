import { verifyToken } from '../utils/jwt.utils.js';
import { errorResponse } from '../utils/response.utils.js';
import { prisma } from '../config/database.js';
import { redisClient } from '../config/redis.js';

export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return errorResponse(res, 'Access token required', 401);
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Check if token is blacklisted
    const isBlacklisted = await redisClient.exists(`blacklist:${token}`);
    if (isBlacklisted) {
      return errorResponse(res, 'Token has been invalidated', 401);
    }

    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        teacherProfile: true,
        studentProfile: true
      }
    });

    if (!user) {
      return errorResponse(res, 'User not found', 401);
    }

    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    return errorResponse(res, 'Invalid token', 401);
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return errorResponse(res, 'Authentication required', 401);
    }

    if (!roles.includes(req.user.role)) {
      return errorResponse(res, 'Insufficient permissions', 403);
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }

    const token = authHeader.substring(7);
    
    try {
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        include: {
          teacherProfile: true,
          studentProfile: true
        }
      });

      if (user) {
        req.user = user;
        req.token = token;
      }
    } catch (error) {
      // Token is invalid, but we continue without authentication
    }

    next();
  } catch (error) {
    next();
  }
};
