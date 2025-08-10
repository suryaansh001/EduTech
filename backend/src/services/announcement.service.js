import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';
import { emailService } from './email.service.js';

export const announcementService = {
  // Create new announcement
  createAnnouncement: async (classId, authorId, announcementData) => {
    const { title, content, priority = 'NORMAL' } = announcementData;

    // Verify the author is the teacher of the class or an admin
    const classInfo = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: true,
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        }
      }
    });

    if (!classInfo) {
      throw new Error('Class not found');
    }

    const author = await prisma.user.findUnique({
      where: { id: authorId }
    });

    if (!author) {
      throw new Error('Author not found');
    }

    // Check permissions
    if (author.role !== 'ADMIN' && classInfo.teacherId !== authorId) {
      throw new Error('You do not have permission to create announcements for this class');
    }

    // Create announcement
    const announcement = await prisma.announcement.create({
      data: {
        title,
        content,
        priority,
        classId,
        authorId
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            title: true,
            subject: true
          }
        }
      }
    });

    // Send email notifications to enrolled students
    if (classInfo.enrollments.length > 0) {
      try {
        const studentEmails = classInfo.enrollments.map(enrollment => enrollment.user);
        await emailService.sendAnnouncementEmail(
          studentEmails,
          announcement,
          classInfo.title
        );
        logger.info(`Announcement notification emails sent for class: ${classId}`);
      } catch (error) {
        logger.warn('Failed to send announcement notification emails:', error);
      }
    }

    logger.info(`Announcement created for class ${classId} by ${authorId}`);
    return announcement;
  },

  // Get announcements for a class
  getAnnouncementsByClass: async (classId, userId, userRole, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    // Check if user has access to the class
    if (userRole === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          userId,
          classId,
          status: 'ACTIVE'
        }
      });

      if (!enrollment) {
        throw new Error('You are not enrolled in this class');
      }
    } else if (userRole === 'TEACHER') {
      const classInfo = await prisma.class.findUnique({
        where: { id: classId }
      });

      if (!classInfo || classInfo.teacherId !== userId) {
        throw new Error('You do not have access to this class');
      }
    }
    // Admin can access all classes

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: {
          classId,
          isActive: true
        },
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.announcement.count({
        where: {
          classId,
          isActive: true
        }
      })
    ]);

    return {
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Get all announcements for a user
  getUserAnnouncements: async (userId, userRole, filters = {}, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const { priority, classId } = filters;
    const skip = (page - 1) * limit;

    let whereClause = { isActive: true };

    if (priority) {
      whereClause.priority = priority;
    }

    if (classId) {
      whereClause.classId = classId;
    }

    // Build class filter based on user role
    let classFilter = {};
    
    if (userRole === 'STUDENT') {
      classFilter = {
        enrollments: {
          some: {
            userId,
            status: 'ACTIVE'
          }
        }
      };
    } else if (userRole === 'TEACHER') {
      classFilter = {
        teacherId: userId
      };
    }
    // Admin can see all announcements

    if (Object.keys(classFilter).length > 0) {
      whereClause.class = classFilter;
    }

    const [announcements, total] = await Promise.all([
      prisma.announcement.findMany({
        where: whereClause,
        include: {
          author: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          class: {
            select: {
              id: true,
              title: true,
              subject: true
            }
          }
        },
        orderBy: [
          { priority: 'desc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: limit
      }),
      prisma.announcement.count({ where: whereClause })
    ]);

    return {
      announcements,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Get announcement by ID
  getAnnouncementById: async (announcementId, userId, userRole) => {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            title: true,
            subject: true,
            teacherId: true,
            enrollments: {
              where: { status: 'ACTIVE' },
              select: {
                userId: true
              }
            }
          }
        }
      }
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    // Check access permissions
    if (userRole === 'STUDENT') {
      const hasAccess = announcement.class.enrollments.some(
        enrollment => enrollment.userId === userId
      );
      if (!hasAccess) {
        throw new Error('You do not have access to this announcement');
      }
    } else if (userRole === 'TEACHER' && announcement.class.teacherId !== userId) {
      throw new Error('You do not have access to this announcement');
    }
    // Admin can access all announcements

    return announcement;
  },

  // Update announcement
  updateAnnouncement: async (announcementId, authorId, updateData) => {
    const { title, content, priority, isActive } = updateData;

    // Check if announcement exists and user has permission
    const existingAnnouncement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        class: true,
        author: true
      }
    });

    if (!existingAnnouncement) {
      throw new Error('Announcement not found');
    }

    const author = await prisma.user.findUnique({
      where: { id: authorId }
    });

    // Check permissions
    if (author.role !== 'ADMIN' && existingAnnouncement.authorId !== authorId) {
      throw new Error('You can only edit your own announcements');
    }

    const updatedAnnouncement = await prisma.announcement.update({
      where: { id: announcementId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(priority && { priority }),
        ...(typeof isActive === 'boolean' && { isActive })
      },
      include: {
        author: {
          select: {
            id: true,
            name: true,
            role: true
          }
        },
        class: {
          select: {
            id: true,
            title: true,
            subject: true
          }
        }
      }
    });

    logger.info(`Announcement ${announcementId} updated by ${authorId}`);
    return updatedAnnouncement;
  },

  // Delete announcement
  deleteAnnouncement: async (announcementId, userId) => {
    const announcement = await prisma.announcement.findUnique({
      where: { id: announcementId },
      include: {
        author: true
      }
    });

    if (!announcement) {
      throw new Error('Announcement not found');
    }

    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    // Check permissions
    if (user.role !== 'ADMIN' && announcement.authorId !== userId) {
      throw new Error('You can only delete your own announcements');
    }

    // Soft delete by setting isActive to false
    await prisma.announcement.update({
      where: { id: announcementId },
      data: { isActive: false }
    });

    logger.info(`Announcement ${announcementId} deleted by ${userId}`);
  }
};
