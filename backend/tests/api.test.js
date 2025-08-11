import request from 'supertest';
import { app } from '../src/app.js';
import { logger } from '../src/utils/logger.utils.js';

// Simple test to verify API endpoints
async function testAPI() {
  try {
    logger.info('🧪 Starting API tests...');

    // Test health endpoint
    const healthResponse = await request(app)
      .get('/health')
      .expect(200);
    
    logger.info('✅ Health check passed');

    // Test login with admin credentials
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@edutech.com',
        password: 'admin123'
      })
      .expect(200);

    if (loginResponse.body.success && loginResponse.body.data.token) {
      logger.info('✅ Admin login successful');
      
      const token = loginResponse.body.data.token;

      // Test protected route
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${token}`)
        .expect(200);

      if (profileResponse.body.success) {
        logger.info('✅ Protected route access successful');
      }
    }

    logger.info('🎉 All tests passed!');
  } catch (error) {
    logger.error('❌ Test failed:', error.message);
  }
}

export { testAPI };
