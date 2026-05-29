/**
 * Feature flag constants and tier definitions
 * Use these to avoid string typos and maintain consistency across the app
 */

// Feature names - use these constants to check if features are enabled
export const FEATURES = {
  AI_CHAT: 'AI_CHAT',
  QUIZ_GENERATION: 'QUIZ_GENERATION',
  DOCUMENT_ANALYSIS: 'DOCUMENT_ANALYSIS',
  BATCH_OPERATIONS: 'BATCH_OPERATIONS',
  ADVANCED_ANALYTICS: 'ADVANCED_ANALYTICS',
  CUSTOM_BRANDING: 'CUSTOM_BRANDING',
  API_ACCESS: 'API_ACCESS',
}

// User tier constants
export const TIERS = {
  FREE: 'free',
  PREMIUM: 'premium',
  ENTERPRISE: 'enterprise',
}

// Feature availability by tier
// Defines which features are available for each user tier
export const TIER_FEATURES = {
  [TIERS.FREE]: [
    FEATURES.AI_CHAT,
  ],
  [TIERS.PREMIUM]: [
    FEATURES.AI_CHAT,
    FEATURES.QUIZ_GENERATION,
    FEATURES.DOCUMENT_ANALYSIS,
    FEATURES.BATCH_OPERATIONS,
  ],
  [TIERS.ENTERPRISE]: [
    FEATURES.AI_CHAT,
    FEATURES.QUIZ_GENERATION,
    FEATURES.DOCUMENT_ANALYSIS,
    FEATURES.BATCH_OPERATIONS,
    FEATURES.ADVANCED_ANALYTICS,
    FEATURES.CUSTOM_BRANDING,
    FEATURES.API_ACCESS,
  ],
}

// Default tier for new users
export const DEFAULT_TIER = TIERS.FREE
