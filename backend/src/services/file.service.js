import { prisma } from '../config/database.js';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { logger } from '../utils/logger.utils.js';

export const fileService = {
  // Upload file
  uploadFile: async (userId, file, classId = null) => {
    try {
      // If classId is provided, verify user has access
      if (classId) {
        const hasAccess = await verifyClassAccess(userId, classId);
        if (!hasAccess) {
          throw new Error('Access denied to this class');
        }
      }

      // Upload to Cloudinary
      const uploadResult = await uploadToCloudinary(file.buffer, 'edutech/files');

      // Save file metadata to database
      const fileUpload = await prisma.fileUpload.create({
        data: {
          filename: uploadResult.public_id,
          originalName: file.originalname,
          fileUrl: uploadResult.secure_url,
          fileSize: file.size,
          mimeType: file.mimetype,
          userId,
          classId
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          },
          class: classId ? {
            select: {
              id: true,
              title: true,
              subject: true
            }
          } : false
        }
      });

      logger.info(`File uploaded: ${file.originalname} by user ${userId}`);
      return fileUpload;
    } catch (error) {
      logger.error('Error uploading file:', error);
      throw new Error('Failed to upload file');
    }
  },

  // Get files with filters
  getFiles: async (userId, userRole, filters = {}, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const { classId, userId: filterUserId } = filters;
    const skip = (page - 1) * limit;

    let whereClause = {};

    // Apply role-based filtering
    if (userRole === 'TEACHER') {
      if (classId) {
        // Verify teacher owns the class
        const classExists = await prisma.class.findFirst({
          where: {
            id: classId,
            teacherId: userId
          }
        });
        if (!classExists) {
          throw new Error('Access denied to this class');
        }
        whereClause.classId = classId;
      } else {
        // Show files from teacher's classes
        whereClause.class = {
          teacherId: userId
        };
      }
    } else if (userRole === 'STUDENT') {
      if (classId) {
        // Verify student is enrolled in the class
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId,
            classId,
            status: 'ACTIVE'
          }
        });
        if (!enrollment) {
          throw new Error('Access denied to this class');
        }
        whereClause.classId = classId;
      } else {
        // Show files from enrolled classes or own files
        whereClause.OR = [
          { userId },
          {
            class: {
              enrollments: {
                some: {
                  userId,
                  status: 'ACTIVE'
                }
              }
            }
          }
        ];
      }
    } else if (userRole === 'ADMIN') {
      // Admin can see all files
      if (classId) whereClause.classId = classId;
      if (filterUserId) whereClause.userId = filterUserId;
    }

    const [files, total] = await Promise.all([
      prisma.fileUpload.findMany({
        where: whereClause,
        include: {
          user: {
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
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.fileUpload.count({ where: whereClause })
    ]);

    return {
      files,
      pagination: {
        page,
        limit,
        total
      }
    };
  },

  // Get file by ID
  getFileById: async (fileId, userId, userRole) => {
    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId },
      include: {
        user: {
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
            teacherId: true
          }
        }
      }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Check access permissions
    let hasAccess = false;

    if (userRole === 'ADMIN') {
      hasAccess = true;
    } else if (file.userId === userId) {
      hasAccess = true;
    } else if (file.class) {
      if (userRole === 'TEACHER' && file.class.teacherId === userId) {
        hasAccess = true;
      } else if (userRole === 'STUDENT') {
        const enrollment = await prisma.enrollment.findFirst({
          where: {
            userId,
            classId: file.classId,
            status: 'ACTIVE'
          }
        });
        hasAccess = !!enrollment;
      }
    }

    if (!hasAccess) {
      throw new Error('Access denied to this file');
    }

    return file;
  },

  // Delete file
  deleteFile: async (fileId, userId, userRole) => {
    const file = await prisma.fileUpload.findUnique({
      where: { id: fileId },
      include: {
        class: {
          select: {
            teacherId: true
          }
        }
      }
    });

    if (!file) {
      throw new Error('File not found');
    }

    // Check deletion permissions
    let canDelete = false;

    if (userRole === 'ADMIN') {
      canDelete = true;
    } else if (file.userId === userId) {
      canDelete = true;
    } else if (userRole === 'TEACHER' && file.class && file.class.teacherId === userId) {
      canDelete = true;
    }

    if (!canDelete) {
      throw new Error('Access denied to delete this file');
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(file.filename);
    } catch (error) {
      logger.warn('Failed to delete file from Cloudinary:', error);
    }

    // Delete from database
    await prisma.fileUpload.delete({
      where: { id: fileId }
    });

    logger.info(`File deleted: ${fileId} by user ${userId}`);
  },

  // Get file for download
  getFileForDownload: async (fileId, userId, userRole) => {
    const file = await fileService.getFileById(fileId, userId, userRole);
    
    // Log download activity
    logger.info(`File downloaded: ${fileId} by user ${userId}`);
    
    return file;
  }
};

// Helper function to verify class access
const verifyClassAccess = async (userId, classId) => {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) return false;

  if (user.role === 'TEACHER') {
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: userId
      }
    });
    return !!classData;
  } else if (user.role === 'STUDENT') {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        userId,
        classId,
        status: 'ACTIVE'
      }
    });
    return !!enrollment;
  } else if (user.role === 'ADMIN') {
    return true;
  }

  return false;
};
