/**
 * ROUTE INTEGRATION EXAMPLES
 * 
 * Demonstrates how to integrate feature middleware with actual route handlers
 * Copy these patterns to your route files
 */

// ====================================
// EXAMPLE 1: Basic Feature Protection
// ====================================
import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireFeature } from '../middleware/feature.middleware.js';
import { FEATURES } from '../config/features.config.js';

const router = express.Router();

/**
 * Protected AI Chat endpoint
 * Only available to PREMIUM and ENTERPRISE users
 */
router.post('/ai-chat/generate', authenticate, requireFeature(FEATURES.AI_CHAT_ENABLED), async (req, res) => {
  try {
    // User has AI_CHAT feature - access granted
    const { prompt, context } = req.body;
    
    // Access feature metadata
    console.log(`Feature: ${req.feature.name}, Tier: ${req.feature.tier}`);
    
    // Generate AI response
    const response = await aiService.generateResponse(prompt, context);
    
    return res.status(200).json({
      success: true,
      message: 'AI response generated',
      data: response,
      feature: req.feature.name
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// ====================================
// EXAMPLE 2: Multiple Features (OR Logic)
// ====================================

/**
 * Endpoint supporting multiple analysis methods
 * Users need at least one analysis feature
 */
router.post(
  '/analyze',
  authenticate,
  requireAnyFeature([FEATURES.DOCUMENT_ANALYSIS_ENABLED, FEATURES.AI_CHAT_ENABLED]),
  async (req, res) => {
    try {
      const { content } = req.body;
      const enabledFeatures = req.feature.enabledFeatures;
      
      let analysis;
      
      if (enabledFeatures.includes(FEATURES.DOCUMENT_ANALYSIS_ENABLED)) {
        // Use document analysis engine
        analysis = await documentAnalyzer.analyze(content);
      } else if (enabledFeatures.includes(FEATURES.AI_CHAT_ENABLED)) {
        // Fall back to AI chat analysis
        analysis = await aiService.analyzeWithChat(content);
      }
      
      return res.status(200).json({
        success: true,
        data: analysis,
        method: enabledFeatures[0]
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ====================================
// EXAMPLE 3: Feature Tracking (No Blocking)
// ====================================
import { trackFeatureUsage, attachFeatureInfo } from '../middleware/feature.middleware.js';

/**
 * Public endpoint that tracks feature usage for analytics
 * Doesn't require the feature, just logs if accessed
 */
router.get(
  '/documents',
  attachFeatureInfo(),
  trackFeatureUsage(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
  async (req, res) => {
    try {
      let documents = await getDocuments(req.user?.id);
      
      // Include analysis metadata if feature is available
      if (req.isFeatureAvailable(FEATURES.DOCUMENT_ANALYSIS_ENABLED)) {
        documents = documents.map(doc => ({
          ...doc,
          analysisAvailable: true
        }));
      }
      
      // Log was already captured by middleware
      console.log(`Feature usage tracked:`, req.featureUsage);
      
      return res.status(200).json({
        success: true,
        data: documents
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ====================================
// EXAMPLE 4: Rate Limited Feature
// ====================================
import { rateLimitByTier } from '../middleware/feature.middleware.js';

/**
 * Quiz generation with tier-based rate limiting
 * FREE: 2 per minute
 * PREMIUM: 50 per minute
 * ENTERPRISE: 500 per minute
 */
router.post(
  '/quiz/generate',
  authenticate,
  rateLimitByTier({
    freeLimit: 2,
    premiumLimit: 50,
    enterpriseLimit: 500
  }),
  requireFeature(FEATURES.QUIZ_GENERATION_ENABLED),
  async (req, res) => {
    try {
      const { topic, numberOfQuestions } = req.body;
      
      // Rate limit info attached by middleware
      console.log(`Rate limit - Current: ${req.rateLimitInfo.current}/${req.rateLimitInfo.limit}`);
      
      const quiz = await quizGenerator.generate(topic, numberOfQuestions);
      
      return res.status(200).json({
        success: true,
        data: quiz,
        rateLimit: {
          remaining: req.rateLimitInfo.remaining,
          limit: req.rateLimitInfo.limit,
          tier: req.rateLimitInfo.tier
        }
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ====================================
// EXAMPLE 5: Conditional Feature Display
// ====================================

/**
 * Dashboard that shows different features based on tier
 */
router.get(
  '/dashboard',
  authenticate,
  attachFeatureInfo(),
  async (req, res) => {
    try {
      const dashboardData = {
        user: {
          id: req.user.id,
          name: req.user.name,
          tier: req.tierInfo.tier
        },
        features: {
          available: req.getAvailableFeatures(),
          counts: {
            total: Object.values(req.getAvailableFeatures()).length,
            enabled: Object.values(req.getAvailableFeatures()).filter(Boolean).length
          }
        }
      };
      
      // Add tier-specific sections
      if (req.tierInfo.isPremium) {
        dashboardData.premiumFeatures = {
          aiChat: req.isFeatureAvailable(FEATURES.AI_CHAT_ENABLED),
          documentAnalysis: req.isFeatureAvailable(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
          quizGeneration: req.isFeatureAvailable(FEATURES.QUIZ_GENERATION_ENABLED)
        };
      }
      
      if (req.tierInfo.isEnterprise) {
        dashboardData.enterpriseFeatures = {
          mcp: req.isFeatureAvailable(FEATURES.MCP_ENABLED),
          pinecone: req.isFeatureAvailable(FEATURES.PINECONE_ENABLED),
          customization: true
        };
      }
      
      if (req.tierInfo.isFree) {
        dashboardData.message = 'Upgrade to Premium to unlock advanced features';
        dashboardData.upgradeUrl = '/pricing';
      }
      
      return res.status(200).json({
        success: true,
        data: dashboardData
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ====================================
// EXAMPLE 6: Admin Override
// ====================================
import { adminFeatureOverride, requireFeatureWithOverride } from '../middleware/feature.middleware.js';

/**
 * Test endpoint for admin to access paid features
 * Admins bypass feature checks
 */
router.post(
  '/admin/test-premium',
  authenticate,
  adminFeatureOverride(),
  requireFeatureWithOverride(FEATURES.AI_CHAT_ENABLED),
  async (req, res) => {
    try {
      // This endpoint works for admins even on FREE tier
      const testResult = await testPremiumFeature();
      
      return res.status(200).json({
        success: true,
        data: testResult,
        adminOverride: req.adminOverride
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ====================================
// EXAMPLE 7: Stacked Features with Tracking
// ====================================

/**
 * Complex example: tracking + rate limit + feature enforcement
 */
router.post(
  '/mcp/query',
  authenticate,
  trackFeatureUsage(FEATURES.MCP_ENABLED),
  rateLimitByTier({
    freeLimit: 0,           // Completely blocked for free
    premiumLimit: 100,
    enterpriseLimit: 2000
  }),
  requireFeature(FEATURES.MCP_ENABLED),
  async (req, res) => {
    try {
      const { query } = req.body;
      
      // Analytics data
      const analytics = {
        userId: req.user.id,
        featureName: req.featureUsage.feature,
        tier: req.user.subscriptionTier,
        rateLimit: req.rateLimitInfo
      };
      
      // Process MCP query
      const result = await mcpService.query(query);
      
      return res.status(200).json({
        success: true,
        data: result,
        _analytics: analytics
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ====================================
// EXAMPLE 8: Setup Entire Router
// ====================================

/**
 * Complete router setup with all middleware
 */
const createPremiumRouter = () => {
  const premiumRouter = express.Router();
  
  // All routes on this router require authentication + premium feature
  premiumRouter.use(authenticate);
  premiumRouter.use(adminFeatureOverride());
  premiumRouter.use(attachFeatureInfo());
  
  // AI Chat routes
  premiumRouter.post(
    '/ai-chat/generate',
    rateLimitByTier({ freeLimit: 0, premiumLimit: 100 }),
    requireFeatureWithOverride(FEATURES.AI_CHAT_ENABLED),
    aiChatRoutes
  );
  
  // Quiz routes
  premiumRouter.post(
    '/quiz/generate',
    rateLimitByTier({ freeLimit: 0, premiumLimit: 50 }),
    requireFeatureWithOverride(FEATURES.QUIZ_GENERATION_ENABLED),
    quizRoutes
  );
  
  // Document analysis routes
  premiumRouter.post(
    '/documents/analyze',
    rateLimitByTier({ freeLimit: 0, premiumLimit: 100 }),
    requireFeatureWithOverride(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
    documentRoutes
  );
  
  return premiumRouter;
};

// ====================================
// EXAMPLE 9: Endpoint Variations
// ====================================

/**
 * Same endpoint with different restrictions based on tier
 */
router.post(
  '/search',
  authenticate,
  attachFeatureInfo(),
  async (req, res) => {
    try {
      const { query, filters } = req.body;
      let results;
      
      if (req.tierInfo.isPremium && req.isFeatureAvailable(FEATURES.AI_CHAT_ENABLED)) {
        // Premium: AI-powered search
        results = await aiSearch.search(query, filters);
      } else {
        // Free: Basic search
        results = await basicSearch.search(query, filters);
      }
      
      return res.status(200).json({
        success: true,
        data: results,
        searchType: req.tierInfo.isPremium ? 'ai-powered' : 'basic'
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

// ====================================
// EXAMPLE 10: Error Handling with Graceful Degradation
// ====================================

/**
 * Feature with fallback when not available
 */
router.get(
  '/insights',
  authenticate,
  attachFeatureInfo(),
  async (req, res) => {
    try {
      const insights = {};
      
      // Advanced insights (premium only)
      if (req.isFeatureAvailable(FEATURES.DOCUMENT_ANALYSIS_ENABLED)) {
        insights.advancedAnalysis = await generateAdvancedInsights(req.user.id);
      }
      
      // AI insights (premium only)
      if (req.isFeatureAvailable(FEATURES.AI_CHAT_ENABLED)) {
        insights.aiRecommendations = await generateAIInsights(req.user.id);
      }
      
      // Basic insights (always available)
      insights.basicStats = await generateBasicStats(req.user.id);
      
      return res.status(200).json({
        success: true,
        data: insights,
        availableFeatures: req.getAvailableFeatures()
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
);

export default router;

/**
 * BEST PRACTICES CHECKLIST:
 * 
 * ✅ Always authenticate before feature checks
 * ✅ Use admin override for testing endpoints
 * ✅ Attach rate limiting before feature checks
 * ✅ Use attachFeatureInfo() for conditional logic
 * ✅ Track usage on public endpoints
 * ✅ Return clear error messages with upgrade paths
 * ✅ Log feature access for monitoring
 * ✅ Test all tier scenarios
 * ✅ Document required features in API docs
 * ✅ Use feature fallback when possible
 */
