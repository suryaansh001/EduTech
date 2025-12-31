# EduTech Backend - Overview & Setup Documentation

**Purpose**: Complete beginner-friendly explanation of entry points, configuration, and database setup

**For RAG Chatbot**: Use this document to understand the overall architecture and setup

---

## Table of Contents

1. [Project Structure](#project-structure)
2. [Entry Point Files](#entry-point-files)
3. [Configuration Files](#configuration-files)
4. [Database Schema](#database-schema)
5. [Environment Variables](#environment-variables)

---

## Project Structure

```
backend/
├── server.js              # Application entry point
├── package.json           # Project dependencies
├── .env                   # Environment variables (not in git)
├── prisma/
│   ├── schema.prisma      # Database schema definition
│   └── seed.js           # Database seeding script
└── src/
    ├── app.js            # Express app configuration
    ├── config/           # Configuration files
    ├── controllers/      # Request handlers
    ├── services/         # Business logic
    ├── middleware/       # Request interceptors
    ├── routes/           # API endpoints
    ├── utils/            # Helper functions
    └── socket/           # WebSocket handlers
```

---

## Entry Point Files

### server.js - Application Entry Point

**Location**: `/backend/server.js`

**Purpose**: Starts the HTTP server, connects to database, and handles graceful shutdown

**Line-by-Line Explanation**:

```javascript
// Line 1: Import the HTTP server and Express app
// The 'server' is an HTTP server that wraps our Express app
import { server } from './src/app.js';

// Line 3: Import logging utility
// Logger helps us write messages to console with timestamps
import { logger } from './src/utils/logger.utils.js';

// Line 5: Import database connection function
// This function connects to PostgreSQL using Prisma
import { connectDB } from './src/config/database.js';

// Line 7: Import initialization utilities
// Creates default admin user if database is empty
import { initializeApp } from './src/utils/init.utils.js';

// Line 10-12: Get port number from environment variables
// process.env.PORT - reads PORT from .env file
// || 5000 - if PORT not set, use 5000 as default
const PORT = process.env.PORT || 5000;

// Line 15-45: Main function to start server
const startServer = async () => {
  // 'async' keyword allows us to use 'await' inside
  // 'await' pauses execution until promise completes
  
  try {
    // Line 17: Connect to database
    // Must complete before we start server
    await connectDB();
    
    // Line 18: Log success message
    // Shows in console: "Database connected successfully"
    logger.info('Database connected successfully');

    // Line 21: Initialize application
    // Creates default admin user if needed
    await initializeApp();
    
    // Line 22: Log initialization complete
    logger.info('App initialized successfully');

    // Line 25-31: Start HTTP server
    // server.listen(PORT, callback)
    // - PORT: which port to listen on (e.g., 5000)
    // - callback: function that runs when server starts
    server.listen(PORT, () => {
      // This runs after server starts successfully
      logger.info(`Server is running on port ${PORT}`);
      // ${PORT} inserts the port number into the string
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    // Line 33-36: Handle startup errors
    // If database connection fails, log error and exit
    logger.error('Failed to start server:', error);
    // process.exit(1) stops the application
    // Exit code 1 means "error occurred"
    process.exit(1);
  }
};

// Line 39-67: Graceful shutdown handler
// Handles server shutdown cleanly (no data loss)
const gracefulShutdown = async (signal) => {
  // 'signal' is SIGTERM or SIGINT (shutdown signal name)
  
  // Line 40: Log which signal was received
  logger.info(`${signal} received. Closing server gracefully...`);

  // Line 43-61: Close server and cleanup
  server.close(async () => {
    // This callback runs when server stops accepting connections
    
    logger.info('Server closed');

    try {
      // Line 48: Disconnect from database
      // Must close database connections before exiting
      await prisma.$disconnect();
      logger.info('Database disconnected');
      
      // Line 52: Exit successfully
      // Exit code 0 means "no errors"
      process.exit(0);
      
    } catch (error) {
      // Line 54-57: Handle disconnect errors
      logger.error('Error during shutdown:', error);
      // Exit with error code
      process.exit(1);
    }
  });

  // Line 60-64: Force shutdown if taking too long
  setTimeout(() => {
    // If shutdown takes more than 10 seconds, force exit
    logger.error('Forced shutdown after 10 seconds');
    process.exit(1);
  }, 10000); // 10000 milliseconds = 10 seconds
};

// Line 67-70: Register shutdown handlers
// These listen for shutdown signals from operating system

// SIGTERM: sent by process managers (PM2, Docker)
// Example: When you run "pm2 stop app"
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// SIGINT: sent when user presses Ctrl+C in terminal
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Line 73: Start the server
// This is where everything begins!
startServer();
```

**Key Concepts for Beginners**:

- **async/await**: Modern way to handle asynchronous operations (like database calls)
- **process.env**: Access environment variables from .env file
- **Graceful Shutdown**: Properly close connections before exiting
- **Exit Codes**: 0 = success, 1 = error (used by operating system)

---

### src/app.js - Express Application Configuration

**Location**: `/backend/src/app.js`

**Purpose**: Configures Express with security middleware, routes, and error handling

**Line-by-Line Explanation**:

```javascript
// Line 1-7: Import core packages
import express from 'express';        // Web framework
import cors from 'cors';              // Allow cross-origin requests
import helmet from 'helmet';          // Security headers
import { createServer } from 'http';  // HTTP server
import { Server } from 'socket.io';   // WebSocket for real-time
import rateLimit from 'express-rate-limit'; // Prevent abuse

// WHY THESE PACKAGES?
// express: Makes building web APIs easy
// cors: Lets frontend (React) talk to backend (different ports)
// helmet: Adds HTTP headers to protect against attacks
// socket.io: Enables real-time features (chat, notifications)
// rate-limit: Stops someone from spamming your API

// Line 10-11: Import configurations
import { connectRedis } from './config/redis.js';
// Redis stores blacklisted tokens (logged out users)

import { initializeSocket } from './socket/index.js';
// Sets up WebSocket event handlers

// Line 13-20: Import security middleware
import { errorHandler } from './middleware/error.middleware.js';
import { 
  xssProtection,           // Prevents script injection
  sqlInjectionProtection,  // Prevents SQL attacks
  securityHeaders,         // Adds security headers
  requestLogger,           // Logs all requests
  bruteForceProtection    // Prevents password guessing
} from './middleware/security.middleware.js';

// Line 22-30: Import routes (API endpoints)
import authRoutes from './routes/auth.routes.js';
// Authentication: /api/auth/login, /api/auth/register

import userRoutes from './routes/users.routes.js';
// User management: /api/users, /api/users/:id

import classRoutes from './routes/classes.routes.js';
// Class management: /api/classes, /api/classes/:id

import quizRoutes from './routes/quizzes.routes.js';
// Quiz management: /api/quizzes, /api/quizzes/:id

// ... more routes imported similarly

// Line 32-33: Create Express app and HTTP server
const app = express();
// 'app' is our Express application object

const server = createServer(app);
// 'server' wraps 'app' to support WebSockets

// Line 36-46: Initialize Socket.IO
const io = new Server(server, {
  cors: {
    // Allow frontend to connect via WebSocket
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true  // Allow cookies
  }
});

// WHY SOCKET.IO?
// For real-time features like:
// - Live chat between students and teachers
// - Real-time quiz updates
// - Instant notifications

// Line 48: Connect to Redis
connectRedis();
// Redis stores temporary data (blacklisted tokens)

// ====================================
// SECURITY MIDDLEWARE (ORDER MATTERS!)
// ====================================
// These run for EVERY request, in order:

// Line 51-52: 1. Security Headers
app.use(securityHeaders);
// Adds HTTP headers like X-Frame-Options, X-Content-Type-Options

// Line 54-67: 2. Helmet (more security headers)
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      // Only load resources from same domain
      
      scriptSrc: ["'self'"],
      // Only run scripts from same domain
      
      styleSrc: ["'self'", "'unsafe-inline'"],
      // Allow inline CSS (needed for styling)
      
      imgSrc: ["'self'", "data:", "https:"],
      // Allow images from anywhere (for user uploads)
      
      connectSrc: ["'self'", process.env.CLIENT_URL],
      // Allow connections to frontend
    },
  },
  crossOriginEmbedderPolicy: false,
  // Allow embedding videos/PDFs
}));

// WHY HELMET?
// Protects against:
// - XSS (Cross-Site Scripting)
// - Clickjacking
// - MIME type sniffing
// - Protocol downgrade attacks

// Line 69-95: 3. CORS (Cross-Origin Resource Sharing)
app.use(cors({
  origin: (origin, callback) => {
    // 'origin' is the domain making the request
    // 'callback' decides if we allow it
    
    const allowedOrigins = [
      process.env.CLIENT_URL || "http://localhost:3000",
      "http://localhost:5173",  // Vite dev server
      "http://localhost:3000"   // React dev server
    ];
    
    // Check if origin is in allowed list
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);  // Allow request
    } else {
      logger.warn(`CORS blocked origin: ${origin}`);
      callback(new Error('Not allowed by CORS'));  // Block request
    }
  },
  credentials: true,  // Allow cookies
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-API-Key']
}));

// WHY CORS?
// Without CORS, browsers block frontend from calling backend
// (security feature to prevent malicious sites from stealing data)

// Line 97-111: 4. Rate Limiting (General)
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes in milliseconds
  max: 100,                   // Max 100 requests per window
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,      // Return rate limit info in headers
  legacyHeaders: false,
  skip: (req) => req.path === '/health',  // Don't rate limit health checks
});
app.use('/api/', limiter);

// HOW RATE LIMITING WORKS:
// If user makes 101 requests in 15 minutes, they're blocked
// Resets after 15 minutes

// Line 113-123: 5. Stricter Rate Limiting (Auth Endpoints)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 10,                    // Only 10 attempts per window
  // This is stricter!
  message: {
    success: false,
    message: 'Too many authentication attempts, please try again later.',
  },
});
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);

// WHY STRICTER FOR AUTH?
// Prevents brute force attacks (guessing passwords)

// Line 125-133: 6. Body Parsing
app.use(express.json({ 
  limit: '10mb',  // Max request body size
  verify: (req, res, buf) => {
    req.rawBody = buf;  // Store raw body for webhooks
  }
}));
app.use(express.urlencoded({ 
  extended: true,  // Parse complex objects
  limit: '10mb' 
}));

// WHAT IS BODY PARSING?
// Converts JSON in request body to JavaScript object
// Example: { "email": "test@test.com" } becomes req.body.email

// Line 135-136: 7. XSS Protection
app.use(xssProtection);
// Removes malicious scripts from input
// Example: <script>alert('hack')</script> is stripped

// Line 138-139: 8. SQL Injection Protection
app.use(sqlInjectionProtection);
// Detects SQL injection patterns
// Example: ' OR '1'='1 is blocked

// Line 141-144: 9. Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(requestLogger);
  // Logs every request (skip in test mode to reduce noise)
}

// Line 146-147: 10. Brute Force Protection
app.use('/api/auth/login', bruteForceProtection);
// Tracks failed login attempts per IP
// Blocks IP after too many failures

// Line 149-153: Serve Static Files
app.use('/uploads', express.static('uploads', {
  dotfiles: 'deny',    // Don't serve hidden files (.env, .git)
  index: false         // Don't show directory listings
}));

// WHAT ARE STATIC FILES?
// Files served directly without processing (images, PDFs, etc.)

// Line 155-163: Health Check Endpoint
app.get('/health', (req, res) => {
  // Used by load balancers to check if server is alive
  res.status(200).json({
    success: true,
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Line 165-174: Register API Routes
app.use('/api/auth', authRoutes);
// All routes in authRoutes are prefixed with /api/auth

app.use('/api/users', userRoutes);
// All routes in userRoutes are prefixed with /api/users

app.use('/api/classes', classRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/notes', noteRoutes);

// LINE 176-182: 404 Handler (catch unmatched routes)
app.use('*', (req, res) => {
  // '*' matches any route not handled above
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Line 184: Initialize WebSocket handlers
initializeSocket(io);

// Line 186: Global Error Handler (MUST BE LAST)
app.use(errorHandler);
// Catches all errors thrown in the app

// Line 188-189: Make Socket.IO available everywhere
app.set('io', io);

// Line 191: Export for use in server.js
export { app, server, io };
```

**Middleware Execution Order** (IMPORTANT):
1. Security headers
2. Helmet (more security)
3. CORS (cross-origin)
4. Rate limiting
5. Body parsing
6. XSS protection
7. SQL injection protection
8. Request logging
9. Brute force protection
10. Route handlers
11. 404 handler
12. Error handler (last!)

---

## Configuration Files

### config/database.js - PostgreSQL Connection

```javascript
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.utils.js';

// Create Prisma client (singleton pattern)
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient();
} else {
  // In development, reuse connection
  if (!globalThis.prisma) {
    globalThis.prisma = new PrismaClient();
  }
  prisma = globalThis.prisma;
}

// Connect to database
export const connectDB = async () => {
  try {
    await prisma.$connect();
    logger.info('Connected to PostgreSQL database');
  } catch (error) {
    logger.error('Database connection failed:', error);
    process.exit(1);
  }
};

// Disconnect from database
export const disconnectDB = async () => {
  try {
    await prisma.$disconnect();
    logger.info('Disconnected from database');
  } catch (error) {
    logger.error('Database disconnection failed:', error);
  }
};

export { prisma };
```

**Key Concepts**:
- **Prisma**: Modern ORM (Object-Relational Mapping) for TypeScript/JavaScript
- **Singleton Pattern**: Create only one database connection instance
- **globalThis**: Global object that persists across module reloads

### config/redis.js - Redis Connection

```javascript
import { createClient } from 'redis';
import { logger } from '../utils/logger.utils.js';

let redisClient;

// Connect to Redis
export const connectRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379'
    });

    redisClient.on('connect', () => {
      logger.info('Connected to Redis');
    });

    redisClient.on('error', (err) => {
      logger.error('Redis connection error:', err);
    });

    await redisClient.connect();
  } catch (error) {
    logger.warn('Redis connection failed:', error.message);
  }
};

// Add token to blacklist
export const blacklistToken = async (token, expiresIn) => {
  if (!redisClient || !redisClient.isOpen) {
    logger.warn('Redis not available');
    return;
  }

  try {
    await redisClient.setEx(`blacklist:${token}`, expiresIn, 'true');
    logger.info('Token blacklisted successfully');
  } catch (error) {
    logger.error('Failed to blacklist token:', error);
  }
};

// Check if token is blacklisted
export const isTokenBlacklisted = async (token) => {
  if (!redisClient || !redisClient.isOpen) {
    return false;
  }

  try {
    const result = await redisClient.get(`blacklist:${token}`);
    return result !== null;
  } catch (error) {
    logger.error('Failed to check token blacklist:', error);
    return false;
  }
};

export { redisClient };
```

**Why Redis?**:
- Fast in-memory data store
- Perfect for temporary data (like blacklisted tokens)
- Automatic expiration (tokens auto-delete after time)

---

## Database Schema

### Prisma Schema Explanation

**Location**: `/backend/prisma/schema.prisma`

**Purpose**: Defines database structure (tables, columns, relationships)

```prisma
// Database provider configuration
datasource db {
  provider = "postgresql"  // Using PostgreSQL database
  url      = env("DATABASE_URL")  // Connection string from .env
}

// Prisma Client generator
generator client {
  provider = "prisma-client-js"  // Generate JavaScript client
}

// Enums (predefined choices)
enum UserRole {
  STUDENT   // Can enroll in classes
  TEACHER   // Can create classes and quizzes
  ADMIN     // Can manage everything
}

enum ClassStatus {
  DRAFT     // Not published yet
  ACTIVE    // Currently running
  ARCHIVED  // Completed/closed
}

// User Model (main user account)
model User {
  id            String    @id @default(cuid())
  // id: Unique identifier (auto-generated)
  // cuid(): Creates unique ID like "ckl123abc"
  
  email         String    @unique
  // @unique ensures no duplicate emails
  
  name          String
  password      String    // Hashed password (never plain text!)
  role          UserRole  @default(STUDENT)
  profileImage  String?   // ? means optional
  bio           String?
  phone         String?
  isFirstLogin  Boolean   @default(true)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLogin     DateTime?

  // Relationships (connections to other tables)
  teacherProfile  TeacherProfile?
  // If role is TEACHER, has teacher profile
  
  studentProfile  StudentProfile?
  // If role is STUDENT, has student profile
  
  createdClasses  Class[]   @relation("TeacherClasses")
  // Classes created by this teacher
  
  enrollments     Enrollment[]
  // Classes this student enrolled in
  
  quizAttempts    QuizAttempt[]
  // Quizzes this student attempted
  
  chatMessages    ChatMessage[]
  // Chat messages sent by user
  
  fileUploads     FileUpload[]
  // Files uploaded by user
  
  announcements   Announcement[]
  // Announcements created by user
  
  notes           Note[]
  // Notes created by user

  @@map("users")
  // Actual table name in database
}

// TeacherProfile Model (extra data for teachers)
model TeacherProfile {
  id            String   @id @default(cuid())
  userId        String   @unique
  // Links to User table (one-to-one)
  
  qualification String?
  // e.g., "Ph.D. in Mathematics"
  
  experience    String?
  // e.g., "10 years"
  
  specialization String?
  // e.g., "Algebra, Calculus"
  
  rating        Float?   @default(0)
  // Average rating from students (0-5)
  
  totalStudents Int      @default(0)
  // Number of students taught
  
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  // onDelete: Cascade means if User deleted, delete this too

  @@map("teacher_profiles")
}

// StudentProfile Model (extra data for students)
model StudentProfile {
  id              String   @id @default(cuid())
  userId          String   @unique
  grade           String?
  // e.g., "Grade 10"
  
  interests       String[]
  // Array of interests: ["Math", "Physics"]
  
  learningGoals   String?
  // Student's goals
  
  totalCourses    Int      @default(0)
  completedCourses Int     @default(0)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("student_profiles")
}

// Class Model (course/class information)
model Class {
  id          String      @id @default(cuid())
  title       String
  // e.g., "Advanced Mathematics"
  
  description String?
  subject     String
  // e.g., "Mathematics"
  
  grade       String?
  // e.g., "Grade 10"
  
  maxStudents Int?
  // Maximum enrollment limit
  
  status      ClassStatus @default(DRAFT)
  startDate   DateTime
  endDate     DateTime?
  meetingLink String?
  // Zoom/Google Meet link
  
  teacherId   String
  // Which teacher created this class
  
  createdAt   DateTime    @default(now())
  updatedAt   DateTime    @updatedAt

  // Relationships
  teacher      User           @relation("TeacherClasses", fields: [teacherId], references: [id])
  enrollments  Enrollment[]   // Students enrolled
  schedules    Schedule[]     // Class timings
  quizzes      Quiz[]         // Quizzes in this class
  chatMessages ChatMessage[]  // Class chat
  fileUploads  FileUpload[]   // Files shared
  announcements Announcement[] // Class announcements
  notes        Note[]         // Class notes

  @@map("classes")
}

// Enrollment Model (student enrollment in class)
model Enrollment {
  id        String           @id @default(cuid())
  userId    String           // Student ID
  classId   String           // Class ID
  status    EnrollmentStatus @default(PENDING)
  progress  Float            @default(0)
  // Progress percentage (0-100)
  
  enrolledAt DateTime        @default(now())
  completedAt DateTime?

  user  User  @relation(fields: [userId], references: [id])
  class Class @relation(fields: [classId], references: [id])

  @@unique([userId, classId])
  // One student can only enroll once per class
  
  @@map("enrollments")
}
```

**Key Relationships**:
- User → TeacherProfile (one-to-one)
- User → StudentProfile (one-to-one)
- Teacher → Classes (one-to-many)
- Student → Enrollments → Classes (many-to-many)
- Class → Quizzes (one-to-many)
- Student → QuizAttempts → Quizzes (many-to-many)

---

## Environment Variables

### .env File Structure

```env
# Server Configuration
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/edutech"

# JWT Authentication
JWT_SECRET=your-super-secret-key-change-this
JWT_EXPIRES_IN=24h
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_REFRESH_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary (File Storage)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email (SMTP)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL
CLIENT_URL=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

**Variable Explanations**:

- **NODE_ENV**: Environment mode (development/production)
- **PORT**: Port number for server (default 5000)
- **DATABASE_URL**: PostgreSQL connection string
- **JWT_SECRET**: Secret key for signing tokens (KEEP SECRET!)
- **JWT_EXPIRES_IN**: How long tokens last (24h = 24 hours)
- **REDIS_URL**: Redis connection string
- **CLOUDINARY_***: Credentials for file storage service
- **SMTP_***: Email server configuration
- **CLIENT_URL**: Frontend URL (for CORS)
- **RATE_LIMIT_***: Rate limiting configuration

---

## For RAG Chatbot Integration

### Recommended Document Sections for RAG:

1. **User asks about setup**: Point to "Entry Point Files" and "Environment Variables"
2. **User asks about security**: Point to "Security Middleware" in app.js
3. **User asks about database**: Point to "Database Schema"
4. **User asks about authentication**: Point to auth sections in other docs
5. **User asks about file structure**: Point to "Project Structure"

### Key Search Keywords:
- startup, initialization, entry point
- configuration, setup, environment
- database, schema, models, tables
- security, middleware, protection
- redis, cache, blacklist
- websocket, socket.io, real-time

---

**Next Documents**:
- EXPLAIN_CONTROLLERS.md - Request handlers
- EXPLAIN_SERVICES.md - Business logic
- EXPLAIN_MIDDLEWARE.md - Security & validation
- EXPLAIN_ROUTES.md - API endpoints
- EXPLAIN_UTILS.md - Helper functions
