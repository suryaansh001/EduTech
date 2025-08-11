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
    const { status, page = 1, limit = 10, isAdmin = false } = options;
    const skip = (page - 1) * limit;

    // Verify ownership (skip for admin)
    if (!isAdmin) {
      const classData = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId
        }
      });

      if (!classData) {
        throw new Error('Class not found or you do not have permission to view enrollments');
      }
    } else {
      // For admin, just check if class exists
      const classData = await prisma.class.findUnique({
        where: { id: classId }
      });

      if (!classData) {
        throw new Error('Class not found');
      }
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
    // Verify class ownership (allow null teacherId for admin)
    if (teacherId) {
      const classData = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId
        }
      });

      if (!classData) {
        throw new Error('Class not found or you do not have permission to manage enrollments');
      }
    } else {
      // For admin, just check if class exists
      const classData = await prisma.class.findUnique({
        where: { id: classId }
      });

      if (!classData) {
        throw new Error('Class not found');
      }
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

    logger.info(`Enrollment status updated: ${enrollmentId} to ${status} by ${teacherId || 'admin'}`);
    return enrollment;
  },

  // Get available students for enrollment (Admin and Teacher use)
  getAvailableStudents: async (classId, userId, userRole, filters = {}, pagination = {}) => {
    const { page = 1, limit = 20 } = pagination;
    const { search, grade } = filters;
    const skip = (page - 1) * limit;

    // Verify permissions
    if (userRole === 'TEACHER') {
      const classData = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: userId
        }
      });

      if (!classData) {
        throw new Error('Class not found or you do not have permission to manage this class');
      }
    } else if (userRole !== 'ADMIN') {
      throw new Error('You do not have permission to view available students');
    }

    let whereClause = {
      role: 'STUDENT',
      isActive: true,
      enrollments: {
        none: {
          classId,
          status: {
            in: ['ACTIVE', 'PENDING']
          }
        }
      }
    };

    if (search) {
      whereClause.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (grade) {
      whereClause.studentProfile = {
        grade: { contains: grade, mode: 'insensitive' }
      };
    }

    const [students, total] = await Promise.all([
      prisma.user.findMany({
        where: whereClause,
        select: {
          id: true,
          name: true,
          email: true,
          profileImage: true,
          phone: true,
          createdAt: true,
          studentProfile: {
            select: {
              grade: true,
              interests: true,
              totalCourses: true,
              completedCourses: true
            }
          }
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit
      }),
      prisma.user.count({ where: whereClause })
    ]);

    return {
      students,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  },

  // Bulk enroll students (Admin and Teacher use)
  bulkEnrollStudents: async (classId, studentIds, userId, userRole) => {
    // Verify permissions
    if (userRole === 'TEACHER') {
      const classData = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: userId
        }
      });

      if (!classData) {
        throw new Error('Class not found or you do not have permission to manage this class');
      }
    } else if (userRole !== 'ADMIN') {
      throw new Error('You do not have permission to enroll students');
    }

    // Check if class exists and get details
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' }
        }
      }
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    // Check capacity
    if (classData.maxStudents) {
      const currentEnrollments = classData.enrollments.length;
      if (currentEnrollments + studentIds.length > classData.maxStudents) {
        throw new Error(`Cannot enroll ${studentIds.length} students. Class capacity exceeded (${currentEnrollments}/${classData.maxStudents})`);
      }
    }

    // Get students to verify they exist and are active
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        role: 'STUDENT',
        isActive: true
      }
    });

    if (students.length !== studentIds.length) {
      throw new Error('Some students were not found or are inactive');
    }

    // Check for existing enrollments
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        classId,
        userId: { in: studentIds }
      }
    });

    if (existingEnrollments.length > 0) {
      const enrolledStudentIds = existingEnrollments.map(e => e.userId);
      const enrolledStudents = students.filter(s => enrolledStudentIds.includes(s.id));
      throw new Error(`Some students are already enrolled: ${enrolledStudents.map(s => s.name).join(', ')}`);
    }

    // Bulk create enrollments
    const enrollmentData = studentIds.map(studentId => ({
      userId: studentId,
      classId,
      status: 'ACTIVE'
    }));

    const enrollments = await prisma.enrollment.createMany({
      data: enrollmentData
    });

    // Get the created enrollments with user details
    const createdEnrollments = await prisma.enrollment.findMany({
      where: {
        classId,
        userId: { in: studentIds }
      },
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
      }
    });

    logger.info(`Bulk enrolled ${studentIds.length} students in class ${classId} by ${userId}`);
    
    return {
      enrollments: createdEnrollments,
      count: enrollments.count
    };
  },

  // Remove student from class
  removeStudentFromClass: async (classId, studentId, userId, userRole) => {
    // Verify permissions
    if (userRole === 'TEACHER') {
      const classData = await prisma.class.findFirst({
        where: {
          id: classId,
          teacherId: userId
        }
      });

      if (!classData) {
        throw new Error('Class not found or you do not have permission to manage this class');
      }
    } else if (userRole !== 'ADMIN') {
      throw new Error('You do not have permission to remove students from this class');
    }

    // Find and delete enrollment
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        classId,
        userId: studentId
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

    if (!enrollment) {
      throw new Error('Student is not enrolled in this class');
    }

    await prisma.enrollment.delete({
      where: {
        id: enrollment.id
      }
    });

    logger.info(`Student ${studentId} removed from class ${classId} by ${userId}`);
    return enrollment;
  }
};
