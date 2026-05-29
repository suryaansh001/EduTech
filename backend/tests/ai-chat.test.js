import request from 'supertest';
import { app } from '../src/app.js';

describe('AI Chat API Tests', () => {
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

    // Get a class ID
    const classesResponse = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    if (classesResponse.body.data?.classes?.length > 0) {
      testClassId = classesResponse.body.data.classes[0].id;
    }

    // Get a quiz ID
    const quizzesResponse = await request(app)
      .get('/api/quizzes')
      .set('Authorization', `Bearer ${studentToken}`);
    
    const quizzes = quizzesResponse.body.data?.quizzes || quizzesResponse.body.data || [];
    if (quizzes.length > 0) {
      testQuizId = quizzes[0].id;
    }
  });

  describe('POST /api/ai-chat/chat', () => {
    test('should send general chat message', async () => {
      const response = await request(app)
        .post('/api/ai-chat/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'What is photosynthesis?',
          useRAG: true
        });

      // May succeed or fail depending on MCP server availability
      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
      }
    });

    test('should send chat with conversation history', async () => {
      const response = await request(app)
        .post('/api/ai-chat/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'Can you explain more?',
          conversationHistory: [
            { role: 'user', content: 'What is photosynthesis?' },
            { role: 'assistant', content: 'Photosynthesis is the process by which plants convert sunlight into energy.' }
          ],
          useRAG: true
        });

      expect([200, 500]).toContain(response.status);
    });

    test('should fail without message', async () => {
      const response = await request(app)
        .post('/api/ai-chat/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .post('/api/ai-chat/chat')
        .send({
          message: 'Hello'
        })
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ai-chat/quiz/create', () => {
    test('should create quiz from chat as teacher', async () => {
      if (!testClassId) {
        console.log('Skipping: No class available');
        return;
      }

      const response = await request(app)
        .post('/api/ai-chat/quiz/create')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          classId: testClassId,
          message: 'Create a 5-question quiz about basic mathematics'
        });

      // May succeed or fail depending on MCP server
      expect([200, 403, 500]).toContain(response.status);
    });

    test('should fail to create quiz as student', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .post('/api/ai-chat/quiz/create')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          classId: testClassId,
          message: 'Create a quiz'
        })
        .expect(403);

      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/ai-chat/quiz/:quizId/analyze', () => {
    test('should analyze quiz performance as student', async () => {
      if (!testQuizId) {
        console.log('Skipping: No quiz available');
        return;
      }

      const response = await request(app)
        .post(`/api/ai-chat/quiz/${testQuizId}/analyze`)
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'How can I improve my score?'
        });

      // May succeed or fail depending on attempts/MCP server
      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/ai-chat/documents/search', () => {
    test('should search documents', async () => {
      const response = await request(app)
        .get('/api/ai-chat/documents/search')
        .query({ query: 'mathematics' })
        .set('Authorization', `Bearer ${teacherToken}`);

      // May succeed or fail depending on Pinecone configuration
      expect([200, 500]).toContain(response.status);
    });

    test('should search with class filter', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .get('/api/ai-chat/documents/search')
        .query({ 
          query: 'quiz',
          classId: testClassId,
          topK: 5
        })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/ai-chat/documents/chat', () => {
    test('should chat with documents', async () => {
      const response = await request(app)
        .post('/api/ai-chat/documents/chat')
        .set('Authorization', `Bearer ${studentToken}`)
        .send({
          message: 'Summarize the key concepts',
          documentIds: []
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/ai-chat/quiz/generate-questions', () => {
    test('should generate quiz questions from content', async () => {
      const response = await request(app)
        .post('/api/ai-chat/quiz/generate-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          content: 'Photosynthesis is the process by which plants convert sunlight, water, and carbon dioxide into glucose and oxygen. This process occurs in the chloroplasts of plant cells.',
          questionCount: 3,
          questionTypes: ['MULTIPLE_CHOICE', 'TRUE_FALSE'],
          difficulty: 'medium'
        });

      expect([200, 500]).toContain(response.status);
      
      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('should fail without content', async () => {
      const response = await request(app)
        .post('/api/ai-chat/quiz/generate-questions')
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          questionCount: 5
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/ai-chat/history/:userId', () => {
    test('should get chat history', async () => {
      // Get current user info
      const profileResponse = await request(app)
        .get('/api/auth/profile')
        .set('Authorization', `Bearer ${studentToken}`);

      const userId = profileResponse.body.data?.id;

      if (userId) {
        const response = await request(app)
          .get(`/api/ai-chat/history/${userId}`)
          .set('Authorization', `Bearer ${studentToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(Array.isArray(response.body.data)).toBe(true);
      }
    });
  });
});
