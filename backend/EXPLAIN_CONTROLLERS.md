# EduTech Backend - Controllers Documentation

**Purpose**: Complete explanation of all controller files (request handlers)

**For RAG Chatbot**: Use this to understand how API endpoints handle requests

---

## Table of Contents

1. [What are Controllers?](#what-are-controllers)
2. [Controller Pattern](#controller-pattern)
3. [Auth Controller](#auth-controller)
4. [Class Controller](#class-controller)
5. [Quiz Controller](#quiz-controller)
6. [Note Controller](#note-controller)
7. [File Controller](#file-controller)
8. [User Controller](#user-controller)
9. [Chat Controller](#chat-controller)
10. [Announcement Controller](#announcement-controller)
11. [Analytics Controller](#analytics-controller)

---

## What are Controllers?

**Controllers** are the bridge between **routes** and **services**.

**Flow**: Route → Controller → Service → Database

```
User Request → Route → Controller → Service → Database
                ↓
         Handle Response
```

**Controller Responsibilities**:
1. Extract data from request (body, params, query)
2. Call appropriate service function
3. Format and send response
4. Pass errors to error handler

**Controllers DON'T**:
- Contain business logic (that's in services)
- Access database directly (services do that)
- Validate data (middleware does that)

---

## Controller Pattern

### Standard Controller Structure

```javascript
export const exampleController = {
  // Each method handles one API endpoint
  methodName: async (req, res, next) => {
    try {
      // 1. Extract data from request
      const userId = req.user.id;  // From auth middleware
      const { param } = req.params;  // URL parameters
      const { query } = req.query;   // Query strings
      const data = req.body;         // Request body

      // 2. Call service
      const result = await service.method(userId, data);

      // 3. Send success response
      successResponse(res, result, 'Success message');
    } catch (error) {
      // 4. Pass error to error handler
      next(error);
    }
  }
};
```

### Key Concepts:

- **req**: Request object (contains user data, params, body)
- **res**: Response object (used to send data back)
- **next**: Function to pass control to next middleware (error handler)
- **async/await**: Handle asynchronous operations (database calls)
- **try/catch**: Catch errors and pass to error handler

---

## Auth Controller

**Location**: `/backend/src/controllers/auth.controller.js`

**Purpose**: Handles user authentication (login, register, password reset)

### Line-by-Line Explanation

```javascript
import { authService } from '../services/auth.service.js';
// Import authentication service (business logic)

import { successResponse, errorResponse } from '../utils/response.utils.js';
// Import response helpers (standardize API responses)

import { redisClient } from '../config/redis.js';
// Import Redis client (for token blacklisting)

export const authController = {
  // Export object containing all auth methods

  // ==========================================
  // METHOD 1: Register New User (PUBLIC)
  // ==========================================
  register: async (req, res, next) => {
    // Endpoint: POST /api/auth/register
    // Who can access: Anyone (public)
    // Purpose: Create new user account
    
    try {
      // STEP 1: Extract registration data from request body
      const { name, email, password, role, phone, bio } = req.body;
      // name: User's full name
      // email: User's email (must be unique)
      // password: Plain text password (will be hashed)
      // role: STUDENT or TEACHER
      // phone: Optional phone number
      // bio: Optional biography
      
      // STEP 2: Call service to register user
      const result = await authService.register({
        name,
        email,
        password,
        role,
        phone,
        bio
      });
      // Service will:
      // - Check if email already exists
      // - Hash password
      // - Create user in database
      // - Create profile (TeacherProfile or StudentProfile)
      // - Generate JWT token
      
      // STEP 3: Send success response
      successResponse(res, result, 'User registered successfully', 201);
      // 201 = Created (new resource created)
      // Returns: { user, token }
      
    } catch (error) {
      // STEP 4: Pass error to error handler middleware
      next(error);
      // Error handler will format error response
    }
  },

  // ==========================================
  // METHOD 2: Admin Creates User
  // ==========================================
  createUser: async (req, res, next) => {
    // Endpoint: POST /api/users (protected, ADMIN only)
    // Who can access: Admin only
    // Purpose: Admin creates student/teacher account
    
    try {
      // STEP 1: Get admin ID from authenticated user
      const adminId = req.user.id;
      // req.user is added by auth middleware
      // Only available for protected routes
      
      // STEP 2: Extract user data from request
      const { name, email, role, phone, bio, grade, specialization } = req.body;
      // grade: For students (e.g., "Grade 10")
      // specialization: For teachers (e.g., "Mathematics")
      
      // STEP 3: Call service to create user
      const result = await authService.createUserByAdmin({
        name,
        email,
        role,
        phone,
        bio,
        grade,
        specialization
      }, adminId);
      // Service will:
      // - Generate random password
      // - Create user account
      // - Send email with credentials
      // - Return user data (no token needed)

      // STEP 4: Send success response
      successResponse(
        res, 
        result, 
        `${role} created successfully and credentials sent via email`, 
        201
      );
      // ${role} inserts "STUDENT" or "TEACHER" into message
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 3: Login User
  // ==========================================
  login: async (req, res, next) => {
    // Endpoint: POST /api/auth/login
    // Who can access: Anyone (public)
    // Purpose: Authenticate user and return token
    
    try {
      // STEP 1: Extract credentials
      const { email, password } = req.body;
      
      // STEP 2: Call service to authenticate
      const result = await authService.login(email, password);
      // Service will:
      // - Find user by email
      // - Compare passwords (bcrypt)
      // - Update lastLogin timestamp
      // - Generate JWT token
      // - Return user data + token
      
      // STEP 3: Send success response
      successResponse(res, result, 'Login successful');
      // Returns: { user, token }
      // Frontend stores token in localStorage
      // Frontend sends token in headers for protected requests
      
    } catch (error) {
      next(error);
      // Common errors:
      // - Email not found
      // - Wrong password
      // - Account inactive
    }
  },

  // ==========================================
  // METHOD 4: Logout User
  // ==========================================
  logout: async (req, res, next) => {
    // Endpoint: POST /api/auth/logout
    // Who can access: Authenticated users
    // Purpose: Invalidate current token
    
    try {
      // STEP 1: Get token from request
      const token = req.token;
      // req.token is added by auth middleware
      // This is the JWT token from Authorization header
      
      // STEP 2: Blacklist token in Redis
      await redisClient.set(
        `blacklist:${token}`,  // Key: blacklist:abc123...
        true,                   // Value: true
        24 * 60 * 60           // Expiry: 24 hours (in seconds)
      );
      // Why blacklist?
      // - JWT tokens can't be "deleted"
      // - We store invalidated tokens in Redis
      // - Auth middleware checks blacklist before allowing access
      
      // WHY 24 HOURS?
      // - Tokens expire after 24 hours anyway
      // - After 24 hours, token is invalid regardless
      // - No need to keep in blacklist forever
      
      // STEP 3: Send success response
      successResponse(res, null, 'Logout successful');
      // null = no data to return
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 5: Get Current User Profile
  // ==========================================
  getProfile: async (req, res, next) => {
    // Endpoint: GET /api/auth/profile
    // Who can access: Authenticated users
    // Purpose: Get logged-in user's profile
    
    try {
      // STEP 1: Get user ID from authenticated user
      const userId = req.user.id;
      // req.user comes from JWT token
      // Token decoded by auth middleware
      
      // STEP 2: Fetch user profile from database
      const user = await authService.getUserProfile(userId);
      // Service will:
      // - Find user by ID
      // - Include role-specific profile (teacher/student)
      // - Return user data (password excluded)
      
      // STEP 3: Send success response
      successResponse(res, user, 'Profile retrieved successfully');
      // Returns complete user object with profile
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 6: Update Profile
  // ==========================================
  updateProfile: async (req, res, next) => {
    // Endpoint: PATCH /api/auth/profile
    // Who can access: Authenticated users
    // Purpose: Update user's own profile
    
    try {
      // STEP 1: Get user ID
      const userId = req.user.id;
      
      // STEP 2: Get update data from request body
      const updateData = req.body;
      // Can update: name, phone, bio, profileImage
      // Can update profile data: grade, interests (student)
      //                          qualification, experience (teacher)
      
      // STEP 3: Call service to update
      const user = await authService.updateProfile(userId, updateData);
      // Service will:
      // - Validate update data
      // - Update user record
      // - Update profile record if needed
      // - Return updated user
      
      // STEP 4: Send success response
      successResponse(res, user, 'Profile updated successfully');
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 7: Change Password
  // ==========================================
  changePassword: async (req, res, next) => {
    // Endpoint: POST /api/auth/change-password
    // Who can access: Authenticated users
    // Purpose: Change user's password
    
    try {
      // STEP 1: Get user ID
      const userId = req.user.id;
      
      // STEP 2: Extract passwords from request
      const { currentPassword, newPassword } = req.body;
      // currentPassword: Current password (for verification)
      // newPassword: New password to set
      
      // STEP 3: Call service to change password
      await authService.changePassword(userId, currentPassword, newPassword);
      // Service will:
      // - Verify current password is correct
      // - Hash new password
      // - Update password in database
      // - Set isFirstLogin to false
      
      // STEP 4: Send success response
      successResponse(res, null, 'Password changed successfully');
      // Good practice: Force logout after password change
      // Frontend should clear token and redirect to login
      
    } catch (error) {
      next(error);
      // Common error: Current password is wrong
    }
  },

  // ==========================================
  // METHOD 8: Forgot Password (Request Reset)
  // ==========================================
  forgotPassword: async (req, res, next) => {
    // Endpoint: POST /api/auth/forgot-password
    // Who can access: Anyone (public)
    // Purpose: Request password reset email
    
    try {
      // STEP 1: Get email from request
      const { email } = req.body;
      
      // STEP 2: Generate reset token and send email
      const result = await authService.generatePasswordResetToken(email);
      // Service will:
      // - Find user by email
      // - Generate random reset token
      // - Store token in database (with expiry)
      // - Send email with reset link
      // - Return success message
      
      // STEP 3: Send success response
      successResponse(res, result, 'Password reset email sent');
      // Email contains link: frontend.com/reset-password?token=abc123
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 9: Reset Password (Using Token)
  // ==========================================
  resetPassword: async (req, res, next) => {
    // Endpoint: POST /api/auth/reset-password
    // Who can access: Anyone (with valid token)
    // Purpose: Reset password using token from email
    
    try {
      // STEP 1: Extract token and new password
      const { token, newPassword } = req.body;
      // token: From email link (query parameter)
      // newPassword: User's new password
      
      // STEP 2: Reset password
      const result = await authService.resetPassword(token, newPassword);
      // Service will:
      // - Find user by reset token
      // - Check token hasn't expired
      // - Hash new password
      // - Update password
      // - Delete reset token
      // - Return success message
      
      // STEP 3: Send success response
      successResponse(res, result, 'Password reset successfully');
      // User can now login with new password
      
    } catch (error) {
      next(error);
      // Common errors:
      // - Invalid token
      // - Token expired
    }
  },

  // ==========================================
  // METHOD 10: Refresh Token
  // ==========================================
  refreshToken: async (req, res, next) => {
    // Endpoint: POST /api/auth/refresh-token
    // Who can access: Authenticated users
    // Purpose: Get new token before old one expires
    
    try {
      // STEP 1: Get user ID from current token
      const userId = req.user.id;
      
      // STEP 2: Generate new token
      const result = await authService.refreshToken(userId);
      // Service will:
      // - Generate new JWT token
      // - Return new token
      
      // STEP 3: Send success response
      successResponse(res, result, 'Token refreshed successfully');
      // Frontend should replace old token with new one
      
    } catch (error) {
      next(error);
    }
  }
};
```

### Auth Controller Summary

**Public Endpoints** (no authentication):
- `register` - Create new account
- `login` - Get authentication token
- `forgotPassword` - Request password reset
- `resetPassword` - Reset password with token

**Protected Endpoints** (requires authentication):
- `logout` - Invalidate token
- `getProfile` - Get own profile
- `updateProfile` - Update own profile
- `changePassword` - Change own password
- `refreshToken` - Get new token

**Admin Only**:
- `createUser` - Create student/teacher account

---

## Class Controller

**Location**: `/backend/src/controllers/class.controller.js`

**Purpose**: Handles class management (create, enroll, manage students)

### Line-by-Line Explanation

```javascript
import { classService } from '../services/class.service.js';
import { successResponse, paginatedResponse } from '../utils/response.utils.js';

export const classController = {

  // ==========================================
  // METHOD 1: Create New Class (TEACHER/ADMIN)
  // ==========================================
  createClass: async (req, res, next) => {
    // Endpoint: POST /api/classes
    // Who can access: Teachers and Admins
    // Purpose: Create a new class/course
    
    try {
      // STEP 1: Get teacher ID from authenticated user
      const teacherId = req.user.id;
      // Only teachers can create classes (checked by middleware)
      
      // STEP 2: Get class data from request body
      const classData = req.body;
      // classData contains:
      // - title: "Advanced Mathematics"
      // - description: "Learn calculus and algebra"
      // - subject: "Mathematics"
      // - grade: "Grade 10"
      // - maxStudents: 30
      // - startDate: "2024-01-01"
      // - endDate: "2024-06-30"
      // - meetingLink: "https://zoom.us/j/123"
      // - status: "DRAFT" or "ACTIVE"
      
      // STEP 3: Call service to create class
      const newClass = await classService.createClass(teacherId, classData);
      // Service will:
      // - Validate data
      // - Create class in database
      // - Link to teacher
      // - Return class object
      
      // STEP 4: Send success response
      successResponse(res, newClass, 'Class created successfully', 201);
      // 201 = Created
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 2: Get All Classes (with filters)
  // ==========================================
  getClasses: async (req, res, next) => {
    // Endpoint: GET /api/classes
    // Who can access: All authenticated users
    // Purpose: Get list of classes (with pagination and filters)
    
    try {
      // STEP 1: Get query parameters (filters and pagination)
      const { page = 1, limit = 10, status, subject, teacherId } = req.query;
      // page: Current page number (default 1)
      // limit: Results per page (default 10)
      // status: Filter by DRAFT/ACTIVE/ARCHIVED
      // subject: Filter by subject (e.g., "Mathematics")
      // teacherId: Filter by teacher
      
      // STEP 2: Get user info
      const userId = req.user.id;
      const userRole = req.user.role;
      // Different roles see different classes:
      // - STUDENT: only ACTIVE classes they're enrolled in or can enroll
      // - TEACHER: only their own classes
      // - ADMIN: all classes
      
      // STEP 3: Build filters object
      const filters = {
        ...(status && { status }),          // Only include if provided
        ...(subject && { subject }),
        ...(teacherId && { teacherId })
      };
      // Example: { status: "ACTIVE", subject: "Mathematics" }
      
      // STEP 4: Call service to get classes
      const result = await classService.getClasses(userId, userRole, filters, {
        page: parseInt(page),    // Convert string to number
        limit: parseInt(limit)
      });
      // Service returns:
      // { 
      //   classes: [...],
      //   pagination: { page, limit, total, pages }
      // }
      
      // STEP 5: Send paginated response
      paginatedResponse(
        res, 
        result.classes,      // Array of classes
        result.pagination,   // Pagination info
        'Classes retrieved successfully'
      );
      // Response format:
      // {
      //   success: true,
      //   message: "Classes retrieved successfully",
      //   data: [...classes...],
      //   pagination: { page: 1, limit: 10, total: 45, pages: 5 }
      // }
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 3: Get Student's Enrollments
  // ==========================================
  getMyEnrollments: async (req, res, next) => {
    // Endpoint: GET /api/classes/my-enrollments
    // Who can access: Students
    // Purpose: Get all classes student is enrolled in
    
    try {
      // STEP 1: Get student ID
      const studentId = req.user.id;
      
      // STEP 2: Fetch enrollments from service
      const enrollments = await classService.getStudentEnrollments(studentId);
      // Service returns enrollments with:
      // - Class details
      // - Enrollment status (PENDING/APPROVED/REJECTED)
      // - Progress percentage
      // - Class schedules
      // - Teacher info
      
      // STEP 3: Send success response
      successResponse(res, enrollments, 'Enrollments retrieved successfully');
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 4: Get Single Class Details
  // ==========================================
  getClass: async (req, res, next) => {
    // Endpoint: GET /api/classes/:id
    // Who can access: All authenticated users
    // Purpose: Get detailed information about one class
    
    try {
      // STEP 1: Extract class ID from URL
      const { id } = req.params;
      // URL: /api/classes/ckl123abc
      // params.id = "ckl123abc"
      
      // STEP 2: Get user info
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // STEP 3: Fetch class from service
      const classData = await classService.getClassById(id, userId, userRole);
      // Service checks:
      // - Does class exist?
      // - Does user have permission to view?
      // Returns class with:
      // - Full class details
      // - Teacher info
      // - Enrollment info (if student)
      // - Student list (if teacher)
      // - Schedules
      
      // STEP 4: Send success response
      successResponse(res, classData, 'Class retrieved successfully');
      
    } catch (error) {
      next(error);
      // Common errors:
      // - Class not found
      // - No permission to view
    }
  },

  // ==========================================
  // METHOD 5: Update Class (TEACHER/ADMIN)
  // ==========================================
  updateClass: async (req, res, next) => {
    // Endpoint: PATCH /api/classes/:id
    // Who can access: Class owner (teacher) or Admin
    // Purpose: Update class details
    
    try {
      // STEP 1: Extract class ID from URL
      const { id } = req.params;
      
      // STEP 2: Get teacher ID
      const teacherId = req.user.id;
      // Service will verify teacher owns this class
      
      // STEP 3: Get update data from body
      const updateData = req.body;
      // Can update:
      // - title, description, subject, grade
      // - maxStudents, startDate, endDate
      // - meetingLink, status
      
      // STEP 4: Call service to update
      const updatedClass = await classService.updateClass(id, teacherId, updateData);
      // Service will:
      // - Check ownership
      // - Validate data
      // - Update class
      // - Return updated class
      
      // STEP 5: Send success response
      successResponse(res, updatedClass, 'Class updated successfully');
      
    } catch (error) {
      next(error);
      // Common errors:
      // - Not your class
      // - Class not found
    }
  },

  // ==========================================
  // METHOD 6: Delete Class (TEACHER/ADMIN)
  // ==========================================
  deleteClass: async (req, res, next) => {
    // Endpoint: DELETE /api/classes/:id
    // Who can access: Class owner (teacher) or Admin
    // Purpose: Delete a class
    
    try {
      // STEP 1: Extract class ID
      const { id } = req.params;
      
      // STEP 2: Get teacher ID
      const teacherId = req.user.id;
      
      // STEP 3: Call service to delete
      await classService.deleteClass(id, teacherId);
      // Service will:
      // - Check ownership
      // - Check if class has active enrollments
      // - Delete related data (schedules, quizzes)
      // - Delete class
      
      // STEP 4: Send success response
      successResponse(res, null, 'Class deleted successfully');
      // null = no data to return
      
    } catch (error) {
      next(error);
      // Common errors:
      // - Can't delete class with active students
    }
  },

  // ==========================================
  // METHOD 7: Enroll in Class (STUDENT)
  // ==========================================
  enrollInClass: async (req, res, next) => {
    // Endpoint: POST /api/classes/:id/enroll
    // Who can access: Students
    // Purpose: Enroll student in a class
    
    try {
      // STEP 1: Extract class ID from URL
      const { id } = req.params;
      
      // STEP 2: Get student ID
      const studentId = req.user.id;
      
      // STEP 3: Call service to enroll
      const enrollment = await classService.enrollStudent(id, studentId);
      // Service will:
      // - Check class exists and is ACTIVE
      // - Check maxStudents not exceeded
      // - Check student not already enrolled
      // - Create enrollment record (status: PENDING)
      // - Return enrollment
      
      // STEP 4: Send success response
      successResponse(res, enrollment, 'Enrolled in class successfully');
      // Enrollment may require teacher approval
      
    } catch (error) {
      next(error);
      // Common errors:
      // - Class is full
      // - Already enrolled
      // - Class not active
    }
  },

  // ==========================================
  // METHOD 8: Get Class Enrollments (TEACHER/ADMIN)
  // ==========================================
  getClassEnrollments: async (req, res, next) => {
    // Endpoint: GET /api/classes/:id/enrollments
    // Who can access: Class teacher or Admin
    // Purpose: Get list of students enrolled in class
    
    try {
      // STEP 1: Extract class ID and get user info
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // STEP 2: Get query parameters
      const { page = 1, limit = 10, status } = req.query;
      // status: Filter by PENDING/APPROVED/REJECTED
      
      // STEP 3: Handle based on role
      if (userRole === 'TEACHER') {
        // Teacher can only view their own class enrollments
        const result = await classService.getClassEnrollments(id, userId, {
          status,
          page: parseInt(page),
          limit: parseInt(limit)
        });
        
        paginatedResponse(
          res, 
          result.enrollments, 
          result.pagination, 
          'Class enrollments retrieved successfully'
        );
        
      } else if (userRole === 'ADMIN') {
        // Admin can view any class enrollments
        const result = await classService.getClassEnrollments(id, null, {
          status,
          page: parseInt(page),
          limit: parseInt(limit),
          isAdmin: true  // Skip ownership check
        });
        
        paginatedResponse(
          res, 
          result.enrollments, 
          result.pagination, 
          'Class enrollments retrieved successfully'
        );
        
      } else {
        // Students can't view enrollments
        return next(new Error('You do not have permission to view class enrollments'));
      }
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 9: Update Enrollment Status (TEACHER/ADMIN)
  // ==========================================
  updateEnrollmentStatus: async (req, res, next) => {
    // Endpoint: PATCH /api/classes/:id/enrollments/:enrollmentId
    // Who can access: Class teacher or Admin
    // Purpose: Approve/reject student enrollment
    
    try {
      // STEP 1: Extract IDs from URL
      const { id, enrollmentId } = req.params;
      // id: Class ID
      // enrollmentId: Enrollment ID
      
      // STEP 2: Get new status from body
      const { status } = req.body;
      // status: "APPROVED" or "REJECTED"
      
      // STEP 3: Get user info
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // STEP 4: Handle based on role
      const teacherId = userRole === 'ADMIN' ? null : userId;
      // If admin, pass null (skip ownership check)
      
      // STEP 5: Update enrollment status
      const enrollment = await classService.updateEnrollmentStatus(
        id, 
        enrollmentId, 
        teacherId, 
        status
      );
      // Service will:
      // - Verify ownership (if teacher)
      // - Update enrollment status
      // - Send notification to student
      // - Return updated enrollment
      
      // STEP 6: Send success response
      successResponse(res, enrollment, 'Enrollment status updated successfully');
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 10: Get Available Students (TEACHER/ADMIN)
  // ==========================================
  getAvailableStudents: async (req, res, next) => {
    // Endpoint: GET /api/classes/:id/available-students
    // Who can access: Class teacher or Admin
    // Purpose: Get list of students who can be enrolled
    
    try {
      // STEP 1: Extract class ID
      const { id } = req.params;
      
      // STEP 2: Get user info
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // STEP 3: Get filters from query
      const { page = 1, limit = 20, search, grade } = req.query;
      // search: Search by name or email
      // grade: Filter by student grade
      
      const filters = {
        ...(search && { search }),
        ...(grade && { grade })
      };
      
      // STEP 4: Fetch available students
      const result = await classService.getAvailableStudents(
        id,
        userId,
        userRole,
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );
      // Service returns students who:
      // - Are not already enrolled
      // - Match the filters
      
      // STEP 5: Send paginated response
      paginatedResponse(
        res,
        result.students,
        result.pagination,
        'Available students retrieved successfully'
      );
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 11: Bulk Enroll Students (TEACHER/ADMIN)
  // ==========================================
  bulkEnrollStudents: async (req, res, next) => {
    // Endpoint: POST /api/classes/:id/bulk-enroll
    // Who can access: Class teacher or Admin
    // Purpose: Enroll multiple students at once
    
    try {
      // STEP 1: Extract class ID
      const { id } = req.params;
      
      // STEP 2: Get student IDs from body
      const { studentIds } = req.body;
      // studentIds: ["id1", "id2", "id3"]
      
      // STEP 3: Validate input
      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return next(new Error('Please provide an array of student IDs'));
      }
      
      // STEP 4: Get user info
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // STEP 5: Bulk enroll
      const result = await classService.bulkEnrollStudents(
        id,
        studentIds,
        userId,
        userRole
      );
      // Service will:
      // - Verify ownership
      // - Check class capacity
      // - Enroll all valid students
      // - Return count of successful enrollments
      
      // STEP 6: Send success response
      successResponse(
        res,
        result,
        `Successfully enrolled ${result.count} students in the class`
      );
      
    } catch (error) {
      next(error);
    }
  },

  // ==========================================
  // METHOD 12: Remove Student from Class (TEACHER/ADMIN)
  // ==========================================
  removeStudentFromClass: async (req, res, next) => {
    // Endpoint: DELETE /api/classes/:id/students/:studentId
    // Who can access: Class teacher or Admin
    // Purpose: Remove a student from class
    
    try {
      // STEP 1: Extract IDs from URL
      const { id, studentId } = req.params;
      // id: Class ID
      // studentId: Student ID to remove
      
      // STEP 2: Get user info
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // STEP 3: Remove student
      const result = await classService.removeStudentFromClass(
        id,
        studentId,
        userId,
        userRole
      );
      // Service will:
      // - Verify ownership
      // - Delete enrollment
      // - Return success message
      
      // STEP 4: Send success response
      successResponse(
        res,
        result,
        'Student removed from class successfully'
      );
      
    } catch (error) {
      next(error);
    }
  }
};
```

### Class Controller Summary

**Teacher/Admin Actions**:
- `createClass` - Create new class
- `updateClass` - Update class details
- `deleteClass` - Delete class
- `getClassEnrollments` - View enrolled students
- `updateEnrollmentStatus` - Approve/reject enrollments
- `getAvailableStudents` - Find students to enroll
- `bulkEnrollStudents` - Enroll multiple students
- `removeStudentFromClass` - Remove student

**Student Actions**:
- `enrollInClass` - Enroll in a class
- `getMyEnrollments` - View my enrolled classes

**All Users**:
- `getClasses` - Browse classes (filtered by role)
- `getClass` - View class details

---

## Quiz Controller

**Location**: `/backend/src/controllers/quiz.controller.js`

**Purpose**: Handles quiz/assessment management

### Key Methods Explained

```javascript
export const quizController = {

  // CREATE QUIZ (TEACHER)
  createQuiz: async (req, res, next) => {
    // Create new quiz for a class
    // Body contains:
    // {
    //   classId: "class-id",
    //   title: "Chapter 1 Quiz",
    //   description: "Test your knowledge",
    //   questions: [
    //     {
    //       questionText: "What is 2+2?",
    //       options: ["3", "4", "5", "6"],
    //       correctAnswer: 1,  // Index of correct option
    //       points: 10
    //     }
    //   ],
    //   totalPoints: 100,
    //   duration: 30,  // Minutes
    //   passingScore: 70,  // Percentage
    //   startTime: "2024-01-01T10:00:00Z",
    //   endTime: "2024-01-01T11:00:00Z",
    //   isActive: true
    // }
    
    const teacherId = req.user.id;
    const quizData = req.body;
    
    const quiz = await quizService.createQuiz(teacherId, quizData);
    
    successResponse(res, quiz, 'Quiz created successfully', 201);
  },

  // SUBMIT QUIZ (STUDENT)
  submitQuiz: async (req, res, next) => {
    // Student submits quiz answers
    // Body contains:
    // {
    //   answers: [
    //     { questionId: "q1", selectedOption: 1 },
    //     { questionId: "q2", selectedOption: 2 }
    //   ]
    // }
    
    const { id } = req.params;  // Quiz ID
    const studentId = req.user.id;
    const { answers } = req.body;
    
    // Service will:
    // - Check quiz is active
    // - Check within time window
    // - Calculate score
    // - Store attempt
    const result = await quizService.submitQuizAttempt(id, studentId, answers);
    // Returns:
    // {
    //   score: 85,
    //   totalPoints: 100,
    //   percentage: 85,
    //   passed: true,
    //   correctAnswers: 8,
    //   totalQuestions: 10
    // }
    
    successResponse(res, result, 'Quiz submitted successfully');
  },

  // GET QUIZ STATISTICS (TEACHER)
  getQuizStatistics: async (req, res, next) => {
    // Get analytics for a quiz
    const { id } = req.params;
    const teacherId = req.user.id;
    
    const stats = await quizService.getQuizStatistics(id, teacherId);
    // Returns:
    // {
    //   totalAttempts: 25,
    //   averageScore: 78.5,
    //   highestScore: 95,
    //   lowestScore: 45,
    //   passRate: 80,  // Percentage
    //   questionStats: [
    //     {
    //       questionId: "q1",
    //       correctRate: 90  // 90% answered correctly
    //     }
    //   ]
    // }
    
    successResponse(res, stats, 'Quiz statistics retrieved successfully');
  }
};
```

---

## Note Controller

**Location**: `/backend/src/controllers/note.controller.js`

**Purpose**: Handles study notes/materials

### Key Methods

```javascript
export const noteController = {

  // CREATE NOTE
  createNote: async (req, res, next) => {
    // Create new note/study material
    // Body:
    // {
    //   title: "Chapter 1 Summary",
    //   content: "Markdown content...",
    //   classId: "class-id",
    //   subject: "Mathematics",
    //   tags: ["algebra", "chapter1"],
    //   isPublic: false  // Only for enrolled students
    // }
    
    const authorId = req.user.id;
    const noteData = req.body;
    
    const note = await noteService.createNote(authorId, noteData);
    
    successResponse(res, note, 'Note created successfully', 201);
  },

  // GET NOTES WITH FILTERS
  getNotes: async (req, res, next) => {
    // Get filtered list of notes
    // Query params:
    // - classId: Filter by class
    // - subject: Filter by subject
    // - tags: Filter by tags
    // - search: Search in title/content
    // - isPublic: Filter by visibility
    
    const userId = req.user.id;
    const userRole = req.user.role;
    const { page, limit, classId, subject, tags, search, isPublic } = req.query;
    
    const filters = {
      ...(classId && { classId }),
      ...(subject && { subject }),
      ...(tags && { tags: Array.isArray(tags) ? tags : [tags] }),
      ...(search && { search }),
      ...(typeof isPublic !== 'undefined' && { isPublic: isPublic === 'true' })
    };
    
    const result = await noteService.getNotes(
      userId,
      userRole,
      filters,
      { page: parseInt(page), limit: parseInt(limit) }
    );
    
    paginatedResponse(res, result.notes, result.pagination, 'Notes retrieved successfully');
  }
};
```

---

## File Controller

**Location**: `/backend/src/controllers/file.controller.js`

**Purpose**: Handles file uploads/downloads

### Key Methods

```javascript
export const fileController = {

  // UPLOAD FILE
  uploadFile: async (req, res, next) => {
    // Upload file to Cloudinary
    // Uses multer middleware for file handling
    
    const userId = req.user.id;
    const { classId } = req.body;  // Optional: link to class
    const file = req.file;  // File from multer
    
    if (!file) {
      return errorResponse(res, 'No file uploaded', 400);
    }
    
    // Service uploads to Cloudinary and stores metadata in DB
    const uploadedFile = await fileService.uploadFile(userId, file, classId);
    // Returns:
    // {
    //   id: "file-id",
    //   fileName: "document.pdf",
    //   fileUrl: "https://cloudinary.com/...",
    //   fileType: "application/pdf",
    //   fileSize: 1048576,  // Bytes
    //   classId: "class-id"
    // }
    
    successResponse(res, uploadedFile, 'File uploaded successfully', 201);
  },

  // DOWNLOAD FILE
  downloadFile: async (req, res, next) => {
    // Download file (redirect to Cloudinary URL)
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;
    
    // Service checks permission
    const fileData = await fileService.getFileForDownload(id, userId, userRole);
    
    // Redirect to Cloudinary URL (file downloads automatically)
    res.redirect(fileData.fileUrl);
  }
};
```

---

## Common Patterns Across Controllers

### 1. Authentication Pattern

```javascript
// Every controller method has access to:
const userId = req.user.id;       // Current user's ID
const userRole = req.user.role;   // STUDENT/TEACHER/ADMIN
// These come from auth middleware
```

### 2. Error Handling Pattern

```javascript
try {
  // Controller logic
} catch (error) {
  next(error);  // Always pass to error handler
}
// Never send error response directly in controller
```

### 3. Pagination Pattern

```javascript
// Query parameters:
const { page = 1, limit = 10 } = req.query;

// Call service with pagination:
const result = await service.getItems({
  page: parseInt(page),
  limit: parseInt(limit)
});

// Use paginated response:
paginatedResponse(res, result.data, result.pagination, 'Success');
```

### 4. Filter Building Pattern

```javascript
// Only include filters if provided:
const filters = {
  ...(status && { status }),      // Spread only if truthy
  ...(subject && { subject }),
  ...(search && { search })
};
// Example output: { status: "ACTIVE", subject: "Math" }
```

---

## For RAG Chatbot Integration

### When to reference this document:

1. **User asks "How do I create a class?"** → Point to Class Controller `createClass`
2. **User asks "How do students enroll?"** → Point to Class Controller `enrollInClass`
3. **User asks "How to create quiz?"** → Point to Quiz Controller `createQuiz`
4. **User asks "How to upload files?"** → Point to File Controller `uploadFile`
5. **User asks "How authentication works?"** → Point to Auth Controller
6. **User asks about specific endpoint** → Find matching controller method

### Search Keywords:
- create, update, delete, get (CRUD operations)
- enroll, approve, reject (enrollment)
- upload, download (files)
- login, register, logout (auth)
- quiz, submit, statistics (assessments)
- pagination, filter, search (data retrieval)

---

**Related Documents**:
- EXPLAIN_SERVICES.md - Business logic layer
- EXPLAIN_MIDDLEWARE.md - Request validation and security
- EXPLAIN_ROUTES.md - API endpoint definitions
