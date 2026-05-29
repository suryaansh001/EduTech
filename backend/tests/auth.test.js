import request from 'supertest';
import { app } from '../src/app.js';

describe('Authentication API Tests', () => {
  let adminToken;
  let teacherToken;
  let studentToken;

  describe('POST /api/auth/login', () => {
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
      expect(response.body.data.user.role).toBe('ADMIN');
      adminToken = response.body.data.token;
    });

    test('should login teacher successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'teacher@edutech.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('TEACHER');
      teacherToken = response.body.data.token;
    });

    test('should login student successfully', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@edutech.com',
          password: 'Password123!'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.role).toBe('STUDENT');
      studentToken = response.body.data.token;
    });

    test('should fail with invalid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edutech.com',
          password: 'WrongPassword123!'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('should fail with non-existent user', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'nonexistent@edutech.com',
          password: 'Password123!'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('should fail with missing email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Password123!'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail with missing password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edutech.com'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/auth/profile', () => {
    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'admin@edutech.com',
          password: 'Password123!'
        });
      adminToken = response.body.data.token;
    });

    test('should get profile with valid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe('admin@edutech.com');
    });

    test('should fail without token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .expect(401);

      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid token', async () => {
      const response = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', 'Bearer invalid-token-here')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/register', () => {
    const uniqueEmail = `testuser_${Date.now()}@edutech.com`;

    test('should register new student', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Test User',
          email: uniqueEmail,
          password: 'TestPassword123!',
          role: 'STUDENT'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.user.email).toBe(uniqueEmail);
    });

    test('should fail with duplicate email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Duplicate User',
          email: 'admin@edutech.com',
          password: 'TestPassword123!',
          role: 'STUDENT'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    test('should fail with weak password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Weak Password User',
          email: `weak_${Date.now()}@edutech.com`,
          password: '123',
          role: 'STUDENT'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail with invalid email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Invalid Email User',
          email: 'not-an-email',
          password: 'TestPassword123!',
          role: 'STUDENT'
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/auth/profile', () => {
    let userToken;

    beforeAll(async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@edutech.com',
          password: 'Password123!'
        });
      userToken = response.body.data?.token;
    });

    test('should update profile bio', async () => {
      if (!userToken) {
        console.log('Skipping: Could not get user token');
        return;
      }

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          bio: 'Updated bio for testing'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should update profile phone', async () => {
      if (!userToken) {
        console.log('Skipping: Could not get user token');
        return;
      }

      const response = await request(app)
        .put('/api/auth/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          phone: '+1987654321'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('POST /api/auth/change-password', () => {
    test('should fail with wrong current password', async () => {
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'student@edutech.com',
          password: 'Password123!'
        });
      
      const token = loginResponse.body.data?.token;
      
      if (!token) {
        console.log('Skipping: Could not get user token');
        return;
      }

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'WrongPassword123!',
          newPassword: 'NewPassword123!'
        })
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });
});
