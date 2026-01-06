/**
 * Test Mode - Frontend Demo Data
 * 
 * This module provides mock authentication and data for testing the UI
 * without a backend server. Useful for development and UI testing.
 * 
 * To enable test mode:
 * - Set TEST_MODE = true in this file
 * - Mock credentials will be available on the login screen
 */

export const TEST_MODE = true; // Set to true to enable test mode

export const DEMO_CREDENTIALS = {
  admin: {
    email: 'admin@edutech.com',
    password: 'Password123!',
    role: 'admin',
  },
  teacher: {
    email: 'teacher@edutech.com',
    password: 'Password123!',
    role: 'teacher',
  },
  student: {
    email: 'student@edutech.com',
    password: 'Password123!',
    role: 'student',
  },
};

export interface TestUser {
  id: string;
  name: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'admin' | 'teacher' | 'student';
  profileImage?: string;
  avatar?: string;
  phone: string;
  bio: string;
  batchId?: string;
  isFirstLogin: boolean;
  createdAt: string;
}

export interface TestClass {
  id: string;
  title: string;
  description: string;
  subject: string;
  grade: string;
  maxStudents: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  startDate: string;
  endDate: string;
  teacherId: string;
  teacherName: string;
}

export interface TestQuiz {
  id: string;
  title: string;
  description: string;
  classId: string;
  timeLimit: number;
  totalMarks: number;
  isActive: boolean;
  questions: TestQuestion[];
}

export interface TestQuestion {
  id: string;
  type: 'MULTIPLE_CHOICE' | 'TRUE_FALSE' | 'SHORT_ANSWER';
  question: string;
  options: string[];
  correctAnswer: string;
  marks: number;
  order: number;
}

export interface TestNote {
  id: string;
  title: string;
  content: string;
  subject: string;
  tags: string[];
  isPublic: boolean;
  classId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

export interface TestAnnouncement {
  id: string;
  title: string;
  content: string;
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  isActive: boolean;
  classId: string;
  authorId: string;
  authorName: string;
  createdAt: string;
}

// Mock Users
export const TEST_USERS = {
  admin: {
    id: '1',
    name: 'System Administrator',
    firstName: 'System',
    lastName: 'Administrator',
    email: 'admin@edutech.com',
    role: 'admin',
    phone: '+1234567890',
    bio: 'System Administrator',
    isFirstLogin: false,
    createdAt: new Date().toISOString(),
  } as TestUser,
  teacher: {
    id: '2',
    name: 'John Teacher',
    firstName: 'John',
    lastName: 'Teacher',
    email: 'teacher@edutech.com',
    role: 'teacher',
    phone: '+1234567891',
    bio: 'Mathematics Teacher with 5 years of experience',
    isFirstLogin: false,
    createdAt: new Date().toISOString(),
  } as TestUser,
  student: {
    id: '3',
    name: 'Jane Student',
    firstName: 'Jane',
    lastName: 'Student',
    email: 'student@edutech.com',
    role: 'student',
    batchId: 'batch1',
    phone: '+1234567892',
    bio: 'High School Student passionate about learning',
    isFirstLogin: false,
    createdAt: new Date().toISOString(),
  } as TestUser,
};

// Mock Classes
export const TEST_CLASSES: TestClass[] = [
  {
    id: 'class1',
    title: 'Introduction to Mathematics',
    description: 'A comprehensive introduction to basic mathematical concepts including algebra, geometry, and statistics.',
    subject: 'Mathematics',
    grade: '10th Grade',
    maxStudents: 30,
    status: 'ACTIVE',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
    teacherId: '2',
    teacherName: 'John Teacher',
  },
  {
    id: 'class2',
    title: 'General Science',
    description: 'Explore the fundamentals of physics, chemistry, and biology. Hands-on experiments and interactive learning.',
    subject: 'Science',
    grade: '10th Grade',
    maxStudents: 35,
    status: 'ACTIVE',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000).toISOString(),
    teacherId: '2',
    teacherName: 'John Teacher',
  },
  {
    id: 'class3',
    title: 'English Literature',
    description: 'Study classic and contemporary literature, develop critical thinking and analytical skills.',
    subject: 'English',
    grade: '10th Grade',
    maxStudents: 30,
    status: 'ACTIVE',
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000).toISOString(),
    teacherId: '2',
    teacherName: 'John Teacher',
  },
];

// Mock Quizzes
export const TEST_QUIZZES: TestQuiz[] = [
  {
    id: 'quiz1',
    title: 'Basic Algebra Quiz',
    description: 'Test your knowledge of basic algebra concepts',
    classId: 'class1',
    timeLimit: 30,
    totalMarks: 20,
    isActive: true,
    questions: [
      {
        id: 'q1',
        type: 'MULTIPLE_CHOICE',
        question: 'What is the value of x in the equation 2x + 5 = 15?',
        options: ['3', '5', '7', '10'],
        correctAnswer: '5',
        marks: 5,
        order: 1,
      },
      {
        id: 'q2',
        type: 'TRUE_FALSE',
        question: 'The square root of 16 is 4.',
        options: ['True', 'False'],
        correctAnswer: 'True',
        marks: 5,
        order: 2,
      },
      {
        id: 'q3',
        type: 'MULTIPLE_CHOICE',
        question: 'Simplify: 3(x + 2) - 2x',
        options: ['x + 6', 'x + 2', '5x + 6', '5x + 2'],
        correctAnswer: 'x + 6',
        marks: 5,
        order: 3,
      },
      {
        id: 'q4',
        type: 'MULTIPLE_CHOICE',
        question: 'What is 15% of 200?',
        options: ['15', '20', '30', '35'],
        correctAnswer: '30',
        marks: 5,
        order: 4,
      },
    ],
  },
  {
    id: 'quiz2',
    title: 'Physics Basics Quiz',
    description: 'Test your understanding of fundamental physics concepts',
    classId: 'class2',
    timeLimit: 40,
    totalMarks: 25,
    isActive: true,
    questions: [
      {
        id: 'q5',
        type: 'MULTIPLE_CHOICE',
        question: 'What is the SI unit of force?',
        options: ['Watt', 'Newton', 'Joule', 'Pascal'],
        correctAnswer: 'Newton',
        marks: 5,
        order: 1,
      },
      {
        id: 'q6',
        type: 'MULTIPLE_CHOICE',
        question: 'Which of the following is NOT a type of energy?',
        options: ['Kinetic', 'Potential', 'Thermal', 'Temporal'],
        correctAnswer: 'Temporal',
        marks: 5,
        order: 2,
      },
    ],
  },
];

// Mock Notes
export const TEST_NOTES: TestNote[] = [
  {
    id: 'note1',
    title: 'Chapter 1: Introduction to Algebra',
    content: `# Introduction to Algebra

## What is Algebra?
Algebra is a branch of mathematics that deals with symbols and the rules for manipulating those symbols.

## Key Concepts
1. **Variables**: Letters that represent unknown values (x, y, z)
2. **Constants**: Fixed values (numbers like 1, 2, 3)
3. **Expressions**: Combinations of variables and constants
4. **Equations**: Mathematical statements showing equality

## Basic Operations
- Addition and Subtraction
- Multiplication and Division
- Order of Operations (PEMDAS)

## Practice Problems
1. Solve for x: x + 5 = 12
2. Simplify: 3x + 2x
3. Evaluate: 2(x + 3) when x = 4`,
    subject: 'Mathematics',
    tags: ['algebra', 'basics', 'introduction'],
    isPublic: true,
    classId: 'class1',
    authorId: '2',
    authorName: 'John Teacher',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'note2',
    title: 'Chapter 1: Laws of Motion',
    content: `# Newton's Laws of Motion

## First Law of Motion
An object at rest stays at rest, and an object in motion stays in motion unless acted upon by a net force.

## Second Law of Motion
Force equals mass times acceleration (F = ma)

## Third Law of Motion
For every action, there is an equal and opposite reaction.

## Key Formulas
- Velocity: v = u + at
- Distance: s = ut + 1/2 at²
- Force: F = ma`,
    subject: 'Physics',
    tags: ['physics', 'motion', 'newton'],
    isPublic: true,
    classId: 'class2',
    authorId: '2',
    authorName: 'John Teacher',
    createdAt: new Date().toISOString(),
  },
];

// Mock Announcements
export const TEST_ANNOUNCEMENTS: TestAnnouncement[] = [
  {
    id: 'ann1',
    title: 'Welcome to the Class!',
    content: 'Welcome to Introduction to Mathematics! Please review the syllabus and complete the first quiz by the end of this week.',
    priority: 'HIGH',
    isActive: true,
    classId: 'class1',
    authorId: '2',
    authorName: 'John Teacher',
    createdAt: new Date().toISOString(),
  },
  {
    id: 'ann2',
    title: 'Science Experiment This Week',
    content: 'We will be conducting an exciting experiment on Laws of Motion this Thursday. Please come prepared with your lab coats.',
    priority: 'HIGH',
    isActive: true,
    classId: 'class2',
    authorId: '2',
    authorName: 'John Teacher',
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

/**
 * Validate demo credentials
 */
export const validateTestCredentials = (
  email: string,
  password: string
): { valid: boolean; user?: TestUser; role?: string } => {
  if (!TEST_MODE) {
    return { valid: false };
  }

  const credentials = Object.entries(DEMO_CREDENTIALS).find(
    ([_, cred]) => cred.email === email && cred.password === password
  );

  if (credentials) {
    const [role] = credentials;
    return {
      valid: true,
      user: TEST_USERS[role as keyof typeof TEST_USERS],
      role,
    };
  }

  return { valid: false };
};

/**
 * Get mock API response
 */
export const getMockApiResponse = (endpoint: string, method: string = 'GET') => {
  if (!TEST_MODE) {
    return null;
  }

  // Example: /classes
  if (endpoint === '/classes' && method === 'GET') {
    return {
      success: true,
      data: { classes: TEST_CLASSES, pagination: { total: TEST_CLASSES.length } },
      message: 'Classes retrieved successfully',
    };
  }

  // Add more mock endpoints as needed
  return null;
};
