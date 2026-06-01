import { isFeatureEnabledForTier, FEATURES } from '../config/features.config.js';
import { errorResponse } from '../utils/response.utils.js';
import { logger } from '../utils/logger.utils.js';

/**
 * Middleware to verify user has access to MCP feature based on their subscription tier
 * 
 * Checks:
 * 1. User is authenticated (req.user must exist)
 * 2. MCP is enabled for their subscription tier
 * 
 * If checks fail, returns 403 Forbidden with informative message
 */
export const requireMCPAccess = (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      logger.warn('[MCP Access] Unauthorized request to MCP endpoint');
      return errorResponse(res, 'Authentication required', 401);
    }

    // Get user's subscription tier (default to FREE)
    const userTier = req.user.subscriptionTier || 'FREE';
    
    // Check if MCP is enabled for this tier
    const mcpEnabled = isFeatureEnabledForTier(FEATURES.MCP_ENABLED, userTier);
    
    if (!mcpEnabled) {
      logger.warn(`[MCP Access] Denied for ${userTier} tier user: ${req.user.id}`);
      return errorResponse(
        res,
        'MCP service is not available in your current tier. Upgrade to Premium to access this feature.',
        403
      );
    }

    // Access granted
    logger.debug(`[MCP Access] Granted for ${userTier} tier user: ${req.user.id}`);
    next();
  } catch (error) {
    logger.error('[MCP Access] Error checking tier access:', error);
    return errorResponse(res, 'Error checking access permissions', 500);
  }
};

export default { requireMCPAccess };
