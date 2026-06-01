# Integration Tests - AI/Non-AI Segregation

Complete test suite for verifying AI/Non-AI tier segregation functionality.

## Setup

```bash
cd backend
npm install
npx prisma migrate deploy
npm run db:seed
npm test
```

## Test Files

### 1. Feature Middleware Tests

Location: `backend/src/middleware/feature.middleware.test.js`

```javascript
const request = require('supertest');
const express = require('express');
const { requireFeature } = require('./feature.middleware');

describe('Feature Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Mock auth middleware
    app.use((req, res, next) => {
      req.user = { id: '1', subscriptionTier: 'FREE' };
      next();
    });

    // Test route
    app.get('/test-feature', 
      requireFeature('AI_CHAT_ENABLED'), 
      (req, res) => res.json({ success: true })
    );
  });

  test('Should block free tier users', async () => {
    const res = await request(app).get('/test-feature');
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
    expect(res.body.feature).toBe('AI_CHAT_ENABLED');
  });

  test('Should include tier info in response', async () => {
    const res = await request(app).get('/test-feature');
    expect(res.body.currentTier).toBe('FREE');
    expect(res.body.requiredTier).toBe('PREMIUM');
  });
});
```

### 2. Service Factory Tests

Location: `backend/src/services/ai/factory.test.js`

```javascript
const { createAIService, SUBSCRIPTION_TIERS } = require('./factory');

describe('Service Factory', () => {
  test('Should return NoOp service for FREE tier', () => {
    const service = createAIService('chat', SUBSCRIPTION_TIERS.FREE);
    const result = service.sendMessage('test');
    
    expect(result.success).toBe(false);
    expect(result.message).toContain('not available');
  });

  test('Should return real service for PREMIUM tier', () => {
    const service = createAIService('chat', SUBSCRIPTION_TIERS.PREMIUM);
    expect(service).toBeDefined();
    expect(service.isAvailable).toBeDefined();
  });

  test('Should return real service for ENTERPRISE tier', () => {
    const service = createAIService('chat', SUBSCRIPTION_TIERS.ENTERPRISE);
    expect(service).toBeDefined();
  });

  test('Should cache service instances', () => {
    const service1 = createAIService('chat', SUBSCRIPTION_TIERS.PREMIUM);
    const service2 = createAIService('chat', SUBSCRIPTION_TIERS.PREMIUM);
    expect(service1).toBe(service2);
  });
});
```

### 3. Route Protection Tests

Location: `backend/src/routes/ai-chat.routes.test.js`

```javascript
const request = require('supertest');
const app = require('../app');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('AI Chat Routes Protection', () => {
  let freeToken, premiumToken;

  beforeAll(async () => {
    // Get test user tokens
    freeToken = await getTokenForUser('student@edutech.com');
    premiumToken = await getTokenForUser('teacher@edutech.com');
  });

  test('POST /api/ai-chat/chat - Free tier blocked', async () => {
    const res = await request(app)
      .post('/api/ai-chat/chat')
      .set('Authorization', `Bearer ${freeToken}`)
      .send({ message: 'hello' });

    expect(res.status).toBe(403);
    expect(res.body.feature).toBe('AI_CHAT_ENABLED');
  });

  test('POST /api/ai-chat/quiz/create - Free tier blocked', async () => {
    const res = await request(app)
      .post('/api/ai-chat/quiz/create')
      .set('Authorization', `Bearer ${freeToken}`)
      .send({ classId: '1', message: 'test' });

    expect(res.status).toBe(403);
  });

  test('GET /api/ai-chat/documents/search - Free tier blocked', async () => {
    const res = await request(app)
      .get('/api/ai-chat/documents/search?query=test')
      .set('Authorization', `Bearer ${freeToken}`);

    expect(res.status).toBe(403);
  });

  test('POST /api/ai-chat/chat - Premium tier allowed', async () => {
    const res = await request(app)
      .post('/api/ai-chat/chat')
      .set('Authorization', `Bearer ${premiumToken}`)
      .send({ message: 'hello' });

    // Should not be 403 (might be 200 or other validation error)
    expect(res.status).not.toBe(403);
  });

  test('POST /api/ai-chat/quiz/create - Premium tier allowed', async () => {
    const res = await request(app)
      .post('/api/ai-chat/quiz/create')
      .set('Authorization', `Bearer ${premiumToken}`)
      .send({ classId: '1', message: 'test' });

    expect(res.status).not.toBe(403);
  });
});

async function getTokenForUser(email) {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: 'Password123!' });
  
  return res.body.token;
}
```

### 4. Database Integrity Tests

Location: `backend/prisma/seed.test.js`

```javascript
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

describe('Database Seed Integrity', () => {
  test('Should have 4 test users with correct tiers', async () => {
    const users = await prisma.user.findMany();
    
    expect(users.length).toBeGreaterThanOrEqual(4);
    
    const tierMap = {};
    users.forEach(u => {
      tierMap[u.email] = u.subscriptionTier;
    });

    expect(tierMap['admin@edutech.com']).toBe('ENTERPRISE');
    expect(tierMap['teacher@edutech.com']).toBe('PREMIUM');
    expect(tierMap['student@edutech.com']).toBe('FREE');
    expect(tierMap['premium-student@edutech.com']).toBe('PREMIUM');
  });

  test('Should have 15 FeatureAccess records', async () => {
    const features = await prisma.featureAccess.findMany();
    expect(features.length).toBe(15);
  });

  test('FREE tier should have no features enabled', async () => {
    const features = await prisma.featureAccess.findMany({
      where: { tier: 'FREE', enabled: true }
    });
    expect(features.length).toBe(0);
  });

  test('PREMIUM tier should have all features enabled', async () => {
    const features = await prisma.featureAccess.findMany({
      where: { tier: 'PREMIUM', enabled: true }
    });
    expect(features.length).toBe(5);
  });

  test('ENTERPRISE tier should have all features enabled', async () => {
    const features = await prisma.featureAccess.findMany({
      where: { tier: 'ENTERPRISE', enabled: true }
    });
    expect(features.length).toBe(5);
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });
});
```

### 5. Frontend Component Tests

Location: `frontend/src/components/FeatureGate.integration.test.jsx`

```javascript
import { render, screen } from '@testing-library/react';
import { FeatureFlagProvider } from '@/context/feature-flag-context';
import FeatureGate from '@/components/FeatureGate';
import { FEATURES } from '@/context/feature-flag-constants';

describe('FeatureGate Integration', () => {
  test('Shows content for premium user', () => {
    render(
      <FeatureFlagProvider initialTier="PREMIUM">
        <FeatureGate feature={FEATURES.AI_CHAT}>
          <div>AI Chat Feature</div>
        </FeatureGate>
      </FeatureFlagProvider>
    );

    expect(screen.getByText('AI Chat Feature')).toBeInTheDocument();
  });

  test('Shows upgrade prompt for free user', () => {
    render(
      <FeatureFlagProvider initialTier="FREE">
        <FeatureGate feature={FEATURES.AI_CHAT}>
          <div>AI Chat Feature</div>
        </FeatureGate>
      </FeatureFlagProvider>
    );

    expect(screen.queryByText('AI Chat Feature')).not.toBeInTheDocument();
    expect(screen.getByText(/upgrade/i)).toBeInTheDocument();
  });

  test('Shows upgrade prompt with correct feature name', () => {
    render(
      <FeatureFlagProvider initialTier="FREE">
        <FeatureGate 
          feature={FEATURES.QUIZ_GENERATION}
          description="Create unlimited quizzes"
        >
          <div>Quiz Generator</div>
        </FeatureGate>
      </FeatureFlagProvider>
    );

    expect(screen.getByText(/Quiz Generator|quiz/i)).toBeInTheDocument();
  });
});
```

### 6. End-to-End API Tests

Location: `backend/tests/e2e/segregation.e2e.test.js`

```javascript
const request = require('supertest');
const app = require('../../src/app');

describe('E2E: AI Segregation', () => {
  let freeUserToken, premiumUserToken;

  beforeAll(async () => {
    // Login as free and premium users
    const freeRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@edutech.com',
        password: 'Password123!'
      });

    const premiumRes = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'teacher@edutech.com',
        password: 'Password123!'
      });

    freeUserToken = freeRes.body.token;
    premiumUserToken = premiumRes.body.token;
  });

  describe('Tier Segregation', () => {
    test('Free user cannot access AI endpoints', async () => {
      const endpoints = [
        { method: 'post', path: '/api/ai-chat/chat' },
        { method: 'post', path: '/api/ai-chat/quiz/create' },
        { method: 'get', path: '/api/ai-chat/documents/search?query=test' },
        { method: 'post', path: '/api/ai-chat/documents/chat' }
      ];

      for (const endpoint of endpoints) {
        const res = await request(app)[endpoint.method](endpoint.path)
          .set('Authorization', `Bearer ${freeUserToken}`)
          .send({ message: 'test', classId: '1' });

        expect(res.status).toBe(403);
        expect(res.body.success).toBe(false);
        expect(res.body.currentTier).toBe('FREE');
      }
    });

    test('Premium user can access AI endpoints', async () => {
      const res = await request(app)
        .post('/api/ai-chat/chat')
        .set('Authorization', `Bearer ${premiumUserToken}`)
        .send({ message: 'hello', classId: '1' });

      // Should not be 403
      expect(res.status).not.toBe(403);
    });

    test('Free user can access regular features', async () => {
      const res = await request(app)
        .get('/api/quizzes')
        .set('Authorization', `Bearer ${freeUserToken}`);

      expect(res.status).toBe(200);
    });
  });

  describe('Error Responses', () => {
    test('Feature denied response has correct structure', async () => {
      const res = await request(app)
        .post('/api/ai-chat/chat')
        .set('Authorization', `Bearer ${freeUserToken}`)
        .send({ message: 'test' });

      expect(res.body).toHaveProperty('success', false);
      expect(res.body).toHaveProperty('message');
      expect(res.body).toHaveProperty('feature');
      expect(res.body).toHaveProperty('currentTier');
      expect(res.body).toHaveProperty('requiredTier');
    });

    test('Error response includes helpful tier info', async () => {
      const res = await request(app)
        .post('/api/ai-chat/quiz/create')
        .set('Authorization', `Bearer ${freeUserToken}`)
        .send({ classId: '1', message: 'test' });

      expect(res.body.message).toContain('Premium');
      expect(res.body.requiredTier).toBe('PREMIUM');
      expect(res.body.currentTier).toBe('FREE');
    });
  });
});
```

## Running Tests

### Run All Tests
```bash
npm test
```

### Run Specific Test Suite
```bash
npm test -- feature.middleware.test
npm test -- factory.test
npm test -- routes.test
npm test -- segregation.e2e.test
```

### Run with Coverage
```bash
npm test -- --coverage
```

### Watch Mode
```bash
npm test -- --watch
```

## Expected Test Results

### Success Metrics
- ✅ All 30+ unit tests pass
- ✅ All 5 integration test suites pass
- ✅ 100% coverage of feature middleware
- ✅ 90%+ coverage of service factory
- ✅ Free tier users blocked (403 responses)
- ✅ Premium users allowed (non-403 responses)
- ✅ Error responses follow spec
- ✅ Database seeds correctly

### Performance Targets
- Feature check: < 5ms (O(1) lookup)
- Service creation: < 10ms (cached)
- API response: < 200ms total
- Database query: < 50ms

## CI/CD Integration

Add to `package.json`:

```json
{
  "scripts": {
    "test": "jest --testTimeout=10000",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:e2e": "jest --testPathPattern=e2e",
    "test:segregation": "jest --testPathPattern=segregation"
  }
}
```

## Debugging Failed Tests

### Check Feature Config
```bash
node -e "const fc = require('./src/config/features.config.js'); console.log(fc.getFeatureConfigurationSummary())"
```

### Check Database State
```bash
npx prisma studio
# Navigate to FeatureAccess table
```

### Enable Debug Logging
```bash
DEBUG=*:* npm test
```

### Run Single Test
```bash
npm test -- -t "Should block free tier users"
```

## Test Checklist

- [ ] All middleware tests pass
- [ ] All factory tests pass
- [ ] All route tests pass
- [ ] All database tests pass
- [ ] All frontend component tests pass
- [ ] All E2E tests pass
- [ ] Coverage above 80%
- [ ] No console errors
- [ ] No memory leaks
- [ ] Performance acceptable

---

**Integration Test Suite Complete ✅**

Ready for CI/CD pipeline integration.
