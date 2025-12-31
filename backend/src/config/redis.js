import { createClient } from 'redis';
import { logger } from '../utils/logger.utils.js';

class RedisClient {
  constructor() {
    this.client = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Use environment variables for Redis configuration
      const redisConfig = {
        socket: {
          host: process.env.REDIS_HOST || 'localhost',
          port: parseInt(process.env.REDIS_PORT) || 6379,
          reconnectStrategy: (retries) => {
            if (retries > 3) {
              logger.warn('Redis connection failed after 3 retries. Running without Redis cache.');
              return false; // Stop retrying
            }
            return Math.min(retries * 100, 3000);
          }
        }
      };

      // Add authentication if credentials are provided
      if (process.env.REDIS_USERNAME) {
        redisConfig.username = process.env.REDIS_USERNAME;
      }
      
      if (process.env.REDIS_PASSWORD) {
        redisConfig.password = process.env.REDIS_PASSWORD;
      }

      this.client = createClient(redisConfig);

      this.client.on('error', (err) => {
        if (err.code !== 'ECONNREFUSED') {
          logger.error('Redis Client Error:', err);
        }
        this.isConnected = false;
      });

      this.client.on('connect', () => {
        logger.info('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.client.on('disconnect', () => {
        logger.warn('🔌 Redis disconnected');
        this.isConnected = false;
      });

      await this.client.connect();
      logger.info('✅ Redis connected successfully');
    } catch (error) {
      logger.warn('⚠️ Redis connection failed - running without cache:', error.message);
      this.isConnected = false;
    }
  }

  async disconnect() {
    if (this.client) {
      await this.client.disconnect();
      this.isConnected = false;
    }
  }

  getClient() {
    return this.client;
  }

  async set(key, value, expireInSeconds = 3600) {
    if (!this.isConnected) return false;
    try {
      await this.client.setEx(key, expireInSeconds, JSON.stringify(value));
      return true;
    } catch (error) {
      logger.error('Redis SET error:', error);
      return false;
    }
  }

  async get(key) {
    if (!this.isConnected) return null;
    try {
      const value = await this.client.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      logger.error('Redis GET error:', error);
      return null;
    }
  }

  async del(key) {
    if (!this.isConnected) return false;
    try {
      await this.client.del(key);
      return true;
    } catch (error) {
      logger.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key) {
    if (!this.isConnected) return false;
    try {
      const result = await this.client.exists(key);
      return result === 1;
    } catch (error) {
      logger.error('Redis EXISTS error:', error);
      return false;
    }
  }
}

const redisClient = new RedisClient();

export const connectRedis = async () => {
  await redisClient.connect();
};

export { redisClient };
