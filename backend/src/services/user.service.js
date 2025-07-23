import { prisma } from '../config/database.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { logger } from '../utils/logger.utils.js';

export const userService = {
  // Get all users with filters
  getUsers: async (filters = {}, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const { role, search } = filters;
    const skip = (page - 1) * limit;

    let whereClause = {};

    if (role) {
      whereClause.role = role;
    }

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          phone: true,
          createdAt: true,
          lastLogin: true,
          teacherProfile: {
            select: {
              qualification: true,
              specialization: true,
              totalStudents: true
            }
          },
          studentProfile: {
            select: {
              grade: true,
              totalCourses: true,
              completedCourses: true
            }
          },
          _count: {
            select: {
              createdClasses: true,
              enrollments: true,
              quizAttempts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return {
      users,
      pagination: {
        page,
        limit,
        total
      }
    };
  },

  // Get user by ID
  getUserById: async (userId, currentUserId, currentUserRole) => {
    // Check access permissions
    if (currentUserRole !== 'ADMIN' && currentUserId !== userId) {
      throw new Error('Access denied');
    }

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
            chatMessages: true,
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

  // Update user (admin only)
  updateUser: async (userId, updateData) => {
    const { name, email, role, phone, bio, profileImage, ...profileData } = updateData;

    // Check if email is already taken
    if (email) {
      const existingUser = await prisma.user.findFirst({
        where: {
          email,
          NOT: { id: userId }
        }
      });

      if (existingUser) {
        throw new Error('Email already in use');
      }
    }

    const user = await prisma.$transaction(async (prisma) => {
      // Update main user data
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          ...(name && { name }),
          ...(email && { email }),
          ...(role && { role }),
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

    logger.info(`User updated: ${userId}`);
    return userWithoutPassword;
  },

  // Delete user (admin only)
  deleteUser: async (userId, currentUserId) => {
    // Prevent self-deletion
    if (userId === currentUserId) {
      throw new Error('Cannot delete your own account');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Delete user (cascade will handle related records)
    await prisma.user.delete({
      where: { id: userId }
    });

    logger.info(`User deleted: ${userId}`);
  },

  // Upload profile image
  uploadProfileImage: async (userId, file) => {
    try {
      // Get current user to check for existing image
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('User not found');
      }

      // Upload new image to Cloudinary
      const uploadResult = await uploadToCloudinary(file.buffer, 'edutech/profiles');

      // Delete old image if exists
      if (user.profileImage) {
        try {
          // Extract public_id from cloudinary URL
          const urlParts = user.profileImage.split('/');
          const publicIdWithExtension = urlParts[urlParts.length - 1];
          const publicId = publicIdWithExtension.split('.')[0];
          await deleteFromCloudinary(`edutech/profiles/${publicId}`);
        } catch (deleteError) {
          logger.warn('Failed to delete old profile image:', deleteError);
        }
      }

      // Update user with new image URL
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { profileImage: uploadResult.secure_url },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          profileImage: true,
          bio: true,
          phone: true
        }
      });

      logger.info(`Profile image updated for user: ${userId}`);
      return updatedUser;
    } catch (error) {
      logger.error('Error uploading profile image:', error);
      throw new Error('Failed to upload profile image');
    }
  },

  // Get user statistics
  getUserStatistics: async (userId, userRole) => {
    const baseStats = {
      totalClasses: 0,
      totalQuizzes: 0,
      totalEnrollments: 0,
      totalQuizAttempts: 0,
      averageScore: 0
    };

    if (userRole === 'TEACHER') {
      const [classCount, quizCount, enrollmentCount, quizStats] = await Promise.all([
        prisma.class.count({ where: { teacherId: userId } }),
        prisma.quiz.count({ 
          where: { 
            class: { teacherId: userId } 
          } 
        }),
        prisma.enrollment.count({ 
          where: { 
            class: { teacherId: userId },
            status: 'ACTIVE'
          } 
        }),
        prisma.quizAttempt.aggregate({
          where: {
            quiz: {
              class: { teacherId: userId }
            }
          },
          _avg: { score: true },
          _count: true
        })
      ]);

      return {
        totalClasses: classCount,
        totalQuizzes: quizCount,
        totalStudents: enrollmentCount,
        totalQuizAttempts: quizStats._count,
        averageStudentScore: quizStats._avg.score || 0
      };
    } else if (userRole === 'STUDENT') {
      const [enrollmentCount, quizAttemptStats, completedCourses] = await Promise.all([
        prisma.enrollment.count({ 
          where: { 
            userId,
            status: 'ACTIVE'
          } 
        }),
        prisma.quizAttempt.aggregate({
          where: { userId },
          _avg: { score: true },
          _count: true
        }),
        prisma.enrollment.count({
          where: {
            userId,
            status: 'COMPLETED'
          }
        })
      ]);

      return {
        totalEnrollments: enrollmentCount,
        totalQuizAttempts: quizAttemptStats._count,
        averageScore: quizAttemptStats._avg.score || 0,
        completedCourses
      };
    } else if (userRole === 'ADMIN') {
      const [userCount, classCount, quizCount, enrollmentCount] = await Promise.all([
        prisma.user.count(),
        prisma.class.count(),
        prisma.quiz.count(),
        prisma.enrollment.count()
      ]);

      return {
        totalUsers: userCount,
        totalClasses: classCount,
        totalQuizzes: quizCount,
        totalEnrollments: enrollmentCount
      };
    }

    return baseStats;
  }
};
