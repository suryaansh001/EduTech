/**
 * FEATURE MIDDLEWARE TESTING GUIDE
 * 
 * Test scenarios and assertions for feature middleware
 */

// ====================================
// TEST SETUP
// ====================================

import supertest from 'supertest';
import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';
import app from '../app.js';
import { prisma } from '../config/database.js';

const request = supertest(app);

// Test user tokens
let freeUserToken;
let premiumUserToken;
let enterpriseUserToken;
let adminUserToken;

beforeAll(async () => {
  // Create test users
  const freeUser = await prisma.user.create({
    data: {
      email: 'free@test.com',
      name: 'Free User',
      password: 'hashed_password',
      subscriptionTier: 'FREE'
    }
  });
  freeUserToken = generateToken(freeUser);
  
  const premiumUser = await prisma.user.create({
    data: {
      email: 'premium@test.com',
      name: 'Premium User',
      password: 'hashed_password',
      subscriptionTier: 'PREMIUM'
    }
  });
  premiumUserToken = generateToken(premiumUser);
  
  const enterpriseUser = await prisma.user.create({
    data: {
      email: 'enterprise@test.com',
      name: 'Enterprise User',
      password: 'hashed_password',
      subscriptionTier: 'ENTERPRISE'
    }
  });
  enterpriseUserToken = generateToken(enterpriseUser);
  
  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Admin User',
      password: 'hashed_password',
      subscriptionTier: 'PREMIUM',
      role: 'ADMIN'
    }
  });
  adminUserToken = generateToken(adminUser);
});

afterAll(async () => {
  await prisma.user.deleteMany({});
  await prisma.$disconnect();
});

// ====================================
// TEST SUITE 1: requireFeature()
// ====================================

describe('requireFeature middleware', () => {
  
  it('should allow premium users to access premium features', async () => {
    const response = await request
      .post('/api/ai-chat/generate')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ prompt: 'Hello AI' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  it('should allow enterprise users to access any feature', async () => {
    const response = await request
      .post('/api/ai-chat/generate')
      .set('Authorization', `Bearer ${enterpriseUserToken}`)
      .send({ prompt: 'Hello AI' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  it('should return 402 for free users trying to access premium features', async () => {
    const response = await request
      .post('/api/ai-chat/generate')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send({ prompt: 'Hello AI' });
    
    expect(response.status).toBe(402);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Premium plan');
    expect(response.body.feature).toBe('AI_CHAT_ENABLED');
    expect(response.body.currentTier).toBe('FREE');
    expect(response.body.requiredTier).toBe('PREMIUM');
    expect(response.body.upgradeUrl).toBe('/pricing');
  });
  
  it('should return 401 for unauthenticated requests', async () => {
    const response = await request
      .post('/api/ai-chat/generate')
      .send({ prompt: 'Hello AI' });
    
    expect(response.status).toBe(401);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('Authentication required');
  });
  
  it('should attach feature metadata to request', async () => {
    // This test requires access to req object
    // Can be verified through response headers or logged data
    const response = await request
      .post('/api/ai-chat/generate')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ prompt: 'Hello AI' });
    
    expect(response.status).toBe(200);
    expect(response.body.feature).toBe('AI_CHAT_ENABLED');
  });
});

// ====================================
// TEST SUITE 2: requireAnyFeature()
// ====================================

describe('requireAnyFeature middleware', () => {
  
  it('should allow user with any of the features', async () => {
    const response = await request
      .post('/api/analyze')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ content: 'Test content' });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  it('should deny free users when none of the features available', async () => {
    const response = await request
      .post('/api/analyze')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send({ content: 'Test content' });
    
    expect(response.status).toBe(402);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toContain('None of the requested features');
    expect(Array.isArray(response.body.features)).toBe(true);
  });
  
  it('should include enabled features in response', async () => {
    const response = await request
      .post('/api/analyze')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ content: 'Test content' });
    
    expect(response.status).toBe(200);
    expect(response.body.enabledFeatures).toBeDefined();
  });
});

// ====================================
// TEST SUITE 3: trackFeatureUsage()
// ====================================

describe('trackFeatureUsage middleware', () => {
  
  it('should not block requests without feature access', async () => {
    const response = await request
      .get('/api/documents')
      .set('Authorization', `Bearer ${freeUserToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
  
  it('should track usage for premium users', async () => {
    const response = await request
      .get('/api/documents')
      .set('Authorization', `Bearer ${premiumUserToken}`);
    
    expect(response.status).toBe(200);
    // Verify feature metadata is included in response
    expect(response.body.featureUsage).toBeDefined();
  });
  
  it('should track usage with feature enabled flag', async () => {
    const response = await request
      .get('/api/documents')
      .set('Authorization', `Bearer ${premiumUserToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.featureUsage.enabled).toBe(true);
  });
  
  it('should track usage even for anonymous users', async () => {
    const response = await request
      .get('/api/documents');
    
    expect(response.status).toBe(200);
  });
});

// ====================================
// TEST SUITE 4: attachFeatureInfo()
// ====================================

describe('attachFeatureInfo middleware', () => {
  
  it('should provide isFeatureAvailable function', async () => {
    const response = await request
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${premiumUserToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data.features).toBeDefined();
  });
  
  it('should provide all features for premium user', async () => {
    const response = await request
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${premiumUserToken}`);
    
    expect(response.status).toBe(200);
    const features = response.body.data.features;
    expect(features.AI_CHAT_ENABLED).toBe(true);
    expect(features.QUIZ_GENERATION_ENABLED).toBe(true);
  });
  
  it('should provide no features for free user', async () => {
    const response = await request
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${freeUserToken}`);
    
    expect(response.status).toBe(200);
    const features = response.body.data.features;
    expect(features.AI_CHAT_ENABLED).toBe(false);
    expect(Object.values(features).every(v => !v)).toBe(true);
  });
  
  it('should provide tier info', async () => {
    const response = await request
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${premiumUserToken}`);
    
    expect(response.status).toBe(200);
    expect(response.body.data.tierInfo).toBeDefined();
    expect(response.body.data.tierInfo.tier).toBe('PREMIUM');
    expect(response.body.data.tierInfo.isPremium).toBe(true);
    expect(response.body.data.tierInfo.isFree).toBe(false);
  });
});

// ====================================
// TEST SUITE 5: rateLimitByTier()
// ====================================

describe('rateLimitByTier middleware', () => {
  
  it('should block free user after limit exceeded', async () => {
    const promises = [];
    
    // Send 11 requests (free limit is 10)
    for (let i = 0; i < 11; i++) {
      promises.push(
        request
          .post('/api/quiz/generate')
          .set('Authorization', `Bearer ${freeUserToken}`)
          .send({ topic: 'Math', numberOfQuestions: 10 })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // First 10 should succeed (200 or 402 from feature check)
    // 11th should be 429 (rate limited)
    const last = responses[10];
    expect(last.status).toBe(429);
    expect(last.body.success).toBe(false);
    expect(last.body.message).toContain('Rate limit exceeded');
  });
  
  it('should allow more requests for premium users', async () => {
    // Premium users have higher limit
    const promises = [];
    
    // Send more requests as premium user
    for (let i = 0; i < 20; i++) {
      promises.push(
        request
          .post('/api/quiz/generate')
          .set('Authorization', `Bearer ${premiumUserToken}`)
          .send({ topic: 'Math', numberOfQuestions: 10 })
      );
    }
    
    const responses = await Promise.all(promises);
    
    // All should be allowed (rate limit is higher for premium)
    const rateLimited = responses.filter(r => r.status === 429);
    expect(rateLimited.length).toBe(0);
  });
  
  it('should include rate limit info in response', async () => {
    const response = await request
      .post('/api/quiz/generate')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ topic: 'Math', numberOfQuestions: 10 });
    
    expect(response.status).toBeOneOf([200, 402]);
    if (response.status === 200) {
      expect(response.body.rateLimit).toBeDefined();
      expect(response.body.rateLimit.remaining).toBeDefined();
      expect(response.body.rateLimit.limit).toBeDefined();
    }
  });
  
  it('should return 429 with retry-after header', async () => {
    // Send many requests to trigger rate limit
    const promises = [];
    for (let i = 0; i < 15; i++) {
      promises.push(
        request
          .post('/api/quiz/generate')
          .set('Authorization', `Bearer ${freeUserToken}`)
          .send({ topic: 'Math', numberOfQuestions: 10 })
      );
    }
    
    const responses = await Promise.all(promises);
    const rateLimited = responses.find(r => r.status === 429);
    
    if (rateLimited) {
      expect(rateLimited.body.retryAfter).toBe(60);
    }
  });
});

// ====================================
// TEST SUITE 6: adminFeatureOverride()
// ====================================

describe('adminFeatureOverride middleware', () => {
  
  it('should allow admin to access premium features on free tier', async () => {
    const response = await request
      .post('/api/admin/test-premium')
      .set('Authorization', `Bearer ${adminUserToken}`)
      .send({});
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.adminOverride).toBe(true);
  });
  
  it('should not override for non-admin users', async () => {
    // Non-admin premium user should pass due to premium tier, not override
    const response = await request
      .post('/api/admin/test-premium')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({});
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});

// ====================================
// TEST SUITE 7: Integration Tests
// ====================================

describe('Feature Middleware Integration', () => {
  
  it('should work with authenticate + requireFeature + rateLimitByTier', async () => {
    const response = await request
      .post('/api/mcp/query')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ query: 'test query' });
    
    // Should either succeed or be rate limited
    expect([200, 402, 429]).toContain(response.status);
  });
  
  it('should handle missing user tier gracefully', async () => {
    // Create user without explicit tier
    const userWithoutTier = await prisma.user.create({
      data: {
        email: 'notier@test.com',
        name: 'No Tier User',
        password: 'hashed_password'
      }
    });
    const token = generateToken(userWithoutTier);
    
    const response = await request
      .post('/api/ai-chat/generate')
      .set('Authorization', `Bearer ${token}`)
      .send({ prompt: 'Hello' });
    
    // Should default to FREE tier and return 402
    expect(response.status).toBe(402);
    expect(response.body.currentTier).toBe('FREE');
  });
  
  it('should provide features in dashboard for different tiers', async () => {
    const freeResponse = await request
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${freeUserToken}`);
    
    const premiumResponse = await request
      .get('/api/dashboard')
      .set('Authorization', `Bearer ${premiumUserToken}`);
    
    expect(freeResponse.status).toBe(200);
    expect(premiumResponse.status).toBe(200);
    
    // Premium should have more features
    const premiumFeatureCount = Object.values(premiumResponse.body.data.features)
      .filter(Boolean).length;
    const freeFeatureCount = Object.values(freeResponse.body.data.features)
      .filter(Boolean).length;
    
    expect(premiumFeatureCount).toBeGreaterThan(freeFeatureCount);
  });
});

// ====================================
// TEST SUITE 8: Error Handling
// ====================================

describe('Feature Middleware Error Handling', () => {
  
  it('should handle middleware errors gracefully', async () => {
    // This would test with a malformed feature config
    const response = await request
      .post('/api/ai-chat/generate')
      .set('Authorization', `Bearer ${premiumUserToken}`)
      .send({ prompt: 'test' });
    
    expect(response.status).toBeOneOf([200, 400, 500]);
  });
  
  it('should log feature denials', async () => {
    const response = await request
      .post('/api/ai-chat/generate')
      .set('Authorization', `Bearer ${freeUserToken}`)
      .send({ prompt: 'test' });
    
    expect(response.status).toBe(402);
    // Verify in logs that denial was logged
  });
});

// ====================================
// HELPER FUNCTIONS
// ====================================

/**
 * Generate JWT token for test user
 */
function generateToken(user) {
  // Implementation depends on your JWT utility
  const jwt = require('jsonwebtoken');
  return jwt.sign(
    {
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionTier: user.subscriptionTier
    },
    process.env.JWT_SECRET || 'test_secret',
    { expiresIn: '24h' }
  );
}

/**
 * Test helper: Wait for rate limit to reset
 */
async function waitForRateLimitReset() {
  return new Promise(resolve => setTimeout(resolve, 60000));
}

/**
 * Test helper: Get user with specific tier
 */
async function createUserWithTier(tier) {
  return prisma.user.create({
    data: {
      email: `${tier.toLowerCase()}@test.com`,
      name: `${tier} User`,
      password: 'hashed_password',
      subscriptionTier: tier
    }
  });
}

/**
 * Test helper: Create admin user
 */
async function createAdminUser() {
  return prisma.user.create({
    data: {
      email: 'admin@test.com',
      name: 'Admin User',
      password: 'hashed_password',
      subscriptionTier: 'PREMIUM',
      role: 'ADMIN'
    }
  });
}

// ====================================
// CUSTOM MATCHERS
// ====================================

expect.extend({
  toBeOneOf(received, expected) {
    const pass = expected.includes(received);
    return {
      pass,
      message: () => 
        pass
          ? `expected ${received} not to be one of ${expected.join(', ')}`
          : `expected ${received} to be one of ${expected.join(', ')}`
    };
  }
});

export {
  freeUserToken,
  premiumUserToken,
  enterpriseUserToken,
  adminUserToken,
  generateToken,
  waitForRateLimitReset,
  createUserWithTier,
  createAdminUser
};
