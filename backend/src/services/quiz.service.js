import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

export const quizService = {
  // Create a new quiz
  createQuiz: async (teacherId, quizData) => {
    const { title, description, classId, timeLimit, questions } = quizData;

    // Verify teacher owns the class
    const classExists = await prisma.class.findFirst({
      where: {
        id: classId,
        teacherId: teacherId
      }
    });

    if (!classExists) {
      throw new Error('Class not found or you do not have permission to create quizzes for this class');
    }

    // Calculate total marks
    const totalMarks = questions.reduce((sum, question) => sum + (question.marks || 1), 0);

    // Create quiz with questions in a transaction
    const quiz = await prisma.$transaction(async (prisma) => {
      const newQuiz = await prisma.quiz.create({
        data: {
          title,
          description,
          classId,
          timeLimit,
          totalMarks
        }
      });

      // Create questions
      const questionsData = questions.map((question, index) => ({
        quizId: newQuiz.id,
        type: question.type,
        question: question.question,
        options: question.options || [],
        correctAnswer: question.correctAnswer,
        marks: question.marks || 1,
        order: question.order || index + 1
      }));

      await prisma.question.createMany({
        data: questionsData
      });

      return newQuiz;
    });

    // Fetch complete quiz with questions
    const completeQuiz = await prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: {
        questions: {
          orderBy: { order: 'asc' }
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

    logger.info(`Quiz created: ${title} by teacher ${teacherId}`);
    return completeQuiz;
  },

  // Get quizzes based on user role
  getQuizzes: async (userId, userRole, filters = {}, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    let whereClause = { ...filters };

    // Apply role-based filtering
    if (userRole === 'TEACHER') {
      whereClause.class = { teacherId: userId };
    } else if (userRole === 'STUDENT') {
      // Students can only see active quizzes from classes they're enrolled in
      whereClause.isActive = true;
      whereClause.class = {
        enrollments: {
          some: {
            userId: userId,
            status: 'ACTIVE'
          }
        }
      };
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where: whereClause,
        include: {
          questions: userRole === 'TEACHER' ? {
            select: {
              id: true,
              type: true,
              marks: true
            }
          } : false,
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
          },
          _count: {
            select: {
              questions: true,
              attempts: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.quiz.count({ where: whereClause })
    ]);

    return {
      quizzes,
      pagination: {
        page,
        limit,
        total
      }
    };
  },

  // Get a specific quiz
  getQuizById: async (quizId, userId, userRole) => {
    let includeAnswers = false;
    let whereClause = { id: quizId };

    // Apply role-based access control
    if (userRole === 'TEACHER') {
      whereClause.class = { teacherId: userId };
      includeAnswers = true;
    } else if (userRole === 'STUDENT') {
      whereClause.isActive = true;
      whereClause.class = {
        enrollments: {
          some: {
            userId: userId,
            status: 'ACTIVE'
          }
        }
      };
    }

    const quiz = await prisma.quiz.findFirst({
      where: whereClause,
      include: {
        questions: {
          select: {
            id: true,
            type: true,
            question: true,
            options: true,
            correctAnswer: includeAnswers,
            marks: true,
            order: true
          },
          orderBy: { order: 'asc' }
        },
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
        },
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to access it');
    }

    // For students, check if they've already attempted the quiz
    if (userRole === 'STUDENT') {
      const existingAttempt = await prisma.quizAttempt.findFirst({
        where: {
          quizId: quizId,
          userId: userId
        }
      });

      quiz.hasAttempted = !!existingAttempt;
      quiz.attempt = existingAttempt;
    }

    return quiz;
  },

  // Update a quiz
  updateQuiz: async (quizId, teacherId, updateData) => {
    const { title, description, timeLimit, isActive, questions } = updateData;

    // Verify ownership
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        class: { teacherId }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to update it');
    }

    // Update quiz in transaction
    const updatedQuiz = await prisma.$transaction(async (prisma) => {
      let totalMarks = quiz.totalMarks;

      // If questions are provided, update them
      if (questions && questions.length > 0) {
        // Delete existing questions
        await prisma.question.deleteMany({
          where: { quizId }
        });

        // Calculate new total marks
        totalMarks = questions.reduce((sum, question) => sum + (question.marks || 1), 0);

        // Create new questions
        const questionsData = questions.map((question, index) => ({
          quizId,
          type: question.type,
          question: question.question,
          options: question.options || [],
          correctAnswer: question.correctAnswer,
          marks: question.marks || 1,
          order: question.order || index + 1
        }));

        await prisma.question.createMany({
          data: questionsData
        });
      }

      // Update quiz
      return await prisma.quiz.update({
        where: { id: quizId },
        data: {
          ...(title && { title }),
          ...(description !== undefined && { description }),
          ...(timeLimit !== undefined && { timeLimit }),
          ...(isActive !== undefined && { isActive }),
          totalMarks
        },
        include: {
          questions: {
            orderBy: { order: 'asc' }
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
    });

    logger.info(`Quiz updated: ${quizId} by teacher ${teacherId}`);
    return updatedQuiz;
  },

  // Delete a quiz
  deleteQuiz: async (quizId, teacherId) => {
    // Verify ownership
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        class: { teacherId }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to delete it');
    }

    // Delete quiz (cascade will handle questions and attempts)
    await prisma.quiz.delete({
      where: { id: quizId }
    });

    logger.info(`Quiz deleted: ${quizId} by teacher ${teacherId}`);
  },

  // Toggle quiz status
  toggleQuizStatus: async (quizId, teacherId, isActive) => {
    // Verify ownership
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        class: { teacherId }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to update it');
    }

    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { isActive },
      include: {
        questions: {
          orderBy: { order: 'asc' }
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

    logger.info(`Quiz ${isActive ? 'activated' : 'deactivated'}: ${quizId} by teacher ${teacherId}`);
    return updatedQuiz;
  },

  // Submit quiz attempt
  submitQuizAttempt: async (quizId, studentId, answers) => {
    // Verify student has access to quiz
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        isActive: true,
        class: {
          enrollments: {
            some: {
              userId: studentId,
              status: 'ACTIVE'
            }
          }
        }
      },
      include: {
        questions: true
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to access it');
    }

    // Check if student has already attempted
    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: {
        quizId,
        userId: studentId
      }
    });

    if (existingAttempt) {
      throw new Error('You have already attempted this quiz');
    }

    // Calculate score
    let score = 0;
    const questionResults = {};

    quiz.questions.forEach(question => {
      const studentAnswer = answers[question.id];
      const isCorrect = studentAnswer === question.correctAnswer;
      
      questionResults[question.id] = {
        question: question.question,
        studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect,
        marks: isCorrect ? question.marks : 0
      };

      if (isCorrect) {
        score += question.marks;
      }
    });

    // Create quiz attempt
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: studentId,
        quizId,
        answers: questionResults,
        score,
        totalMarks: quiz.totalMarks
      },
      include: {
        quiz: {
          select: {
            id: true,
            title: true,
            totalMarks: true
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    logger.info(`Quiz attempt submitted: ${quizId} by student ${studentId}, score: ${score}/${quiz.totalMarks}`);

    return {
      attempt,
      score,
      totalMarks: quiz.totalMarks,
      percentage: ((score / quiz.totalMarks) * 100).toFixed(2),
      questionResults
    };
  },

  // Get quiz attempts for a quiz (teacher view)
  getQuizAttempts: async (quizId, teacherId, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    // Verify ownership
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        class: { teacherId }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to view attempts');
    }

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { quizId },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.quizAttempt.count({ where: { quizId } })
    ]);

    return {
      attempts,
      pagination: {
        page,
        limit,
        total
      }
    };
  },

  // Get student's quiz attempts
  getStudentQuizAttempts: async (studentId, filters = {}, pagination = {}) => {
    const { page = 1, limit = 10 } = pagination;
    const skip = (page - 1) * limit;

    let whereClause = { userId: studentId };

    if (filters.classId) {
      whereClause.quiz = { classId: filters.classId };
    }

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: whereClause,
        include: {
          quiz: {
            select: {
              id: true,
              title: true,
              totalMarks: true,
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
        skip,
        take: limit
      }),
      prisma.quizAttempt.count({ where: whereClause })
    ]);

    return {
      attempts: attempts.map(attempt => ({
        ...attempt,
        percentage: ((attempt.score / attempt.totalMarks) * 100).toFixed(2)
      })),
      pagination: {
        page,
        limit,
        total
      }
    };
  },

  // Get quiz attempt details
  getQuizAttemptById: async (attemptId, userId, userRole) => {
    let whereClause = { id: attemptId };

    if (userRole === 'STUDENT') {
      whereClause.userId = userId;
    } else if (userRole === 'TEACHER') {
      whereClause.quiz = {
        class: { teacherId: userId }
      };
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: whereClause,
      include: {
        quiz: {
          include: {
            questions: {
              orderBy: { order: 'asc' }
            },
            class: {
              select: {
                id: true,
                title: true,
                subject: true
              }
            }
          }
        },
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    if (!attempt) {
      throw new Error('Quiz attempt not found or you do not have permission to view it');
    }

    return {
      ...attempt,
      percentage: ((attempt.score / attempt.totalMarks) * 100).toFixed(2)
    };
  },

  // Get quiz statistics
  getQuizStatistics: async (quizId, teacherId) => {
    // Verify ownership
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        class: { teacherId }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to view statistics');
    }

    const [attempts, stats] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { quizId },
        select: {
          score: true,
          totalMarks: true,
          completedAt: true
        }
      }),
      prisma.quizAttempt.aggregate({
        where: { quizId },
        _avg: { score: true },
        _min: { score: true },
        _max: { score: true },
        _count: true
      })
    ]);

    const totalAttempts = attempts.length;
    const averageScore = stats._avg.score || 0;
    const minScore = stats._min.score || 0;
    const maxScore = stats._max.score || 0;
    const averagePercentage = totalAttempts > 0 ? ((averageScore / quiz.totalMarks) * 100).toFixed(2) : 0;

    // Calculate score distribution
    const scoreRanges = {
      '90-100': 0,
      '80-89': 0,
      '70-79': 0,
      '60-69': 0,
      'below-60': 0
    };

    attempts.forEach(attempt => {
      const percentage = (attempt.score / attempt.totalMarks) * 100;
      if (percentage >= 90) scoreRanges['90-100']++;
      else if (percentage >= 80) scoreRanges['80-89']++;
      else if (percentage >= 70) scoreRanges['70-79']++;
      else if (percentage >= 60) scoreRanges['60-69']++;
      else scoreRanges['below-60']++;
    });

    return {
      totalAttempts,
      averageScore,
      averagePercentage,
      minScore,
      maxScore,
      totalMarks: quiz.totalMarks,
      scoreDistribution: scoreRanges,
      recentAttempts: attempts.slice(0, 5).map(attempt => ({
        score: attempt.score,
        percentage: ((attempt.score / attempt.totalMarks) * 100).toFixed(2),
        completedAt: attempt.completedAt
      }))
    };
  }
};
