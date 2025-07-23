import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

export const analyticsService = {
  // Track an analytics event
  trackEvent: async (userId, event, data = null, classId = null) => {
    try {
      await prisma.analytics.create({
        data: {
          userId,
          event,
          data,
          classId
        }
      });

      logger.info(`Analytics event tracked: ${event} by user ${userId}`);
    } catch (error) {
      logger.error('Error tracking analytics event:', error);
      throw new Error('Failed to track event');
    }
  },

  // Get platform analytics (admin only)
  getPlatformAnalytics: async (startDate, endDate) => {
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const whereClause = Object.keys(dateFilter).length > 0 ? {
      createdAt: dateFilter
    } : {};

    const [
      totalUsers,
      totalClasses,
      totalQuizzes,
      totalEnrollments,
      totalQuizAttempts,
      userGrowth,
      classGrowth,
      recentActivity
    ] = await Promise.all([
      // Total counts
      prisma.user.count(),
      prisma.class.count(),
      prisma.quiz.count(),
      prisma.enrollment.count(),
      prisma.quizAttempt.count(),

      // Growth data
      prisma.user.groupBy({
        by: ['createdAt'],
        _count: true,
        where: whereClause,
        orderBy: { createdAt: 'asc' }
      }),
      
      prisma.class.groupBy({
        by: ['createdAt'],
        _count: true,
        where: whereClause,
        orderBy: { createdAt: 'asc' }
      }),

      // Recent activity
      prisma.analytics.findMany({
        where: whereClause,
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              role: true
            }
          }
        }
      })
    ]);

    // User role distribution
    const userRoleDistribution = await prisma.user.groupBy({
      by: ['role'],
      _count: true
    });

    // Most active classes
    const mostActiveClasses = await prisma.class.findMany({
      select: {
        id: true,
        title: true,
        subject: true,
        _count: {
          select: {
            enrollments: true,
            quizzes: true,
            chatMessages: true
          }
        }
      },
      orderBy: {
        enrollments: {
          _count: 'desc'
        }
      },
      take: 5
    });

    return {
      overview: {
        totalUsers,
        totalClasses,
        totalQuizzes,
        totalEnrollments,
        totalQuizAttempts
      },
      userRoleDistribution,
      userGrowth,
      classGrowth,
      mostActiveClasses,
      recentActivity
    };
  },

  // Get teacher analytics
  getTeacherAnalytics: async (teacherId, options = {}) => {
    const { startDate, endDate, classId } = options;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    let classFilter = { teacherId };
    if (classId) classFilter.id = classId;

    const [
      totalClasses,
      totalStudents,
      totalQuizzes,
      totalQuizAttempts,
      averageQuizScore,
      classPerformance,
      recentQuizzes
    ] = await Promise.all([
      // Basic counts
      prisma.class.count({ where: classFilter }),
      
      prisma.enrollment.count({
        where: {
          class: classFilter,
          status: 'ACTIVE'
        }
      }),

      prisma.quiz.count({
        where: {
          class: classFilter,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      }),

      prisma.quizAttempt.count({
        where: {
          quiz: {
            class: classFilter
          },
          ...(Object.keys(dateFilter).length > 0 && { completedAt: dateFilter })
        }
      }),

      // Average quiz score
      prisma.quizAttempt.aggregate({
        where: {
          quiz: {
            class: classFilter
          },
          ...(Object.keys(dateFilter).length > 0 && { completedAt: dateFilter })
        },
        _avg: { score: true }
      }),

      // Class performance
      prisma.class.findMany({
        where: classFilter,
        select: {
          id: true,
          title: true,
          subject: true,
          _count: {
            select: {
              enrollments: true,
              quizzes: true,
              chatMessages: true
            }
          },
          quizzes: {
            select: {
              _count: {
                select: {
                  attempts: true
                }
              }
            }
          }
        }
      }),

      // Recent quizzes
      prisma.quiz.findMany({
        where: {
          class: classFilter,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        select: {
          id: true,
          title: true,
          totalMarks: true,
          isActive: true,
          createdAt: true,
          _count: {
            select: {
              attempts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 5
      })
    ]);

    return {
      overview: {
        totalClasses,
        totalStudents,
        totalQuizzes,
        totalQuizAttempts,
        averageQuizScore: averageQuizScore._avg.score || 0
      },
      classPerformance,
      recentQuizzes
    };
  },

  // Get student analytics
  getStudentAnalytics: async (studentId, options = {}) => {
    const { startDate, endDate, classId } = options;
    
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    let enrollmentFilter = { userId: studentId, status: 'ACTIVE' };
    if (classId) enrollmentFilter.classId = classId;

    const [
      totalEnrollments,
      totalQuizAttempts,
      averageScore,
      totalScore,
      quizPerformance,
      recentAttempts,
      classProgress
    ] = await Promise.all([
      // Basic counts
      prisma.enrollment.count({ where: enrollmentFilter }),

      prisma.quizAttempt.count({
        where: {
          userId: studentId,
          ...(classId && {
            quiz: { classId }
          }),
          ...(Object.keys(dateFilter).length > 0 && { completedAt: dateFilter })
        }
      }),

      // Score analytics
      prisma.quizAttempt.aggregate({
        where: {
          userId: studentId,
          ...(classId && {
            quiz: { classId }
          }),
          ...(Object.keys(dateFilter).length > 0 && { completedAt: dateFilter })
        },
        _avg: { score: true },
        _sum: { score: true }
      }),

      // Quiz performance over time
      prisma.quizAttempt.findMany({
        where: {
          userId: studentId,
          ...(classId && {
            quiz: { classId }
          }),
          ...(Object.keys(dateFilter).length > 0 && { completedAt: dateFilter })
        },
        select: {
          score: true,
          totalMarks: true,
          completedAt: true,
          quiz: {
            select: {
              id: true,
              title: true,
              class: {
                select: {
                  id: true,
                  title: true,
                  subject: true
                }
              }
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 10
      }),

      // Recent attempts
      prisma.quizAttempt.findMany({
        where: {
          userId: studentId,
          ...(classId && {
            quiz: { classId }
          })
        },
        select: {
          id: true,
          score: true,
          totalMarks: true,
          completedAt: true,
          quiz: {
            select: {
              id: true,
              title: true,
              class: {
                select: {
                  title: true,
                  subject: true
                }
              }
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: 5
      }),

      // Class progress
      prisma.enrollment.findMany({
        where: enrollmentFilter,
        select: {
          progress: true,
          enrolledAt: true,
          class: {
            select: {
              id: true,
              title: true,
              subject: true,
              _count: {
                select: {
                  quizzes: true
                }
              }
            }
          }
        }
      })
    ]);

    return {
      overview: {
        totalEnrollments,
        totalQuizAttempts,
        averageScore: averageScore._avg.score || 0,
        totalScore: totalScore._sum.score || 0
      },
      quizPerformance: quizPerformance.map(attempt => ({
        ...attempt,
        percentage: ((attempt.score / attempt.totalMarks) * 100).toFixed(2)
      })),
      recentAttempts: recentAttempts.map(attempt => ({
        ...attempt,
        percentage: ((attempt.score / attempt.totalMarks) * 100).toFixed(2)
      })),
      classProgress
    };
  },

  // Get class analytics
  getClassAnalytics: async (classId, userId, userRole, options = {}) => {
    // Verify access
    if (userRole === 'TEACHER') {
      const classExists = await prisma.class.findFirst({
        where: { id: classId, teacherId: userId }
      });
      if (!classExists) {
        throw new Error('Access denied to this class');
      }
    } else if (userRole === 'STUDENT') {
      const enrollment = await prisma.enrollment.findFirst({
        where: { userId, classId, status: 'ACTIVE' }
      });
      if (!enrollment) {
        throw new Error('Access denied to this class');
      }
    }

    const { startDate, endDate } = options;
    const dateFilter = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const [
      classInfo,
      enrollmentStats,
      quizStats,
      chatActivity,
      topPerformers
    ] = await Promise.all([
      // Class information
      prisma.class.findUnique({
        where: { id: classId },
        select: {
          id: true,
          title: true,
          subject: true,
          status: true,
          createdAt: true,
          teacher: {
            select: {
              id: true,
              name: true
            }
          },
          _count: {
            select: {
              enrollments: true,
              quizzes: true,
              chatMessages: true,
              fileUploads: true
            }
          }
        }
      }),

      // Enrollment statistics
      prisma.enrollment.groupBy({
        by: ['status'],
        where: { classId },
        _count: true
      }),

      // Quiz statistics
      prisma.quiz.findMany({
        where: {
          classId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        },
        select: {
          id: true,
          title: true,
          totalMarks: true,
          isActive: true,
          _count: {
            select: {
              attempts: true
            }
          },
          attempts: {
            select: {
              score: true,
              totalMarks: true
            }
          }
        }
      }),

      // Chat activity
      prisma.chatMessage.count({
        where: {
          classId,
          ...(Object.keys(dateFilter).length > 0 && { createdAt: dateFilter })
        }
      }),

      // Top performers (for teachers)
      userRole === 'TEACHER' ? prisma.quizAttempt.findMany({
        where: {
          quiz: { classId },
          ...(Object.keys(dateFilter).length > 0 && { completedAt: dateFilter })
        },
        select: {
          score: true,
          totalMarks: true,
          user: {
            select: {
              id: true,
              name: true
            }
          }
        },
        orderBy: { score: 'desc' },
        take: 10
      }) : []
    ]);

    return {
      classInfo,
      enrollmentStats,
      quizStats: quizStats.map(quiz => ({
        ...quiz,
        averageScore: quiz.attempts.length > 0 
          ? quiz.attempts.reduce((sum, attempt) => sum + attempt.score, 0) / quiz.attempts.length 
          : 0,
        averagePercentage: quiz.attempts.length > 0 
          ? (quiz.attempts.reduce((sum, attempt) => sum + (attempt.score / attempt.totalMarks), 0) / quiz.attempts.length * 100).toFixed(2)
          : 0
      })),
      chatActivity,
      ...(userRole === 'TEACHER' && {
        topPerformers: topPerformers.map(attempt => ({
          user: attempt.user,
          score: attempt.score,
          totalMarks: attempt.totalMarks,
          percentage: ((attempt.score / attempt.totalMarks) * 100).toFixed(2)
        }))
      })
    };
  }
};
