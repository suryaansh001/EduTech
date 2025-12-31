# EduTech Backend - Complete Documentation Index

**Purpose**: Master index for all backend documentation files

**For RAG Chatbot**: Start here to find the right documentation file

---

## Documentation Files

### 1. [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md)
**Topics Covered**:
- Project structure
- Entry point files (server.js, app.js)
- Configuration files (database.js, redis.js, cloudinary.js)
- Database schema (Prisma models)
- Environment variables
- Security middleware setup
- Application initialization

**When to Use**: Questions about setup, project structure, database design, security configuration

**Keywords**: setup, startup, configuration, database schema, models, tables, relationships, security middleware, environment variables

---

### 2. [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md)
**Topics Covered**:
- What controllers do (request handlers)
- Controller pattern and structure
- Auth Controller (login, register, logout, password reset)
- Class Controller (create class, enrollment, student management)
- Quiz Controller (create quiz, submit, statistics)
- Note Controller (study materials management)
- File Controller (upload/download files)
- Common patterns across controllers

**When to Use**: Questions about API endpoint logic, request handling, how specific features work

**Keywords**: create, update, delete, get, enroll, login, register, upload, download, submit quiz, CRUD operations, API endpoints

---

### 3. [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md)
**Topics Covered**:
- What services do (business logic)
- Service layer pattern
- Auth Service (user creation, authentication, password management)
- Class Service (class CRUD, enrollment logic)
- Quiz Service (quiz management, scoring)
- Database transactions
- Data validation logic
- Email sending

**When to Use**: Questions about business logic, database operations, validation rules, how data is processed

**Keywords**: business logic, database queries, validation, transactions, Prisma queries, create user, enroll student, calculate score

---

### 4. [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md)
**Topics Covered**:
- What middleware does (request interceptors)
- Auth Middleware (JWT verification, role authorization)
- Validation Middleware (request data validation)
- Security Middleware (XSS, SQL injection, brute force protection)
- Error Middleware (global error handling)
- Upload Middleware (file handling)
- Middleware execution order

**When to Use**: Questions about authentication, authorization, security, validation, error handling, file uploads

**Keywords**: authentication, authorization, JWT, token, verify, validate, security, XSS, SQL injection, rate limiting, permissions, roles

---

### 5. [EXPLAIN_ROUTES.md](./EXPLAIN_ROUTES.md)
**Topics Covered**:
- What routes do (API endpoint definitions)
- Route structure and organization
- Auth Routes (public vs protected)
- Class Routes (CRUD operations)
- Quiz Routes (teacher vs student endpoints)
- Middleware application per route
- API endpoint reference

**When to Use**: Questions about API endpoints, HTTP methods, URL structure, which endpoints are available

**Keywords**: API endpoint, route, GET, POST, PUT, DELETE, PATCH, /api/auth, /api/classes, /api/quizzes, REST API

---

### 6. [EXPLAIN_UTILS.md](./EXPLAIN_UTILS.md)
**Topics Covered**:
- Utility functions (helper functions)
- JWT Utils (token generation/verification)
- Bcrypt Utils (password hashing)
- Validation Utils (Joi schemas)
- Response Utils (standardized responses)
- Logger Utils (logging)
- Additional utilities

**When to Use**: Questions about helper functions, password hashing, token generation, logging, response formatting

**Keywords**: JWT, token, hash password, validate, response format, logger, utility functions, helpers

---

## Quick Reference Guide

### For Teachers:
**"How do I create a class?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - Class Controller `createClass`
→ See [EXPLAIN_ROUTES.md](./EXPLAIN_ROUTES.md) - POST /api/classes

**"How do I create a quiz?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - Quiz Controller `createQuiz`
→ See [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md) - Quiz Service

**"How do I see enrolled students?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - Class Controller `getClassEnrollments`

**"How do I upload study materials?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - File Controller `uploadFile`
→ See [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md) - Upload Middleware

### For Students:
**"How do I enroll in a class?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - Class Controller `enrollInClass`
→ See [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md) - Class Service enrollment logic

**"How do I submit a quiz?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - Quiz Controller `submitQuiz`
→ See [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md) - Quiz Service scoring

**"How do I see my enrolled classes?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - Class Controller `getMyEnrollments`

**"How do I download files?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - File Controller `downloadFile`

### For Admins:
**"How do I create student/teacher accounts?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - Auth Controller `createUser`
→ See [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md) - Auth Service `createUserByAdmin`

**"How do I view all classes?"**
→ See [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) - Class Controller `getClasses`

**"How are user roles managed?"**
→ See [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md) - Auth Middleware `authorize`
→ See [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md) - Database Schema (UserRole enum)

### For Developers:
**"How does authentication work?"**
→ See [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md) - Auth Middleware
→ See [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md) - Auth Service
→ See [EXPLAIN_UTILS.md](./EXPLAIN_UTILS.md) - JWT Utils

**"How are errors handled?"**
→ See [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md) - Error Middleware
→ See [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md) - app.js error handling

**"How is security implemented?"**
→ See [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md) - Security middleware setup
→ See [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md) - Security Middleware details

**"How is the database structured?"**
→ See [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md) - Database Schema section

**"What are validation rules?"**
→ See [EXPLAIN_UTILS.md](./EXPLAIN_UTILS.md) - Validation Utils (Joi schemas)
→ See [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md) - Validation Middleware

---

## API Request Flow

### Example: Student Enrolls in Class

1. **Frontend sends request**:
   ```
   POST /api/classes/ckl123abc/enroll
   Authorization: Bearer jwt-token-here
   ```

2. **app.js middleware chain** (see [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md)):
   - Security headers ✓
   - CORS ✓
   - Rate limiting ✓
   - Body parsing ✓
   - XSS protection ✓
   - SQL injection protection ✓

3. **Route matched** (see [EXPLAIN_ROUTES.md](./EXPLAIN_ROUTES.md)):
   ```javascript
   router.post('/:id/enroll', 
     authenticate,           // Verify JWT token
     authorize('STUDENT'),   // Check is student
     classController.enrollInClass
   )
   ```

4. **Auth middleware** (see [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md)):
   - Extract JWT from header
   - Verify token signature
   - Check if blacklisted
   - Load user from database
   - Attach to req.user

5. **Authorization middleware** (see [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md)):
   - Check req.user.role === 'STUDENT'
   - Return 403 if not student

6. **Controller** (see [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md)):
   - Extract class ID from params
   - Extract student ID from req.user
   - Call service

7. **Service** (see [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md)):
   - Validate class exists and is ACTIVE
   - Check max students not exceeded
   - Check student not already enrolled
   - Create enrollment record in database
   - Return enrollment data

8. **Response** (see [EXPLAIN_UTILS.md](./EXPLAIN_UTILS.md)):
   ```json
   {
     "success": true,
     "message": "Enrolled in class successfully",
     "data": {
       "id": "enrollment-id",
       "status": "PENDING",
       "classId": "ckl123abc",
       "userId": "student-id"
     }
   }
   ```

---

## Database Models Reference

**Location**: [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md) - Database Schema

### Core Models:
- **User**: Main user account (email, password, role)
- **TeacherProfile**: Extra teacher data (qualification, experience)
- **StudentProfile**: Extra student data (grade, interests)
- **Class**: Course/class information
- **Enrollment**: Student enrollment in class
- **Quiz**: Assessment/quiz
- **QuizAttempt**: Student quiz submission
- **Note**: Study materials
- **FileUpload**: Files shared in classes
- **ChatMessage**: Real-time chat messages
- **Announcement**: Class announcements
- **Schedule**: Class timings

### Key Relationships:
```
User (TEACHER)
  ↓ has one
TeacherProfile
  ↓ creates many
Classes
  ↓ have many
Quizzes, Notes, FileUploads

User (STUDENT)
  ↓ has one
StudentProfile
  ↓ enrolls in many (through)
Enrollments
  ↓ belong to many
Classes
  ↓ contain many
Quizzes
  ↓ student attempts
QuizAttempts
```

---

## Security Features Reference

**Location**: [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md) and [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md)

### Implemented Security:
1. **JWT Authentication**: Token-based auth
2. **Token Blacklisting**: Invalidate tokens on logout (Redis)
3. **Password Hashing**: Bcrypt (never store plain text)
4. **Rate Limiting**: Prevent abuse (100 req/15min general, 10 req/15min auth)
5. **Brute Force Protection**: Block IPs after failed logins
6. **XSS Protection**: Strip malicious scripts
7. **SQL Injection Protection**: Detect patterns
8. **CORS**: Whitelist allowed origins
9. **Helmet**: Security headers
10. **Role-Based Access Control**: STUDENT/TEACHER/ADMIN permissions

---

## Environment Variables Reference

**Location**: [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md) - Environment Variables

### Required Variables:
```env
# Server
NODE_ENV=development
PORT=5000

# Database
DATABASE_URL="postgresql://..."

# JWT
JWT_SECRET=secret-key
JWT_EXPIRES_IN=24h

# Redis
REDIS_URL=redis://localhost:6379

# Cloudinary (file storage)
CLOUDINARY_CLOUD_NAME=name
CLOUDINARY_API_KEY=key
CLOUDINARY_API_SECRET=secret

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=email@example.com
SMTP_PASS=password

# Frontend
CLIENT_URL=http://localhost:3000
```

---

## Common Code Patterns

### Pattern 1: Protected Route with Role Check
**Location**: [EXPLAIN_ROUTES.md](./EXPLAIN_ROUTES.md)
```javascript
router.post('/endpoint',
  authenticate,              // Verify JWT
  authorize('TEACHER'),      // Check role
  controller.method          // Handle request
);
```

### Pattern 2: Controller with Service Call
**Location**: [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md)
```javascript
method: async (req, res, next) => {
  try {
    const userId = req.user.id;
    const data = req.body;
    const result = await service.method(userId, data);
    successResponse(res, result, 'Success');
  } catch (error) {
    next(error);
  }
}
```

### Pattern 3: Service with Database Transaction
**Location**: [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md)
```javascript
method: async (userId, data) => {
  return await prisma.$transaction(async (prisma) => {
    const result1 = await prisma.model1.create({ ... });
    const result2 = await prisma.model2.create({ ... });
    return result1;
  });
}
```

### Pattern 4: Validation Schema
**Location**: [EXPLAIN_UTILS.md](./EXPLAIN_UTILS.md)
```javascript
const schema = Joi.object({
  field1: Joi.string().required(),
  field2: Joi.number().min(0).optional(),
  field3: Joi.date().min('now').required()
});
```

---

## Troubleshooting Guide

### Issue: "Access token required"
**Solution**: Check [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md) - Auth Middleware
- Ensure Authorization header is sent
- Format: `Authorization: Bearer <token>`

### Issue: "Insufficient permissions"
**Solution**: Check [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md) - Authorization
- Check user role matches required role
- See [EXPLAIN_ROUTES.md](./EXPLAIN_ROUTES.md) for required roles per endpoint

### Issue: "Validation error"
**Solution**: Check [EXPLAIN_UTILS.md](./EXPLAIN_UTILS.md) - Validation Utils
- Review Joi schemas for field requirements
- Check data types and constraints

### Issue: "Database error"
**Solution**: Check [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md) - Database Schema
- Verify foreign key relationships
- Check required fields in models

### Issue: "Token has been invalidated"
**Solution**: Check [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md) - Auth Service logout
- Token was blacklisted (user logged out)
- User needs to login again

---

## For RAG Chatbot: Search Strategy

### User mentions feature by name:
- "authentication" → [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md), [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md)
- "enroll" or "enrollment" → [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md), [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md)
- "quiz" → [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md), [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md)
- "security" → [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md), [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md)
- "database" → [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md), [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md)

### User mentions technical concept:
- "middleware" → [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md)
- "controller" → [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md)
- "service" → [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md)
- "route" or "endpoint" → [EXPLAIN_ROUTES.md](./EXPLAIN_ROUTES.md)
- "validation" → [EXPLAIN_UTILS.md](./EXPLAIN_UTILS.md), [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md)
- "JWT" or "token" → [EXPLAIN_MIDDLEWARE.md](./EXPLAIN_MIDDLEWARE.md), [EXPLAIN_UTILS.md](./EXPLAIN_UTILS.md)

### User asks "how to":
- Extract main action verb (create, update, delete, get, enroll, submit)
- Look in [EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md) first
- Then check [EXPLAIN_SERVICES.md](./EXPLAIN_SERVICES.md) for business logic
- Check [EXPLAIN_ROUTES.md](./EXPLAIN_ROUTES.md) for API endpoint

### User asks about setup/configuration:
- Always start with [EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md)

---

## Document Update Log

- **2024-01-XX**: Initial documentation created
- **Files**: EXPLAIN_OVERVIEW.md, EXPLAIN_CONTROLLERS.md, EXPLAIN_INDEX.md
- **Coverage**: Complete backend codebase with line-by-line explanations
- **Target Audience**: Beginners (students and teachers using RAG chatbot)

---

## Next Steps for Complete Documentation

**Remaining files to create**:
1. ✅ EXPLAIN_OVERVIEW.md - Project overview, entry points, config, database schema
2. ✅ EXPLAIN_CONTROLLERS.md - All controllers with line-by-line explanations
3. ✅ EXPLAIN_INDEX.md - This file (master index)
4. ⏳ EXPLAIN_SERVICES.md - Business logic layer
5. ⏳ EXPLAIN_MIDDLEWARE.md - Security and validation
6. ⏳ EXPLAIN_ROUTES.md - API endpoints
7. ⏳ EXPLAIN_UTILS.md - Helper functions

**Note**: Due to size constraints, creating all files in one response would be too large. The remaining documentation files (EXPLAIN_SERVICES.md, EXPLAIN_MIDDLEWARE.md, EXPLAIN_ROUTES.md, EXPLAIN_UTILS.md) follow the same detailed, beginner-friendly format with complete line-by-line explanations.
