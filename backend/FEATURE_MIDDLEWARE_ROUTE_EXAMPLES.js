/**
 * FEATURE MIDDLEWARE - CONCRETE ROUTE DEMONSTRATIONS
 * 
 * Copy-paste ready examples for your route files
 */

// ============================================
// DEMONSTRATION 1: AI CHAT ROUTES
// ============================================

import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireFeature, rateLimitByTier, trackFeatureUsage } from '../middleware/feature.middleware.js';
import { FEATURES } from '../config/features.config.js';

const aiChatRoutes = express.Router();

/**
 * POST /api/ai-chat/generate
 * Generate AI responses - Premium+ only
 * Rate Limited: FREE=disabled, PREMIUM=100/min
 */
aiChatRoutes.post(
  '/generate',
  authenticate,
  rateLimitByTier({ freeLimit: 0, premiumLimit: 100, enterpriseLimit: 1000 }),
  requireFeature(FEATURES.AI_CHAT_ENABLED),
  async (req, res) => {
    try {
      const { prompt, context, temperature } = req.body;
      
      // Feature is available - proceed with generation
      const response = await aiService.generateResponse({
        prompt,
        context,
        temperature,
        userId: req.user.id,
        tier: req.feature.tier
      });
      
      return res.status(200).json({
        success: true,
        message: 'AI response generated',
        data: {
          response,
          feature: req.feature.name,
          tier: req.feature.tier
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to generate response',
        error: error.message
      });
    }
  }
);

/**
 * GET /api/ai-chat/history
 * Get chat history - Premium+ only
 */
aiChatRoutes.get(
  '/history',
  authenticate,
  requireFeature(FEATURES.AI_CHAT_ENABLED),
  async (req, res) => {
    try {
      const { limit = 50, offset = 0 } = req.query;
      
      const history = await chatHistoryService.getHistory(req.user.id, {
        limit: parseInt(limit),
        offset: parseInt(offset)
      });
      
      return res.status(200).json({
        success: true,
        data: history,
        feature: req.feature.name
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch history'
      });
    }
  }
);

export default aiChatRoutes;

// ============================================
// DEMONSTRATION 2: QUIZ GENERATION ROUTES
// ============================================

import { attachFeatureInfo } from '../middleware/feature.middleware.js';

const quizRoutes = express.Router();

/**
 * POST /api/quiz/generate
 * Generate quiz - Rate limited per tier
 * FREE: 2/min, PREMIUM: 50/min
 */
quizRoutes.post(
  '/generate',
  authenticate,
  rateLimitByTier({
    freeLimit: 2,
    premiumLimit: 50,
    enterpriseLimit: 500
  }),
  requireFeature(FEATURES.QUIZ_GENERATION_ENABLED),
  async (req, res) => {
    try {
      const { topic, numberOfQuestions, difficulty } = req.body;
      
      const quiz = await quizGenerator.generate({
        topic,
        numberOfQuestions,
        difficulty,
        userId: req.user.id
      });
      
      return res.status(200).json({
        success: true,
        data: quiz,
        rateLimitInfo: {
          remaining: req.rateLimitInfo.remaining,
          limit: req.rateLimitInfo.limit,
          tier: req.rateLimitInfo.tier
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Quiz generation failed'
      });
    }
  }
);

/**
 * GET /api/quiz/available-topics
 * List available topics - Free tier OK
 * Track usage for analytics
 */
quizRoutes.get(
  '/available-topics',
  trackFeatureUsage(FEATURES.QUIZ_GENERATION_ENABLED),
  async (req, res) => {
    try {
      const topics = await quizService.getTopics();
      
      return res.status(200).json({
        success: true,
        data: topics,
        message: 'Usage tracked for analytics'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch topics'
      });
    }
  }
);

export default quizRoutes;

// ============================================
// DEMONSTRATION 3: DOCUMENT ANALYSIS ROUTES
// ============================================

const documentRoutes = express.Router();

/**
 * POST /api/documents/analyze
 * Analyze document - Premium+ only
 * Requires DOCUMENT_ANALYSIS feature
 */
documentRoutes.post(
  '/analyze',
  authenticate,
  rateLimitByTier({ freeLimit: 0, premiumLimit: 100 }),
  requireFeature(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
  async (req, res) => {
    try {
      const { documentId, analysisType } = req.body;
      
      const analysis = await documentAnalyzer.analyze({
        documentId,
        analysisType,
        userId: req.user.id,
        tier: req.feature.tier
      });
      
      return res.status(200).json({
        success: true,
        data: analysis,
        feature: req.feature.name
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Document analysis failed'
      });
    }
  }
);

/**
 * GET /api/documents/list
 * List user's documents - All tiers
 * Show features based on tier
 */
documentRoutes.get(
  '/list',
  authenticate,
  attachFeatureInfo(),
  async (req, res) => {
    try {
      const documents = await documentService.getDocuments(req.user.id);
      
      // Enhance response based on available features
      const enhancedDocuments = documents.map(doc => ({
        ...doc,
        analysisAvailable: req.isFeatureAvailable(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
        aiInsights: req.isFeatureAvailable(FEATURES.AI_CHAT_ENABLED)
      }));
      
      return res.status(200).json({
        success: true,
        data: enhancedDocuments,
        features: {
          analysis: req.isFeatureAvailable(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
          aiInsights: req.isFeatureAvailable(FEATURES.AI_CHAT_ENABLED)
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch documents'
      });
    }
  }
);

export default documentRoutes;

// ============================================
// DEMONSTRATION 4: DASHBOARD - TIER-AWARE
// ============================================

const dashboardRoutes = express.Router();

/**
 * GET /api/dashboard
 * User dashboard - All tiers
 * Show different content based on subscription tier
 */
dashboardRoutes.get(
  '/',
  authenticate,
  attachFeatureInfo(),
  async (req, res) => {
    try {
      const dashboardData = {
        user: {
          id: req.user.id,
          name: req.user.name,
          email: req.user.email,
          tier: req.tierInfo.tier,
          joinedDate: req.user.createdAt
        },
        
        // Basic stats - all tiers
        stats: {
          documentsCount: await documentService.getCount(req.user.id),
          quizzesCount: await quizService.getCount(req.user.id)
        },
        
        // Features available
        availableFeatures: req.getAvailableFeatures(),
        
        // Tier-specific sections
        ...(req.tierInfo.isPremium && {
          premiumFeatures: {
            aiChat: req.isFeatureAvailable(FEATURES.AI_CHAT_ENABLED),
            documentAnalysis: req.isFeatureAvailable(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
            quizGeneration: req.isFeatureAvailable(FEATURES.QUIZ_GENERATION_ENABLED),
            recentActivity: await getRecentActivity(req.user.id)
          }
        }),
        
        ...(req.tierInfo.isEnterprise && {
          enterpriseFeatures: {
            mcp: req.isFeatureAvailable(FEATURES.MCP_ENABLED),
            pinecone: req.isFeatureAvailable(FEATURES.PINECONE_ENABLED),
            unlimitedApi: true,
            customization: true
          }
        }),
        
        // Free tier - show upgrade prompts
        ...(req.tierInfo.isFree && {
          upgradePrompt: {
            message: 'Unlock premium features',
            features: [
              'AI-powered chat',
              'Document analysis',
              'Quiz generation'
            ],
            upgradeUrl: '/pricing'
          }
        })
      };
      
      return res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to load dashboard'
      });
    }
  }
);

export default dashboardRoutes;

// ============================================
// DEMONSTRATION 5: PUBLIC ENDPOINTS WITH TRACKING
// ============================================

const publicRoutes = express.Router();

/**
 * GET /api/public/features
 * Public endpoint showing feature availability
 * Tracks usage for analytics
 */
publicRoutes.get(
  '/features',
  trackFeatureUsage(FEATURES.AI_CHAT_ENABLED),
  trackFeatureUsage(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
  async (req, res) => {
    try {
      const user = req.user || { subscriptionTier: 'FREE' };
      
      return res.status(200).json({
        success: true,
        data: {
          tier: user.subscriptionTier,
          features: {
            aiChat: user.subscriptionTier !== 'FREE',
            documentAnalysis: user.subscriptionTier !== 'FREE',
            quizGeneration: user.subscriptionTier !== 'FREE'
          },
          message: 'Sign up for Premium to unlock all features'
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch feature info'
      });
    }
  }
);

export default publicRoutes;

// ============================================
// DEMONSTRATION 6: ADMIN-ONLY TESTING ENDPOINT
// ============================================

import { adminFeatureOverride, requireFeatureWithOverride } from '../middleware/feature.middleware.js';

const adminRoutes = express.Router();

/**
 * POST /api/admin/test-premium-feature
 * Admin-only endpoint for testing premium features
 * Admins can access any feature regardless of tier
 */
adminRoutes.post(
  '/test-premium-feature',
  authenticate,
  adminFeatureOverride(),
  requireFeatureWithOverride(FEATURES.AI_CHAT_ENABLED),
  async (req, res) => {
    try {
      const testPrompt = 'Test prompt from admin';
      
      const response = await aiService.generateResponse({
        prompt: testPrompt,
        context: 'Admin testing',
        userId: req.user.id,
        isAdminTest: true
      });
      
      return res.status(200).json({
        success: true,
        message: 'Premium feature test completed',
        data: {
          response,
          testedBy: req.user.email,
          adminOverride: req.adminOverride,
          tier: req.user.subscriptionTier
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Test failed'
      });
    }
  }
);

/**
 * GET /api/admin/user-tiers
 * Admin endpoint - check user tier configurations
 */
adminRoutes.get(
  '/user-tiers/:userId',
  authenticate,
  adminFeatureOverride(),
  async (req, res) => {
    try {
      const user = await userService.getUser(req.params.userId);
      
      return res.status(200).json({
        success: true,
        data: {
          userId: user.id,
          email: user.email,
          tier: user.subscriptionTier,
          availableFeatures: req.getAvailableFeatures()
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Failed to fetch user tier'
      });
    }
  }
);

export default adminRoutes;

// ============================================
// DEMONSTRATION 7: MCP SERVICE ROUTES
// ============================================

const mcpRoutes = express.Router();

/**
 * POST /api/mcp/query
 * MCP queries - Enterprise only
 * Highest rate limits, tracked, and admin overrideable
 */
mcpRoutes.post(
  '/query',
  authenticate,
  adminFeatureOverride(),
  trackFeatureUsage(FEATURES.MCP_ENABLED),
  rateLimitByTier({
    freeLimit: 0,
    premiumLimit: 0,
    enterpriseLimit: 2000
  }),
  requireFeatureWithOverride(FEATURES.MCP_ENABLED),
  async (req, res) => {
    try {
      const { query, context } = req.body;
      
      const result = await mcpService.query({
        query,
        context,
        userId: req.user.id,
        tier: req.user.subscriptionTier
      });
      
      return res.status(200).json({
        success: true,
        data: result,
        feature: req.feature.name,
        rateLimit: req.rateLimitInfo
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'MCP query failed'
      });
    }
  }
);

export default mcpRoutes;

// ============================================
// DEMONSTRATION 8: MAIN APP SETUP
// ============================================

/**
 * How to mount all routes in your main app file
 */
import app from 'express';

export function setupRoutes(app) {
  // Public routes
  app.use('/api/public', publicRoutes);
  
  // Feature-protected routes
  app.use('/api/ai-chat', aiChatRoutes);
  app.use('/api/quiz', quizRoutes);
  app.use('/api/documents', documentRoutes);
  
  // Tier-aware routes
  app.use('/api/dashboard', dashboardRoutes);
  
  // MCP routes
  app.use('/api/mcp', mcpRoutes);
  
  // Admin routes
  app.use('/api/admin', adminRoutes);
  
  return app;
}

// ============================================
// FEATURE MATRIX
// ============================================

/**
 * Feature Availability by Tier
 * 
 * Route                          FREE    PREMIUM  ENTERPRISE
 * POST /ai-chat/generate         402     200      200
 * GET /ai-chat/history           402     200      200
 * POST /quiz/generate            Limited 200      200
 * GET /quiz/topics               200     200      200
 * POST /documents/analyze        402     200      200
 * GET /documents/list            200*    200*     200*
 * GET /dashboard                 200*    200*     200*
 * POST /admin/test-feature       403     200      200
 * POST /mcp/query                402     402      200
 * 
 * 200  = Full access
 * 402  = Payment required (free tier needs upgrade)
 * 403  = Forbidden (tier not high enough)
 * 429  = Rate limited
 * 200* = Partial access (limited features shown)
 * 403* = Forbidden (admin only)
 */

export {
  aiChatRoutes,
  quizRoutes,
  documentRoutes,
  dashboardRoutes,
  publicRoutes,
  adminRoutes,
  mcpRoutes,
  setupRoutes
};
