import pkg from '@prisma/client';
const { PrismaClient } = pkg;
import { logger } from '../utils/logger.utils.js';

class Database {
  constructor() {
    // Reuse Prisma client in serverless environments to avoid connection issues
    if (process.env.VERCEL === '1') {
      if (!global.prisma) {
        global.prisma = new PrismaClient({
          log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
        });
      }
      this.prisma = global.prisma;
    } else {
      this.prisma = new PrismaClient({
        log: process.env.NODE_ENV === 'development' ? ['query', 'info', 'warn', 'error'] : ['error'],
      });
    }
  }

  async connect() {
    try {
      await this.prisma.$connect();
      logger.info('✅ Database connected successfully');
    } catch (error) {
      logger.error('❌ Database connection failed:', error);
      process.exit(1);
    }
  }

  async disconnect() {
    try {
      await this.prisma.$disconnect();
      logger.info('🔌 Database disconnected');
    } catch (error) {
      logger.error('❌ Database disconnection failed:', error);
    }
  }

  getClient() {
    return this.prisma;
  }
}

const database = new Database();
export { database };
export const prisma = database.getClient();
