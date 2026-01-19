import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

// Helper function to verify class access
export const verifyClassAccess = async (userId, userRole, classId) => {
  try {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        teacherId: true,
        enrollments: {
          where: { studentId: userId },
          select: { id: true }
        }
      }
    });

    if (!classData) return false;

    // Admin has access to all classes
    if (userRole === 'ADMIN') return true;

    // Teacher has access if they teach the class
    if (userRole === 'TEACHER' && classData.teacherId === userId) return true;

    // Student has access if enrolled
    if (userRole === 'STUDENT' && classData.enrollments.length > 0) return true;

    return false;
  } catch (error) {
    logger.error('Error verifying class access:', error);
    return false;
  }
};