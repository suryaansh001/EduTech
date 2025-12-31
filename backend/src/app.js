import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { createServer } from 'http';
import { Server } from 'socket.io';
import rateLimit from 'express-rate-limit';

// Import configurations
import { connectRedis } from './config/redis.js';
import { initializeSocket } from './socket/index.js';

// Import middleware
import { errorHandler } from './middleware/error.middleware.js';
import { 
  xssProtection, 
  sqlInjectionProtection, 
  securityHeaders, 
  requestLogger,
  bruteForceProtection 
} from './middleware/security.middleware.js';
import { logger } from './utils/logger.utils.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import classRoutes from './routes/classes.routes.js';
import quizRoutes from './routes/quizzes.routes.js';
import fileRoutes from './routes/files.routes.js';
import chatRoutes from './routes/chat.routes.js';
import analyticsRoutes from './routes/analytics.routes.js';
import announcementRoutes from './routes/announcements.routes.js';
import noteRoutes from './routes/notes.routes.js';

const app = express();
const server = createServer(app);

/**
 * Initialize Socket.IO with CORS configuration
 * SECURITY: Restrict origins to prevent unauthorized WebSocket connections
 */
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true
  }
});

// Connect to Redis
connectRedis();

/**
 * SECURITY MIDDLEWARE STACK
 * Order matters - security middleware should run early in the pipeline
 */

// 1. Security Headers - Add secure HTTP headers
// REASON: Protects against XSS, clickjacking, MIME sniffing attacks
app.use(securityHeaders);

// 2. Helmet - Industry-standard security headers
// REASON: Comprehensive security header management
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", process.env.CLIENT_URL || "http://localhost:3000"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow embedding for educational content
}));

// 3. CORS - Cross-Origin Resource Sharing
// REASON: Restrict which domains can access the API
app.use(cors({
  origin: (origin, callback) => {
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:5173", // Vite dev server
      "http://localhost:3000"
    ];
    
    // Allow requests with no origin (mobile apps, Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
}));

// 4. Rate Limiting - Prevent DoS attacks
// REASON: Limit request frequency to prevent abuse
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Skip rate limiting for health checks
  skip: (req) => req.path === '/health',
});
app.use('/api/', limiter);

// 5. Stricter rate limiting for authentication endpoints
// REASON: Auth endpoints are primary targets for brute force attacks
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
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// 6. Body parsing with size limits
// REASON: Prevent large payload DoS attacks
app.use(express.json({ 
  limit: '10mb',
  verify: (req, res, buf) => {
    req.rawBody = buf;
  }
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 7. XSS Protection - Sanitize input
// REASON: Prevent Cross-Site Scripting attacks
app.use(xssProtection);

// 8. SQL Injection Protection
// REASON: Additional layer against SQL injection (Prisma already provides protection)
app.use(sqlInjectionProtection);

// 9. Request Logging
// REASON: Audit trail for security monitoring
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
}

// 10. Brute Force Protection for login
// REASON: Track and block repeated failed login attempts
app.use('/api/auth/login', bruteForceProtection);

// Static files with security
// REASON: Serve uploaded files but prevent directory traversal
app.use('/uploads', express.static('uploads', {
  dotfiles: 'deny',
  index: false
}));

/**
 * Health check endpoint
 * REASON: For load balancers and monitoring systems
 */
app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

/**
 * API Routes
 * All routes require /api prefix for clear separation
 */
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notes', noteRoutes);

/**
 * 404 handler - Catch all unmatched routes
 * REASON: Provide consistent error response for invalid routes
 */
app.use('*', (req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Initialize Socket.IO handlers
initializeSocket(io);

/**
 * Global Error Handler
 * REASON: Catch all errors and return consistent error responses
 * Must be last middleware in the stack
 */
app.use(errorHandler);

// Make io available throughout the app
app.set('io', io);

export { app, server, io };
