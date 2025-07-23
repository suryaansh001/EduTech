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

// Teacher profile validation
export const teacherProfileSchema = Joi.object({
  qualification: Joi.string().max(200).optional(),
  experience: Joi.string().max(200).optional(),
  specialization: Joi.string().max(200).optional()
});

// Student profile validation
export const studentProfileSchema = Joi.object({
  grade: Joi.string().max(20).optional(),
  interests: Joi.array().items(Joi.string()).optional(),
  learningGoals: Joi.string().max(500).optional()
});

// Class validation schemas
export const createClassSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(1000).optional(),
  subject: Joi.string().min(2).max(50).required(),
  grade: Joi.string().max(20).optional(),
  maxStudents: Joi.number().integer().min(1).max(1000).optional(),
  startDate: Joi.date().required(),
  endDate: Joi.date().greater(Joi.ref('startDate')).optional(),
  meetingLink: Joi.string().uri().optional()
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
  status: Joi.string().valid('DRAFT', 'ACTIVE', 'ARCHIVED').optional()
});

// Quiz validation schemas
export const createQuizSchema = Joi.object({
  title: Joi.string().min(3).max(100).required(),
  description: Joi.string().max(1000).optional(),
  classId: Joi.string().required(),
  timeLimit: Joi.number().integer().min(1).max(480).optional(), // max 8 hours
  questions: Joi.array().items(
    Joi.object({
      type: Joi.string().valid('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER').required(),
      question: Joi.string().min(10).max(1000).required(),
      options: Joi.array().items(Joi.string()).when('type', {
        is: 'MULTIPLE_CHOICE',
        then: Joi.required().min(2).max(6),
        otherwise: Joi.optional()
      }),
      correctAnswer: Joi.string().required(),
      marks: Joi.number().integer().min(1).max(100).default(1),
      order: Joi.number().integer().min(1).required()
    })
  ).min(1).required()
});

export const submitQuizSchema = Joi.object({
  answers: Joi.object().pattern(
    Joi.string(), // questionId
    Joi.string()  // answer
  ).required()
});

// Schedule validation schema
export const createScheduleSchema = Joi.object({
  classId: Joi.string().required(),
  title: Joi.string().min(3).max(100).required(),
  startTime: Joi.date().required(),
  endTime: Joi.date().greater(Joi.ref('startTime')).required(),
  isRecurring: Joi.boolean().default(false),
  recurringPattern: Joi.string().when('isRecurring', {
    is: true,
    then: Joi.required(),
    otherwise: Joi.optional()
  })
});

// Chat message validation
export const chatMessageSchema = Joi.object({
  message: Joi.string().min(1).max(1000).required(),
  classId: Joi.string().required()
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
  id: Joi.string().required()
});
