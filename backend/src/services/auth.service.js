import { prisma } from '../config/database.js';
import { hashPassword, comparePassword } from '../utils/bcrypt.utils.js';
import { generateToken } from '../utils/jwt.utils.js';
import { logger } from '../utils/logger.utils.js';

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
          lastLogin: new Date()
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          bio: true,
          phone: true,
          createdAt: true
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
            fileUploads: true
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

    // Verify current password
    const isCurrentPasswordValid = await comparePassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new Error('Current password is incorrect');
    }

    // Hash new password
    const hashedNewPassword = await hashPassword(newPassword);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword }
    });

    logger.info(`Password changed for user: ${user.email}`);
  },

  // Refresh token
  refreshToken: async (userId) => {
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
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
