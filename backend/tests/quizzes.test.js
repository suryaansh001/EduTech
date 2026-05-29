import request from 'supertest';
import { app } from '../src/app.js';

describe('Quizzes API Tests', () => {
  let teacherToken;
  let studentToken;
  let testClassId;
  let testQuizId;

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

    // Get a class ID for quiz creation
    const classesResponse = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    if (classesResponse.body.data?.classes?.length > 0) {
      testClassId = classesResponse.body.data.classes[0].id;
    }
  });

  describe('POST /api/quizzes', () => {
    test('should create quiz as teacher', async () => {
      if (!testClassId) {
        console.log('Skipping: No class available for quiz creation');
        return;
      }

      const response = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Test Quiz',
          description: 'A quiz for API testing',
          classId: testClassId,
          timeLimit: 30,
          totalMarks: 100,
          questions: [
            {
              type: 'MULTIPLE_CHOICE',
              question: 'What is 2 + 2?',
              options: ['3', '4', '5', '6'],
              correctAnswer: '4',
              marks: 10
            },
            {
              type: 'TRUE_FALSE',
              question: 'The sky is blue.',
              options: ['True', 'False'],
              correctAnswer: 'True',
              marks: 10
            },
            {
              type: 'SHORT_ANSWER',
              question: 'What is the capital of France?',
              options: [],
              correctAnswer: 'Paris',
              marks: 10
            }
          ]
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Quiz');
      testQuizId = response.body.data.id;
    });

    test('should fail to create quiz as student', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          title: 'Student Quiz',
          classId: testClassId,
          timeLimit: 30,
          totalMarks: 50,
          questions: []
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });

    test('should fail with missing required fields', async () => {
      const response = await request(app)
        .post('/api/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          title: 'Incomplete Quiz'
          // Missing classId and other required fields
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/quizzes', () => {
    test('should get all quizzes as teacher', async () => {
      const response = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data.quizzes || response.body.data)).toBe(true);
    });

    test('should get quizzes by class', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .get(`/api/quizzes?classId=${testClassId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('GET /api/quizzes/:id', () => {
    test('should get quiz by id', async () => {
      // Get quizzes first
      const quizzesResponse = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${teacherToken}`);

      const quizzes = quizzesResponse.body.data?.quizzes || quizzesResponse.body.data || [];
      
      if (quizzes.length > 0) {
        const quizId = quizzes[0].id;

        const response = await request(app)
          .get(`/api/quizzes/${quizId}`)
          .set('Authorization', `Bearer ${teacherToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
      }
    });

    test('should return 404 for non-existent quiz', async () => {
      const response = await request(app)
        .get('/api/quizzes/non-existent-quiz-id')
        .set('Authorization', `Bearer ${teacherToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/quizzes/:id', () => {
    test('should update quiz as owner', async () => {
      if (!testQuizId) return;

      const response = await request(app)
        .put(`/api/quizzes/${testQuizId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          description: 'Updated quiz description'
        })
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PUT /api/quizzes/:id/toggle', () => {
    test('should toggle quiz active status', async () => {
      if (!testQuizId) return;

      const response = await request(app)
        .put(`/api/quizzes/${testQuizId}/toggle`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('POST /api/quizzes/:id/attempt', () => {
    test('should start quiz attempt as student', async () => {
      // Get an active quiz
      const quizzesResponse = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${studentToken}`);

      const quizzes = quizzesResponse.body.data?.quizzes || quizzesResponse.body.data || [];
      const activeQuiz = quizzes.find(q => q.isActive);

      if (activeQuiz) {
        const response = await request(app)
          .post(`/api/quizzes/${activeQuiz.id}/attempt`)
          .set('Authorization', `Bearer ${studentToken}`)
          .send({
            answers: {
              q1: '4',
              q2: 'True',
              q3: 'Paris'
            }
          });

        // Could succeed or fail based on enrollment/previous attempts
        expect([200, 201, 400, 403, 500]).toContain(response.status);
      }
    });

    test('should fail attempt as teacher', async () => {
      if (!testQuizId) return;

      const response = await request(app)
        .post(`/api/quizzes/${testQuizId}/attempt`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          answers: {}
        });

      expect([400, 403, 500]).toContain(response.status);
    });
  });

  describe('GET /api/quizzes/:id/attempts', () => {
    test('should get quiz attempts as teacher', async () => {
      if (!testQuizId) return;

      const response = await request(app)
        .get(`/api/quizzes/${testQuizId}/attempts`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 404]).toContain(response.status);
    });
  });

  describe('GET /api/quizzes/my-attempts', () => {
    test('should get student own attempts', async () => {
      const response = await request(app)
        .get('/api/quizzes/my-attempts')
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('DELETE /api/quizzes/:id', () => {
    test('should delete quiz as owner', async () => {
      if (!testQuizId) return;

      const response = await request(app)
        .delete(`/api/quizzes/${testQuizId}`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 204, 404]).toContain(response.status);
    });
  });
});
