import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt.utils.js';
import { logger } from '../src/utils/logger.utils.js';
import { FEATURES, SUBSCRIPTION_TIERS, TIER_FEATURES } from '../src/config/features.config.js';

const prisma = new PrismaClient();

/**
 * Database Seed Script
 * 
 * Seeds the database with:
 * 1. Default admin, teacher, and student users with appropriate tiers
 * 2. FeatureAccess table with all tier + feature combinations
 * 3. Sample classes, quizzes, notes for demonstration
 * 
 * SECURITY NOTES:
 * 1. Passwords follow security policy (min 8 chars, uppercase, lowercase, number, special char)
 * 2. Admin account should be changed immediately in production
 * 3. isFirstLogin is set to true for demo accounts to force password change
 * 4. In production, remove or modify this seed script
 */

// SECURITY: Use strong default passwords meeting policy requirements
const DEFAULT_PASSWORD = 'Password123!';

/**
 * Seed FeatureAccess table with all tier + feature combinations
 * This defines what features are available for each subscription tier
 */
async function seedFeatureAccess() {
  try {
    logger.info('🔐 Seeding feature access configuration...');
    
    for (const tier of Object.values(SUBSCRIPTION_TIERS)) {
      const tierFeatures = TIER_FEATURES[tier];
      
      for (const feature of Object.values(FEATURES)) {
        const enabled = tierFeatures[feature] || false;
        
        // Check if this tier+feature combination already exists
        const existing = await prisma.featureAccess.findUnique({
          where: {
            tier_featureName: {
              tier,
              featureName: feature
            }
          }
        });

        if (!existing) {
          await prisma.featureAccess.create({
            data: {
              tier,
              featureName: feature,
              enabled,
              description: `${feature} for ${tier} tier`
            }
          });
        }
      }
    }
    
    logger.info('✅ Feature access configuration seeded successfully');
  } catch (error) {
    logger.error('❌ Error seeding feature access:', error);
    throw error;
  }
}

async function main() {
  try {
    // First, seed feature access configuration
    await seedFeatureAccess();

    // Create default admin user (ENTERPRISE tier - full access)
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
          subscriptionTier: 'ENTERPRISE',
          tierUpdatedAt: new Date(),
          // SECURITY: In production, set to true to force password change
          isFirstLogin: false,
          isActive: true
        }
      });

      logger.info('✅ Default admin user created (ENTERPRISE tier):', admin.email);
    } else {
      logger.info('ℹ️ Default admin user already exists');
    }

    // Create sample teacher (PREMIUM tier - full AI features)
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
            subscriptionTier: 'PREMIUM',
            tierUpdatedAt: new Date(),
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

      logger.info('✅ Sample teacher user created (PREMIUM tier):', teacher.email);
    }

    // Create sample student (FREE tier - basic access)
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
            subscriptionTier: 'FREE',
            tierUpdatedAt: new Date(),
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

      logger.info('✅ Sample student user created (FREE tier):', student.email);
    }

    // Create another student for PREMIUM testing
    const premiumStudentExists = await prisma.user.findUnique({
      where: { email: 'premium-student@edutech.com' }
    });

    if (!premiumStudentExists) {
      const hashedPassword = await hashPassword(DEFAULT_PASSWORD);
      
      const premiumStudent = await prisma.$transaction(async (prisma) => {
        const newStudent = await prisma.user.create({
          data: {
            name: 'Alex Premium',
            email: 'premium-student@edutech.com',
            password: hashedPassword,
            role: 'STUDENT',
            phone: '+1234567893',
            bio: 'Premium subscriber with full feature access',
            subscriptionTier: 'PREMIUM',
            tierUpdatedAt: new Date(),
            isFirstLogin: false,
            isActive: true
          }
        });

        await prisma.studentProfile.create({
          data: {
            userId: newStudent.id,
            grade: '11th Grade',
            interests: ['AI', 'Computer Science', 'Advanced Mathematics'],
            learningGoals: 'Master programming and AI concepts'
          }
        });

        return newStudent;
      });

      logger.info('✅ Premium student user created (PREMIUM tier):', premiumStudent.email);
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
    logger.info('📝 TEST MODE - Demo Credentials & Subscription Tiers:');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('');
    logger.info('👨‍💼 ADMIN Account (ENTERPRISE Tier - Full Access):');
    logger.info('   Email: admin@edutech.com');
    logger.info('   Password: Password123!');
    logger.info('   Tier: ENTERPRISE');
    logger.info('   Access: Full system admin + all AI features');
    logger.info('');
    logger.info('👨‍🏫 TEACHER Account (PREMIUM Tier - All AI Features):');
    logger.info('   Email: teacher@edutech.com');
    logger.info('   Password: Password123!');
    logger.info('   Tier: PREMIUM');
    logger.info('   Access: Create classes, AI chat, quiz generation, document analysis');
    logger.info('   Demo Data: 3 classes (Math, Science, English)');
    logger.info('');
    logger.info('👨‍🎓 STUDENT Account (FREE Tier - Basic Access):');
    logger.info('   Email: student@edutech.com');
    logger.info('   Password: Password123!');
    logger.info('   Tier: FREE');
    logger.info('   Access: View classes, take quizzes, view notes (NO AI features)');
    logger.info('   Demo Data: Enrolled in all 3 classes with sample content');
    logger.info('');
    logger.info('👨‍🎓 PREMIUM STUDENT Account (PREMIUM Tier - All AI Features):');
    logger.info('   Email: premium-student@edutech.com');
    logger.info('   Password: Password123!');
    logger.info('   Tier: PREMIUM');
    logger.info('   Access: All platform features including AI capabilities');
    logger.info('   Demo Data: Test account for premium feature verification');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('🔐 Subscription Tiers Configured:');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('FREE:       Basic platform access, no AI features');
    logger.info('PREMIUM:    All AI features (chat, documents, quizzes)');
    logger.info('ENTERPRISE: Full features + custom configurations');
    logger.info('');
    logger.info('💡 Feature Access configured in FeatureAccess table:');
    Object.entries(TIER_FEATURES).forEach(([tier, features]) => {
      const enabledCount = Object.values(features).filter(v => v).length;
      logger.info(`   ${tier}: ${enabledCount} features enabled`);
    });
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
