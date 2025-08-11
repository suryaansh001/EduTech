import { prisma } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.utils.js';
import { generateToken, generateRandomPassword } from '../utils/jwt.utils.js';
import { logger } from '../utils/logger.utils.js';
import { emailService } from './email.service.js';
import crypto from 'crypto';

export const authService = {
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

  // Admin creates a student/teacher with temporary password
  createUserByAdmin: async (userData, adminId) => {
    const { name, email, role = 'STUDENT', phone, bio, grade, specialization } = userData;

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Generate temporary password
    const temporaryPassword = generateRandomPassword();
    const hashedPassword = await hashPassword(temporaryPassword);

    // Create user with transaction
    const user = await prisma.$transaction(async (prisma) => {
      const newUser = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
          phone,
          bio,
          isFirstLogin: true,
          isActive: true
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

      // Create role-specific profile with additional data
      if (role === 'TEACHER') {
        await prisma.teacherProfile.create({
          data: {
            userId: newUser.id,
            specialization: specialization || null
          }
        });
      } else if (role === 'STUDENT') {
        await prisma.studentProfile.create({
          data: {
            userId: newUser.id,
            grade: grade || null
          }
        });
      }

      return newUser;
    });

    // Send welcome email with credentials
    try {
      await emailService.sendWelcomeEmail(user, temporaryPassword);
      logger.info(`Welcome email sent to new ${role.toLowerCase()}: ${email}`);
    } catch (error) {
      logger.warn(`Failed to send welcome email to ${email}:`, error);
      // Don't throw error here as user is already created
    }

    logger.info(`New ${role.toLowerCase()} created by admin ${adminId}: ${email}`);

    return {
      user,
      temporaryPassword // Only return this in development/testing
    };
  },

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

  // Get user profile
  getUserProfile: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        teacherProfile: true,
        studentProfile: true,
        _count: {
          select: {
            createdClasses: true,
            enrollments: true,
            quizAttempts: true,
            fileUploads: true,
            announcements: true,
            notes: true
          }
        }
      }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  },

  // Update user profile
  updateProfile: async (userId, updateData) => {
    const { name, phone, bio, profileImage, ...profileData } = updateData;

    const user = await prisma.$transaction(async (prisma) => {
      // Update main user data
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(phone && { phone }),
          ...(bio && { bio }),
          ...(profileImage && { profileImage })
        },
        include: {
          teacherProfile: true,
          studentProfile: true
        }
      });

      // Update role-specific profile
      if (updatedUser.role === 'TEACHER' && Object.keys(profileData).length > 0) {
        await prisma.teacherProfile.upsert({
          where: { userId },
          update: profileData,
          create: {
            userId,
            ...profileData
          }
        });
      } else if (updatedUser.role === 'STUDENT' && Object.keys(profileData).length > 0) {
        await prisma.studentProfile.upsert({
          where: { userId },
          update: profileData,
          create: {
            userId,
            ...profileData
          }
        });
      }

      return updatedUser;
    });

    // Remove password from response
    const { password, ...userWithoutPassword } = user;

    return userWithoutPassword;
  },

  // Change password
  changePassword: async (userId, currentPassword, newPassword) => {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // For first login, skip current password verification
    if (!user.isFirstLogin) {
      // Verify current password for existing users
      const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Current password is incorrect');
      }
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password and mark first login as complete
    await prisma.user.update({
      where: { id: userId },
      data: { 
        password: hashedNewPassword,
        isFirstLogin: false
      }
    });

    logger.info(`Password changed for user: ${user.email}`);
  },

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

  // Refresh token
  refreshToken: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    if (!user.isActive) {
      throw new Error('Account is deactivated');
    }

    // Generate new JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role
    });

    return { token };
  }
};
