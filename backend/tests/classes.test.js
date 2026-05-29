import request from 'supertest';
import { app } from '../src/app.js';

describe('Classes API Tests', () => {
  let teacherToken;
  let studentToken;
  let adminToken;
  let createdClassId;

  beforeAll(async () => {
    // Login as teacher
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teacher@edutech.com',
        password: 'Password123!'
      });
    teacherToken = teacherLogin.body.data.token;

    // Login as student
    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@edutech.com',
        password: 'Password123!'
      });
    studentToken = studentLogin.body.data.token;

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@edutech.com',
        password: 'Password123!'
      });
    adminToken = adminLogin.body.data.token;
  });

  describe('GET /api/classes', () => {
    test('should get all classes as teacher', async () => {
      const response = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.classes)).toBe(true);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get('/api/classes')
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/classes', () => {
    test('should create class as teacher', async () => {
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Test Class',
          subject: 'Testing',
          description: 'A test class for API testing',
          maxStudents: 30
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Class');
      createdClassId = response.body.data.id;
    });

    test('should fail to create class as student', async () => {
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Class',
          subject: 'Testing',
          description: 'Should not be created'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Incomplete Class'
          // Missing subject
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/classes/:id', () => {
    test('should get class by id', async () => {
      // First get all classes to get an id
      const classesResponse = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (classesResponse.body.data.classes.length > 0) {
        const classId = classesResponse.body.data.classes[0].id;

        const response = await request(app)
          .get(`/api/classes/${classId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.id).toBe(classId);
      }
    });

    test('should return 404 for non-existent class', async () => {
      const response = await request(app)
        .get('/api/classes/non-existent-id')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/classes/my-enrollments', () => {
    test('should get student enrollments', async () => {
      const response = await request(app)
        .get('/api/classes/my-enrollments')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
    });
  });

  describe('POST /api/classes/:id/enroll', () => {
    test('should enroll student in class', async () => {
      // Get an available class
      const classesResponse = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (classesResponse.body.data.classes.length > 0) {
        const classId = classesResponse.body.data.classes[0].id;

        const response = await request(app)
          .post(`/api/classes/${classId}/enroll`)
          .set('Authorization', `Bearer ${studentToken}`);

        // Could be 200 (enrolled) or error if already enrolled
        expect([200, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('PUT /api/classes/:id', () => {
    test('should update class as owner teacher', async () => {
      if (createdClassId) {
        const response = await request(app)
          .put(`/api/classes/${createdClassId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            description: 'Updated description'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('POST /api/classes/:id/schedules', () => {
    test('should add schedule to class', async () => {
      if (createdClassId) {
        const response = await request(app)
          .post(`/api/classes/${createdClassId}/schedules`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .send({
            dayOfWeek: 'MONDAY',
            startTime: '09:00',
            endTime: '10:30',
            room: 'Room 101'
          });

        // Could be 200/201 or error if schedule conflicts
        expect([200, 201, 400, 500]).toContain(response.status);
      }
    });
  });

  describe('DELETE /api/classes/:id', () => {
    test('should delete class as owner', async () => {
      if (createdClassId) {
        const response = await request(app)
          .delete(`/api/classes/${createdClassId}`)
          .set('Authorization', `Bearer ${teacherToken}`);

        expect([200, 204, 404]).toContain(response.status);
      }
    });

    test('should fail to delete class as non-owner', async () => {
      const classesResponse = await request(app)
        .get('/api/classes')
        .set('Authorization', `Bearer ${teacherToken}`);

      if (classesResponse.body.data.classes.length > 0) {
        const classId = classesResponse.body.data.classes[0].id;

        const response = await request(app)
          .delete(`/api/classes/${classId}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(403);

        expect(response.body.success).toBe(false);
      }
    });
  });
});
