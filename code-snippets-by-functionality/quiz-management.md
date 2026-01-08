# Step 4: Quiz Management

This section covers quiz creation, submission, and management functionality.

## Routes (quizzes.routes.js)

```javascript
import express from 'express';
import { quizController } from '../controllers/quiz.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validation.middleware.js';
import {
  createQuizSchema,
  submitQuizSchema,
  idSchema,
  paginationSchema
} from '../utils/validation.utils.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Teacher-only routes
router.post('/', 
  authorize('TEACHER', 'ADMIN'),
  validate(createQuizSchema),
  quizController.createQuiz
);

router.put('/:id',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.updateQuiz
);

router.delete('/:id',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.deleteQuiz
);

router.patch('/:id/status',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.toggleQuizStatus
);

router.get('/:id/attempts',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.getQuizAttempts
);

router.get('/:id/statistics',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  quizController.getQuizStatistics
);

// Student routes
router.post('/:id/submit',
  authorize('STUDENT'),
  validateParams(idSchema),
  validate(submitQuizSchema),
  quizController.submitQuiz
);

router.get('/my-attempts',
  authorize('STUDENT'),
  quizController.getMyQuizAttempts
);

// Shared routes (students and teachers)
router.get('/', quizController.getQuizzes);
router.get('/:id', validateParams(idSchema), quizController.getQuiz);

// Quiz attempt details
router.get('/attempts/:attemptId',
  validateParams({ attemptId: idSchema.extract('id') }),
  quizController.getQuizAttempt
);

export default router;
```

**Explanation:**
- **Role Separation**: Clear separation between teacher/admin routes and student routes
- **Quiz Lifecycle**: Teachers can create, update, delete, and toggle quiz active status
- **Attempt Management**: Students can submit quizzes and view their attempt history
- **Analytics**: Teachers can view quiz attempts and detailed statistics
- **Shared Access**: Some routes (viewing quizzes) are available to both roles with appropriate data filtering

## Controller (quiz.controller.js)

```javascript
import { quizService } from '../services/quiz.service.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.utils.js';

export const quizController = {
  // Create a new quiz
  createQuiz: async (req, res, next) => {
    try {
      const teacherId = req.user.id;
      const quizData = req.body;
      
      const quiz = await quizService.createQuiz(teacherId, quizData);
```

**Explanation:**
- **Service Integration**: Controllers handle HTTP requests and delegate business logic to service layer
- **User Context**: Extracts user ID from JWT token for authorization checks
- **Error Handling**: Uses try-catch with Express error middleware for consistent error responses
- **Standardized Responses**: Uses utility functions for consistent API response formatting across all endpoints
      
      successResponse(res, quiz, 'Quiz created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get all quizzes (with filters)
  getQuizzes: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, classId, isActive } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const filters = {
        ...(classId && { classId }),
        ...(isActive !== undefined && { isActive: isActive === 'true' })
      };

      const result = await quizService.getQuizzes(userId, userRole, filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.quizzes, result.pagination, 'Quizzes retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get a specific quiz
  getQuiz: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const quiz = await quizService.getQuizById(id, userId, userRole);
      
      successResponse(res, quiz, 'Quiz retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update a quiz
  updateQuiz: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const updateData = req.body;
      
      const quiz = await quizService.updateQuiz(id, teacherId, updateData);
      
      successResponse(res, quiz, 'Quiz updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete a quiz
  deleteQuiz: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      
      await quizService.deleteQuiz(id, teacherId);
      
      successResponse(res, null, 'Quiz deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Activate/Deactivate a quiz
  toggleQuizStatus: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const { isActive } = req.body;
      
      const quiz = await quizService.toggleQuizStatus(id, teacherId, isActive);
      
      successResponse(res, quiz, `Quiz ${isActive ? 'activated' : 'deactivated'} successfully`);
    } catch (error) {
      next(error);
    }
  },

  // Submit quiz attempt
  submitQuiz: async (req, res, next) => {
    try {
      const { id } = req.params;
      const studentId = req.user.id;
      const { answers } = req.body;
      
      const result = await quizService.submitQuizAttempt(id, studentId, answers);
      
      successResponse(res, result, 'Quiz submitted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get quiz attempts for a quiz (teacher view)
  getQuizAttempts: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const { page = 1, limit = 10 } = req.query;
      
      const result = await quizService.getQuizAttempts(id, teacherId, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.attempts, result.pagination, 'Quiz attempts retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get student's quiz attempts
  getMyQuizAttempts: async (req, res, next) => {
    try {
      const studentId = req.user.id;
      const { page = 1, limit = 10, classId } = req.query;
      
      const filters = {
        ...(classId && { classId })
      };

      const result = await quizService.getStudentQuizAttempts(studentId, filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.attempts, result.pagination, 'Your quiz attempts retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get quiz attempt details
  getQuizAttempt: async (req, res, next) => {
    try {
      const { attemptId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const attempt = await quizService.getQuizAttemptById(attemptId, userId, userRole);
      
      successResponse(res, attempt, 'Quiz attempt details retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get quiz statistics (teacher view)
  getQuizStatistics: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      
      const stats = await quizService.getQuizStatistics(id, teacherId);
      
      successResponse(res, stats, 'Quiz statistics retrieved successfully');
    } catch (error) {
      next(error);
    }
  }
};

**Controller Explanation:**
- **CRUD Operations**: Standard create, read, update, delete operations for quizzes
- **Role-Based Filtering**: getQuizzes filters results based on user role (students see quizzes from their classes, teachers see their own quizzes)
- **Pagination**: All list endpoints support pagination with configurable page size
- **Quiz Lifecycle Management**: Teachers can activate/deactivate quizzes to control availability
- **Attempt Tracking**: Separate endpoints for teachers to view all attempts vs students viewing their own attempts
- **Statistics**: Teachers get detailed analytics on quiz performance
- **Security**: All operations validate user permissions and ownership
```

## Service (quiz.service.js) - Create Quiz

```javascript
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

**Service Explanation (Create Quiz):**
- **Authorization Check**: Verifies teacher owns the class before allowing quiz creation
- **Transaction Safety**: Uses Prisma transactions to ensure quiz and questions are created atomically
- **Data Integrity**: Calculates total marks from individual question marks
- **Question Ordering**: Maintains question order for consistent quiz presentation
- **Complete Response**: Returns quiz with all questions and class information for immediate use

## Service (quiz.service.js) - Submit Quiz Attempt
```

## Service (quiz.service.js) - Submit Quiz Attempt

```javascript
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

**Service Explanation (Submit Quiz Attempt):**
- **Access Control**: Verifies student is enrolled in the class and quiz is active
- **Duplicate Prevention**: Checks if student has already attempted the quiz
- **Scoring Logic**: Compares student answers with correct answers and calculates total score
- **Detailed Results**: Stores individual question results for review and analytics
- **Performance Metrics**: Calculates percentage and provides comprehensive attempt data

## Service (quiz.service.js) - Get Quiz Statistics
```

## Service (quiz.service.js) - Get Quiz Statistics

```javascript
  // Get quiz statistics (teacher view)
  getQuizStatistics: async (quizId, teacherId) => {
    // Verify teacher owns the quiz
    const quiz = await prisma.quiz.findFirst({
      where: {
        id: quizId,
        class: {
          teacherId: teacherId
        }
      },
      include: {
        _count: {
          select: {
            attempts: true
          }
        }
      }
    });

    if (!quiz) {
      throw new Error('Quiz not found or you do not have permission to view its statistics');
    }

    // Get attempt statistics
    const attempts = await prisma.quizAttempt.findMany({
      where: { quizId },
      select: {
        score: true,
        totalMarks: true,
        completedAt: true
      }
    });

    if (attempts.length === 0) {
      return {
        quizId,
        title: quiz.title,
        totalAttempts: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        scoreDistribution: {},
        recentAttempts: []
      };
    }

    // Calculate statistics
    const scores = attempts.map(a => a.score);
    const percentages = attempts.map(a => (a.score / a.totalMarks) * 100);

    const averageScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);

    // Score distribution (by ranges)
    const distribution = {
      '0-20': 0,
      '21-40': 0,
      '41-60': 0,
      '61-80': 0,
      '81-100': 0
    };

    percentages.forEach(percentage => {
      if (percentage <= 20) distribution['0-20']++;
      else if (percentage <= 40) distribution['21-40']++;
      else if (percentage <= 60) distribution['41-60']++;
      else if (percentage <= 80) distribution['61-80']++;
      else distribution['81-100']++;
    });

    // Recent attempts
    const recentAttempts = attempts
      .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
      .slice(0, 10)
      .map(attempt => ({
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: ((attempt.score / attempt.totalMarks) * 100).toFixed(2),
        completedAt: attempt.completedAt
      }));

    return {
      quizId,
      title: quiz.title,
      totalAttempts: attempts.length,
      averageScore: averageScore.toFixed(2),
      highestScore,
      lowestScore,
      scoreDistribution: distribution,
      recentAttempts
    };
  }
};

**Service Explanation (Get Quiz Statistics):**
- **Teacher Authorization**: Verifies teacher owns the quiz before providing statistics
- **Performance Metrics**: Calculates average, highest, and lowest scores across all attempts
- **Score Distribution**: Groups student performance into percentage ranges for analysis
- **Recent Activity**: Shows the 10 most recent attempts for monitoring quiz activity
- **Empty State Handling**: Provides meaningful defaults when no attempts exist yet
```</content>
<parameter name="filePath">/home/suri/proj/EduTech/code-snippets-by-functionality/quiz-management.md