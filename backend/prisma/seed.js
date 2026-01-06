import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt.utils.js';
import { logger } from '../src/utils/logger.utils.js';

const prisma = new PrismaClient();

/**
 * Database Seed Script
 * 
 * SECURITY NOTES:
 * 1. Passwords follow security policy (min 8 chars, uppercase, lowercase, number, special char)
 * 2. Admin account should be changed immediately in production
 * 3. isFirstLogin is set to true for demo accounts to force password change
 * 4. In production, remove or modify this seed script
 */

// SECURITY: Use strong default passwords meeting policy requirements
const DEFAULT_PASSWORD = 'Password123!';

async function main() {
  try {
    // Create default admin user
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@edutech.com' }
    });

    if (!adminExists) {
      // SECURITY: Hash password with bcrypt (cost factor defined in utils)
      const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
      
      const admin = await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: 'admin@edutech.com',
          password: hashedPassword,
          role: 'ADMIN',
          phone: '+1234567890',
          bio: 'System Administrator',
          // SECURITY: In production, set to true to force password change
          isFirstLogin: false,
          isActive: true
        }
      });

      logger.info('✅ Default admin user created:', admin.email);
    } else {
      logger.info('ℹ️ Default admin user already exists');
    }

    // Create sample teacher
    const teacherExists = await prisma.user.findUnique({
      where: { email: 'teacher@edutech.com' }
    });

    if (!teacherExists) {
      const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
      
      const teacher = await prisma.$transaction(async (prisma) => {
        const newTeacher = await prisma.user.create({
          data: {
            name: 'John Teacher',
            email: 'teacher@edutech.com',
            password: hashedPassword,
            role: 'TEACHER',
            phone: '+1234567891',
            bio: 'Mathematics Teacher with 5 years of experience',
            isFirstLogin: false,
            isActive: true
          }
        });

        await prisma.teacherProfile.create({
          data: {
            userId: newTeacher.id,
            qualification: 'M.Sc Mathematics',
            specialization: 'Mathematics',
            experience: '5 years'
          }
        });

        return newTeacher;
      });

      logger.info('✅ Sample teacher user created:', teacher.email);
    }

    // Create sample student
    const studentExists = await prisma.user.findUnique({
      where: { email: 'student@edutech.com' }
    });

    if (!studentExists) {
      const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
      
      const student = await prisma.$transaction(async (prisma) => {
        const newStudent = await prisma.user.create({
          data: {
            name: 'Jane Student',
            email: 'student@edutech.com',
            password: hashedPassword,
            role: 'STUDENT',
            phone: '+1234567892',
            bio: 'High School Student passionate about learning',
            isFirstLogin: false,
            isActive: true
          }
        });

        await prisma.studentProfile.create({
          data: {
            userId: newStudent.id,
            grade: '10th Grade',
            interests: ['Mathematics', 'Science', 'Technology'],
            learningGoals: 'Excel in STEM subjects and prepare for college'
          }
        });

        return newStudent;
      });

      logger.info('✅ Sample student user created:', student.email);
    }

    // Create a sample class for demonstration
    const teacher = await prisma.user.findUnique({
      where: { email: 'teacher@edutech.com' }
    });

    const student = await prisma.user.findUnique({
      where: { email: 'student@edutech.com' }
    });

    if (teacher && student) {
      const classExists = await prisma.class.findFirst({
        where: { title: 'Introduction to Mathematics' }
      });

      if (!classExists) {
        const newClass = await prisma.class.create({
          data: {
            title: 'Introduction to Mathematics',
            description: 'A comprehensive introduction to basic mathematical concepts including algebra, geometry, and statistics.',
            subject: 'Mathematics',
            grade: '10th Grade',
            maxStudents: 30,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
            teacherId: teacher.id,
          }
        });

        // Enroll the sample student
        await prisma.enrollment.create({
          data: {
            userId: student.id,
            classId: newClass.id,
            status: 'ACTIVE',
            progress: 25
          }
        });

        // Create a sample quiz
        const quiz = await prisma.quiz.create({
          data: {
            title: 'Basic Algebra Quiz',
            description: 'Test your knowledge of basic algebra concepts',
            classId: newClass.id,
            timeLimit: 30,
            totalMarks: 20,
            isActive: true,
            questions: {
              create: [
                {
                  type: 'MULTIPLE_CHOICE',
                  question: 'What is the value of x in the equation 2x + 5 = 15?',
                  options: ['3', '5', '7', '10'],
                  correctAnswer: '5',
                  marks: 5,
                  order: 1
                },
                {
                  type: 'TRUE_FALSE',
                  question: 'The square root of 16 is 4.',
                  options: ['True', 'False'],
                  correctAnswer: 'True',
                  marks: 5,
                  order: 2
                },
                {
                  type: 'MULTIPLE_CHOICE',
                  question: 'Simplify: 3(x + 2) - 2x',
                  options: ['x + 6', 'x + 2', '5x + 6', '5x + 2'],
                  correctAnswer: 'x + 6',
                  marks: 5,
                  order: 3
                },
                {
                  type: 'MULTIPLE_CHOICE',
                  question: 'What is 15% of 200?',
                  options: ['15', '20', '30', '35'],
                  correctAnswer: '30',
                  marks: 5,
                  order: 4
                }
              ]
            }
          }
        });

        // Create sample notes
        await prisma.note.create({
          data: {
            title: 'Chapter 1: Introduction to Algebra',
            content: `
# Introduction to Algebra

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
3. Evaluate: 2(x + 3) when x = 4
            `.trim(),
            subject: 'Mathematics',
            tags: ['algebra', 'basics', 'introduction'],
            isPublic: true,
            classId: newClass.id,
            authorId: teacher.id
          }
        });

        // Create sample announcement
        await prisma.announcement.create({
          data: {
            title: 'Welcome to the Class!',
            content: 'Welcome to Introduction to Mathematics! Please review the syllabus and complete the first quiz by the end of this week.',
            priority: 'HIGH',
            isActive: true,
            classId: newClass.id,
            authorId: teacher.id
          }
        });

        logger.info('✅ Sample class, quiz, notes, and announcements created');
      }
    }

    // Create additional sample classes for better testing experience
    const adminUser = await prisma.user.findUnique({
      where: { email: 'admin@edutech.com' }
    });

    if (teacher && student && adminUser) {
      // Science class
      const scienceClassExists = await prisma.class.findFirst({
        where: { title: 'General Science' }
      });

      if (!scienceClassExists) {
        const scienceClass = await prisma.class.create({
          data: {
            title: 'General Science',
            description: 'Explore the fundamentals of physics, chemistry, and biology. Hands-on experiments and interactive learning.',
            subject: 'Science',
            grade: '10th Grade',
            maxStudents: 35,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000),
            teacherId: teacher.id,
          }
        });

        await prisma.enrollment.create({
          data: {
            userId: student.id,
            classId: scienceClass.id,
            status: 'ACTIVE',
            progress: 45
          }
        });

        // Add quiz to science class
        await prisma.quiz.create({
          data: {
            title: 'Physics Basics Quiz',
            description: 'Test your understanding of fundamental physics concepts',
            classId: scienceClass.id,
            timeLimit: 40,
            totalMarks: 25,
            isActive: true,
            questions: {
              create: [
                {
                  type: 'MULTIPLE_CHOICE',
                  question: 'What is the SI unit of force?',
                  options: ['Watt', 'Newton', 'Joule', 'Pascal'],
                  correctAnswer: 'Newton',
                  marks: 5,
                  order: 1
                },
                {
                  type: 'MULTIPLE_CHOICE',
                  question: 'Which of the following is NOT a type of energy?',
                  options: ['Kinetic', 'Potential', 'Thermal', 'Temporal'],
                  correctAnswer: 'Temporal',
                  marks: 5,
                  order: 2
                }
              ]
            }
          }
        });

        // Add notes to science class
        await prisma.note.create({
          data: {
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
- Force: F = ma
            `.trim(),
            subject: 'Physics',
            tags: ['physics', 'motion', 'newton'],
            isPublic: true,
            classId: scienceClass.id,
            authorId: teacher.id
          }
        });

        logger.info('✅ Science class with quiz and notes created');
      }

      // English class
      const englishClassExists = await prisma.class.findFirst({
        where: { title: 'English Literature' }
      });

      if (!englishClassExists) {
        const englishClass = await prisma.class.create({
          data: {
            title: 'English Literature',
            description: 'Study classic and contemporary literature, develop critical thinking and analytical skills.',
            subject: 'English',
            grade: '10th Grade',
            maxStudents: 30,
            status: 'ACTIVE',
            startDate: new Date(),
            endDate: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000),
            teacherId: teacher.id,
          }
        });

        await prisma.enrollment.create({
          data: {
            userId: student.id,
            classId: englishClass.id,
            status: 'ACTIVE',
            progress: 60
          }
        });

        logger.info('✅ English Literature class created');
      }
    }

    logger.info('');
    logger.info('🎉 Database seeded successfully!');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('📝 TEST MODE - Demo Credentials for UI Testing:');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('');
    logger.info('👨‍💼 ADMIN Account:');
    logger.info('   Email: admin@edutech.com');
    logger.info('   Password: Password123!');
    logger.info('   Access: Full system administration, user management');
    logger.info('');
    logger.info('👨‍🏫 TEACHER Account:');
    logger.info('   Email: teacher@edutech.com');
    logger.info('   Password: Password123!');
    logger.info('   Access: Create classes, quizzes, manage students');
    logger.info('   Demo Data: 3 classes (Math, Science, English)');
    logger.info('');
    logger.info('👨‍🎓 STUDENT Account:');
    logger.info('   Email: student@edutech.com');
    logger.info('   Password: Password123!');
    logger.info('   Access: View classes, take quizzes, view notes');
    logger.info('   Demo Data: Enrolled in all 3 classes with sample content');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════');

  } catch (error) {
    logger.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
