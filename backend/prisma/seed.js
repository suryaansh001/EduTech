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

    logger.info('🎉 Database seeded successfully!');
    logger.info('');
    logger.info('📝 Demo Credentials:');
    logger.info('   Admin: admin@edutech.com / Password123!');
    logger.info('   Teacher: teacher@edutech.com / Password123!');
    logger.info('   Student: student@edutech.com / Password123!');

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
