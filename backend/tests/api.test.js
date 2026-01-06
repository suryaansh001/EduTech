import request from 'supertest';
import { app } from '../src/app.js';
import { logger } from '../src/utils/logger.utils.js';

describe('API Tests', () => {
  test('should pass health check', async () => {
    const response = await request(app)
      .get('/health')
      .expect(200);
    
    expect(response.body).toBeDefined();
  });

  test('should login admin successfully', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@edutech.com',
        password: 'Password123!'
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.token).toBeDefined();
  });

  test('should access protected route with token', async () => {
    const loginResponse = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@edutech.com',
        password: 'Password123!'
      })
      .expect(200);

    const token = loginResponse.body.data.token;

    const profileResponse = await request(app)
      .get('/api/auth/profile')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(profileResponse.body.success).toBe(true);
  });
});
