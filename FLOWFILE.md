# EduTech Platform Flow Guide

**Purpose**: Complete workflow documentation for Admin, Teacher, and Student journeys

**For**: New developers contributing to the project

**Last Updated**: 2025-01-01

---

## Table of Contents

1. [Platform Overview](#platform-overview)
2. [User Roles](#user-roles)
3. [Admin Workflows](#admin-workflows)
4. [Teacher Workflows](#teacher-workflows)
5. [Student Workflows](#student-workflows)
6. [Technical Flow Diagrams](#technical-flow-diagrams)
7. [API Endpoint Reference](#api-endpoint-reference)
8. [Database Interactions](#database-interactions)
9. [Common Patterns](#common-patterns)

---

## Platform Overview

### What is EduTech?

**EduTech** is a comprehensive learning management system (LMS) that connects:
- **Admins**: Platform managers
- **Teachers**: Content creators and instructors
- **Students**: Learners

### Key Features:
- 📚 Class management
- 📝 Quiz/assessment system
- 📄 Notes and file sharing
- 💬 Real-time chat
- 📊 Analytics dashboard
- 🔐 Role-based access control

### Technology Stack:
```
Frontend: React + TypeScript + Vite + Tailwind CSS
Backend: Node.js + Express + Prisma ORM
Database: PostgreSQL
Real-time: Socket.IO
Storage: Cloudinary (files)
Cache: Redis (token blacklisting)
```

---

## User Roles

### 1. **ADMIN**
**Capabilities**:
- Create teacher and student accounts
- View all classes, users, and activities
- Manage platform settings
- Access analytics across all classes
- Approve/reject enrollments

**Access Level**: Full platform access

### 2. **TEACHER**
**Capabilities**:
- Create and manage their own classes
- Create quizzes and assignments
- Upload study materials
- Approve student enrollments
- Grade assignments
- View class analytics
- Communicate with students

**Access Level**: Their own classes and students only

### 3. **STUDENT**
**Capabilities**:
- Browse and enroll in classes
- Take quizzes and submit assignments
- View grades and progress
- Access study materials
- Chat with teachers and classmates
- View their own analytics

**Access Level**: Classes they're enrolled in only

---

## Admin Workflows

### Flow 1: Admin Login

```
┌─────────────────────────────────────────────────────────────┐
│                    ADMIN LOGIN FLOW                         │
└─────────────────────────────────────────────────────────────┘

1. Frontend: Admin navigates to /login
   │
   ├─→ Component: components/login-page.tsx
   │
2. Admin enters credentials
   │   Email: admin@edutech.com
   │   Password: ********
   │
3. Frontend: Form submission
   │
   ├─→ API Call: POST /api/auth/login
   │   Body: { email, password }
   │
4. Backend: Route Handler
   │
   ├─→ File: routes/auth.routes.js
   ├─→ Middleware: Rate limiting (10 req/15min)
   ├─→ Middleware: Validation (loginSchema)
   ├─→ Controller: authController.login
   │
5. Backend: Authentication Logic
   │
   ├─→ File: services/auth.service.js
   ├─→ Step 1: Find user by email
   │   await prisma.user.findUnique({ where: { email } })
   │
   ├─→ Step 2: Verify password
   │   await comparePassword(password, user.password)
   │   (bcrypt comparison)
   │
   ├─→ Step 3: Check user is active
   │   if (!user.isActive) throw Error
   │
   ├─→ Step 4: Update last login
   │   await prisma.user.update({ lastLogin: new Date() })
   │
   ├─→ Step 5: Generate JWT token
   │   token = generateToken({ userId, email, role: 'ADMIN' })
   │   (Valid for 24 hours)
   │
6. Backend: Response
   │
   └─→ Status: 200 OK
       Body: {
         success: true,
         data: {
           user: { id, name, email, role: 'ADMIN', ... },
           token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
         }
       }
   │
7. Frontend: Handle Response
   │
   ├─→ Store token: localStorage.setItem('token', token)
   ├─→ Store user: Context/State management
   ├─→ Navigate: /admin/dashboard
   │
8. Frontend: Admin Dashboard Loads
   │
   └─→ Component: components/admin/admin-dashboard.tsx
       Auto-fetches: Platform statistics
```

**Files Involved**:
- `frontend/components/login-page.tsx`
- `backend/routes/auth.routes.js`
- `backend/controllers/auth.controller.js`
- `backend/services/auth.service.js`
- `backend/utils/bcrypt.utils.js`
- `backend/utils/jwt.utils.js`

---

### Flow 2: Admin Creates Teacher Account

```
┌─────────────────────────────────────────────────────────────┐
│              ADMIN CREATES TEACHER ACCOUNT                  │
└─────────────────────────────────────────────────────────────┘

1. Frontend: Admin navigates to "Create User"
   │
   ├─→ Component: components/admin/admin-dashboard.tsx
   ├─→ Section: User management tab
   │
2. Admin fills form
   │
   ├─→ Name: "John Doe"
   ├─→ Email: "john.doe@edutech.com"
   ├─→ Role: "TEACHER"
   ├─→ Phone: "+1234567890" (optional)
   ├─→ Specialization: "Mathematics" (for teacher)
   │
3. Frontend: Form submission
   │
   ├─→ API Call: POST /api/auth/create-user
   │   Headers: { Authorization: "Bearer <admin-token>" }
   │   Body: { name, email, role, phone, specialization }
   │
4. Backend: Security Checks
   │
   ├─→ Middleware: authenticate (verify JWT)
   │   • Extract token from header
   │   • Verify signature
   │   • Check not blacklisted (Redis)
   │   • Load user from DB
   │   • Attach to req.user
   │
   ├─→ Middleware: authorize('ADMIN')
   │   • Check req.user.role === 'ADMIN'
   │   • Return 403 if not admin
   │
   ├─→ Middleware: validate(createUserSchema)
   │   • Joi validation
   │   • Check email format
   │   • Check required fields
   │
5. Backend: Create User Logic
   │
   ├─→ File: services/auth.service.js
   ├─→ Method: createUserByAdmin()
   │
   ├─→ Step 1: Check email uniqueness
   │   const existing = await prisma.user.findUnique({ where: { email } })
   │   if (existing) throw Error('Email already exists')
   │
   ├─→ Step 2: Generate temporary password
   │   const tempPassword = generateRandomPassword() // e.g., "Xy9@kL2p"
   │   const hashedPassword = await hashPassword(tempPassword)
   │
   ├─→ Step 3: Database transaction (atomic operation)
   │   await prisma.$transaction(async (prisma) => {
   │     
   │     // Create user
   │     const user = await prisma.user.create({
   │       data: {
   │         name, email, password: hashedPassword,
   │         role: 'TEACHER',
   │         phone, bio,
   │         isFirstLogin: true,
   │         isActive: true
   │       }
   │     })
   │     
   │     // Create teacher profile
   │     await prisma.teacherProfile.create({
   │       data: {
   │         userId: user.id,
   │         specialization
   │       }
   │     })
   │     
   │     return user
   │   })
   │
   ├─→ Step 4: Send welcome email
   │   await emailService.sendWelcomeEmail(user, tempPassword)
   │   Email contains:
   │   • Login credentials
   │   • Platform URL
   │   • First login instructions
   │
6. Backend: Response
   │
   └─→ Status: 201 Created
       Body: {
         success: true,
         message: "TEACHER created successfully and credentials sent via email",
         data: {
           user: { id, name, email, role, ... },
           temporaryPassword: "Xy9@kL2p" (only in dev mode)
         }
       }
   │
7. Frontend: Success Handling
   │
   ├─→ Show success notification
   ├─→ Refresh user list
   ├─→ Display credentials (dev mode) or email sent message
   │
8. Email: Teacher receives email
   │
   └─→ Subject: "Welcome to EduTech"
       Content:
       • Your email: john.doe@edutech.com
       • Temporary password: Xy9@kL2p
       • Login URL: https://edutech.com/login
       • Note: Change password on first login
```

**Database Changes**:
```sql
-- users table
INSERT INTO users (id, name, email, password, role, isFirstLogin, ...)
VALUES ('ckl123...', 'John Doe', 'john.doe@...', '$2b$10$...', 'TEACHER', true, ...);

-- teacher_profiles table
INSERT INTO teacher_profiles (id, userId, specialization, ...)
VALUES ('ckl456...', 'ckl123...', 'Mathematics', ...);
```

**Files Involved**:
- `frontend/components/admin/admin-dashboard.tsx`
- `backend/routes/auth.routes.js`
- `backend/controllers/auth.controller.js`
- `backend/services/auth.service.js`
- `backend/services/email.service.js`
- `backend/utils/jwt.utils.js` (generateRandomPassword)
- `backend/utils/bcrypt.utils.js` (hashPassword)

---

### Flow 3: Admin Views Platform Analytics

```
┌─────────────────────────────────────────────────────────────┐
│              ADMIN VIEWS PLATFORM ANALYTICS                 │
└─────────────────────────────────────────────────────────────┘

1. Frontend: Dashboard loads
   │
   ├─→ Component: components/admin/admin-dashboard.tsx
   ├─→ Hook: useEffect(() => { fetchAnalytics() }, [])
   │
2. Frontend: Fetch analytics
   │
   ├─→ API Call: GET /api/analytics/overview
   │   Headers: { Authorization: "Bearer <admin-token>" }
   │
3. Backend: Route Handler
   │
   ├─→ Middleware: authenticate + authorize('ADMIN')
   ├─→ Controller: analyticsController.getOverview
   │
4. Backend: Analytics Logic
   │
   ├─→ File: services/analytics.service.js
   │
   ├─→ Query 1: Total users by role
   │   const userStats = await prisma.user.groupBy({
   │     by: ['role'],
   │     _count: true
   │   })
   │   Result: { ADMIN: 2, TEACHER: 50, STUDENT: 1000 }
   │
   ├─→ Query 2: Class statistics
   │   const classStats = await prisma.class.groupBy({
   │     by: ['status'],
   │     _count: true
   │   })
   │   Result: { ACTIVE: 100, DRAFT: 20, ARCHIVED: 50 }
   │
   ├─→ Query 3: Quiz completion rate
   │   const totalQuizzes = await prisma.quiz.count()
   │   const completedAttempts = await prisma.quizAttempt.count()
   │   const rate = (completedAttempts / totalQuizzes) * 100
   │
   ├─→ Query 4: Recent activity
   │   const recentClasses = await prisma.class.findMany({
   │     take: 10,
   │     orderBy: { createdAt: 'desc' }
   │   })
   │
   ├─→ Query 5: Enrollment trends
   │   const enrollmentsByMonth = await prisma.enrollment.groupBy({
   │     by: ['createdAt'],
   │     _count: true,
   │     orderBy: { createdAt: 'desc' }
   │   })
   │
5. Backend: Response
   │
   └─→ Status: 200 OK
       Body: {
         success: true,
         data: {
           users: { total: 1052, byRole: {...} },
           classes: { total: 170, byStatus: {...} },
           enrollments: { total: 5000, activeRate: 85 },
           quizzes: { total: 500, completionRate: 78 },
           recentActivity: [...],
           trends: { enrollments: [...], completions: [...] }
         }
       }
   │
6. Frontend: Render Dashboard
   │
   ├─→ Display cards with statistics
   ├─→ Render charts (enrollment trends)
   ├─→ Show recent activity list
   └─→ Display quick actions
```

**Files Involved**:
- `frontend/components/admin/admin-dashboard.tsx`
- `backend/routes/analytics.routes.js`
- `backend/controllers/analytics.controller.js`
- `backend/services/analytics.service.js`

---

## Teacher Workflows

### Flow 4: Teacher Creates a Class

```
┌─────────────────────────────────────────────────────────────┐
│                 TEACHER CREATES CLASS                       │
└─────────────────────────────────────────────────────────────┘

1. Frontend: Teacher navigates to "Create Class"
   │
   ├─→ Component: components/teacher/teacher-dashboard.tsx
   ├─→ Button: "Create New Class"
   │
2. Teacher fills form
   │
   ├─→ Title: "Advanced Mathematics"
   ├─→ Description: "Learn calculus and algebra"
   ├─→ Subject: "Mathematics"
   ├─→ Grade: "Grade 10"
   ├─→ Max Students: 30
   ├─→ Start Date: 2025-02-01
   ├─→ End Date: 2025-06-30
   ├─→ Meeting Link: "https://zoom.us/j/123456"
   ├─→ Status: "DRAFT" (or "ACTIVE")
   │
3. Frontend: Submit form
   │
   ├─→ API Call: POST /api/classes
   │   Headers: { Authorization: "Bearer <teacher-token>" }
   │   Body: {
   │     title, description, subject, grade,
   │     maxStudents, startDate, endDate,
   │     meetingLink, status
   │   }
   │
4. Backend: Security & Validation
   │
   ├─→ Middleware: authenticate
   │   • Verify JWT token
   │   • Load teacher user
   │
   ├─→ Middleware: authorize('TEACHER', 'ADMIN')
   │   • Check user role
   │
   ├─→ Middleware: validate(createClassSchema)
   │   • Title: min 3, max 100 chars
   │   • Start date: must be future date
   │   • End date: must be after start date
   │   • Max students: 1-1000
   │
5. Backend: Create Class Logic
   │
   ├─→ File: services/class.service.js
   ├─→ Method: createClass(teacherId, classData)
   │
   ├─→ Step 1: Validate teacher exists
   │   const teacher = await prisma.user.findUnique({
   │     where: { id: teacherId, role: 'TEACHER' }
   │   })
   │
   ├─→ Step 2: Create class in database
   │   const newClass = await prisma.class.create({
   │     data: {
   │       title, description, subject, grade,
   │       maxStudents, startDate, endDate,
   │       meetingLink, status,
   │       teacherId, // Link to teacher
   │     }
   │   })
   │
   ├─→ Step 3: Return with teacher info
   │   const classWithTeacher = await prisma.class.findUnique({
   │     where: { id: newClass.id },
   │     include: {
   │       teacher: {
   │         select: { id, name, email, profileImage }
   │       },
   │       _count: {
   │         select: { enrollments: true }
   │       }
   │     }
   │   })
   │
6. Backend: Response
   │
   └─→ Status: 201 Created
       Body: {
         success: true,
         message: "Class created successfully",
         data: {
           id: "ckl789...",
           title: "Advanced Mathematics",
           description: "...",
           status: "DRAFT",
           teacher: { name: "John Doe", ... },
           enrollmentCount: 0,
           createdAt: "2025-01-01T10:00:00Z"
         }
       }
   │
7. Frontend: Success Handling
   │
   ├─→ Show success notification
   ├─→ Navigate to class details page
   ├─→ Update class list
   │
8. Optional: If status is ACTIVE
   │
   └─→ Class becomes visible to students
       Students can now browse and enroll
```

**Database Changes**:
```sql
-- classes table
INSERT INTO classes (
  id, title, description, subject, grade,
  maxStudents, startDate, endDate, meetingLink,
  status, teacherId, createdAt
) VALUES (
  'ckl789...', 'Advanced Mathematics', '...',
  'Mathematics', 'Grade 10', 30,
  '2025-02-01', '2025-06-30', 'https://zoom.us/...',
  'DRAFT', 'ckl123...' -- teacher ID, NOW()
);
```

**Files Involved**:
- `frontend/components/teacher/teacher-dashboard.tsx`
- `backend/routes/classes.routes.js`
- `backend/controllers/class.controller.js`
- `backend/services/class.service.js`

---

### Flow 5: Teacher Creates Quiz

```
┌─────────────────────────────────────────────────────────────┐
│                  TEACHER CREATES QUIZ                       │
└─────────────────────────────────────────────────────────────┘

1. Frontend: Teacher opens class → "Quizzes" tab
   │
   ├─→ Component: components/teacher/quiz-management.tsx
   ├─→ Button: "Create New Quiz"
   │
2. Teacher fills quiz form
   │
   ├─→ Title: "Chapter 1 Quiz"
   ├─→ Description: "Test your understanding"
   ├─→ Class: Select from dropdown (class ID)
   ├─→ Duration: 30 minutes
   ├─→ Total Points: 100
   ├─→ Passing Score: 70
   ├─→ Start Time: 2025-02-01 09:00 AM
   ├─→ End Time: 2025-02-01 10:00 AM
   │
3. Teacher adds questions (array)
   │
   ├─→ Question 1:
   │   • Type: MULTIPLE_CHOICE
   │   • Question: "What is 2 + 2?"
   │   • Options: ["3", "4", "5", "6"]
   │   • Correct Answer: 1 (index)
   │   • Points: 10
   │   • Explanation: "Basic arithmetic"
   │
   ├─→ Question 2:
   │   • Type: TRUE_FALSE
   │   • Question: "The Earth is flat"
   │   • Options: ["True", "False"]
   │   • Correct Answer: 1 (False)
   │   • Points: 10
   │
   └─→ ... (up to N questions)
   │
4. Frontend: Submit quiz
   │
   ├─→ API Call: POST /api/quizzes
   │   Headers: { Authorization: "Bearer <teacher-token>" }
   │   Body: {
   │     classId,
   │     title, description,
   │     duration, totalPoints, passingScore,
   │     startTime, endTime,
   │     isActive: true,
   │     questions: [
   │       { type, question, options, correctAnswer, points, explanation },
   │       ...
   │     ]
   │   }
   │
5. Backend: Validation
   │
   ├─→ Middleware: authenticate + authorize('TEACHER')
   │
   ├─→ Middleware: validate(createQuizSchema)
   │   • Title: 3-100 chars
   │   • Duration: 1-480 minutes
   │   • Questions: at least 1
   │   • Each question: required fields
   │   • Total points validation
   │
6. Backend: Create Quiz Logic
   │
   ├─→ File: services/quiz.service.js
   ├─→ Method: createQuiz(teacherId, quizData)
   │
   ├─→ Step 1: Verify class ownership
   │   const classData = await prisma.class.findUnique({
   │     where: { id: classId }
   │   })
   │   if (classData.teacherId !== teacherId) {
   │     throw Error('You can only create quizzes for your classes')
   │   }
   │
   ├─→ Step 2: Database transaction
   │   const quiz = await prisma.$transaction(async (prisma) => {
   │     
   │     // Create quiz
   │     const newQuiz = await prisma.quiz.create({
   │       data: {
   │         classId, teacherId,
   │         title, description,
   │         duration, totalPoints, passingScore,
   │         startTime, endTime, isActive
   │       }
   │     })
   │     
   │     // Create questions
   │     const questionPromises = questions.map((q, index) =>
   │       prisma.quizQuestion.create({
   │         data: {
   │           quizId: newQuiz.id,
   │           type: q.type,
   │           question: q.question,
   │           options: q.options,
   │           correctAnswer: q.correctAnswer,
   │           points: q.points,
   │           explanation: q.explanation,
   │           order: index + 1
   │         }
   │       })
   │     )
   │     
   │     await Promise.all(questionPromises)
   │     
   │     return newQuiz
   │   })
   │
   ├─→ Step 3: Fetch complete quiz with questions
   │   const completeQuiz = await prisma.quiz.findUnique({
   │     where: { id: quiz.id },
   │     include: {
   │       questions: { orderBy: { order: 'asc' } },
   │       class: { select: { title: true } }
   │     }
   │   })
   │
7. Backend: Response
   │
   └─→ Status: 201 Created
       Body: {
         success: true,
         message: "Quiz created successfully",
         data: {
           id: "quiz123...",
           title: "Chapter 1 Quiz",
           duration: 30,
           totalPoints: 100,
           questionCount: 10,
           isActive: true,
           questions: [...] // Only for teacher view
         }
       }
   │
8. Frontend: Success
   │
   ├─→ Show notification: "Quiz created"
   ├─→ Navigate to quiz details
   ├─→ If isActive: Students can now see quiz
```

**Database Changes**:
```sql
-- quizzes table
INSERT INTO quizzes (id, classId, teacherId, title, duration, ...)
VALUES ('quiz123...', 'class789...', 'teacher456...', 'Chapter 1 Quiz', 30, ...);

-- quiz_questions table (multiple inserts)
INSERT INTO quiz_questions (id, quizId, type, question, options, correctAnswer, points, order)
VALUES 
  ('q1...', 'quiz123...', 'MULTIPLE_CHOICE', 'What is 2+2?', ['3','4','5','6'], 1, 10, 1),
  ('q2...', 'quiz123...', 'TRUE_FALSE', 'Earth is flat', ['True','False'], 1, 10, 2),
  ...
```

**Files Involved**:
- `frontend/components/teacher/quiz-management.tsx`
- `backend/routes/quizzes.routes.js`
- `backend/controllers/quiz.controller.js`
- `backend/services/quiz.service.js`

---

### Flow 6: Teacher Approves Student Enrollment

```
┌─────────────────────────────────────────────────────────────┐
│            TEACHER APPROVES STUDENT ENROLLMENT              │
└─────────────────────────────────────────────────────────────┘

1. Student enrolls in class (see Student Flow 7)
   │
   └─→ Enrollment status: PENDING
   │
2. Frontend: Teacher views pending enrollments
   │
   ├─→ Component: Class details page
   ├─→ Tab: "Enrollments"
   ├─→ Filter: status = PENDING
   │
   ├─→ API Call: GET /api/classes/{classId}/enrollments?status=PENDING
   │   Headers: { Authorization: "Bearer <teacher-token>" }
   │
3. Backend: Fetch Enrollments
   │
   ├─→ Service: class.service.js
   ├─→ Method: getClassEnrollments()
   │
   ├─→ Query:
   │   const enrollments = await prisma.enrollment.findMany({
   │     where: {
   │       classId,
   │       status: 'PENDING'
   │     },
   │     include: {
   │       user: {
   │         select: { id, name, email, profileImage },
   │         include: {
   │           studentProfile: { select: { grade, interests } }
   │         }
   │       }
   │     },
   │     orderBy: { enrolledAt: 'desc' }
   │   })
   │
4. Frontend: Display pending list
   │
   └─→ Shows: Student name, email, grade, enrollment date
       Actions: [Approve] [Reject] buttons
   │
5. Teacher clicks "Approve" button
   │
   ├─→ API Call: PATCH /api/classes/{classId}/enrollments/{enrollmentId}
   │   Headers: { Authorization: "Bearer <teacher-token>" }
   │   Body: { status: "APPROVED" }
   │
6. Backend: Update Enrollment
   │
   ├─→ Middleware: authenticate + authorize('TEACHER')
   │
   ├─→ Service: class.service.js
   ├─→ Method: updateEnrollmentStatus()
   │
   ├─→ Step 1: Verify ownership
   │   const classData = await prisma.class.findUnique({
   │     where: { id: classId }
   │   })
   │   if (classData.teacherId !== teacherId) {
   │     throw Error('Not your class')
   │   }
   │
   ├─→ Step 2: Check max students
   │   const currentCount = await prisma.enrollment.count({
   │     where: { classId, status: 'APPROVED' }
   │   })
   │   if (currentCount >= classData.maxStudents) {
   │     throw Error('Class is full')
   │   }
   │
   ├─→ Step 3: Update enrollment
   │   const updated = await prisma.enrollment.update({
   │     where: { id: enrollmentId },
   │     data: {
   │       status: 'APPROVED',
   │       approvedAt: new Date()
   │     }
   │   })
   │
   ├─→ Step 4: Send notification to student
   │   await emailService.sendEnrollmentApproved(student, classData)
   │
7. Backend: Response
   │
   └─→ Status: 200 OK
       Body: {
         success: true,
         message: "Enrollment status updated successfully",
         data: { enrollment with student info }
       }
   │
8. Frontend: Update UI
   │
   ├─→ Remove from pending list
   ├─→ Show success notification
   ├─→ Update enrollment count
   │
9. Student receives email
   │
   └─→ "You've been approved for Advanced Mathematics!"
       Student can now access class materials
```

**Files Involved**:
- `frontend/components/teacher/teacher-dashboard.tsx`
- `backend/routes/classes.routes.js`
- `backend/controllers/class.controller.js`
- `backend/services/class.service.js`
- `backend/services/email.service.js`

---

## Student Workflows

### Flow 7: Student Enrolls in Class

```
┌─────────────────────────────────────────────────────────────┐
│                STUDENT ENROLLS IN CLASS                     │
└─────────────────────────────────────────────────────────────┘

1. Frontend: Student browses available classes
   │
   ├─→ Component: components/student/student-dashboard.tsx
   ├─→ Section: "Browse Classes"
   │
   ├─→ API Call: GET /api/classes?status=ACTIVE
   │   Headers: { Authorization: "Bearer <student-token>" }
   │
2. Backend: Fetch Available Classes
   │
   ├─→ Service: class.service.js
   ├─→ Method: getClasses(userId, 'STUDENT', filters)
   │
   ├─→ Logic: Return only ACTIVE classes where:
   │   • Student is NOT already enrolled
   │   • Class has available spots
   │   • startDate hasn't passed (optional)
   │
   ├─→ Query:
   │   const classes = await prisma.class.findMany({
   │     where: {
   │       status: 'ACTIVE',
   │       enrollments: {
   │         none: { userId: studentId }  // Not enrolled
   │       }
   │     },
   │     include: {
   │       teacher: { select: { name, profileImage } },
   │       _count: { select: { enrollments: true } }
   │     }
   │   })
   │
3. Frontend: Display class cards
   │
   └─→ Shows: Title, teacher, subject, grade, spots available
       Button: "Enroll" (if has spots)
   │
4. Student clicks "Enroll" button
   │
   ├─→ Confirmation modal: "Enroll in Advanced Mathematics?"
   ├─→ Student confirms
   │
   ├─→ API Call: POST /api/classes/{classId}/enroll
   │   Headers: { Authorization: "Bearer <student-token>" }
   │   Body: {} (empty, uses student ID from token)
   │
5. Backend: Enrollment Logic
   │
   ├─→ Middleware: authenticate + authorize('STUDENT')
   │
   ├─→ Service: class.service.js
   ├─→ Method: enrollStudent(classId, studentId)
   │
   ├─→ Step 1: Verify class exists and is ACTIVE
   │   const classData = await prisma.class.findUnique({
   │     where: { id: classId }
   │   })
   │   if (!classData) throw Error('Class not found')
   │   if (classData.status !== 'ACTIVE') {
   │     throw Error('Class is not accepting enrollments')
   │   }
   │
   ├─→ Step 2: Check not already enrolled
   │   const existing = await prisma.enrollment.findUnique({
   │     where: {
   │       userId_classId: { userId: studentId, classId }
   │     }
   │   })
   │   if (existing) throw Error('Already enrolled')
   │
   ├─→ Step 3: Check class capacity
   │   if (classData.maxStudents) {
   │     const count = await prisma.enrollment.count({
   │       where: { classId, status: 'APPROVED' }
   │     })
   │     if (count >= classData.maxStudents) {
   │       throw Error('Class is full')
   │     }
   │   }
   │
   ├─→ Step 4: Create enrollment
   │   const enrollment = await prisma.enrollment.create({
   │     data: {
   │       userId: studentId,
   │       classId,
   │       status: 'PENDING',  // Requires teacher approval
   │       progress: 0,
   │       enrolledAt: new Date()
   │     },
   │     include: {
   │       class: {
   │         select: { title, teacher: { select: { name } } }
   │       }
   │     }
   │   })
   │
   ├─→ Step 5: Notify teacher
   │   await emailService.sendEnrollmentRequest(teacher, student, classData)
   │
6. Backend: Response
   │
   └─→ Status: 201 Created
       Body: {
         success: true,
         message: "Enrolled in class successfully",
         data: {
           enrollment: {
             id: "enroll123...",
             status: "PENDING",
             class: { title: "Advanced Mathematics" },
             enrolledAt: "2025-01-01T10:00:00Z"
           }
         }
       }
   │
7. Frontend: Success Handling
   │
   ├─→ Show notification: "Enrollment request sent!"
   ├─→ Badge: "Pending Approval"
   ├─→ Update UI: Button changes to "Pending"
   │
8. What happens next:
   │
   ├─→ Teacher receives email notification
   ├─→ Teacher reviews and approves/rejects
   ├─→ Student receives approval email
   └─→ Student can access class materials
```

**Database Changes**:
```sql
-- enrollments table
INSERT INTO enrollments (id, userId, classId, status, progress, enrolledAt)
VALUES ('enroll123...', 'student456...', 'class789...', 'PENDING', 0, NOW());
```

**Files Involved**:
- `frontend/components/student/student-dashboard.tsx`
- `backend/routes/classes.routes.js`
- `backend/controllers/class.controller.js`
- `backend/services/class.service.js`
- `backend/services/email.service.js`

---

### Flow 8: Student Takes Quiz

```
┌─────────────────────────────────────────────────────────────┐
│                   STUDENT TAKES QUIZ                        │
└─────────────────────────────────────────────────────────────┘

1. Frontend: Student views enrolled class
   │
   ├─→ Component: Class details page
   ├─→ Tab: "Quizzes"
   │
   ├─→ API Call: GET /api/quizzes?classId={classId}
   │   Headers: { Authorization: "Bearer <student-token>" }
   │
2. Backend: Fetch Available Quizzes
   │
   ├─→ Service: quiz.service.js
   ├─→ Method: getQuizzes(studentId, 'STUDENT', { classId })
   │
   ├─→ Logic: Return quizzes where:
   │   • Student is enrolled in class
   │   • Quiz is active (isActive = true)
   │   • Current time is within quiz window
   │
   ├─→ Query:
   │   const quizzes = await prisma.quiz.findMany({
   │     where: {
   │       classId,
   │       isActive: true,
   │       startTime: { lte: new Date() },
   │       endTime: { gte: new Date() }
   │     },
   │     include: {
   │       _count: { select: { attempts: true } }
   │     }
   │   })
   │   
   │   // Check if student already attempted
   │   const attempts = await prisma.quizAttempt.findMany({
   │     where: { userId: studentId, quizId: { in: quizIds } }
   │   })
   │
3. Frontend: Display quiz list
   │
   └─→ Shows: Quiz title, duration, points, due date
       Status: "Not Started" | "In Progress" | "Completed"
       Button: "Start Quiz" (if not started)
   │
4. Student clicks "Start Quiz"
   │
   ├─→ API Call: GET /api/quizzes/{quizId}
   │   Headers: { Authorization: "Bearer <student-token>" }
   │
5. Backend: Fetch Quiz Questions
   │
   ├─→ Service: quiz.service.js
   ├─→ Method: getQuizById(quizId, studentId, 'STUDENT')
   │
   ├─→ Step 1: Verify student is enrolled
   │   const enrollment = await prisma.enrollment.findFirst({
   │     where: {
   │       userId: studentId,
   │       classId: quiz.classId,
   │       status: 'APPROVED'
   │     }
   │   })
   │   if (!enrollment) throw Error('Not enrolled in class')
   │
   ├─→ Step 2: Check quiz is active and within time window
   │   if (!quiz.isActive) throw Error('Quiz not active')
   │   if (now < quiz.startTime || now > quiz.endTime) {
   │     throw Error('Quiz not available at this time')
   │   }
   │
   ├─→ Step 3: Check if already attempted
   │   const attempt = await prisma.quizAttempt.findFirst({
   │     where: { userId: studentId, quizId }
   │   })
   │   if (attempt) throw Error('Already attempted')
   │
   ├─→ Step 4: Return questions (WITHOUT correct answers)
   │   const questions = await prisma.quizQuestion.findMany({
   │     where: { quizId },
   │     select: {
   │       id: true,
   │       type: true,
   │       question: true,
   │       options: true,
   │       points: true,
   │       order: true,
   │       // correctAnswer: EXCLUDED for students!
   │     },
   │     orderBy: { order: 'asc' }
   │   })
   │
6. Frontend: Quiz Interface
   │
   ├─→ Component: components/student/quiz-interface.tsx
   │
   ├─→ Display:
   │   • Timer (countdown from duration)
   │   • Questions (one by one or all at once)
   │   • Radio buttons / checkboxes for options
   │   • Progress indicator
   │   • Navigation buttons
   │
   ├─→ State Management:
   │   const [answers, setAnswers] = useState({})
   │   const [timeRemaining, setTimeRemaining] = useState(duration * 60)
   │
7. Student answers questions
   │
   ├─→ Question 1: Selects option B
   │   answers['q1'] = 1  // index of selected option
   │
   ├─→ Question 2: Selects option A
   │   answers['q2'] = 0
   │
   └─→ ... continues for all questions
   │
8. Student clicks "Submit Quiz" (or timer expires)
   │
   ├─→ Confirmation: "Are you sure? You cannot change answers."
   ├─→ Student confirms
   │
   ├─→ API Call: POST /api/quizzes/{quizId}/submit
   │   Headers: { Authorization: "Bearer <student-token>" }
   │   Body: {
   │     answers: [
   │       { questionId: 'q1', selectedOption: 1 },
   │       { questionId: 'q2', selectedOption: 0 },
   │       ...
   │     ]
   │   }
   │
9. Backend: Grade Quiz
   │
   ├─→ Service: quiz.service.js
   ├─→ Method: submitQuizAttempt(quizId, studentId, answers)
   │
   ├─→ Step 1: Verify quiz still available
   │   const quiz = await prisma.quiz.findUnique({
   │     where: { id: quizId },
   │     include: { questions: true }
   │   })
   │
   ├─→ Step 2: Calculate score
   │   let totalScore = 0
   │   const results = []
   │   
   │   for (const answer of answers) {
   │     const question = quiz.questions.find(q => q.id === answer.questionId)
   │     const isCorrect = answer.selectedOption === question.correctAnswer
   │     
   │     if (isCorrect) {
   │       totalScore += question.points
   │     }
   │     
   │     results.push({
   │       questionId: question.id,
   │       selectedOption: answer.selectedOption,
   │       correctOption: question.correctAnswer,
   │       isCorrect,
   │       pointsAwarded: isCorrect ? question.points : 0
   │     })
   │   }
   │   
   │   const percentage = (totalScore / quiz.totalPoints) * 100
   │   const passed = totalScore >= quiz.passingScore
   │
   ├─→ Step 3: Save attempt to database
   │   const attempt = await prisma.quizAttempt.create({
   │     data: {
   │       userId: studentId,
   │       quizId,
   │       answers: results,  // JSON field
   │       score: totalScore,
   │       totalPoints: quiz.totalPoints,
   │       percentage,
   │       passed,
   │       submittedAt: new Date()
   │     }
   │   })
   │
   ├─→ Step 4: Update student profile stats
   │   await prisma.studentProfile.update({
   │     where: { userId: studentId },
   │     data: {
   │       totalQuizzes: { increment: 1 },
   │       totalScore: { increment: totalScore }
   │     }
   │   })
   │
10. Backend: Response
    │
    └─→ Status: 200 OK
        Body: {
          success: true,
          message: "Quiz submitted successfully",
          data: {
            score: 85,
            totalPoints: 100,
            percentage: 85,
            passed: true,
            correctAnswers: 8,
            totalQuestions: 10,
            results: [
              {
                questionId: 'q1',
                question: 'What is 2+2?',
                yourAnswer: 'B',
                correctAnswer: 'B',
                isCorrect: true,
                points: 10,
                explanation: 'Basic arithmetic'
              },
              ...
            ]
          }
        }
    │
11. Frontend: Results Page
    │
    ├─→ Component: Quiz results page
    │
    ├─→ Display:
    │   • Score: 85/100 (85%)
    │   • Status: ✅ PASSED (green) or ❌ FAILED (red)
    │   • Question-by-question breakdown
    │   • Explanations for each answer
    │   • Option to review quiz
    │
    └─→ Actions: "Back to Class" | "View Analytics"
```

**Database Changes**:
```sql
-- quiz_attempts table
INSERT INTO quiz_attempts (
  id, userId, quizId, score, totalPoints,
  percentage, passed, answers, submittedAt
) VALUES (
  'attempt123...', 'student456...', 'quiz789...',
  85, 100, 85.0, true,
  '[{"questionId":"q1","selectedOption":1,"isCorrect":true,...}]',
  NOW()
);

-- student_profiles table (update)
UPDATE student_profiles
SET totalQuizzes = totalQuizzes + 1,
    totalScore = totalScore + 85
WHERE userId = 'student456...';
```

**Files Involved**:
- `frontend/components/student/quiz-interface.tsx`
- `frontend/components/student/quiz-results.tsx`
- `backend/routes/quizzes.routes.js`
- `backend/controllers/quiz.controller.js`
- `backend/services/quiz.service.js`

---

### Flow 9: Student Views Notes

```
┌─────────────────────────────────────────────────────────────┐
│                  STUDENT VIEWS NOTES                        │
└─────────────────────────────────────────────────────────────┘

1. Frontend: Student navigates to class → "Notes" tab
   │
   ├─→ Component: components/student/notes-viewer.tsx
   │
   ├─→ API Call: GET /api/notes?classId={classId}
   │   Headers: { Authorization: "Bearer <student-token>" }
   │
2. Backend: Fetch Notes
   │
   ├─→ Service: note.service.js
   ├─→ Method: getNotes(studentId, 'STUDENT', { classId })
   │
   ├─→ Step 1: Verify student is enrolled
   │   const enrollment = await prisma.enrollment.findFirst({
   │     where: {
   │       userId: studentId,
   │       classId,
   │       status: 'APPROVED'
   │     }
   │   })
   │   if (!enrollment) throw Error('Not enrolled')
   │
   ├─→ Step 2: Fetch notes
   │   const notes = await prisma.note.findMany({
   │     where: {
   │       classId,
   │       OR: [
   │         { isPublic: true },  // Public notes
   │         { authorId: studentId }  // Own notes
   │       ]
   │     },
   │     include: {
   │       author: {
   │         select: { name, profileImage, role }
   │       }
   │     },
   │     orderBy: { createdAt: 'desc' }
   │   })
   │
3. Frontend: Display Notes List
   │
   └─→ Shows: Title, author, tags, created date
       Filter: By subject, tags
       Search: By title/content
       Button: "View Note"
   │
4. Student clicks "View Note"
   │
   ├─→ API Call: GET /api/notes/{noteId}
   │
5. Backend: Fetch Note Details
   │
   └─→ Returns: Full content, attachments, related files
   │
6. Frontend: Note Viewer
   │
   ├─→ Display: Markdown-rendered content
   ├─→ Actions: Download PDF, Print, Bookmark
   └─→ Related: Linked files, videos, external resources
```

**Files Involved**:
- `frontend/components/student/notes-viewer.tsx`
- `backend/routes/notes.routes.js`
- `backend/controllers/note.controller.js`
- `backend/services/note.service.js`

---

## Technical Flow Diagrams

### Authentication Flow (All Users)

```
┌────────────┐
│  Browser   │
└─────┬──────┘
      │ 1. POST /api/auth/login
      │    { email, password }
      ▼
┌─────────────────────────────────────┐
│         Express Backend             │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Middleware Chain            │  │
│  │  1. Rate limiting            │  │
│  │  2. Body parsing             │  │
│  │  3. Validation (Joi)         │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  Auth Controller             │  │
│  │  • Extract credentials       │  │
│  │  • Call auth service         │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  Auth Service                │  │
│  │  1. Find user (Prisma)       │  │
│  │  2. Verify password (bcrypt) │  │
│  │  3. Check active status      │  │
│  │  4. Generate JWT             │  │
│  │  5. Update lastLogin         │  │
│  └──────────┬───────────────────┘  │
└─────────────┼───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│         PostgreSQL                  │
│  SELECT * FROM users                │
│  WHERE email = $1                   │
│  UPDATE users SET lastLogin = NOW() │
└─────────────┬───────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│  Response to Browser                │
│  {                                  │
│    user: { id, name, email, role }, │
│    token: "eyJhbGc..."              │
│  }                                  │
└─────────────────────────────────────┘
```

### Protected Route Flow

```
┌────────────┐
│  Browser   │
└─────┬──────┘
      │ GET /api/classes
      │ Header: Authorization: Bearer <token>
      ▼
┌─────────────────────────────────────┐
│         Express Backend             │
│                                     │
│  ┌──────────────────────────────┐  │
│  │  Auth Middleware             │  │
│  │  1. Extract token            │  │
│  │  2. Verify JWT signature     │  │
│  │  3. Check Redis blacklist    │──┼─→ Redis
│  │  4. Load user from DB        │──┼─→ PostgreSQL
│  │  5. Attach to req.user       │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  Authorize Middleware        │  │
│  │  • Check req.user.role       │  │
│  │  • Match against allowed     │  │
│  │  • 403 if not authorized     │  │
│  └──────────┬───────────────────┘  │
│             │                       │
│             ▼                       │
│  ┌──────────────────────────────┐  │
│  │  Controller Logic            │  │
│  │  • Access req.user           │  │
│  │  • Call service methods      │  │
│  │  • Return response           │  │
│  └──────────────────────────────┘  │
└─────────────────────────────────────┘
```

---

## API Endpoint Reference

### Authentication Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| POST | `/api/auth/register` | ❌ | Public | Self-registration (students) |
| POST | `/api/auth/login` | ❌ | Public | User login |
| POST | `/api/auth/logout` | ✅ | All | Logout (blacklist token) |
| GET | `/api/auth/profile` | ✅ | All | Get own profile |
| PUT | `/api/auth/profile` | ✅ | All | Update own profile |
| POST | `/api/auth/change-password` | ✅ | All | Change password |
| POST | `/api/auth/forgot-password` | ❌ | Public | Request password reset |
| POST | `/api/auth/reset-password` | ❌ | Public | Reset password with token |
| POST | `/api/auth/create-user` | ✅ | Admin | Create teacher/student |

### Class Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/classes` | ✅ | All | List classes (filtered by role) |
| POST | `/api/classes` | ✅ | Teacher, Admin | Create new class |
| GET | `/api/classes/:id` | ✅ | All | Get class details |
| PATCH | `/api/classes/:id` | ✅ | Teacher (owner), Admin | Update class |
| DELETE | `/api/classes/:id` | ✅ | Teacher (owner), Admin | Delete class |
| POST | `/api/classes/:id/enroll` | ✅ | Student | Enroll in class |
| GET | `/api/classes/my-enrollments` | ✅ | Student | Get my enrollments |
| GET | `/api/classes/:id/enrollments` | ✅ | Teacher, Admin | List enrollments |
| PATCH | `/api/classes/:id/enrollments/:enrollmentId` | ✅ | Teacher, Admin | Approve/reject enrollment |

### Quiz Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/quizzes` | ✅ | All | List quizzes (filtered by role) |
| POST | `/api/quizzes` | ✅ | Teacher, Admin | Create quiz |
| GET | `/api/quizzes/:id` | ✅ | All | Get quiz details |
| PATCH | `/api/quizzes/:id` | ✅ | Teacher (owner), Admin | Update quiz |
| DELETE | `/api/quizzes/:id` | ✅ | Teacher (owner), Admin | Delete quiz |
| POST | `/api/quizzes/:id/submit` | ✅ | Student | Submit quiz attempt |
| GET | `/api/quizzes/:id/attempts` | ✅ | Teacher, Admin | View all attempts |
| GET | `/api/quizzes/my-attempts` | ✅ | Student | View my attempts |
| GET | `/api/quizzes/:id/statistics` | ✅ | Teacher, Admin | Quiz statistics |

### File Endpoints

| Method | Endpoint | Auth | Role | Description |
|--------|----------|------|------|-------------|
| GET | `/api/files` | ✅ | All | List files (filtered by access) |
| POST | `/api/files` | ✅ | All | Upload file |
| GET | `/api/files/:id` | ✅ | All | Get file details |
| DELETE | `/api/files/:id` | ✅ | Owner, Admin | Delete file |
| GET | `/api/files/:id/download` | ✅ | All | Download file |

---

## Database Interactions

### Common Prisma Patterns

#### 1. Simple Query
```javascript
// Find user by email
const user = await prisma.user.findUnique({
  where: { email: 'student@example.com' }
});
```

#### 2. Query with Relations
```javascript
// Get class with teacher and enrollments
const classData = await prisma.class.findUnique({
  where: { id: classId },
  include: {
    teacher: {
      select: { id, name, email }
    },
    enrollments: {
      where: { status: 'APPROVED' },
      include: {
        user: { select: { name, email } }
      }
    }
  }
});
```

#### 3. Transaction (Atomic Operations)
```javascript
// Create user with profile (all or nothing)
const user = await prisma.$transaction(async (prisma) => {
  const newUser = await prisma.user.create({
    data: { name, email, password, role: 'TEACHER' }
  });
  
  await prisma.teacherProfile.create({
    data: { userId: newUser.id, specialization }
  });
  
  return newUser;
});
```

#### 4. Aggregation
```javascript
// Count students by grade
const stats = await prisma.studentProfile.groupBy({
  by: ['grade'],
  _count: true
});
```

---

## Common Patterns

### Pattern 1: Request Flow
```
User Action → Frontend Component → API Call → 
Backend Route → Middleware Chain → Controller → 
Service → Database → Response → Frontend Update
```

### Pattern 2: Error Handling
```javascript
// Controllers always use try-catch
try {
  const result = await service.method();
  successResponse(res, result, 'Success message');
} catch (error) {
  next(error);  // Pass to error middleware
}
```

### Pattern 3: Authorization Check
```javascript
// Service method checks ownership
if (resource.ownerId !== userId && userRole !== 'ADMIN') {
  throw new Error('Not authorized');
}
```

### Pattern 4: Pagination
```javascript
// Controller extracts pagination
const { page = 1, limit = 10 } = req.query;

// Service calculates skip/take
const skip = (page - 1) * limit;
const items = await prisma.model.findMany({
  skip,
  take: limit
});

// Return with pagination info
return {
  items,
  pagination: {
    page,
    limit,
    total: await prisma.model.count(),
    pages: Math.ceil(total / limit)
  }
};
```

---

## Getting Started as a Contributor

### 1. Setup Development Environment

```bash
# Clone repository
git clone <repository-url>
cd EduTech

# Install backend dependencies
cd backend
npm install

# Setup environment variables
cp .env.example .env
# Edit .env with your credentials

# Run database migrations
npx prisma migrate dev

# Start backend
npm run dev

# In another terminal, start frontend
cd ../frontend
npm install
npm run dev
```

### 2. Understanding the Codebase

**Start with these files**:
1. `backend/src/app.js` - See how everything connects
2. `backend/src/routes/` - Understand API endpoints
3. `backend/src/services/` - Business logic
4. `frontend/lib/api.ts` - Frontend API calls
5. `frontend/components/` - UI components

### 3. Making Changes

**Workflow**:
1. Create feature branch: `git checkout -b feature/my-feature`
2. Make changes (follow existing patterns)
3. Test locally
4. Commit: `git commit -m "feat: add feature"`
5. Push: `git push origin feature/my-feature`
6. Create pull request

### 4. Testing Your Changes

**Backend**:
```bash
# Run tests
npm test

# Test specific endpoint
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@edutech.com","password":"admin123"}'
```

**Frontend**:
- Open browser to `http://localhost:3000`
- Check console for errors
- Test user flows manually

---

## Need Help?

**Questions about**:
- Authentication? → Check `backend/EXPLAIN_CONTROLLERS.md` (Auth section)
- Database? → Check `backend/EXPLAIN_OVERVIEW.md` (Database Schema)
- API endpoints? → Check this file (API Reference section)
- Specific feature? → Check relevant flow in this document

**Common Issues**:
- 401 Unauthorized → Check token in headers
- 403 Forbidden → Check user role permissions
- 404 Not Found → Check API endpoint URL
- 500 Server Error → Check backend logs

---

**Document Version**: 1.0  
**Last Updated**: 2025-01-01  
**Maintained by**: EduTech Development Team
