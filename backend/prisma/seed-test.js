import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/bcrypt.utils.js';
import { logger } from '../src/utils/logger.utils.js';

const prisma = new PrismaClient();

/**
 * Test Data Seed Script
 * 
 * Creates additional test users with various subscription tiers
 * for thorough testing of feature access and tier-based limitations
 * 
 * Use this in development/staging for comprehensive testing
 */

const TEST_PASSWORD = 'TestPass123!';

async function seedTestUsers() {
  try {
    logger.info('🧪 Seeding test users with various subscription tiers...');

    const testUsers = [
      {
        email: 'test-free@edutech.com',
        name: 'Free Tier Tester',
        role: 'STUDENT',
        tier: 'FREE',
        description: 'Tests free tier limitations'
      },
      {
        email: 'test-premium@edutech.com',
        name: 'Premium Tier Tester',
        role: 'STUDENT',
        tier: 'PREMIUM',
        description: 'Tests premium features'
      },
      {
        email: 'test-enterprise@edutech.com',
        name: 'Enterprise Tier Tester',
        role: 'ADMIN',
        tier: 'ENTERPRISE',
        description: 'Tests enterprise features'
      },
      {
        email: 'test-teacher-free@edutech.com',
        name: 'Free Tier Teacher',
        role: 'TEACHER',
        tier: 'FREE',
        description: 'Teacher with limited features'
      },
      {
        email: 'test-teacher-premium@edutech.com',
        name: 'Premium Tier Teacher',
        role: 'TEACHER',
        tier: 'PREMIUM',
        description: 'Teacher with all AI features'
      }
    ];

    let createdCount = 0;
    let skippedCount = 0;

    for (const testUser of testUsers) {
      const userExists = await prisma.user.findUnique({
        where: { email: testUser.email }
      });

      if (!userExists) {
        const hashedPassword = await hashPassword(TEST_PASSWORD);

        await prisma.$transaction(async (prisma) => {
          const newUser = await prisma.user.create({
            data: {
              name: testUser.name,
              email: testUser.email,
              password: hashedPassword,
              role: testUser.role,
              subscriptionTier: testUser.tier,
              isFirstLogin: true,
              isActive: true,
              bio: testUser.description,
              phone: `+1999999${String(createdCount).padStart(4, '0')}`
            }
          });

          // Create corresponding profile
          if (testUser.role === 'STUDENT') {
            await prisma.studentProfile.create({
              data: {
                userId: newUser.id,
                grade: '10th Grade',
                interests: ['Testing', 'Development'],
                learningGoals: 'Test feature access for subscription tier'
              }
            });
          } else if (testUser.role === 'TEACHER') {
            await prisma.teacherProfile.create({
              data: {
                userId: newUser.id,
                qualification: 'M.Tech',
                specialization: 'Computer Science',
                experience: 'Test account'
              }
            });
          }

          logger.info(`✅ Created ${testUser.tier} tier test user:`, newUser.email);
        });

        createdCount++;
      } else {
        skippedCount++;
      }
    }

    logger.info(`\n✅ Test users seeded: ${createdCount} created, ${skippedCount} skipped`);
  } catch (error) {
    logger.error('❌ Error seeding test users:', error);
    throw error;
  }
}

async function seedTestUserOverrides() {
  try {
    logger.info('🧪 Seeding test user feature overrides...');

    // Find a test user to apply overrides to
    const testUser = await prisma.user.findUnique({
      where: { email: 'test-free@edutech.com' }
    });

    if (testUser) {
      // Grant AI_CHAT_ENABLED to a free tier user (temporary override)
      const existingOverride = await prisma.userFeatureOverride.findUnique({
        where: {
          userId_featureName: {
            userId: testUser.id,
            featureName: 'AI_CHAT_ENABLED'
          }
        }
      });

      if (!existingOverride) {
        await prisma.userFeatureOverride.create({
          data: {
            userId: testUser.id,
            featureName: 'AI_CHAT_ENABLED',
            enabled: true,
            expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7-day trial
          }
        });

        logger.info('✅ Created AI_CHAT_ENABLED override for test-free user (7-day trial)');
      }

      // Revoke QUIZ_GENERATION for premium student
      const premiumUser = await prisma.user.findUnique({
        where: { email: 'test-premium@edutech.com' }
      });

      if (premiumUser) {
        const existingRevoke = await prisma.userFeatureOverride.findUnique({
          where: {
            userId_featureName: {
              userId: premiumUser.id,
              featureName: 'QUIZ_GENERATION_ENABLED'
            }
          }
        });

        if (!existingRevoke) {
          await prisma.userFeatureOverride.create({
            data: {
              userId: premiumUser.id,
              featureName: 'QUIZ_GENERATION_ENABLED',
              enabled: false,
              expiresAt: null // Permanent revocation
            }
          });

          logger.info('✅ Revoked QUIZ_GENERATION for premium test user (testing restrictions)');
        }
      }
    }

    logger.info('✅ Feature overrides seeded successfully');
  } catch (error) {
    logger.error('❌ Error seeding feature overrides:', error);
    throw error;
  }
}

async function main() {
  try {
    await seedTestUsers();
    await seedTestUserOverrides();

    logger.info('\n');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('🧪 Test Users Created');
    logger.info('═══════════════════════════════════════════════════════');
    logger.info('');
    logger.info('All test users use password: ' + TEST_PASSWORD);
    logger.info('');
    logger.info('Test Accounts:');
    logger.info('  1. test-free@edutech.com (FREE tier - Student)');
    logger.info('     - Has 7-day AI_CHAT trial override');
    logger.info('  2. test-premium@edutech.com (PREMIUM tier - Student)');
    logger.info('     - QUIZ_GENERATION revoked for testing restrictions');
    logger.info('  3. test-enterprise@edutech.com (ENTERPRISE tier - Admin)');
    logger.info('  4. test-teacher-free@edutech.com (FREE tier - Teacher)');
    logger.info('  5. test-teacher-premium@edutech.com (PREMIUM tier - Teacher)');
    logger.info('');
    logger.info('═══════════════════════════════════════════════════════');
  } catch (error) {
    logger.error('❌ Test seed failed:', error);
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
