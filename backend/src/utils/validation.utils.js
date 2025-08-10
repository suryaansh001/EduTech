import Joi from 'joi';

// User validation schemas
export const registerSchema = Joi.object({
  name: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(128).required(),
  role: Joi.string().valid('STUDENT', 'TEACHER', 'ADMIN').default('STUDENT'),
  phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional(),
  bio: Joi.string().max(500).optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required()
});

export const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).optional(),
  phone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional(),
  bio: Joi.string().max(500).optional(),
  profileImage: Joi.string().uri().optional()
});

export const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match'
  })
});

export const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required()
});

export const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  newPassword: Joi.string().min(6).max(128).required(),
  confirmPassword: Joi.string().valid(Joi.ref('newPassword')).required().messages({
    'any.only': 'Passwords do not match'
  })
});

// Teacher profile validation
export const teacherProfileSchema = Joi.object({
  qualification: Joi.string().max(200).optional(),
  experience: Joi.string().max(200).optional(),
  specialization: Joi.string().max(200).optional(),
  department: Joi.string().max(100).optional(),
  officeHours: Joi.string().max(200).optional()
});

// Student profile validation
export const studentProfileSchema = Joi.object({
  grade: Joi.string().max(20).optional(),
  interests: Joi.array().items(Joi.string().max(50)).max(10).optional(),
  learningGoals: Joi.string().max(500).optional(),
  parentEmail: Joi.string().email().optional(),
  parentPhone: Joi.string().pattern(/^[+]?[\d\s-()]+$/).optional()
});

// Class validation schemas
export const createClassSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(1000).optional(),
  subject: Joi.string().min(2).max(50).required(),
  grade: Joi.string().max(20).optional(),
  maxStudents: Joi.number().integer().min(1).max(1000).optional(),
  startDate: Joi.date().min('now').required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  meetingLink: Joi.string().uri().optional(),
  classCode: Joi.string().alphanum().length(6).optional()
});

export const updateClassSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  subject: Joi.string().min(2).max(50).optional(),
  grade: Joi.string().max(20).optional(),
  maxStudents: Joi.number().integer().min(1).max(1000).optional(),
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  meetingLink: Joi.string().uri().optional(),
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'COMPLETED', 'CANCELLED').optional()
});

export const joinClassSchema = Joi.object({
  classCode: Joi.string().alphanum().length(6).required()
});

// Assignment validation schemas
export const createAssignmentSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(2000).required(),
  classId: Joi.string().required(),
  dueDate: Joi.date().min('now').required(),
  maxMarks: Joi.number().integer().min(1).max(1000).default(100),
  attachments: Joi.array().items(Joi.string().uri()).max(10).optional(),
  submissionType: Joi.string().valid('FILE', 'TEXT', 'BOTH').default('BOTH')
});

export const submitAssignmentSchema = Joi.object({
  textSubmission: Joi.string().max(5000).optional(),
  fileSubmissions: Joi.array().items(Joi.string().uri()).max(5).optional()
}).or('textSubmission', 'fileSubmissions');

// Quiz validation schemas
export const createQuizSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(1000).optional(),
  classId: Joi.string().required(),
  timeLimit: Joi.number().integer().min(1).max(480).optional(), // max 8 hours
  totalMarks: Joi.number().integer().min(1).max(1000).optional(),
  passingMarks: Joi.number().integer().min(0).optional(),
  shuffleQuestions: Joi.boolean().default(false),
  showResults: Joi.boolean().default(true),
  allowRetakes: Joi.boolean().default(false),
  maxAttempts: Joi.number().integer().min(1).max(10).default(1),
  startTime: Joi.date().min('now').optional(),
  endTime: Joi.date().greater(Joi.ref('startTime')).optional(),
  questions: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY').required(),
      question: Joi.string().min(10).max(2000).required(),
      options: Joi.when('type', {
        is: 'MULTIPLE_CHOICE',
        then: Joi.array().items(Joi.string().max(200)).min(2).max(6).required(),
        otherwise: Joi.optional()
      }),
      correctAnswer: Joi.when('type', {
        is: Joi.valid('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'),
        then: Joi.string().required(),
        otherwise: Joi.optional() // Essay questions don't have predefined answers
      }),
      marks: Joi.number().integer().min(1).max(100).default(1),
      explanation: Joi.string().max(500).optional(),
      order: Joi.number().integer().min(1).required()
    })
  ).min(1).required()
});

export const updateQuizSchema = Joi.object({
  title: Joi.string().min(3).max(100).optional(),
  description: Joi.string().max(1000).optional(),
  timeLimit: Joi.number().integer().min(1).max(480).optional(),
  totalMarks: Joi.number().integer().min(1).max(1000).optional(),
  passingMarks: Joi.number().integer().min(0).optional(),
  shuffleQuestions: Joi.boolean().optional(),
  showResults: Joi.boolean().optional(),
  allowRetakes: Joi.boolean().optional(),
  maxAttempts: Joi.number().integer().min(1).max(10).optional(),
  startTime: Joi.date().optional(),
  endTime: Joi.date().optional(),
  status: Joi.string().valid('DRAFT', 'PUBLISHED', 'COMPLETED', 'CANCELLED').optional()
});

export const submitQuizSchema = Joi.object({
  answers: Joi.object().pattern(
    Joi.string(), // questionId
    Joi.alternatives().try(
      Joi.string().max(2000), // For text answers
      Joi.number(), // For multiple choice indices
      Joi.boolean() // For true/false
    )
  ).required(),
  timeSpent: Joi.number().integer().min(0).optional() // in seconds
});

// Announcement validation schemas
export const createAnnouncementSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  content: Joi.string().min(10).max(2000).required(),
  classId: Joi.string().required(),
  priority: Joi.string().valid('LOW', 'NORMAL', 'HIGH', 'URGENT').default('NORMAL'),
  attachments: Joi.array().items(Joi.string().uri()).max(5).optional(),
  scheduledFor: Joi.date().min('now').optional()
});

// Schedule validation schema
export const createScheduleSchema = Joi.object({
  classId: Joi.string().required(),
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(500).optional(),
  startTime: Joi.date().min('now').required(),
  endTime: Joi.date().greater(Joi.ref('startTime')).required(),
  isRecurring: Joi.boolean().default(false),
  recurringPattern: Joi.when('isRecurring', {
    is: true,
    then: Joi.string().valid('DAILY', 'WEEKLY', 'MONTHLY').required(),
    otherwise: Joi.optional()
  }),
  recurringEndDate: Joi.when('isRecurring', {
    is: true,
    then: Joi.date().greater(Joi.ref('startTime')).optional(),
    otherwise: Joi.optional()
  }),
  meetingLink: Joi.string().uri().optional()
});

// Chat message validation
export const chatMessageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  classId: Joi.string().required(),
  type: Joi.string().valid('TEXT', 'FILE', 'IMAGE').default('TEXT'),
  fileUrl: Joi.when('type', {
    is: Joi.valid('FILE', 'IMAGE'),
    then: Joi.string().uri().required(),
    otherwise: Joi.optional()
  })
});

// File upload validation
export const fileUploadSchema = Joi.object({
  fileName: Joi.string().min(1).max(255).required(),
  fileSize: Joi.number().integer().min(1).max(50 * 1024 * 1024).required(), // 50MB max
  fileType: Joi.string().required(),
  classId: Joi.string().optional()
});

// Grading validation
export const gradeSubmissionSchema = Joi.object({
  marks: Joi.number().min(0).required(),
  feedback: Joi.string().max(1000).optional(),
  status: Joi.string().valid('PENDING', 'GRADED', 'RETURNED').default('GRADED')
});

// Attendance validation
export const markAttendanceSchema = Joi.object({
  classId: Joi.string().required(),
  date: Joi.date().max('now').required(),
  students: Joi.array().items(
    Joi.object({
      studentId: Joi.string().required(),
      status: Joi.string().valid('PRESENT', 'ABSENT', 'LATE', 'EXCUSED').required(),
      notes: Joi.string().max(200).optional()
    })
  ).min(1).required()
});

// Search and filter validation
export const searchSchema = Joi.object({
  query: Joi.string().min(1).max(100).required(),
  type: Joi.string().valid('CLASSES', 'USERS', 'QUIZZES', 'ASSIGNMENTS').optional(),
  filters: Joi.object().optional()
});

// Pagination validation
export const paginationSchema = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(100).default(10),
  sortBy: Joi.string().optional(),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

// ID validation
export const idSchema = Joi.object({
  id: Joi.string().hex().length(24).required() // MongoDB ObjectId format
});

export const mongoIdSchema = Joi.string().hex().length(24);

// Date range validation
export const dateRangeSchema = Joi.object({
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).required()
});

// Bulk operations validation
export const bulkUserSchema = Joi.object({
  users: Joi.array().items(registerSchema.fork(['password'], (schema) => schema.optional())).min(1).max(100).required()
});

// Analytics validation
export const analyticsSchema = Joi.object({
  type: Joi.string().valid('CLASS', 'QUIZ', 'USER', 'OVERALL').required(),
  period: Joi.string().valid('DAY', 'WEEK', 'MONTH', 'YEAR').default('WEEK'),
  startDate: Joi.date().optional(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional()
});

// Common validation helper functions
export const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

export const validateParams = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.params);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};

export const validateQuery = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: 'Invalid query parameters',
        errors: error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }))
      });
    }
    next();
  };
};