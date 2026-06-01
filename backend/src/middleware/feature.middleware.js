import { isFeatureEnabledForTier, FEATURES, SUBSCRIPTION_TIERS } from '../config/features.config.js';
import { logger } from '../utils/logger.utils.js';

/**
 * Require a specific feature for the user's subscription tier
 * Returns 403 if feature is disabled, 402 if user is on free tier
 * @param {string} featureName - Feature name from FEATURES config
 * @returns {Function} Express middleware
 */
export const requireFeature = (featureName) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access this feature',
          timestamp: new Date().toISOString()
        });
      }

      // Get user's subscription tier (default to FREE)
      const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

      // Check if feature is enabled for the user's tier
      const isFeatureEnabled = isFeatureEnabledForTier(featureName, userTier);

      // If feature is enabled, continue
      if (isFeatureEnabled) {
        // Attach feature metadata to request
        req.feature = {
          name: featureName,
          enabled: true,
          tier: userTier,
          checkedAt: new Date().toISOString()
        };

        // Log feature access
        logger.debug(`✅ Feature access granted: ${featureName} for user ${req.user.id} (${userTier})`);
        return next();
      }

      // Feature is disabled
      const statusCode = userTier === SUBSCRIPTION_TIERS.FREE ? 402 : 403;
      const message = userTier === SUBSCRIPTION_TIERS.FREE
        ? 'This feature is only available on Premium plan'
        : `This feature requires a higher subscription tier`;

      // Log denied feature access
      logger.warn(`❌ Feature access denied: ${featureName} for user ${req.user.id} (${userTier})`);

      // Determine required tier (assuming PREMIUM is minimum for features)
      let requiredTier = SUBSCRIPTION_TIERS.PREMIUM;
      if (featureName === FEATURES.MCP_ENABLED || featureName === FEATURES.PINECONE_ENABLED) {
        requiredTier = SUBSCRIPTION_TIERS.PREMIUM;
      }

      return res.status(statusCode).json({
        success: false,
        message,
        feature: featureName,
        currentTier: userTier,
        requiredTier,
        upgradeUrl: '/pricing',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error in requireFeature middleware: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Require at least one of multiple features (OR logic)
 * User must have access to at least one of the listed features
 * @param {string[]} featureArray - Array of feature names from FEATURES config
 * @returns {Function} Express middleware
 */
export const requireAnyFeature = (featureArray) => {
  return (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required to access this feature',
          timestamp: new Date().toISOString()
        });
      }

      // Validate input
      if (!Array.isArray(featureArray) || featureArray.length === 0) {
        logger.error('Invalid featureArray provided to requireAnyFeature');
        return res.status(500).json({
          success: false,
          message: 'Internal server error',
          timestamp: new Date().toISOString()
        });
      }

      // Get user's subscription tier
      const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

      // Check if user has access to at least one feature
      const enabledFeatures = featureArray.filter(feature =>
        isFeatureEnabledForTier(feature, userTier)
      );

      if (enabledFeatures.length > 0) {
        // Attach feature metadata to request
        req.feature = {
          name: featureArray,
          enabled: true,
          enabledFeatures,
          tier: userTier,
          checkedAt: new Date().toISOString()
        };

        logger.debug(`✅ Feature access granted: ANY of [${featureArray.join(', ')}] for user ${req.user.id} (${userTier})`);
        return next();
      }

      // No features available
      logger.warn(`❌ Feature access denied: ANY of [${featureArray.join(', ')}] for user ${req.user.id} (${userTier})`);

      return res.status(userTier === SUBSCRIPTION_TIERS.FREE ? 402 : 403).json({
        success: false,
        message: 'None of the requested features are available on your subscription tier',
        features: featureArray,
        currentTier: userTier,
        requiredTier: SUBSCRIPTION_TIERS.PREMIUM,
        upgradeUrl: '/pricing',
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      logger.error(`Error in requireAnyFeature middleware: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Track feature usage for analytics without enforcing access
 * Logs usage and attaches metadata but allows request to proceed
 * @param {string} featureName - Feature name from FEATURES config
 * @returns {Function} Express middleware
 */
export const trackFeatureUsage = (featureName) => {
  return (req, res, next) => {
    try {
      // Get user info if authenticated, otherwise use anonymous
      const userId = req.user?.id || 'anonymous';
      const userTier = req.user?.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
      const isFeatureEnabled = req.user ? isFeatureEnabledForTier(featureName, userTier) : false;

      // Attach feature usage data to request
      req.featureUsage = {
        feature: featureName,
        userId,
        tier: userTier,
        enabled: isFeatureEnabled,
        accessedAt: new Date().toISOString(),
        method: req.method,
        path: req.path
      };

      // Log feature usage
      logger.info(`📊 Feature usage tracked: ${featureName} by user ${userId} (${userTier}) - enabled: ${isFeatureEnabled}`);

      // Continue to next middleware/route without blocking
      next();
    } catch (error) {
      logger.error(`Error in trackFeatureUsage middleware: ${error.message}`);
      // Don't block the request on tracking error
      next();
    }
  };
};

/**
 * Attach feature availability info to request for use in route handlers
 * This is informational and doesn't enforce access
 * @returns {Function} Express middleware
 */
export const attachFeatureInfo = () => {
  return (req, res, next) => {
    try {
      const userTier = req.user?.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

      // Create helper function to check feature availability
      req.isFeatureAvailable = (featureName) => {
        return isFeatureEnabledForTier(featureName, userTier);
      };

      // Create helper function to get all available features
      req.getAvailableFeatures = () => {
        const available = {};
        Object.entries(FEATURES).forEach(([key, featureName]) => {
          available[featureName] = isFeatureEnabledForTier(featureName, userTier);
        });
        return available;
      };

      // Attach tier info
      req.tierInfo = {
        tier: userTier,
        isFree: userTier === SUBSCRIPTION_TIERS.FREE,
        isPremium: userTier === SUBSCRIPTION_TIERS.PREMIUM,
        isEnterprise: userTier === SUBSCRIPTION_TIERS.ENTERPRISE
      };

      next();
    } catch (error) {
      logger.error(`Error in attachFeatureInfo middleware: ${error.message}`);
      next();
    }
  };
};

/**
 * Rate limiting per subscription tier
 * Prevents abuse by limiting requests based on tier
 * @param {Object} options - Configuration options
 * @param {number} options.freeLimit - Requests per minute for free tier (default: 10)
 * @param {number} options.premiumLimit - Requests per minute for premium tier (default: 100)
 * @param {number} options.enterpriseLimit - Requests per minute for enterprise tier (default: 1000)
 * @returns {Function} Express middleware
 */
export const rateLimitByTier = (options = {}) => {
  const {
    freeLimit = 10,
    premiumLimit = 100,
    enterpriseLimit = 1000
  } = options;

  // Store request counts (in production, use Redis)
  const requestCounts = new Map();

  return (req, res, next) => {
    try {
      const userId = req.user?.id || req.ip;
      const userTier = req.user?.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

      // Determine limit based on tier
      let limit;
      switch (userTier) {
        case SUBSCRIPTION_TIERS.PREMIUM:
          limit = premiumLimit;
          break;
        case SUBSCRIPTION_TIERS.ENTERPRISE:
          limit = enterpriseLimit;
          break;
        case SUBSCRIPTION_TIERS.FREE:
        default:
          limit = freeLimit;
      }

      // Get current request count (reset every minute)
      const now = Math.floor(Date.now() / 60000);
      const key = `${userId}:${now}`;
      const count = requestCounts.get(key) || 0;

      if (count >= limit) {
        logger.warn(`⚠️ Rate limit exceeded for user ${userId} (${userTier}): ${count}/${limit}`);
        return res.status(429).json({
          success: false,
          message: `Rate limit exceeded. Maximum ${limit} requests per minute for ${userTier} tier`,
          tier: userTier,
          limit,
          retryAfter: 60,
          timestamp: new Date().toISOString()
        });
      }

      // Increment counter
      requestCounts.set(key, count + 1);

      // Attach rate limit info to request
      req.rateLimitInfo = {
        tier: userTier,
        limit,
        current: count + 1,
        remaining: limit - (count + 1)
      };

      next();
    } catch (error) {
      logger.error(`Error in rateLimitByTier middleware: ${error.message}`);
      next();
    }
  };
};

/**
 * Allow admin override of feature restrictions
 * Should be used after authentication middleware to grant admins bypass access
 * @returns {Function} Express middleware
 */
export const adminFeatureOverride = () => {
  return (req, res, next) => {
    try {
      if (req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN') {
        // Mark this request as admin-overridden
        req.adminOverride = true;
        logger.info(`🔓 Admin override applied for user ${req.user.id}`);
      }
      next();
    } catch (error) {
      logger.error(`Error in adminFeatureOverride middleware: ${error.message}`);
      next();
    }
  };
};

/**
 * Modify requireFeature to respect admin override
 * Enhanced version that checks for admin override
 */
export const requireFeatureWithOverride = (featureName) => {
  return (req, res, next) => {
    try {
      // Check if admin override is active
      if (req.adminOverride) {
        req.feature = {
          name: featureName,
          enabled: true,
          tier: req.user?.subscriptionTier || SUBSCRIPTION_TIERS.FREE,
          adminOverride: true,
          checkedAt: new Date().toISOString()
        };
        logger.debug(`🔓 Feature access granted via admin override: ${featureName} for user ${req.user.id}`);
        return next();
      }

      // Otherwise use normal feature check (delegate to requireFeature)
      return requireFeature(featureName)(req, res, next);
    } catch (error) {
      logger.error(`Error in requireFeatureWithOverride middleware: ${error.message}`);
      return res.status(500).json({
        success: false,
        message: 'Internal server error',
        timestamp: new Date().toISOString()
      });
    }
  };
};

// Export all utilities as a single object for convenience
export const featureMiddleware = {
  requireFeature,
  requireAnyFeature,
  trackFeatureUsage,
  attachFeatureInfo,
  rateLimitByTier,
  adminFeatureOverride,
  requireFeatureWithOverride
};

export default featureMiddleware;
