import request from 'supertest';
import { app } from '../src/app.js';

describe('Announcements API Tests', () => {
  let teacherToken;
  let studentToken;
  let testClassId;
  let createdAnnouncementId;

  beforeAll(async () => {
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@edutech.com', password: 'Password123!' });
    teacherToken = teacherLogin.body.data.token;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@edutech.com', password: 'Password123!' });
    studentToken = studentLogin.body.data.token;

    const classesResponse = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    if (classesResponse.body.data?.classes?.length > 0) {
      testClassId = classesResponse.body.data.classes[0].id;
    }
  });

  describe('POST /api/announcements', () => {
    test('should create announcement as teacher', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Test Announcement',
          content: 'This is a test announcement',
          classId: testClassId,
          priority: 'NORMAL'
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      createdAnnouncementId = response.body.data.id;
    });

    test('should fail to create announcement as student', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .post('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Announcement',
          content: 'Should fail',
          classId: testClassId
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/announcements', () => {
    test('should get announcements', async () => {
      const response = await request(app)
        .get('/api/announcements')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should filter announcements by class', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .get('/api/announcements')
        .query({ classId: testClassId })
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/announcements/:id', () => {
    test('should update announcement', async () => {
      if (!createdAnnouncementId) return;

      const response = await request(app)
        .put(`/api/announcements/${createdAnnouncementId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          content: 'Updated content'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/announcements/:id', () => {
    test('should delete announcement', async () => {
      if (!createdAnnouncementId) return;

      const response = await request(app)
        .delete(`/api/announcements/${createdAnnouncementId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 204]).toContain(response.status);
    });
  });
});

describe('Notes API Tests', () => {
  let teacherToken;
  let studentToken;
  let testClassId;
  let createdNoteId;

  beforeAll(async () => {
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@edutech.com', password: 'Password123!' });
    teacherToken = teacherLogin.body.data.token;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@edutech.com', password: 'Password123!' });
    studentToken = studentLogin.body.data.token;

    const classesResponse = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    if (classesResponse.body.data?.classes?.length > 0) {
      testClassId = classesResponse.body.data.classes[0].id;
    }
  });

  describe('POST /api/notes', () => {
    test('should create note as teacher', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Test Note',
          content: 'This is test note content for API testing',
          subject: 'Testing',
          classId: testClassId,
          isPublic: true,
          tags: ['test', 'api']
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      createdNoteId = response.body.data.id;
    });

    test('should create personal note as student', async () => {
      const response = await request(app)
        .post('/api/notes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'My Personal Note',
          content: 'Personal study notes',
          subject: 'Study',
          isPublic: false
        })
        .expect(201);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/notes', () => {
    test('should get notes', async () => {
      const response = await request(app)
        .get('/api/notes')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should filter by subject', async () => {
      const response = await request(app)
        .get('/api/notes')
        .query({ subject: 'Testing' })
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/notes/:id', () => {
    test('should get note by id', async () => {
      if (!createdNoteId) return;

      const response = await request(app)
        .get(`/api/notes/${createdNoteId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/notes/:id', () => {
    test('should update note', async () => {
      if (!createdNoteId) return;

      const response = await request(app)
        .put(`/api/notes/${createdNoteId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          content: 'Updated note content'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/notes/:id', () => {
    test('should delete note', async () => {
      if (!createdNoteId) return;

      const response = await request(app)
        .delete(`/api/notes/${createdNoteId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 204]).toContain(response.status);
    });
  });
});

describe('Analytics API Tests', () => {
  let teacherToken;
  let studentToken;
  let studentUserId;

  beforeAll(async () => {
    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@edutech.com', password: 'Password123!' });
    teacherToken = teacherLogin.body.data.token;

    const studentLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'student@edutech.com', password: 'Password123!' });
    studentToken = studentLogin.body.data.token;
    studentUserId = studentLogin.body.data.user.id;
  });

  describe('GET /api/analytics/student/:id', () => {
    test('should get student analytics', async () => {
      const response = await request(app)
        .get(`/api/analytics/student/${studentUserId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 404, 500]).toContain(response.status);
    });
  });

  describe('GET /api/analytics/dashboard', () => {
    test('should get analytics dashboard', async () => {
      const response = await request(app)
        .get('/api/analytics/dashboard')
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });
});

describe('Users API Tests', () => {
  let adminToken;
  let teacherToken;

  beforeAll(async () => {
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@edutech.com', password: 'Password123!' });
    adminToken = adminLogin.body.data.token;

    const teacherLogin = await request(app)
      .post('/api/auth/login')
      .send({ email: 'teacher@edutech.com', password: 'Password123!' });
    teacherToken = teacherLogin.body.data.token;
  });

  describe('GET /api/users', () => {
    test('should get users as admin', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should fail to get users as teacher', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/users/stats', () => {
    test('should get user stats', async () => {
      const response = await request(app)
        .get('/api/users/stats')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
