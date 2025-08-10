import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt.utils.js';
import { logger } from '../src/utils/logger.utils.js';

const prisma = new PrismaClient();

async function main() {
  try {
    // Create default admin user
    const adminExists = await prisma.user.findUnique({
      where: { email: 'admin@edutech.com' }
    });

    if (!adminExists) {
      const hashedPassword = await hashPassword('admin123');
      
      const admin = await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: 'admin@edutech.com',
          password: hashedPassword,
          role: 'ADMIN',
          phone: '+1234567890',
          bio: 'System Administrator',
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
      const hashedPassword = await hashPassword('teacher123');
      
      const teacher = await prisma.$transaction(async (prisma) => {
        const newTeacher = await prisma.user.create({
          data: {
            name: 'John Teacher',
            email: 'teacher@edutech.com',
            password: hashedPassword,
            role: 'TEACHER',
            phone: '+1234567891',
            bio: 'Mathematics Teacher',
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
      const hashedPassword = await hashPassword('student123');
      
      const student = await prisma.$transaction(async (prisma) => {
        const newStudent = await prisma.user.create({
          data: {
            name: 'Jane Student',
            email: 'student@edutech.com',
            password: hashedPassword,
            role: 'STUDENT',
            phone: '+1234567892',
            bio: 'High School Student',
            isFirstLogin: false,
            isActive: true
          }
        });

        await prisma.studentProfile.create({
          data: {
            userId: newStudent.id,
            grade: '10th Grade',
            interests: ['Mathematics', 'Science'],
            learningGoals: 'Excel in STEM subjects'
          }
        });

        return newStudent;
      });

      logger.info('✅ Sample student user created:', student.email);
    }

    logger.info('🎉 Database seeded successfully!');

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
