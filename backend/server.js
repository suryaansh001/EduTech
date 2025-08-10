import dotenv from 'dotenv';
import { server } from './src/app.js';
import { logger } from './src/utils/logger.utils.js';
import { initializeApp, shutdownApp } from './src/utils/init.utils.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Initialize the application
const startServer = async () => {
  try {
    await initializeApp();
    
    // Start server
    const serverInstance = server.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
      logger.info(`📚 API Documentation: http://localhost:${PORT}/api`);
    });

    // Graceful shutdown
    const shutdown = async (signal) => {
      logger.info(`\n${signal} received. Shutting down gracefully...`);
      
      serverInstance.close(async () => {
        logger.info('HTTP server closed');
        await shutdownApp();
        process.exit(0);
      });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
