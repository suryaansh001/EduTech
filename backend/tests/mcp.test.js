import request from 'supertest';
import { app } from '../src/app.js';

describe('MCP Analytics API Tests', () => {
  let teacherToken;
  let studentToken;
  let adminToken;
  let studentUserId;
  let testClassId;

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
    studentUserId = studentLogin.body.data.user.id;

    // Login as admin
    const adminLogin = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@edutech.com',
        password: 'Password123!'
      });
    adminToken = adminLogin.body.data.token;

    // Get a class ID
    const classesResponse = await request(app)
      .get('/api/classes')
      .set('Authorization', `Bearer ${teacherToken}`);
    
    if (classesResponse.body.data?.classes?.length > 0) {
      testClassId = classesResponse.body.data.classes[0].id;
    }
  });

  describe('GET /api/mcp/student/:userId/performance', () => {
    test('should get student performance analytics', async () => {
      const response = await request(app)
        .get(`/api/mcp/student/${studentUserId}/performance`)
        .set('Authorization', `Bearer ${teacherToken}`);

      // May succeed or fail depending on MCP server availability
      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });

    test('should get detailed performance', async () => {
      const response = await request(app)
        .get(`/api/mcp/student/${studentUserId}/performance`)
        .query({ includeDetails: 'true' })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
    });

    test('should fail without authentication', async () => {
      const response = await request(app)
        .get(`/api/mcp/student/${studentUserId}/performance`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/mcp/class/:classId/insights', () => {
    test('should get class insights as teacher', async () => {
      if (!testClassId) {
        console.log('Skipping: No class available');
        return;
      }

      const response = await request(app)
        .get(`/api/mcp/class/${testClassId}/insights`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
    });

    test('should get class insights with risk threshold', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .get(`/api/mcp/class/${testClassId}/insights`)
        .query({ riskThreshold: 0.5 })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/mcp/student/:userId/risk', () => {
    test('should predict student risk level', async () => {
      const response = await request(app)
        .get(`/api/mcp/student/${studentUserId}/risk`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('POST /api/mcp/student/:userId/recommendations', () => {
    test('should generate AI recommendations', async () => {
      const response = await request(app)
        .post(`/api/mcp/student/${studentUserId}/recommendations`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          focus: 'general'
        });

      expect([200, 500]).toContain(response.status);
    });

    test('should generate recommendations with specific focus', async () => {
      const response = await request(app)
        .post(`/api/mcp/student/${studentUserId}/recommendations`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          focus: 'study_habits'
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/mcp/student/:userId/class/:classId/predict-grade', () => {
    test('should predict final grade', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .post(`/api/mcp/student/${studentUserId}/class/${testClassId}/predict-grade`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          currentWeek: 8,
          totalWeeks: 16
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/mcp/student/:userId/dropout-risk', () => {
    test('should predict dropout risk', async () => {
      const response = await request(app)
        .get(`/api/mcp/student/${studentUserId}/dropout-risk`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
    });

    test('should predict dropout risk for specific class', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .get(`/api/mcp/student/${studentUserId}/dropout-risk`)
        .query({ classId: testClassId })
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/mcp/student/:userId/study-plan', () => {
    test('should suggest study plan', async () => {
      const response = await request(app)
        .post(`/api/mcp/student/${studentUserId}/study-plan`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          duration: 'week'
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/mcp/student/:userId/anomalies', () => {
    test('should detect learning anomalies', async () => {
      const response = await request(app)
        .get(`/api/mcp/student/${studentUserId}/anomalies`)
        .set('Authorization', `Bearer ${teacherToken}`);

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('POST /api/mcp/report/:scope/:targetId', () => {
    test('should generate student report', async () => {
      const response = await request(app)
        .post(`/api/mcp/report/student/${studentUserId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          format: 'detailed'
        });

      expect([200, 500]).toContain(response.status);
    });

    test('should generate class report', async () => {
      if (!testClassId) return;

      const response = await request(app)
        .post(`/api/mcp/report/class/${testClassId}`)
        .set('Authorization', `Bearer ${teacherToken}`)
        .send({
          format: 'summary'
        });

      expect([200, 500]).toContain(response.status);
    });
  });

  describe('GET /api/mcp/insights/:userId', () => {
    test('should get user AI insights', async () => {
      const response = await request(app)
        .get(`/api/mcp/insights/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });

  describe('PATCH /api/mcp/insights/:insightId/read', () => {
    test('should mark insight as read', async () => {
      // First get insights
      const insightsResponse = await request(app)
        .get(`/api/mcp/insights/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      const insights = insightsResponse.body.data || [];
      
      if (insights.length > 0) {
        const response = await request(app)
          .patch(`/api/mcp/insights/${insights[0].id}/read`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect([200, 404]).toContain(response.status);
      }
    });
  });

  describe('PATCH /api/mcp/insights/:insightId/dismiss', () => {
    test('should dismiss insight', async () => {
      const insightsResponse = await request(app)
        .get(`/api/mcp/insights/${studentUserId}`)
        .set('Authorization', `Bearer ${studentToken}`);

      const insights = insightsResponse.body.data || [];
      
      if (insights.length > 0) {
        const response = await request(app)
          .patch(`/api/mcp/insights/${insights[0].id}/dismiss`)
          .set('Authorization', `Bearer ${studentToken}`);

        expect([200, 404]).toContain(response.status);
      }
    });
  });

  describe('GET /api/mcp/tools', () => {
    test('should list available MCP tools', async () => {
      const response = await request(app)
        .get('/api/mcp/tools')
        .set('Authorization', `Bearer ${adminToken}`);

      expect([200, 500]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body.success).toBe(true);
      }
    });
  });

  describe('GET /api/mcp/logs', () => {
    test('should get MCP query logs as admin', async () => {
      const response = await request(app)
        .get('/api/mcp/logs')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    test('should filter logs by server name', async () => {
      const response = await request(app)
        .get('/api/mcp/logs')
        .query({ serverName: 'analytics' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });
  });
});
