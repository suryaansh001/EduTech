import request from 'supertest';
import { app } from '../src/app.js';

describe('Health Check & Basic API Tests', () => {
  describe('GET /', () => {
    test('should pass health check', async () => {
      const response = await request(app)
        .get('/')
        .expect(200);
      
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBeDefined();
    });
  });

  describe('API Security', () => {
    test('should return 401 for protected routes without token', async () => {
      const protectedRoutes = [
        '/api/classes',
        '/api/quizzes',
        '/api/notes',
        '/api/announcements',
        '/api/auth/profile',
      ];

      for (const route of protectedRoutes) {
        const response = await request(app).get(route);
        expect(response.status).toBe(401);
      }
    });

    test('should return 401 for invalid token', async () => {
      const response = await request(app)
        .get('/api/classes')
        .set('Authorization', 'Bearer invalid-token')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('API Error Handling', () => {
    test('should return 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('Rate Limiting', () => {
    test('should allow normal request rate', async () => {
      // Make a few requests to ensure rate limiting doesn't block normal usage
      for (let i = 0; i < 5; i++) {
        const response = await request(app).get('/');
        expect(response.status).toBe(200);
      }
    });
  });
});
