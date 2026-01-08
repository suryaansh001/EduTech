# Step 1: Authentication

This section covers the authentication functionality including login, registration, forgot password, and password reset.

## Routes (auth.routes.js)

```javascript
import express from 'express';
import { authController } from '../controllers/auth.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema
} from '../utils/validation.utils.js';
import Joi from 'joi';

// Additional validation schemas
const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().allow('').optional(), // Allow empty for first login
  newPassword: Joi.string().min(6).max(128).required()
});

const createUserSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  role: Joi.string().valid('STUDENT', 'TEACHER').required(),
  phone: Joi.string().optional(),
  bio: Joi.string().max(500).optional(),
  grade: Joi.string().optional(), // For students
  specialization: Joi.string().optional() // For teachers
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required()
});

const router = express.Router();

// Public routes - no authentication required
router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/forgot-password', validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validate(resetPasswordSchema), authController.resetPassword);
```

**Explanation:**
- **Imports**: Brings in Express router, authentication controller, middleware for auth checks and validation, and predefined validation schemas
- **Validation Schemas**: Define the expected structure and rules for request data using Joi validation library
- **Router Setup**: Creates Express router instance
- **Public Routes**: Endpoints accessible without authentication (register, login, password reset)

```javascript
// Protected routes - require authentication
router.use(authenticate);

router.post('/logout', authController.logout);
router.get('/profile', authController.getProfile);
router.put('/profile', validate(updateProfileSchema), authController.updateProfile);
router.post('/change-password', 
  validate(changePasswordSchema), 
  authController.changePassword
);
router.post('/refresh-token', authController.refreshToken);

// Admin only routes - require ADMIN role
router.post('/create-user', 
  authorize('ADMIN'), 
  validate(createUserSchema), 
  authController.createUser
);

export default router;
```

**Explanation:**
- **Protected Routes**: All routes after `router.use(authenticate)` require a valid JWT token
- **Profile Management**: Routes for viewing and updating user profile information
- **Password Management**: Routes for changing passwords and refreshing authentication tokens
- **Admin Routes**: Special routes only accessible to users with ADMIN role, allowing admin to create users directly
```

## Controller (auth.controller.js)

```javascript
import { authService } from '../services/auth.service.js';
import { successResponse, errorResponse } from '../utils/response.utils.js';
import { redisClient } from '../config/redis.js';

export const authController = {
  // Register a new user (public registration)
  register: async (req, res, next) => {
    try {
      const { name, email, password, role, phone, bio } = req.body;
      
      const result = await authService.register({
        name,
        email,
        password,
        role,
        phone,
        bio
      });

      successResponse(res, result, 'User registered successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Admin creates a new user (student/teacher)
  createUser: async (req, res, next) => {
    try {
      const adminId = req.user.id;
      const { name, email, role, phone, bio, grade, specialization } = req.body;
      
      const result = await authService.createUserByAdmin({
        name,
        email,
        role,
        phone,
        bio,
        grade,
        specialization
      }, adminId);

      successResponse(res, result, `${role} created successfully and credentials sent via email`, 201);
    } catch (error) {
      next(error);
    }
  },

  // Login user
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      
      const result = await authService.login(email, password);
      
      successResponse(res, result, 'Login successful');
    } catch (error) {
      next(error);
    }
  },
```

**Explanation:**
- **Imports**: Brings in the authentication service for business logic, response utilities for standardized API responses, and Redis client for token blacklisting
- **Controller Object**: Exports an object containing all authentication-related controller methods
- **Register Method**: Handles user registration by extracting data from request body and calling the service layer
- **Create User (Admin)**: Allows admins to create users directly, includes additional fields like grade/specialization
- **Login Method**: Processes login requests by calling the service layer with email and password

```javascript
  // Logout user
  logout: async (req, res, next) => {
    try {
      const token = req.token;
      
      // Add token to blacklist in Redis
      await redisClient.set(`blacklist:${token}`, true, 24 * 60 * 60); // 24 hours
      
      successResponse(res, null, 'Logout successful');
    } catch (error) {
      next(error);
    }
  },

  // Get current user profile
  getProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const user = await authService.getUserProfile(userId);
      
      successResponse(res, user, 'Profile retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update user profile
  updateProfile: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const updateData = req.body;
      
      const user = await authService.updateProfile(userId, updateData);
      
      successResponse(res, user, 'Profile updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Change password
  changePassword: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const { currentPassword, newPassword } = req.body;
      
      await authService.changePassword(userId, currentPassword, newPassword);
      
      successResponse(res, null, 'Password changed successfully');
    } catch (error) {
      next(error);
    }
  },

  // Request password reset
  forgotPassword: async (req, res, next) => {
    try {
      const { email } = req.body;
      
      const result = await authService.generatePasswordResetToken(email);
      
      successResponse(res, result, 'Password reset email sent');
    } catch (error) {
      next(error);
    }
  },

  // Reset password using token
  resetPassword: async (req, res, next) => {
    try {
      const { token, newPassword } = req.body;
      
      const result = await authService.resetPassword(token, newPassword);
      
      successResponse(res, result, 'Password reset successfully');
    } catch (error) {
      next(error);
    }
  },

  // Refresh token
  refreshToken: async (req, res, next) => {
    try {
      const userId = req.user.id;
      
      const result = await authService.refreshToken(userId);
      
      successResponse(res, result, 'Token refreshed successfully');
    } catch (error) {
      next(error);
    }
  }
};
```

**Explanation:**
- **Logout Method**: Adds the current JWT token to Redis blacklist to prevent reuse, effectively logging out the user
- **Get Profile**: Retrieves the current user's profile information using their ID from the JWT token
- **Update Profile**: Allows users to update their profile information (name, phone, bio, etc.)
- **Change Password**: Handles password changes with validation of current password
- **Forgot Password**: Initiates password reset process by generating and sending a reset token via email
- **Reset Password**: Completes password reset using the token sent via email
- **Refresh Token**: Generates a new JWT token for the authenticated user
```

## Service (auth.service.js) - Register

```javascript
  // Register a new user
  register: async (userData) => {
    const { name, email, password, role = 'STUDENT', phone, bio } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Create user with transaction to ensure profile creation
    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          phone,
          bio,
          lastLogin: new Date(),
          isFirstLogin: false
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          bio: true,
          phone: true,
          createdAt: true,
          isFirstLogin: true
        }
      });

      // Create role-specific profile
      if (role === 'TEACHER') {
        await prisma.teacherProfile.create({
          data: {
            userId: newUser.id
          }
        });
      } else if (role === 'STUDENT') {
        await prisma.studentProfile.create({
          data: {
            userId: newUser.id
          }
        });
      }

      return newUser;
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    logger.info(`New user registered: ${email}`);

    return {
      user,
      token
    };
  },
```

**Explanation:**
- **Duplicate Check**: Verifies if a user with the same email already exists to prevent duplicate registrations
- **Password Hashing**: Uses bcrypt to securely hash the password before storing it in the database
- **Database Transaction**: Uses Prisma's transaction to ensure both user creation and profile creation succeed together
- **Role-Based Profiles**: Creates either a teacher or student profile based on the user's role
- **JWT Token Generation**: Creates a JSON Web Token containing user ID, email, and role for authentication
- **Logging**: Records the registration event for monitoring and debugging
```

## Service (auth.service.js) - Login

```javascript
  // Login user
  login: async (email, password) => {
    // Find user with profiles
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teacherProfile: true,
        studentProfile: true
      }
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isActive) {
      throw new Error('Your account has been deactivated. Please contact administrator.');
    }

    // Check password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    // Update last login
    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    logger.info(`User logged in: ${email}`);

    return {
      user: userWithoutPassword,
      token
    };
  },
```

**Explanation:**
- **User Lookup**: Finds the user by email and includes their role-specific profile data
- **Account Status Check**: Verifies the account is active and not deactivated by admin
- **Password Verification**: Uses bcrypt to compare the provided password with the hashed password in database
- **Last Login Update**: Records the current timestamp as the user's last login time
- **Token Generation**: Creates a JWT token for the authenticated session
- **Security**: Removes password from the response object before returning user data

## Service (auth.service.js) - Forgot Password

```javascript
  // Generate password reset token
  generatePasswordResetToken: async (email) => {
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Save token to database
    await prisma.passwordResetToken.create({
      data: {
        token: resetToken,
        userId: user.id,
        expiresAt
      }
    });

    // Send reset email
    try {
      await emailService.sendPasswordResetEmail(user, resetToken);
      logger.info(`Password reset email sent to: ${email}`);
    } catch (error) {
      logger.error(`Failed to send password reset email to ${email}:`, error);
      throw new Error('Failed to send password reset email');
    }

    return { message: 'Password reset email sent' };
  },
```

**Explanation:**
- **User Verification**: Confirms the email exists in the system before proceeding
- **Secure Token Generation**: Creates a cryptographically secure random token using Node.js crypto module
- **Expiration**: Sets token to expire in 1 hour for security
- **Database Storage**: Saves the token with user association and expiration time
- **Email Notification**: Sends password reset email with the token (handled by email service)
- **Error Handling**: Logs failures and provides user-friendly error messages

## Service (auth.service.js) - Reset Password

```javascript
  // Reset password using token
  resetPassword: async (token, newPassword) => {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true }
    });

    if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
      throw new Error('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await hashPassword(newPassword);

    // Update password and mark token as used
    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword }
      }),
      prisma.passwordResetToken.update({
        where: { token },
        data: { used: true }
      })
    ]);

    logger.info(`Password reset completed for user: ${resetToken.user.email}`);
    return { message: 'Password reset successfully' };
  },
```

**Explanation:**
- **Token Validation**: Verifies the token exists, hasn't been used, and hasn't expired
- **Password Security**: Hashes the new password before storing it
- **Atomic Operation**: Uses database transaction to ensure both password update and token marking happen together
- **Token Invalidation**: Marks the reset token as used to prevent reuse
- **Logging**: Records successful password reset for security auditing
```

## Frontend Login Component (login-page.tsx)

```tsx
"use client"

/**
 * Login Page Component
 * 
 * SECURITY FEATURES:
 * 1. Input validation before submission
 * 2. Rate limiting awareness (handled by API)
 * 3. Secure password field (type="password")
 * 4. CSRF protection via API layer
 * 5. Error messages don't reveal if email exists
 * 6. Loading states prevent double submission
 * 7. First login detection for password change flow
 */

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useAuth } from "@/lib/auth-context"
import { ThemeToggle } from "./theme-toggle"
import { GraduationCap, Eye, EyeOff, AlertCircle, Loader2 } from "lucide-react"
import MathPhysicsBackground from "@/components/ui/mathsphysicsbackground"

export function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotEmail, setForgotEmail] = useState("")
  const [forgotPasswordSent, setForgotPasswordSent] = useState(false)
  const { login } = useAuth()

  /**
   * Handle login form submission
   * SECURITY: Validates input and handles errors securely
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // SECURITY: Basic client-side validation
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password")
      return
    }

    // SECURITY: Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const result = await login(email, password)
      
      if (!result.success) {
        // SECURITY: Generic error message to prevent enumeration
        setError(result.message || "Invalid credentials. Please try again.")
      } else if (result.isFirstLogin) {
        // TODO: Redirect to password change page
        // For now, just notify user
        setError("Please change your password after logging in.")
      }
    } catch (err) {
      // SECURITY: Don't expose technical errors to users
      setError("An error occurred. Please try again later.")
      console.error("Login error:", err)
    } finally {
      setIsLoading(false)
    }
  }

  /**
   * Handle forgot password submission
   * SECURITY: Doesn't reveal if email exists in system
   */
  const handleForgotPassword = async (e: React.FormEvent) => {
```

**Explanation:**
- **Security Features**: The component implements multiple security best practices including input validation, rate limiting awareness, and secure error handling
- **State Management**: Uses React hooks to manage form state, loading states, and UI toggles
- **Client-side Validation**: Performs basic validation before API calls to improve user experience
- **Error Handling**: Provides generic error messages to prevent information leakage about valid/invalid accounts
- **Loading States**: Prevents double submission and provides user feedback during API calls
- **First Login Detection**: Handles special flow for users logging in with temporary passwords
    e.preventDefault()
    
    if (!forgotEmail.trim()) {
      setError("Please enter your email address")
      return
    }

    setIsLoading(true)
    setError("")

    try {
      // API call would go here
      // For now, show success message regardless (security best practice)
      setForgotPasswordSent(true)
    } catch (err) {
      setError("An error occurred. Please try again later.")
    } finally {
      setIsLoading(false)
    }
  }
  // ... rest of the component for UI rendering
}
```</content>
<parameter name="filePath">/home/suri/proj/EduTech/code-snippets-by-functionality/authentication.md