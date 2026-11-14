import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.utils.js';

const toAnswerString = (v) => (v === undefined || v === null ? '' : String(v));

export const quizService = {
  // Create a new quiz
  createQuiz: async (teacherId, quizData) => {
    const { title, description, classId, timeLimit, questions, isActive, startTime, endTime } = quizData;

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
    const totalMarks = (questions || []).reduce((sum, question) => sum + Number(question.marks ?? question.points ?? 1), 0);

    // Create quiz with questions in a transaction
    const quiz = await prisma.$transaction(async (tx) => {
      const newQuiz = await tx.quiz.create({
        data: {
          title,
          description,
          classId,
          timeLimit: timeLimit != null ? Number(timeLimit) : null,
          totalMarks,
          isActive: isActive !== undefined ? !!isActive : true,
          startTime: startTime ? new Date(startTime) : null,
          endTime: endTime ? new Date(endTime) : null,
        }
      });

      const questionsData = (questions || []).map((question, index) => ({
        quizId: newQuiz.id,
        type: question.type || 'MULTIPLE_CHOICE',
        question: question.question,
        options: Array.isArray(question.options) ? question.options.map((o) => String(o)) : [],
        correctAnswer: toAnswerString(question.correctAnswer),
        marks: Number(question.marks ?? question.points ?? 1),
        order: question.order || index + 1
      }));

      if (questionsData.length) {
        await tx.question.createMany({ data: questionsData });
      }

      return newQuiz;
    });

    const completeQuiz = await prisma.quiz.findUnique({
      where: { id: quiz.id },
      include: {
        questions: { orderBy: { order: 'asc' } },
        class: { select: { id: true, title: true, subject: true } },
        _count: { select: { attempts: true } }
      }
    });

    logger.info(`Quiz created: ${title} by teacher ${teacherId}`);
    return completeQuiz;
  },

  // Get quizzes based on user role
  getQuizzes: async (userId, userRole, filters = {}, pagination = {}) => {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    let whereClause = { ...filters };

    if (userRole === 'TEACHER') {
      whereClause.class = { teacherId: userId };
    } else if (userRole === 'STUDENT') {
      whereClause.class = {
        ...(whereClause.class || {}),
        enrollments: {
          some: { userId: userId, status: 'ACTIVE' }
        }
      };
    }

    const [quizzes, total] = await Promise.all([
      prisma.quiz.findMany({
        where: whereClause,
        include: {
          questions: { orderBy: { order: 'asc' } },
          class: {
            select: {
              id: true,
              title: true,
              subject: true,
              teacher: { select: { id: true, name: true } }
            }
          },
          _count: { select: { questions: true, attempts: true } },
          ...(userRole === 'STUDENT' ? {
            attempts: {
              where: { userId },
              select: {
                id: true, score: true, totalMarks: true, percentageScore: true, completedAt: true,
                startedAt: true, timeSpentMinutes: true, questionTimes: true, answers: true,
                attempt2Score: true, attempt2TotalMarks: true, attempt2Percentage: true, attempt2CompletedAt: true, attempt2TimeSpentMinutes: true
              }
            }
          } : {})
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.quiz.count({ where: whereClause })
    ]);

    // For students, hide correct answers unless attempted (to allow review); include attempt info
    const shaped = quizzes.map((q) => {
      if (userRole === 'STUDENT') {
        const attempt = q.attempts && q.attempts[0] ? q.attempts[0] : null;
        return {
          ...q,
          questions: q.questions.map(({ correctAnswer, ...rest }) => ({ ...rest, ...(attempt ? { correctAnswer } : {}) })),
          myAttempt: attempt,
          attempts: undefined,
        };
      }
      return q;
    });

    return {
      quizzes: shaped,
      pagination: { page, limit, total }
    };
  },

  // Get a specific quiz
  getQuizById: async (quizId, userId, userRole) => {
    let whereClause = { id: quizId };

    if (userRole === 'TEACHER') {
      whereClause.class = { teacherId: userId };
    } else if (userRole === 'STUDENT') {
      whereClause.class = {
        enrollments: { some: { userId: userId, status: 'ACTIVE' } }
      };
    }

    const quiz = await prisma.quiz.findFirst({
      where: whereClause,
      include: {
        questions: { orderBy: { order: 'asc' } },
        class: {
          select: {
            id: true, title: true, subject: true,
            teacher: { select: { id: true, name: true } }
          }
        },
        _count: { select: { attempts: true } },
        ...(userRole === 'STUDENT' ? {
          attempts: {
            where: { userId },
            select: {
              id: true, score: true, totalMarks: true, percentageScore: true, completedAt: true,
              startedAt: true, timeSpentMinutes: true, questionTimes: true, answers: true,
              attempt2Score: true, attempt2TotalMarks: true, attempt2Percentage: true, attempt2CompletedAt: true, attempt2TimeSpentMinutes: true
            }
          }
        } : {})
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to access it');
    }

    if (userRole === 'STUDENT') {
      const attempt = quiz.attempts && quiz.attempts[0] ? quiz.attempts[0] : null;
      quiz.myAttempt = attempt;
      quiz.hasAttempted = !!attempt;
      // reveal correct answers only after attempt (for review)
      quiz.questions = quiz.questions.map(({ correctAnswer, ...rest }) => ({ ...rest, ...(attempt ? { correctAnswer } : {}) }));
      delete quiz.attempts;
    }

    return quiz;
  },

  // Update a quiz
  updateQuiz: async (quizId, teacherId, updateData) => {
    const { title, description, timeLimit, isActive, questions, startTime, endTime } = updateData;

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, class: { teacherId } }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to update it');
    }

    const updatedQuiz = await prisma.$transaction(async (tx) => {
      let totalMarks = quiz.totalMarks;

      if (questions && questions.length > 0) {
        await tx.question.deleteMany({ where: { quizId } });
        totalMarks = questions.reduce((sum, question) => sum + Number(question.marks ?? question.points ?? 1), 0);
        const questionsData = questions.map((question, index) => ({
          quizId,
          type: question.type || 'MULTIPLE_CHOICE',
          question: question.question,
          options: Array.isArray(question.options) ? question.options.map((o) => String(o)) : [],
          correctAnswer: toAnswerString(question.correctAnswer),
          marks: Number(question.marks ?? question.points ?? 1),
          order: question.order || index + 1
        }));
        await tx.question.createMany({ data: questionsData });
      }

      return await tx.quiz.update({
        where: { id: quizId },
        data: {
          ...(title !== undefined && { title }),
          ...(description !== undefined && { description }),
          ...(timeLimit !== undefined && { timeLimit: timeLimit != null ? Number(timeLimit) : null }),
          ...(isActive !== undefined && { isActive: !!isActive }),
          ...(startTime !== undefined && { startTime: startTime ? new Date(startTime) : null }),
          ...(endTime !== undefined && { endTime: endTime ? new Date(endTime) : null }),
          totalMarks
        },
        include: {
          questions: { orderBy: { order: 'asc' } },
          class: { select: { id: true, title: true, subject: true } },
          _count: { select: { attempts: true } }
        }
      });
    });

    logger.info(`Quiz updated: ${quizId} by teacher ${teacherId}`);
    return updatedQuiz;
  },

  // Delete a quiz
  deleteQuiz: async (quizId, teacherId) => {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, class: { teacherId } }
    });
    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to delete it');
    }
    await prisma.quiz.delete({ where: { id: quizId } });
    logger.info(`Quiz deleted: ${quizId} by teacher ${teacherId}`);
  },

  // Toggle quiz status
  toggleQuizStatus: async (quizId, teacherId, isActive) => {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, class: { teacherId } }
    });
    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to update it');
    }
    const updatedQuiz = await prisma.quiz.update({
      where: { id: quizId },
      data: { isActive },
      include: {
        questions: { orderBy: { order: 'asc' } },
        class: { select: { id: true, title: true, subject: true } },
        _count: { select: { attempts: true } }
      }
    });
    logger.info(`Quiz ${isActive ? 'activated' : 'deactivated'}: ${quizId} by teacher ${teacherId}`);
    return updatedQuiz;
  },

  // Submit quiz attempt (attempt 1 final, attempt 2 practice marks-only)
  submitQuizAttempt: async (quizId, studentId, payload) => {
    const answers = payload.answers || {};
    const timeSpentSec = payload.timeSpent != null ? Number(payload.timeSpent) : null;
    const startedAt = payload.startedAt ? new Date(payload.startedAt) : null;
    const questionTimes = payload.questionTimes || null;
    const isPractice = !!payload.isPractice;

    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        isActive: true,
        class: {
          enrollments: { some: { userId: studentId, status: 'ACTIVE' } }
        }
      },
      include: { questions: { orderBy: { order: 'asc' } } }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to access it');
    }

    const now = new Date();
    if (quiz.startTime && now < new Date(quiz.startTime)) {
      throw new Error('Quiz has not started yet');
    }
    if (quiz.endTime && now > new Date(quiz.endTime)) {
      throw new Error('Quiz has ended');
    }

    const existingAttempt = await prisma.quizAttempt.findFirst({
      where: { quizId, userId: studentId }
    });

    // Compute score & per-question results (returned for UI review; stored only for attempt 1)
    let score = 0;
    const questionResults = {};
    quiz.questions.forEach(question => {
      const studentAnswer = answers[question.id];
      const correct = question.correctAnswer;
      const isCorrect = studentAnswer !== undefined && studentAnswer !== null && String(studentAnswer) === String(correct);
      questionResults[question.id] = {
        questionId: question.id,
        question: question.question,
        studentAnswer: studentAnswer ?? null,
        correctAnswer: correct,
        isCorrect,
        marks: isCorrect ? question.marks : 0
      };
      if (isCorrect) score += question.marks;
    });
    const percentage = quiz.totalMarks ? (score / quiz.totalMarks) * 100 : 0;

    if (existingAttempt) {
      // Practice reattempt (attempt 2): store only marks, not answers/options
      if (existingAttempt.attempt2Percentage != null) {
        throw new Error('You have already completed the practice reattempt');
      }
      const updated = await prisma.quizAttempt.update({
        where: { id: existingAttempt.id },
        data: {
          attempt2Score: score,
          attempt2TotalMarks: quiz.totalMarks,
          attempt2Percentage: percentage,
          attempt2CompletedAt: new Date(),
          attempt2TimeSpentMinutes: timeSpentSec != null ? Math.round(timeSpentSec / 60) : null,
        },
        include: {
          quiz: { select: { id: true, title: true, totalMarks: true } },
          user: { select: { id: true, name: true, email: true } }
        }
      });
      logger.info(`Quiz practice attempt submitted: ${quizId} by student ${studentId}, score: ${score}/${quiz.totalMarks}`);
      return {
        attempt: updated,
        score,
        totalMarks: quiz.totalMarks,
        percentage: Number(percentage.toFixed(2)),
        questionResults,
        isPractice: true
      };
    }

    // Attempt 1 (final): store full details
    const attempt = await prisma.quizAttempt.create({
      data: {
        userId: studentId,
        quizId,
        answers: questionResults, // store per-question details for attempt 1
        score,
        totalMarks: quiz.totalMarks,
        percentageScore: percentage,
        startedAt: startedAt,
        completedAt: new Date(),
        timeSpentMinutes: timeSpentSec != null ? Math.round(timeSpentSec / 60) : null,
        questionTimes: questionTimes || undefined,
      },
      include: {
        quiz: { select: { id: true, title: true, totalMarks: true } },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    logger.info(`Quiz attempt submitted: ${quizId} by student ${studentId}, score: ${score}/${quiz.totalMarks}`);

    return {
      attempt,
      score,
      totalMarks: quiz.totalMarks,
      percentage: Number(percentage.toFixed(2)),
      questionResults,
      isPractice: false
    };
  },

  // Get quiz attempts for a quiz (teacher view)
  getQuizAttempts: async (quizId, teacherId, pagination = {}) => {
    const { page = 1, limit = 50 } = pagination;
    const skip = (page - 1) * limit;

    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, class: { teacherId } },
      include: { questions: { orderBy: { order: 'asc' } } }
    });
    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to view attempts');
    }

    const [attempts, total] = await Promise.all([
      prisma.quizAttempt.findMany({
        where: { quizId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.quizAttempt.count({ where: { quizId } })
    ]);

    return { attempts, quiz, pagination: { page, limit, total } };
  },

  // Get student's quiz attempts
  getStudentQuizAttempts: async (studentId, filters = {}, pagination = {}) => {
    const { page = 1, limit = 50 } = pagination;
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
              id: true, title: true, totalMarks: true,
              class: { select: { id: true, title: true, subject: true } }
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        skip,
        take: limit
      }),
      prisma.quizAttempt.count({ where: whereClause })
    ]);

    return { attempts, pagination: { page, limit, total } };
  },

  // Get quiz attempt details
  getQuizAttemptById: async (attemptId, userId, userRole) => {
    let whereClause = { id: attemptId };
    if (userRole === 'STUDENT') {
      whereClause.userId = userId;
    } else if (userRole === 'TEACHER') {
      whereClause.quiz = { class: { teacherId: userId } };
    }

    const attempt = await prisma.quizAttempt.findFirst({
      where: whereClause,
      include: {
        quiz: {
          include: {
            questions: { orderBy: { order: 'asc' } },
            class: { select: { id: true, title: true, subject: true } }
          }
        },
        user: { select: { id: true, name: true, email: true } }
      }
    });

    if (!attempt) {
      throw new Error('Quiz attempt not found or you do not have permission to view it');
    }

    return attempt;
  },

  // Get quiz statistics
  getQuizStatistics: async (quizId, teacherId) => {
    const quiz = await prisma.quiz.findFirst({
      where: { id: quizId, class: { teacherId } }
    });
    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to view statistics');
    }

    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId },
      select: { score: true, totalMarks: true, completedAt: true, percentageScore: true }
    });

    const totalAttempts = attempts.length;
    const avgPct = totalAttempts ? attempts.reduce((s, a) => s + (a.percentageScore || 0), 0) / totalAttempts : 0;

    return {
      totalAttempts,
      averagePercentage: Number(avgPct.toFixed(2)),
      totalMarks: quiz.totalMarks,
    };
  }
};
