# Step 3: Class Management

This section covers class management functionality including creating classes, enrollment, and class administration.

## Routes (classes.routes.js)

```javascript
import express from 'express';
import { classController } from '../controllers/class.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate, validateParams } from '../middleware/validation.middleware.js';
import {
  createClassSchema,
  updateClassSchema,
  idSchema,
  paginationSchema
} from '../utils/validation.utils.js';
import Joi from 'joi';

// Additional validation schemas
const bulkEnrollSchema = Joi.object({
  studentIds: Joi.array().items(Joi.string()).min(1).max(50).required()
});

const enrollmentStatusSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'ACTIVE', 'COMPLETED', 'DROPPED').required()
});

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get my enrollments (students only) - must be before /:id routes
router.get('/my-enrollments',
  authorize('STUDENT'),
  classController.getMyEnrollments
);

// Create a new class (teachers and admins only)
router.post('/',
  authorize('TEACHER', 'ADMIN'),
  validate(createClassSchema),
  classController.createClass
);

// Get all classes
router.get('/', classController.getClasses);

// Get a specific class
router.get('/:id',
  validateParams(idSchema),
  classController.getClass
);

// Update a class (teachers and admins only)
router.put('/:id',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  validate(updateClassSchema),
  classController.updateClass
);

// Delete a class (teachers and admins only)
router.delete('/:id',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  classController.deleteClass
);

// Enroll in a class (students only)
router.post('/:id/enroll',
  authorize('STUDENT'),
  validateParams(idSchema),
  classController.enrollInClass
);

// Get class enrollments (teachers and admins only)
router.get('/:id/enrollments',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  classController.getClassEnrollments
);

// Update enrollment status (teachers and admins only)
router.patch('/:id/enrollments/:enrollmentId',
  authorize('TEACHER', 'ADMIN'),
  validateParams({
    id: idSchema.extract('id'),
    enrollmentId: idSchema.extract('id')
  }),
  validate(enrollmentStatusSchema),
  classController.updateEnrollmentStatus
);

// Get available students for enrollment (teachers and admins only)
router.get('/:id/available-students',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  classController.getAvailableStudents
```

**Explanation:**
- **Role-Based Access**: Different routes have different authorization requirements (students, teachers, admins)
- **Route Ordering**: `/my-enrollments` is placed before `/:id` routes to prevent conflicts
- **Bulk Operations**: Supports bulk enrollment of multiple students at once
- **Enrollment Management**: Teachers can approve/reject student enrollment requests
- **Validation**: Comprehensive input validation using Joi schemas for all endpoints
);

// Bulk enroll students (teachers and admins only)
router.post('/:id/bulk-enroll',
  authorize('TEACHER', 'ADMIN'),
  validateParams(idSchema),
  validate(bulkEnrollSchema),
  classController.bulkEnrollStudents
);

// Remove student from class (teachers and admins only)
router.delete('/:id/students/:studentId',
  authorize('TEACHER', 'ADMIN'),
  validateParams({
    id: idSchema.extract('id'),
    studentId: idSchema.extract('id')
  }),
  classController.removeStudentFromClass
);

export default router;
```

## Controller (class.controller.js)

```javascript
import { classService } from '../services/class.service.js';
import { successResponse, paginatedResponse } from '../utils/response.utils.js';

export const classController = {
  // Create a new class
  createClass: async (req, res, next) => {
    try {
      const teacherId = req.user.id;
      const classData = req.body;
      
      const newClass = await classService.createClass(teacherId, classData);
      
      successResponse(res, newClass, 'Class created successfully', 201);
    } catch (error) {
      next(error);
    }
  },

  // Get all classes
  getClasses: async (req, res, next) => {
    try {
      const { page = 1, limit = 10, status, subject, teacherId } = req.query;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const filters = {
        ...(status && { status }),
        ...(subject && { subject }),
        ...(teacherId && { teacherId })
      };

      const result = await classService.getClasses(userId, userRole, filters, {
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      paginatedResponse(res, result.classes, result.pagination, 'Classes retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  /**
   * Get my enrollments (for students)
   * REASON: Allow students to see their enrolled classes with schedules
   */
  getMyEnrollments: async (req, res, next) => {
    try {
      const studentId = req.user.id;
      
      const enrollments = await classService.getStudentEnrollments(studentId);
      
      successResponse(res, enrollments, 'Enrollments retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get a specific class
  getClass: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      const classData = await classService.getClassById(id, userId, userRole);
      
      successResponse(res, classData, 'Class retrieved successfully');
    } catch (error) {
      next(error);
    }
  },

  // Update a class
  updateClass: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      const updateData = req.body;
      
      const updatedClass = await classService.updateClass(id, teacherId, updateData);
      
      successResponse(res, updatedClass, 'Class updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Delete a class
  deleteClass: async (req, res, next) => {
    try {
      const { id } = req.params;
      const teacherId = req.user.id;
      
      await classService.deleteClass(id, teacherId);
      
      successResponse(res, null, 'Class deleted successfully');
    } catch (error) {
      next(error);
    }
  },

  // Enroll in a class (for students)
  enrollInClass: async (req, res, next) => {
    try {
      const { id } = req.params;
      const studentId = req.user.id;
      
      const enrollment = await classService.enrollStudent(id, studentId);
      
      successResponse(res, enrollment, 'Enrolled in class successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get class enrollments
  getClassEnrollments: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 10, status } = req.query;
      
      // Allow both teachers and admins to view enrollments
      if (userRole === 'TEACHER') {
        const result = await classService.getClassEnrollments(id, userId, {
          status,
          page: parseInt(page),
          limit: parseInt(limit)
        });
        
        paginatedResponse(res, result.enrollments, result.pagination, 'Class enrollments retrieved successfully');
      } else if (userRole === 'ADMIN') {
        // Admin can view any class enrollments
        const result = await classService.getClassEnrollments(id, null, {
          status,
          page: parseInt(page),
          limit: parseInt(limit),
          isAdmin: true
        });
        
        paginatedResponse(res, result.enrollments, result.pagination, 'Class enrollments retrieved successfully');
      } else {
        return next(new Error('You do not have permission to view class enrollments'));
      }
    } catch (error) {
      next(error);
    }
  },

  // Update enrollment status
  updateEnrollmentStatus: async (req, res, next) => {
    try {
      const { id, enrollmentId } = req.params;
      const { status } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;
      
      // Allow both teachers and admins to update enrollment status
      const teacherId = userRole === 'ADMIN' ? null : userId;
      
      const enrollment = await classService.updateEnrollmentStatus(id, enrollmentId, teacherId, status);
      
      successResponse(res, enrollment, 'Enrollment status updated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Get available students for enrollment
  getAvailableStudents: async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;
      const { page = 1, limit = 20, search, grade } = req.query;

      const filters = {
        ...(search && { search }),
        ...(grade && { grade })
      };

      const result = await classService.getAvailableStudents(
        id,
        userId,
        userRole,
        filters,
        { page: parseInt(page), limit: parseInt(limit) }
      );

      paginatedResponse(
        res,
        result.students,
        result.pagination,
        'Available students retrieved successfully'
      );
    } catch (error) {
      next(error);
    }
  },

  // Bulk enroll students
  bulkEnrollStudents: async (req, res, next) => {
    try {
      const { id } = req.params;
      const { studentIds } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role;

      if (!Array.isArray(studentIds) || studentIds.length === 0) {
        return next(new Error('Please provide an array of student IDs'));
      }

      const result = await classService.bulkEnrollStudents(
        id,
        studentIds,
        userId,
        userRole
      );

      successResponse(
        res,
        result,
        `Successfully enrolled ${result.count} students in the class`
      );
    } catch (error) {
      next(error);
    }
  },

  // Remove student from class
  removeStudentFromClass: async (req, res, next) => {
    try {
      const { id, studentId } = req.params;
      const userId = req.user.id;
      const userRole = req.user.role;

      const result = await classService.removeStudentFromClass(
        id,
        studentId,
        userId,
        userRole
      );

      successResponse(
        res,
        result,
        'Student removed from class successfully'
      );
    } catch (error) {
      next(error);
    }
  }
};

**Controller Explanation:**
- **Role-Based Access Control**: Different methods have different permission checks for students, teachers, and admins
- **Flexible Filtering**: getClasses supports multiple filters (status, subject, teacher) with role-based data access
- **Enrollment Management**: Teachers can approve/reject enrollments and bulk enroll students
- **Student Management**: Teachers can view available students and remove students from classes
- **Admin Privileges**: Admins have broader access to view and manage any class enrollments
- **Bulk Operations**: Supports enrolling multiple students at once for efficiency

## Service (class.service.js) - Create Class
```

## Service (class.service.js) - Create Class

```javascript
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

**Service Explanation (Create Class):**
- **Data Validation**: Accepts comprehensive class information including scheduling and capacity limits
- **Teacher Association**: Automatically associates the class with the creating teacher
- **Metadata Inclusion**: Returns class with teacher details and enrollment/quiz counts for immediate display
- **Date Handling**: Properly converts date strings to Date objects for database storage

## Service (class.service.js) - Get Classes
```

## Service (class.service.js) - Get Classes

```javascript
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

**Service Explanation (Get Classes):**
- **Role-Based Filtering**: Teachers see only their classes, students see active classes and their enrollments
- **Rich Data Inclusion**: Includes teacher profiles, enrollment counts, and student-specific enrollment status
- **Efficient Pagination**: Uses skip/take for database-level pagination with total count calculation
- **Conditional Includes**: Students get additional enrollment data when viewing classes

## Service (class.service.js) - Enroll Student
```

## Service (class.service.js) - Enroll Student

```javascript
  // Enroll a student in a class
  enrollStudent: async (classId, studentId) => {
    // Check if class exists and is active
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { status: { in: ['ACTIVE', 'PENDING'] } }
            }
          }
        }
      }
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    if (classData.status !== 'ACTIVE') {
      throw new Error('Class is not available for enrollment');
    }

    // Check if student is already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_classId: {
          userId: studentId,
          classId: classId
        }
      }
    });

    if (existingEnrollment) {
      if (existingEnrollment.status === 'ACTIVE') {
        throw new Error('You are already enrolled in this class');
      } else if (existingEnrollment.status === 'PENDING') {
        throw new Error('Your enrollment is pending approval');
      } else if (existingEnrollment.status === 'DROPPED') {
        // Allow re-enrollment if previously dropped
        const updatedEnrollment = await prisma.enrollment.update({
          where: { id: existingEnrollment.id },
          data: { status: 'PENDING' },
          include: {
            class: {
              select: {
                id: true,
                title: true,
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
        return updatedEnrollment;
      }
    }

    // Check capacity
    if (classData.maxStudents && classData._count.enrollments >= classData.maxStudents) {
      throw new Error('Class is full');
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId: studentId,
        classId: classId,
        status: 'PENDING' // Require teacher approval
      },
      include: {
        class: {
          select: {
            id: true,
            title: true,
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

    logger.info(`Student ${studentId} enrolled in class ${classId}`);
    return enrollment;
  },

**Service Explanation (Enroll Student):**
- **Class Validation**: Checks if class exists and is available for enrollment
- **Duplicate Prevention**: Handles various enrollment states (active, pending, dropped) appropriately
- **Capacity Management**: Enforces maximum student limits set by teachers
- **Approval Workflow**: New enrollments start as 'PENDING' requiring teacher approval
- **Re-enrollment**: Allows dropped students to re-enroll by changing status back to pending

## Service (class.service.js) - Bulk Enroll Students
```

## Service (class.service.js) - Bulk Enroll Students

```javascript
  // Bulk enroll students in a class
  bulkEnrollStudents: async (classId, studentIds, userId, userRole) => {
    // Verify class ownership or admin access
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: {
        teacherId: true,
        status: true,
        maxStudents: true,
        _count: {
          select: {
            enrollments: {
              where: { status: { in: ['ACTIVE', 'PENDING'] } }
            }
          }
        }
      }
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    if (userRole === 'TEACHER' && classData.teacherId !== userId) {
      throw new Error('You do not have permission to enroll students in this class');
    }

    if (classData.status !== 'ACTIVE') {
      throw new Error('Class is not active');
    }

    // Check capacity
    const currentEnrollments = classData._count.enrollments;
    const availableSlots = classData.maxStudents ? classData.maxStudents - currentEnrollments : Infinity;
    
    if (studentIds.length > availableSlots) {
      throw new Error(`Cannot enroll ${studentIds.length} students. Only ${availableSlots} slots available.`);
    }

    // Get existing enrollments to avoid duplicates
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        classId: classId,
        userId: { in: studentIds }
      },
      select: {
        userId: true,
        status: true
      }
    });

    const existingStudentIds = new Set(existingEnrollments.map(e => e.userId));
    const alreadyEnrolled = existingEnrollments.filter(e => e.status === 'ACTIVE').map(e => e.userId);
    const pendingStudents = existingEnrollments.filter(e => e.status === 'PENDING').map(e => e.userId);

    // Filter out students who are already enrolled or have pending enrollment
    const studentsToEnroll = studentIds.filter(id => 
      !existingStudentIds.has(id) || 
      (existingStudentIds.has(id) && !alreadyEnrolled.includes(id) && !pendingStudents.includes(id))
    );

    if (studentsToEnroll.length === 0) {
      throw new Error('All selected students are already enrolled or have pending enrollment');
    }

    // Create enrollments in transaction
    const result = await prisma.$transaction(async (prisma) => {
      const enrollments = await prisma.enrollment.createMany({
        data: studentsToEnroll.map(studentId => ({
          userId: studentId,
          classId: classId,
          status: 'ACTIVE' // Direct enrollment by teacher/admin
        })),
        skipDuplicates: true
      });

      return enrollments;
    });

    logger.info(`Bulk enrolled ${result.count} students in class ${classId} by ${userRole} ${userId}`);

    return {
      count: result.count,
      enrolledStudents: studentsToEnroll,
      skipped: studentIds.length - studentsToEnroll.length
    };
  },

**Service Explanation (Bulk Enroll Students):**
- **Permission Validation**: Ensures only class teachers or admins can bulk enroll students
- **Capacity Enforcement**: Checks available slots before allowing bulk enrollment
- **Duplicate Handling**: Intelligently handles students who are already enrolled or have pending requests
- **Direct Enrollment**: Teacher-initiated enrollments bypass the pending approval process
- **Transaction Safety**: Uses database transactions to ensure all enrollments succeed or fail together
- **Detailed Reporting**: Returns counts of successfully enrolled and skipped students
```</content>
<parameter name="filePath">/home/suri/proj/EduTech/code-snippets-by-functionality/class-management.md