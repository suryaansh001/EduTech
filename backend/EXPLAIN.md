# EduTech Backend - Complete Line-by-Line Documentation

**Purpose**: This document provides beginner-friendly explanations of every backend file and line of code. Perfect reference for integrating RAG-based chatbot for teachers and students.

**Last Updated**: December 30, 2025

---

## Table of Contents

1. [Entry Point Files](#entry-point-files)
2. [Configuration Files](#configuration-files)
3. [Controllers](#controllers)
4. [Services](#services)
5. [Middleware](#middleware)
6. [Routes](#routes)
7. [Utilities](#utilities)
8. [Database Schema](#database-schema)
9. [Socket Handlers](#socket-handlers)
10. [RAG Chatbot Integration Guide](#rag-chatbot-integration-guide)

---

## Entry Point Files

### server.js - Application Entry Point

**Location**: `/backend/server.js`

**Purpose**: Starts the Express server and handles graceful shutdown

```javascript
// Line 1: Import the HTTP server and Express app from app.js
import { server } from './src/app.js';

// Line 2: Import logger utility for logging messages
import { logger } from './src/utils/logger.utils.js';

// Line 3: Import database connection function
import { connectDB } from './src/config/database.js';

// Line 4: Import initialization utilities (creates default admin user)
import { initializeApp } from './src/utils/init.utils.js';

// Line 6-8: Get the port number from environment variables, default to 5000
// process.env.PORT checks if PORT is set in .env file
// || 5000 means "if PORT is not set, use 5000"
const PORT = process.env.PORT || 5000;

// Line 10-45: Main async function to start the server
// async means this function can use "await" to wait for promises
const startServer = async () => {
  try {
    // Line 12: Connect to PostgreSQL database using Prisma
    // await means "wait for database connection before continuing"
    await connectDB();
    
    // Line 13: Log success message to console
    logger.info('Database connected successfully');

    // Line 16: Initialize the app (creates default admin user if not exists)
    await initializeApp();
    
    // Line 17: Log that initialization is complete
    logger.info('App initialized successfully');

    // Line 20-26: Start the HTTP server on specified port
    // server.listen starts listening for incoming HTTP requests
    server.listen(PORT, () => {
      // This callback runs when server starts successfully
      logger.info(`Server is running on port ${PORT}`);
      // ${PORT} is template literal syntax to insert variable value
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (error) {
    // Line 27-30: If any error occurs during startup
    logger.error('Failed to start server:', error);
    // Exit the application with error code 1
    process.exit(1);
  }
};

// Line 33-55: Graceful shutdown handler
// When you press Ctrl+C or server receives termination signal
const gracefulShutdown = async (signal) => {
  // Line 34: Log which signal was received (SIGTERM or SIGINT)
  logger.info(`${signal} received. Closing server gracefully...`);

  // Line 37-44: Close the server and stop accepting new connections
  server.close(async () => {
    // This callback runs when server is closed
    logger.info('Server closed');

    try {
      // Line 42: Disconnect from database
      await prisma.$disconnect();
      logger.info('Database disconnected');
      
      // Line 45: Exit with success code 0
      process.exit(0);
    } catch (error) {
      // Line 47: If database disconnect fails
      logger.error('Error during shutdown:', error);
      process.exit(1);
    }
  });

  // Line 52-53: Timeout to force shutdown if it takes too long
  setTimeout(() => {
    logger.error('Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000); // 10000 milliseconds = 10 seconds
};

// Line 56-57: Register shutdown handlers for different signals
// SIGTERM: sent by process managers like PM2 or Docker
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
// SIGINT: sent when you press Ctrl+C
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Line 60: Start the server
startServer();
```

### src/app.js - Express Application Configuration

**Location**: `/backend/src/app.js`

**Purpose**: Configures Express app with middleware, routes, and security

```javascript
// Line 1-7: Import required packages
import express from 'express'; // Web framework for Node.js
import cors from 'cors'; // Enables Cross-Origin Resource Sharing
import helmet from 'helmet'; // Security headers middleware
import { createServer } from 'http'; // Node.js HTTP server
import { Server } from 'socket.io'; // WebSocket library for real-time features
import rateLimit from 'express-rate-limit'; // Rate limiting to prevent abuse

// Line 9-10: Import configurations
import { connectRedis } from './config/redis.js'; // Redis for token blacklisting
import { initializeSocket } from './socket/index.js'; // WebSocket handlers

// Line 12-18: Import middleware
import { errorHandler } from './middleware/error.middleware.js';
import { 
  xssProtection, // Prevents Cross-Site Scripting attacks
  sqlInjectionProtection, // Prevents SQL injection
  securityHeaders, // Adds security headers
  requestLogger, // Logs all requests
  bruteForceProtection // Prevents brute force attacks
} from './middleware/security.middleware.js';
import { logger } from './utils/logger.utils.js';

// Line 20-28: Import routes (API endpoints)
import authRoutes from './routes/auth.routes.js'; // Login, register, logout
import userRoutes from './routes/users.routes.js'; // User management
import classRoutes from './routes/classes.routes.js'; // Class management
import quizRoutes from './routes/quizzes.routes.js'; // Quiz management
import fileRoutes from './routes/files.routes.js'; // File uploads/downloads
import chatRoutes from './routes/chat.routes.js'; // Chat messages
import analyticsRoutes from './routes/analytics.routes.js'; // Analytics data
import announcementRoutes from './routes/announcements.routes.js'; // Announcements
import noteRoutes from './routes/notes.routes.js'; // Notes management

// Line 30-31: Create Express app and HTTP server
const app = express(); // Creates Express application
const server = createServer(app); // Creates HTTP server wrapping Express

// Line 33-42: Initialize Socket.IO for WebSockets (real-time features)
const io = new Server(server, {
  cors: {
    // Allow frontend to connect via WebSocket
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"], // Allowed HTTP methods for WebSocket handshake
    credentials: true // Allow cookies in WebSocket connections
  }
});

// Line 44: Connect to Redis (for storing blacklisted tokens)
connectRedis();

// Line 46-55: SECURITY MIDDLEWARE STACK
// Order matters! Security middleware runs first

// 1. Security Headers - Adds HTTP security headers
app.use(securityHeaders);

// 2. Helmet - Industry-standard security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"], // Only load resources from same origin
      scriptSrc: ["'self'"], // Only execute scripts from same origin
      styleSrc: ["'self'", "'unsafe-inline'"], // Allow inline styles
      imgSrc: ["'self'", "data:", "https:"], // Allow images from anywhere
      connectSrc: ["'self'", process.env.CLIENT_URL || "http://localhost:3000"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding educational content
}));

// 3. CORS - Cross-Origin Resource Sharing
app.use(cors({
  origin: (origin, callback) => {
    // List of allowed domains
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:5173", // Vite dev server
      "http://localhost:3000"
    ];
    
    // Allow requests with no origin (mobile apps, Postman)
    // or from allowed origins
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true); // Allow the request
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS')); // Block the request
    }
  },
  credentials: true, // Allow cookies to be sent
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
}));

// 4. Rate Limiting - Prevent DoS attacks
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true, // Return rate limit info in headers
  legacyHeaders: false, // Disable old X-RateLimit headers
  skip: (req) => req.path === '/health', // Don't rate limit health checks
});
app.use('/api/', limiter); // Apply to all /api/* routes

// 5. Stricter rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Only 10 auth attempts per 15 minutes
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/auth/login', authLimiter); // Apply to login
app.use('/api/auth/register', authLimiter); // Apply to register
app.use('/api/auth/forgot-password', authLimiter); // Apply to password reset

// 6. Body parsing with size limits
app.use(express.json({ 
  limit: '10mb', // Maximum request body size
  verify: (req, res, buf) => {
    req.rawBody = buf; // Store raw body for signature verification
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Parse URL-encoded data

// 7. XSS Protection - Sanitize input
app.use(xssProtection); // Removes malicious scripts from input

// 8. SQL Injection Protection
app.use(sqlInjectionProtection); // Detects SQL injection patterns

// 9. Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger); // Log all requests (skip in test mode)
}

// 10. Brute Force Protection for login
app.use('/api/auth/login', bruteForceProtection); // Track failed login attempts

// Static files with security
app.use('/uploads', express.static('uploads', {
  dotfiles: 'deny', // Don't serve hidden files (starting with .)
  index: false // Don't serve directory listings
}));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API Routes - All routes require /api prefix
app.use('/api/auth', authRoutes); // Authentication endpoints
app.use('/api/users', userRoutes); // User management
app.use('/api/classes', classRoutes); // Class management
app.use('/api/quizzes', quizRoutes); // Quiz management
app.use('/api/files', fileRoutes); // File operations
app.use('/api/chat', chatRoutes); // Chat functionality
app.use('/api/analytics', analyticsRoutes); // Analytics
app.use('/api/announcements', announcementRoutes); // Announcements
app.use('/api/notes', noteRoutes); // Notes

// 404 handler - Catch all unmatched routes
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize Socket.IO handlers
initializeSocket(io);

// Global Error Handler (must be last middleware)
app.use(errorHandler);

// Make io available throughout the app
app.set('io', io);

// Export server and io for use in server.js
export { app, server, io };
```

---

## Configuration Files

### config/database.js - Database Connection

**Location**: `/backend/src/config/database.js`

**Purpose**: Connects to PostgreSQL database using Prisma ORM

```javascript
// Line 1: Import PrismaClient from generated client
import { PrismaClient } from '@prisma/client';

// Line 2: Import logger for logging messages
import { logger } from '../utils/logger.utils.js';

// Line 4-10: Create single Prisma instance (singleton pattern)
// This ensures we only have one database connection pool
let prisma;

if (process.env.NODE_ENV === 'production') {
  // In production, create new instance every time
  prisma = new PrismaClient();
} else {
  // In development, reuse existing instance to avoid creating too many connections
  // globalThis is a global object that persists across module reloads
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient();
  }
  prisma = globalThis.prisma;
}

// Line 12-22: Function to connect to database
export const connectDB = async () => {
  try {
    // $connect() establishes connection to database
    await prisma.$connect();
    // Log successful connection
    logger.info('Connected to PostgreSQL database');
  } catch (error) {
    // If connection fails, log error and exit
    logger.error('Database connection failed:', error);
    process.exit(1); // Exit with error code
  }
};

// Line 24-34: Function to disconnect from database
export const disconnectDB = async () => {
  try {
    // $disconnect() closes database connection
    await prisma.$disconnect();
    logger.info('Disconnected from database');
  } catch (error) {
    logger.error('Database disconnection failed:', error);
  }
};

// Line 36: Export prisma instance for use in services
export { prisma };
```

### config/redis.js - Redis Connection

**Location**: `/backend/src/config/redis.js`

**Purpose**: Connects to Redis for storing blacklisted JWT tokens

```javascript
// Line 1: Import Redis client
import { createClient } from 'redis';

// Line 2: Import logger
import { logger } from '../utils/logger.utils.js';

// Line 4: Create Redis client instance
let redisClient;

// Line 6-40: Function to connect to Redis
export const connectRedis = async () => {
  try {
    // Create Redis client with connection URL from environment
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
      // Default: Connect to Redis on localhost port 6379
    });

    // Event: When Redis connection opens successfully
    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    // Event: When Redis connection has an error
    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    // Connect to Redis
    await redisClient.connect();
  } catch (error) {
    // If Redis connection fails, log warning but don't exit
    // App can work without Redis (tokens just won't be blacklisted)
    logger.warn('Redis connection failed. Token blacklisting disabled:', error.message);
  }
};

// Line 42-56: Function to add token to blacklist
export const blacklistToken = async (token, expiresIn) => {
  if (!redisClient || !redisClient.isOpen) {
    // If Redis is not connected, log warning
    logger.warn('Redis not available. Token not blacklisted');
    return;
  }

  try {
    // Store token in Redis with expiration
    // key: `blacklist:${token}` - unique key for each token
    // value: 'true' - just a marker that token is blacklisted
    // EX: expiresIn - token expires after this many seconds
    await redisClient.setEx(`blacklist:${token}`, expiresIn, 'true');
    logger.info('Token blacklisted successfully');
  } catch (error) {
    logger.error('Failed to blacklist token:', error);
  }
};

// Line 58-72: Function to check if token is blacklisted
export const isTokenBlacklisted = async (token) => {
  if (!redisClient || !redisClient.isOpen) {
    // If Redis is not connected, assume token is not blacklisted
    return false;
  }

  try {
    // Get token from Redis
    const result = await redisClient.get(`blacklist:${token}`);
    // If result is not null, token is blacklisted
    return result !== null;
  } catch (error) {
    logger.error('Failed to check token blacklist:', error);
    // On error, assume token is not blacklisted (fail open)
    return false;
  }
};

// Line 74: Export Redis client for direct access if needed
export { redisClient };
```

### config/cloudinary.js - File Upload Service

**Location**: `/backend/src/config/cloudinary.js`

**Purpose**: Configures Cloudinary for file storage (images, PDFs, etc.)

```javascript
// Line 1: Import Cloudinary SDK
import { v2 as cloudinary } from 'cloudinary';

// Line 2: Import logger
import { logger } from '../utils/logger.utils.js';

// Line 4-17: Configure Cloudinary with credentials from environment
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your cloud name
  api_key: process.env.CLOUDINARY_API_KEY, // Your API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your API secret
  secure: true // Use HTTPS for all requests
});

// Log configuration status
if (process.env.CLOUDINARY_CLOUD_NAME) {
  logger.info('Cloudinary configured successfully');
} else {
  logger.warn('Cloudinary not configured. File uploads will fail.');
}

// Line 19: Export cloudinary instance
export default cloudinary;
```

---

## Controllers

Controllers handle HTTP requests, validate input, call services, and return responses.

### controllers/auth.controller.js - Authentication Controller

**Location**: `/backend/src/controllers/auth.controller.js`

**Purpose**: Handles login, registration, logout, and password management

```javascript
// Line 1: Import authentication service
import { authService } from '../services/auth.service.js';

// Line 2: Import response utilities
import { successResponse } from '../utils/response.utils.js';

// Line 3: Import token blacklisting function
import { blacklistToken } from '../config/redis.js';

// Line 4: Import JWT utilities
import { verifyToken } from '../utils/jwt.utils.js';

// Line 6: Export controller object with all auth methods
export const authController = {
  
  // Line 8-23: REGISTER - Create new user account
  register: async (req, res, next) => {
    try {
      // req.body contains: { firstName, lastName, email, password, role }
      const userData = req.body;
      
      // Call service to create user and generate token
      const result = await authService.register(userData);
      
      // Return success response with user data and token
      // Status 201: Created
      successResponse(res, result, 'Registration successful', 201);
    } catch (error) {
      // If any error occurs, pass to error handler middleware
      next(error);
    }
  },

  // Line 25-40: LOGIN - Authenticate user
  login: async (req, res, next) => {
    try {
      // req.body contains: { email, password }
      const { email, password } = req.body;
      
      // Call service to verify credentials and generate token
      const result = await authService.login(email, password);
      
      // Return success response with user data and token
      successResponse(res, result, 'Login successful');
    } catch (error) {
      // Pass error to error handler
      next(error);
    }
  },

  // Line 42-68: LOGOUT - Invalidate user session
  logout: async (req, res, next) => {
    try {
      // Get token from Authorization header
      // Format: "Bearer <token>"
      const authHeader = req.headers.authorization;
      
      if (authHeader && authHeader.startsWith('Bearer ')) {
        // Extract token (remove "Bearer " prefix)
        const token = authHeader.substring(7);
        
        try {
          // Verify token to get expiration time
          const decoded = verifyToken(token);
          // Calculate remaining time until token expires
          const expiresIn = decoded.exp - Math.floor(Date.now() / 1000);
          
          // Add token to blacklist if it hasn't expired yet
          if (expiresIn > 0) {
            await blacklistToken(token, expiresIn);
          }
        } catch (error) {
          // If token verification fails, ignore (token might be expired)
          // Still allow logout to succeed
        }
      }
      
      // Return success response
      successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  },

  // Line 70-85: FORGOT PASSWORD - Send password reset email
  forgotPassword: async (req, res, next) => {
    try {
      // req.body contains: { email }
      const { email } = req.body;
      
      // Call service to generate reset token and send email
      await authService.forgotPassword(email);
      
      // Always return success (don't reveal if email exists)
      // Security: Prevents email enumeration attacks
      successResponse(
        res,
        null,
        'If an account exists with this email, a password reset link has been sent.'
      );
    } catch (error) {
      next(error);
    }
  },

  // Line 87-102: RESET PASSWORD - Reset password with token
  resetPassword: async (req, res, next) => {
    try {
      // req.body contains: { token, newPassword }
      const { token, newPassword } = req.body;
      
      // Call service to verify token and update password
      await authService.resetPassword(token, newPassword);
      
      // Return success response
      successResponse(res, null, 'Password reset successful');
    } catch (error) {
      next(error);
    }
  },

  // Line 104-119: CHANGE PASSWORD - Change password when logged in
  changePassword: async (req, res, next) => {
    try {
      // req.user is set by authenticate middleware
      const userId = req.user.id;
      // req.body contains: { currentPassword, newPassword }
      const { currentPassword, newPassword } = req.body;
      
      // Call service to verify current password and update
      await authService.changePassword(userId, currentPassword, newPassword);
      
      // Return success response
      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  },

  // Line 121-136: VERIFY EMAIL - Verify email address with token
  verifyEmail: async (req, res, next) => {
    try {
      // req.query contains: ?token=<verification_token>
      const { token } = req.query;
      
      // Call service to verify token and mark email as verified
      await authService.verifyEmail(token);
      
      // Return success response
      successResponse(res, null, 'Email verified successfully');
    } catch (error) {
      next(error);
    }
  },

  // Line 138-153: ME - Get current user profile
  me: async (req, res, next) => {
    try {
      // req.user is set by authenticate middleware
      const userId = req.user.id;
      
      // Call service to get user profile
      const user = await authService.getUserProfile(userId);
      
      // Return success response with user data
      successResponse(res, user, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Line 155-170: REFRESH TOKEN - Generate new access token
  refreshToken: async (req, res, next) => {
    try {
      // req.body contains: { refreshToken }
      const { refreshToken } = req.body;
      
      // Call service to verify refresh token and generate new access token
      const result = await authService.refreshToken(refreshToken);
      
      // Return success response with new token
      successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }
};
```

### controllers/user.controller.js - User Management Controller

**Location**: `/backend/src/controllers/user.controller.js`

**Purpose**: Handles user CRUD operations and profile management

```javascript
// Line 1: Import user service
import { userService } from '../services/user.service.js';

// Line 2: Import response utilities
import { successResponse, paginatedResponse } from '../utils/response.utils.js';

// Line 4: Export controller object
export const userController = {
  
  // Line 6-28: GET ALL USERS - Retrieve list of users with pagination
  getAllUsers: async (req, res, next) => {
    try {
      // req.query contains: ?page=1&limit=10&role=STUDENT&search=john
      const {
        page = 1, // Default to page 1
        limit = 10, // Default to 10 users per page
        role, // Filter by role (ADMIN, TEACHER, STUDENT)
        search // Search by name or email
      } = req.query;

      // Build filters object
      const filters = {
        ...(role && { role }), // Add role filter if provided
        ...(search && { search }) // Add search filter if provided
      };

      // Call service to get users with pagination
      const result = await userService.getUsers(filters, {
        page: parseInt(page), // Convert string to number
        limit: parseInt(limit)
      });

      // Return paginated response
      // result contains: { users: [...], pagination: {...} }
      paginatedResponse(
        res,
        result.users,
        result.pagination,
        'Users retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  // Line 30-45: GET USER BY ID - Retrieve single user details
  getUserById: async (req, res, next) => {
    try {
      // req.params contains route parameters
      // Example: /api/users/:id -> req.params.id
      const { id } = req.params;
      
      // Call service to get user by ID
      const user = await userService.getUserById(id);
      
      // Return success response with user data
      successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Line 47-62: CREATE USER - Create new user (admin only)
  createUser: async (req, res, next) => {
    try {
      // req.body contains user data
      const userData = req.body;
      
      // Call service to create user
      const user = await userService.createUser(userData);
      
      // Return success response with created user
      // Status 201: Created
      successResponse(res, user, 'User created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Line 64-79: UPDATE USER - Update user details
  updateUser: async (req, res, next) => {
    try {
      // Get user ID from route parameters
      const { id } = req.params;
      // Get update data from request body
      const updateData = req.body;
      
      // Call service to update user
      const user = await userService.updateUser(id, updateData);
      
      // Return success response with updated user
      successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Line 81-96: DELETE USER - Delete user account
  deleteUser: async (req, res, next) => {
    try {
      // Get user ID from route parameters
      const { id } = req.params;
      
      // Call service to delete user
      await userService.deleteUser(id);
      
      // Return success response (no data)
      successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Line 98-113: GET USER STATS - Get user statistics (dashboard data)
  getUserStats: async (req, res, next) => {
    try {
      // req.user is set by authenticate middleware
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Call service to get role-specific statistics
      const stats = await userService.getUserStatistics(userId, userRole);
      
      // Return success response with statistics
      successResponse(res, stats, 'User statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Line 115-130: UPDATE USER ROLE - Change user role (admin only)
  updateUserRole: async (req, res, next) => {
    try {
      // Get user ID from route parameters
      const { id } = req.params;
      // Get new role from request body
      const { role } = req.body;
      
      // Call service to update user role
      const user = await userService.updateUserRole(id, role);
      
      // Return success response with updated user
      successResponse(res, user, 'User role updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Line 132-147: GET USER PROFILE - Get detailed user profile
  getUserProfile: async (req, res, next) => {
    try {
      // Get user ID from route parameters
      const { id } = req.params;
      
      // Call service to get detailed profile
      const profile = await userService.getUserProfile(id);
      
      // Return success response with profile data
      successResponse(res, profile, 'User profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};
```

*Note: Due to the extensive nature of the documentation, I'm creating the first section. Would you like me to continue with the remaining controllers, services, middleware, routes, and utilities? This will be a very large file (estimated 10,000+ lines). I can either:*

1. **Continue in the same file** (create one massive EXPLAIN.md)
2. **Split into multiple files** (EXPLAIN_PART1.md, EXPLAIN_PART2.md, etc.)
3. **Create separate files per category** (EXPLAIN_CONTROLLERS.md, EXPLAIN_SERVICES.md, etc.)

Which approach would you prefer for organizing this comprehensive documentation?
