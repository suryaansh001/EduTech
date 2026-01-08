# Step 2: User Management

This section covers user management functionality including user listing, profile management, and statistics.

## Routes (users.routes.js)

```javascript
import express from 'express';
import { userController } from '../controllers/user.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { validateParams } from '../middleware/validation.middleware.js';
import { idSchema } from '../utils/validation.utils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all users (admin only)
router.get('/',
  authorize('ADMIN'),
  userController.getUsers
);

// Get user statistics
router.get('/stats', userController.getUserStats);

// Upload profile image
router.post('/profile-image',
  uploadSingle('image'),
  userController.uploadProfileImage
);

// Get user by ID
router.get('/:id',
  validateParams(idSchema),
  userController.getUserById
);

// Update user (admin only)
router.put('/:id',
  authorize('ADMIN'),
  validateParams(idSchema),
  userController.updateUser
);

// Delete user (admin only)
router.delete('/:id',
  authorize('ADMIN'),
  validateParams(idSchema),
  userController.deleteUser
);

export default router;
```

**Explanation:**
- **Authentication Required**: All routes require a valid JWT token, ensuring only authenticated users can access user management features
- **Role-Based Access**: Admin-only routes use `authorize('ADMIN')` middleware to restrict access to administrative functions
- **File Upload**: Profile image upload uses specialized middleware to handle multipart form data
- **Parameter Validation**: ID parameters are validated using Joi schemas to ensure proper format
- **RESTful Design**: Follows REST conventions with appropriate HTTP methods for CRUD operations

## Controller (user.controller.js)

```javascript
import { userService } from '../services/user.service.js';
import { successResponse, paginatedResponse, errorResponse } from '../utils/response.utils.js';

export const userController = {
  // Get all users (admin only)
  getUsers: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, role, search } = req.query;
      
      const filters = {
        ...(role && { role }),
        ...(search && { search })
      };

      const result = await userService.getUsers(filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.users, result.pagination, 'Users retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get user by ID
  getUserById: async (req, res, next) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;
      const currentUserRole = req.user.role;
      
      const user = await userService.getUserById(id, currentUserId, currentUserRole);
      
      successResponse(res, user, 'User retrieved successfully');
    } catch (error) {
      next(error);
    }
  },
```

**Explanation:**
- **Service Layer Integration**: Controllers act as intermediaries, calling service methods for business logic
- **Pagination Support**: User listing supports pagination with configurable page size and filtering
- **Role-Based Access Control**: User retrieval checks current user's permissions before allowing access
- **Error Handling**: Uses try-catch blocks with `next(error)` to pass errors to Express error middleware
- **Standardized Responses**: Uses utility functions for consistent API response formatting

```javascript
  // Update user (admin only)
  updateUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const updateData = req.body;
      
      const user = await userService.updateUser(id, updateData);
      
      successResponse(res, user, 'User updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete user (admin only)
  deleteUser: async (req, res, next) => {
    try {
      const { id } = req.params;
      const currentUserId = req.user.id;
      
      await userService.deleteUser(id, currentUserId);
      
      successResponse(res, null, 'User deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Upload profile image
  uploadProfileImage: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const file = req.file;
      
      if (!file) {
        return errorResponse(res, 'No file uploaded', 400);
      }

      const user = await userService.uploadProfileImage(userId, file);
      
      successResponse(res, user, 'Profile image uploaded successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get user statistics
  getUserStats: async (req, res, next) => {
    try {
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const stats = await userService.getUserStatistics(userId, userRole);
      
      successResponse(res, stats, 'User statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};
```

**Explanation:**
- **Admin Operations**: Update and delete operations are restricted to admin users only
- **File Upload Handling**: Profile image upload includes validation to ensure a file was provided
- **Self-Protection**: Delete operation prevents users from deleting their own accounts
- **Role-Based Statistics**: Statistics endpoint provides different data based on user role (admin, teacher, student)

## Service (user.service.js) - Get Users

```javascript
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
```

**Explanation:**
- **Flexible Filtering**: Supports filtering by user role and searching across name/email fields
- **Case-Insensitive Search**: Uses Prisma's `mode: 'insensitive'` for better search experience
- **Pagination**: Implements skip-based pagination for large datasets
- **Parallel Queries**: Uses `Promise.all` to fetch users and total count simultaneously for better performance

```javascript
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
```

**Explanation:**
- **Comprehensive User Data**: Selects user information along with role-specific profile data and activity counts
- **Related Data Inclusion**: Includes teacher/student profile information and counts of classes, enrollments, and quiz attempts
- **Sorting**: Orders users by creation date (newest first) for better user experience
- **Pagination Metadata**: Returns pagination information for frontend pagination controls

## Service (user.service.js) - Update User

```javascript
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
```

**Explanation:**
- **Email Uniqueness Check**: Ensures no duplicate emails when updating user email addresses
- **Conditional Updates**: Only updates fields that are provided in the updateData object
- **Database Transaction**: Uses Prisma transaction to ensure data consistency across related updates
- **Profile Data Separation**: Separates main user data from role-specific profile data for proper handling

```javascript
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
```

**Explanation:**
- **Upsert Operation**: Uses Prisma's upsert to create or update role-specific profile data
- **Security**: Removes password from response data before returning to client
- **Logging**: Records user update operations for audit purposes

## Service (user.service.js) - Upload Profile Image

```javascript
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
```

**Explanation:**
- **Cloud Storage**: Uses Cloudinary for reliable image storage and CDN delivery
- **Cleanup**: Automatically deletes old profile images to prevent storage bloat
- **Error Handling**: Gracefully handles failures in old image deletion without breaking the upload
- **Organized Storage**: Stores images in the 'edutech/profiles' folder for better organization
      throw new Error('Failed to upload profile image');
    }
  },
```

## Service (user.service.js) - User Statistics

```javascript
  // Get user statistics
  getUserStatistics: async (userId, userRole) => {
    /**
     * SECURITY: Statistics are role-based
     * - Admin: Full platform statistics
     * - Teacher: Own classes and students statistics
     * - Student: Own enrollment and performance statistics
     */
    const baseStats = {
      totalClasses: 0,
      totalQuizzes: 0,
      totalEnrollments: 0,
      totalQuizAttempts: 0,
      averageScore: 0
    };

    if (userRole === 'TEACHER') {
      const [classCount, quizCount, enrollmentCount, quizStats, recentActivities] = await Promise.all([
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
        }),
        // Get recent quiz attempts for teacher's classes
        prisma.quizAttempt.findMany({
          where: {
            quiz: {
              class: { teacherId: userId }
            }
          },
          select: {
            id: true,
            score: true,
            completedAt: true,
            user: {
              select: { name: true, profileImage: true }
            },
            quiz: {
              select: { title: true }
            }
          },
          orderBy: { completedAt: 'desc' },
          take: 5
        })
      ]);

      return {
        totalClasses: classCount,
        totalQuizzes: quizCount,
        totalStudents: enrollmentCount,
        totalQuizAttempts: quizStats._count,
        averageStudentScore: quizStats._avg.score || 0,
        recentActivities: recentActivities.map(a => ({
          id: a.id,
          user: a.user.name,
          action: `completed "${a.quiz.title}" with score ${a.score}%`,
          time: formatTimeAgo(a.completedAt),
          avatar: a.user.profileImage
        }))
      };
    } else if (userRole === 'STUDENT') {
      const [enrollmentCount, quizAttemptStats, completedCourses, recentAttempts] = await Promise.all([
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
        }),
        prisma.quizAttempt.findMany({
          where: { userId },
          select: {
            id: true,
            score: true,
            completedAt: true,
            quiz: {
              select: { title: true }
            }
          },
          orderBy: { completedAt: 'desc' },
          take: 5
        })
      ]);

      return {
        totalEnrollments: enrollmentCount,
        totalQuizAttempts: quizAttemptStats._count,
        averageScore: quizAttemptStats._avg.score || 0,
        completedCourses,
        recentActivities: recentAttempts.map(a => ({
          id: a.id,
          user: 'You',
          action: `completed "${a.quiz.title}" with score ${a.score}%`,
          time: formatTimeAgo(a.completedAt)
        }))
      };
    } else if (userRole === 'ADMIN') {
      const [
        studentCount, 
        teacherCount, 
        classCount, 
        quizCount, 
        enrollmentCount,
        recentUsers,
        recentClasses
      ] = await Promise.all([
        prisma.user.count({ where: { role: 'STUDENT' } }),
        prisma.user.count({ where: { role: 'TEACHER' } }),
        prisma.class.count(),
        prisma.quiz.count(),
        prisma.enrollment.count({ where: { status: 'ACTIVE' } }),
        // Recent user registrations
        prisma.user.findMany({
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            profileImage: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        }),
        // Recent classes created
        prisma.class.findMany({
          select: {
            id: true,
            title: true,
            createdAt: true,
            teacher: {
              select: { name: true }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 3
        })
      ]);

      // Build recent activities
      const recentActivities = [];
      
      for (const user of recentUsers) {
        recentActivities.push({
          id: user.id,
          user: user.name,
          action: `registered as ${user.role.toLowerCase()}`,
          time: formatTimeAgo(user.createdAt),
          avatar: user.profileImage
        });
      }
      
      for (const cls of recentClasses) {
        recentActivities.push({
          id: cls.id,
          user: cls.teacher.name,
          action: `created class "${cls.title}"`,
          time: formatTimeAgo(cls.createdAt)
        });
      }

      // Sort by time and take top 5
      recentActivities.sort((a, b) => {
        return new Date(b.time).getTime() - new Date(a.time).getTime();
      });

      return {
        totalStudents: studentCount,
        totalTeachers: teacherCount,
        totalClasses: classCount,
        totalQuizzes: quizCount,
        activeEnrollments: enrollmentCount,
        recentActivities: recentActivities.slice(0, 5),
        notifications: [
          { id: '1', message: `${studentCount} students registered`, time: 'Today', type: 'info' },
          { id: '2', message: `${enrollmentCount} active enrollments`, time: 'Today', type: 'success' }
        ]
      };
    }

    return baseStats;
  }
};

**Service Explanation (User Statistics):**
- **Role-Based Analytics**: Provides different statistics based on user role (admin gets platform-wide stats, teachers get class stats, students get personal stats)
- **Performance Metrics**: Calculates averages, counts, and trends for quizzes and enrollments
- **Recent Activity Feed**: Shows recent quiz attempts, user registrations, and class creations
- **Admin Dashboard**: Comprehensive platform overview with user counts and system activity
- **Teacher Insights**: Class performance, student engagement, and quiz analytics
- **Student Progress**: Personal learning progress and quiz performance tracking
```</content>
<parameter name="filePath">/home/suri/proj/EduTech/code-snippets-by-functionality/user-management.md