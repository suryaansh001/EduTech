# Feature Flags - Implementation Examples

This document provides practical code examples for integrating the feature flag system throughout the EduTech backend.

## 1. Express Middleware - Feature Access Control

```javascript
// src/middleware/features.middleware.js
import { isFeatureEnabledForTier, SUBSCRIPTION_TIERS } from '../config/features.config.js';

export const requireFeature = (featureName) => {
  return (req, res, next) => {
    // Get user tier from authenticated user (default to FREE)
    const userTier = req.user?.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    
    // Check if feature is enabled for user's tier
    if (!isFeatureEnabledForTier(featureName, userTier)) {
      return res.status(403).json({
        success: false,
        error: 'Feature not available for your subscription tier',
        feature: featureName,
        currentTier: userTier,
        requiredTier: 'PREMIUM or higher',
      });
    }
    
    next();
  };
};

export const requireFeatures = (featureNames) => {
  return (req, res, next) => {
    const userTier = req.user?.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    
    const missingFeatures = featureNames.filter(
      feature => !isFeatureEnabledForTier(feature, userTier)
    );
    
    if (missingFeatures.length > 0) {
      return res.status(403).json({
        success: false,
        error: 'One or more required features are not available',
        missingFeatures,
        currentTier: userTier,
      });
    }
    
    next();
  };
};
```

## 2. Using in Routes

```javascript
// src/routes/ai.routes.js
import express from 'express';
import { requireFeature, requireFeatures } from '../middleware/features.middleware.js';
import { authenticate } from '../middleware/auth.middleware.js';
import { FEATURES } from '../config/features.config.js';
import * as aiController from '../controllers/ai.controller.js';

const router = express.Router();

// Protect AI Chat route - require AI_CHAT_ENABLED feature
router.post(
  '/chat',
  authenticate,
  requireFeature(FEATURES.AI_CHAT_ENABLED),
  aiController.sendMessage
);

// Protect Quiz Generation - can require multiple features
router.post(
  '/generate-quiz',
  authenticate,
  requireFeatures([FEATURES.QUIZ_GENERATION_ENABLED]),
  aiController.generateQuiz
);

// Protect Document Analysis - might need Pinecone enabled too
router.post(
  '/analyze-document',
  authenticate,
  requireFeatures([FEATURES.DOCUMENT_ANALYSIS_ENABLED, FEATURES.PINECONE_ENABLED]),
  aiController.analyzeDocument
);

// Public endpoint - no feature check needed
router.get('/features', (req, res) => {
  // Users can see what features they have access to
  const userTier = req.user?.subscriptionTier || 'FREE';
  const { getEnabledFeaturesForTier } = await import('../config/features.config.js');
  const features = getEnabledFeaturesForTier(userTier);
  res.json(features);
});

export default router;
```

## 3. Service Layer - Feature-Based Logic

```javascript
// src/services/ai.service.js
import { isFeatureEnabledForTier, SUBSCRIPTION_TIERS } from '../config/features.config.js';

export class AIService {
  async initializeUserSession(userId, userTier) {
    const capabilities = {};
    
    // Initialize only enabled features for user's tier
    if (isFeatureEnabledForTier('AI_CHAT_ENABLED', userTier)) {
      capabilities.aiChat = await this.initializeChatEngine();
    }
    
    if (isFeatureEnabledForTier('PINECONE_ENABLED', userTier)) {
      capabilities.vectorDB = await this.initializePinecone();
    }
    
    if (isFeatureEnabledForTier('QUIZ_GENERATION_ENABLED', userTier)) {
      capabilities.quizGen = await this.initializeQuizGenerator();
    }
    
    return capabilities;
  }
  
  async processMessage(userId, message, userTier) {
    // Check feature availability before processing
    if (!isFeatureEnabledForTier('AI_CHAT_ENABLED', userTier)) {
      throw new Error('AI Chat not available for your subscription tier');
    }
    
    // Use MCP if available
    if (isFeatureEnabledForTier('MCP_ENABLED', userTier)) {
      return await this.processWithMCP(message);
    }
    
    // Fallback to basic AI processing
    return await this.processWithBasicAI(message);
  }
  
  async generateQuiz(courseId, userTier) {
    if (!isFeatureEnabledForTier('QUIZ_GENERATION_ENABLED', userTier)) {
      throw new Error('Quiz generation not available for your subscription tier');
    }
    
    // Quiz generation logic here
    return await this.createQuiz(courseId);
  }
}
```

## 4. Controller - Exposing Feature Information

```javascript
// src/controllers/features.controller.js
import {
  FEATURES,
  SUBSCRIPTION_TIERS,
  getEnabledFeaturesForTier,
  getFeatureConfigurationSummary,
} from '../config/features.config.js';

export const getUserFeatures = (req, res) => {
  try {
    const userTier = req.user?.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    const enabledFeatures = getEnabledFeaturesForTier(userTier);
    
    res.json({
      success: true,
      tier: userTier,
      features: enabledFeatures,
      allFeatures: FEATURES,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getFeatureStatus = (req, res) => {
  try {
    const { feature } = req.params;
    const userTier = req.user?.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    
    if (!Object.values(FEATURES).includes(feature)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid feature name',
      });
    }
    
    const { isFeatureEnabledForTier } = await import('../config/features.config.js');
    const enabled = isFeatureEnabledForTier(feature, userTier);
    
    res.json({
      success: true,
      feature,
      enabled,
      tier: userTier,
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

export const getAdminConfiguration = (req, res) => {
  try {
    // Admin only - requires admin middleware
    const config = getFeatureConfigurationSummary();
    
    res.json({
      success: true,
      configuration: config,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};
```

## 5. Frontend API Integration

```javascript
// frontend/hooks/useFeatures.js
import { useAuth } from './useAuth';
import { useEffect, useState } from 'react';

export const useFeatures = () => {
  const { user } = useAuth();
  const [features, setFeatures] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFeatures = async () => {
      try {
        const response = await fetch('/api/features', {
          headers: {
            'Authorization': `Bearer ${user.token}`,
          },
        });
        const data = await response.json();
        setFeatures(data.features);
      } catch (error) {
        console.error('Failed to fetch features:', error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchFeatures();
    }
  }, [user]);

  return {
    features,
    loading,
    canUse: (featureName) => features[featureName] || false,
  };
};

// Usage in component
export const ChatComponent = () => {
  const { canUse, loading } = useFeatures();

  if (loading) return <div>Loading features...</div>;

  if (!canUse('AI_CHAT_ENABLED')) {
    return <div>AI Chat is not available in your plan</div>;
  }

  return <ChatUI />;
};
```

## 6. Database - User Model Extension

```javascript
// prisma/schema.prisma
model User {
  id                    String     @id @default(cuid())
  email                 String     @unique
  password              String
  name                  String?
  
  // Subscription tier for feature access
  subscriptionTier      String     @default("FREE")  // FREE, PREMIUM, ENTERPRISE
  
  createdAt             DateTime   @default(now())
  updatedAt             DateTime   @updatedAt
}
```

## 7. Testing Feature Flags

```javascript
// tests/features.test.js
import { describe, it, expect, beforeEach } from 'vitest';
import {
  isFeatureEnabledForTier,
  getEnabledFeaturesForTier,
  FEATURES,
  SUBSCRIPTION_TIERS,
} from '../src/config/features.config.js';

describe('Feature Flags', () => {
  describe('Tier Access Control', () => {
    it('FREE tier has no AI features', () => {
      const features = getEnabledFeaturesForTier(SUBSCRIPTION_TIERS.FREE);
      Object.values(features).forEach(enabled => {
        expect(enabled).toBe(false);
      });
    });

    it('PREMIUM tier has all AI features', () => {
      const features = getEnabledFeaturesForTier(SUBSCRIPTION_TIERS.PREMIUM);
      Object.values(features).forEach(enabled => {
        expect(enabled).toBe(true);
      });
    });

    it('ENTERPRISE tier has all AI features', () => {
      const features = getEnabledFeaturesForTier(SUBSCRIPTION_TIERS.ENTERPRISE);
      Object.values(features).forEach(enabled => {
        expect(enabled).toBe(true);
      });
    });
  });

  describe('Feature Checking', () => {
    it('correctly checks if feature is enabled', () => {
      expect(isFeatureEnabledForTier(FEATURES.AI_CHAT_ENABLED, SUBSCRIPTION_TIERS.PREMIUM)).toBe(true);
      expect(isFeatureEnabledForTier(FEATURES.AI_CHAT_ENABLED, SUBSCRIPTION_TIERS.FREE)).toBe(false);
    });

    it('environment overrides take precedence', () => {
      const envOverrides = {
        AI_CHAT_ENABLED: true,
        MCP_ENABLED: false,
        PINECONE_ENABLED: false,
        QUIZ_GENERATION_ENABLED: false,
        DOCUMENT_ANALYSIS_ENABLED: false,
      };
      
      expect(isFeatureEnabledForTier(FEATURES.AI_CHAT_ENABLED, SUBSCRIPTION_TIERS.FREE, envOverrides)).toBe(true);
    });
  });
});
```

## 8. Error Handling Pattern

```javascript
// src/utils/featureCheck.utils.js
import { isFeatureEnabledForTier, SUBSCRIPTION_TIERS } from '../config/features.config.js';

export class FeatureNotAvailableError extends Error {
  constructor(feature, tier) {
    super(`Feature '${feature}' is not available for tier '${tier}'`);
    this.name = 'FeatureNotAvailableError';
    this.feature = feature;
    this.tier = tier;
  }
}

export const assertFeatureAvailable = (feature, userTier) => {
  if (!isFeatureEnabledForTier(feature, userTier)) {
    throw new FeatureNotAvailableError(feature, userTier);
  }
};

// Usage in try-catch
try {
  assertFeatureAvailable('AI_CHAT_ENABLED', user.subscriptionTier);
  // Process chat message
} catch (error) {
  if (error instanceof FeatureNotAvailableError) {
    logger.warn(`User tried to use unavailable feature: ${error.feature}`);
    // Return appropriate error response
  }
}
```

## 9. Configuration Loading Pattern

```javascript
// src/app.js
import { logFeatureConfiguration } from './config/features.config.js';

// Log feature configuration on app startup
const initializeApp = async () => {
  // ... other initialization code ...
  
  // Log feature configuration in development
  if (process.env.NODE_ENV === 'development') {
    logFeatureConfiguration();
  }
};
```

## 10. Monitoring & Analytics

```javascript
// src/middleware/featureUsage.middleware.js
import { logger } from '../utils/logger.utils.js';

export const trackFeatureUsage = (featureName) => {
  return (req, res, next) => {
    const userTier = req.user?.subscriptionTier || 'FREE';
    
    logger.info('Feature Usage', {
      feature: featureName,
      user: req.user?.id,
      tier: userTier,
      timestamp: new Date().toISOString(),
    });
    
    // Track in analytics/monitoring system
    // analyticsService.track('feature_used', {
    //   feature: featureName,
    //   tier: userTier,
    //   userId: req.user?.id,
    // });
    
    next();
  };
};

// Usage in routes
router.post(
  '/chat',
  authenticate,
  requireFeature(FEATURES.AI_CHAT_ENABLED),
  trackFeatureUsage('AI_CHAT_ENABLED'),
  aiController.sendMessage
);
```

## 11. Admin Dashboard Endpoint

```javascript
// src/routes/admin.routes.js
import { requireAdmin } from '../middleware/admin.middleware.js';
import { getFeatureConfigurationSummary } from '../config/features.config.js';

router.get('/admin/features/config', requireAdmin, (req, res) => {
  const config = getFeatureConfigurationSummary();
  res.json({
    success: true,
    data: config,
    serverTime: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});
```

---

**Note:** These examples assume you have proper authentication and error handling middleware in place. Always validate user tier from the authenticated user object, never from user input.
