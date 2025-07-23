import dotenv from 'dotenv';
import { server } from './src/app.js';
import { logger } from './src/utils/logger.utils.js';

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 5000;

// Start server
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📖 Environment: ${process.env.NODE_ENV || 'development'}`);
  logger.info(`🔗 Health check: http://localhost:${PORT}/health`);
});
