import { prisma } from '../config/database.js';
import { emailService } from '../services/email.service.js';
import { logger } from './logger.utils.js';

export const initializeApp = async () => {
  try {
    // Check database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    // Verify email configuration
    const emailVerified = await emailService.verifyConnection();
    if (emailVerified) {
      logger.info('✅ Email service configured successfully');
    } else {
      logger.warn('⚠️ Email service configuration failed - email features may not work');
    }

  } catch (error) {
    logger.error('❌ Application initialization failed:', error);
    throw error;
  }
};

export const shutdownApp = async () => {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Database disconnected');
  } catch (error) {
    logger.error('Error during shutdown:', error);
  }
};
