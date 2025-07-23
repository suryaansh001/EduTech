import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

export const classService = {
  // Create a new class
  createClass: async (teacherId, classData) => {
    const {
      title,
      description,
      subject,
      grade,
      maxStudents,
      startDate,
      endDate,
      meetingLink
    } = classData;

    const newClass = await prisma.class.create({
      data: {
        title,
        description,
        subject,
        grade,
        maxStudents,
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        meetingLink,
        teacherId
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            quizzes: true
          }
        }
      }
    });

    logger.info(`Class created: ${title} by teacher ${teacherId}`);
    return newClass;
  },

  // Get classes based on user role
  getClasses: async (userId, userRole, filters = {}, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    let whereClause = { ...filters };

    // Apply role-based filtering
    if (userRole === 'TEACHER') {
      whereClause.teacherId = userId;
    } else if (userRole === 'STUDENT') {
      // Students can see active classes and classes they're enrolled in
      whereClause.OR = [
        { status: 'ACTIVE' },
        {
          enrollments: {
            some: {
              userId: userId
            }
          }
        }
      ];
    }

    const [classes, total] = await Promise.all([
      prisma.class.findMany({
        where: whereClause,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              email: true,
              teacherProfile: {
                select: {
                  qualification: true,
                  specialization: true
                }
              }
            }
          },
          _count: {
            select: {
              enrollments: true,
              quizzes: true
            }
          },
          ...(userRole === 'STUDENT' && {
            enrollments: {
              where: { userId },
              select: {
                id: true,
                status: true,
                enrolledAt: true,
                progress: true
              }
            }
          })
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.class.count({ where: whereClause })
    ]);

    return {
      classes,
      pagination: {
        page,
        limit,
        total
      }
    };
  },

  // Get a specific class
  getClassById: async (classId, userId, userRole) => {
    let includeEnrollments = false;
    let whereClause = { id: classId };

    // Apply role-based access control
    if (userRole === 'TEACHER') {
      whereClause.teacherId = userId;
      includeEnrollments = true;
    } else if (userRole === 'STUDENT') {
      // Students can access active classes or classes they're enrolled in
      whereClause.OR = [
        { status: 'ACTIVE' },
        {
          enrollments: {
            some: { userId }
          }
        }
      ];
    }

    const classData = await prisma.class.findFirst({
      where: whereClause,
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true,
            teacherProfile: {
              select: {
                qualification: true,
                specialization: true,
                experience: true
              }
            }
          }
        },
        schedules: {
          orderBy: { startTime: 'asc' }
        },
        quizzes: {
          where: userRole === 'STUDENT' ? { isActive: true } : {},
          select: {
            id: true,
            title: true,
            description: true,
            totalMarks: true,
            timeLimit: true,
            isActive: true,
            createdAt: true,
            _count: {
              select: {
                questions: true,
                attempts: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        fileUploads: {
          select: {
            id: true,
            filename: true,
            originalName: true,
            fileUrl: true,
            fileSize: true,
            mimeType: true,
            createdAt: true,
            user: {
              select: {
                id: true,
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' }
        },
        _count: {
          select: {
            enrollments: true,
            quizzes: true,
            chatMessages: true
          }
        },
        ...(includeEnrollments && {
          enrollments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  studentProfile: {
                    select: {
                      grade: true
                    }
                  }
                }
              }
            },
            orderBy: { enrolledAt: 'desc' }
          }
        }),
        ...(userRole === 'STUDENT' && {
          enrollments: {
            where: { userId },
            select: {
              id: true,
              status: true,
              enrolledAt: true,
              progress: true
            }
          }
        })
      }
    });

    if (!classData) {
      throw new Error('Class not found or you do not have permission to access it');
    }

    return classData;
  },

  // Update a class
  updateClass: async (classId, teacherId, updateData) => {
    // Verify ownership
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId
      }
    });

    if (!existingClass) {
      throw new Error('Class not found or you do not have permission to update it');
    }

    const {
      title,
      description,
      subject,
      grade,
      maxStudents,
      startDate,
      endDate,
      meetingLink,
      status
    } = updateData;

    const updatedClass = await prisma.class.update({
      where: { id: classId },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(subject && { subject }),
        ...(grade !== undefined && { grade }),
        ...(maxStudents !== undefined && { maxStudents }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate !== undefined && { endDate: endDate ? new Date(endDate) : null }),
        ...(meetingLink !== undefined && { meetingLink }),
        ...(status && { status })
      },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        _count: {
          select: {
            enrollments: true,
            quizzes: true
          }
        }
      }
    });

    logger.info(`Class updated: ${classId} by teacher ${teacherId}`);
    return updatedClass;
  },

  // Delete a class
  deleteClass: async (classId, teacherId) => {
    // Verify ownership
    const existingClass = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId
      }
    });

    if (!existingClass) {
      throw new Error('Class not found or you do not have permission to delete it');
    }

    // Delete class (cascade will handle related records)
    await prisma.class.delete({
      where: { id: classId }
    });

    logger.info(`Class deleted: ${classId} by teacher ${teacherId}`);
  },

  // Enroll student in class
  enrollStudent: async (classId, studentId) => {
    // Check if class exists and is active
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        status: 'ACTIVE'
      }
    });

    if (!classData) {
      throw new Error('Class not found or not available for enrollment');
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_classId: {
          userId: studentId,
          classId
        }
      }
    });

    if (existingEnrollment) {
      throw new Error('Already enrolled in this class');
    }

    // Check class capacity
    if (classData.maxStudents) {
      const currentEnrollments = await prisma.enrollment.count({
        where: {
          classId,
          status: 'ACTIVE'
        }
      });

      if (currentEnrollments >= classData.maxStudents) {
        throw new Error('Class is full');
      }
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: studentId,
        classId,
        status: 'ACTIVE'
      },
      include: {
        class: {
          select: {
            id: true,
            title: true,
            subject: true,
            teacher: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    });

    logger.info(`Student enrolled: ${studentId} in class ${classId}`);
    return enrollment;
  },

  // Get class enrollments
  getClassEnrollments: async (classId, teacherId, options = {}) => {
    const { status, page = 1, limit = 10 } = options;
    const skip = (page - 1) * limit;

    // Verify ownership
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId
      }
    });

    if (!classData) {
      throw new Error('Class not found or you do not have permission to view enrollments');
    }

    let whereClause = { classId };
    if (status) {
      whereClause.status = status;
    }

    const [enrollments, total] = await Promise.all([
      prisma.enrollment.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              studentProfile: {
                select: {
                  grade: true,
                  interests: true
                }
              }
            }
          }
        },
        orderBy: { enrolledAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.enrollment.count({ where: whereClause })
    ]);

    return {
      enrollments,
      pagination: {
        page,
        limit,
        total
      }
    };
  },

  // Update enrollment status
  updateEnrollmentStatus: async (classId, enrollmentId, teacherId, status) => {
    // Verify class ownership
    const classData = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId
      }
    });

    if (!classData) {
      throw new Error('Class not found or you do not have permission to manage enrollments');
    }

    // Update enrollment
    const enrollment = await prisma.enrollment.update({
      where: {
        id: enrollmentId,
        classId
      },
      data: {
        status,
        ...(status === 'COMPLETED' && { completedAt: new Date() })
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info(`Enrollment status updated: ${enrollmentId} to ${status} by teacher ${teacherId}`);
    return enrollment;
  }
};
