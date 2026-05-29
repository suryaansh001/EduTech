import { logger } from '../utils/logger.utils.js';

// ==========================================
// FEATURE DEFINITIONS
// ==========================================
const FEATURES = {
  AI_CHAT_ENABLED: 'AI_CHAT_ENABLED',
  MCP_ENABLED: 'MCP_ENABLED',
  PINECONE_ENABLED: 'PINECONE_ENABLED',
  QUIZ_GENERATION_ENABLED: 'QUIZ_GENERATION_ENABLED',
  DOCUMENT_ANALYSIS_ENABLED: 'DOCUMENT_ANALYSIS_ENABLED',
};

// ==========================================
// SUBSCRIPTION TIERS
// ==========================================
const SUBSCRIPTION_TIERS = {
  FREE: 'FREE',
  PREMIUM: 'PREMIUM',
  ENTERPRISE: 'ENTERPRISE',
};

// ==========================================
// TIER FEATURE CONFIGURATIONS
// ==========================================
const TIER_FEATURES = {
  [SUBSCRIPTION_TIERS.FREE]: {
    [FEATURES.AI_CHAT_ENABLED]: false,
    [FEATURES.MCP_ENABLED]: false,
    [FEATURES.PINECONE_ENABLED]: false,
    [FEATURES.QUIZ_GENERATION_ENABLED]: false,
    [FEATURES.DOCUMENT_ANALYSIS_ENABLED]: false,
  },
  [SUBSCRIPTION_TIERS.PREMIUM]: {
    [FEATURES.AI_CHAT_ENABLED]: true,
    [FEATURES.MCP_ENABLED]: true,
    [FEATURES.PINECONE_ENABLED]: true,
    [FEATURES.QUIZ_GENERATION_ENABLED]: true,
    [FEATURES.DOCUMENT_ANALYSIS_ENABLED]: true,
  },
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {
    [FEATURES.AI_CHAT_ENABLED]: true,
    [FEATURES.MCP_ENABLED]: true,
    [FEATURES.PINECONE_ENABLED]: true,
    [FEATURES.QUIZ_GENERATION_ENABLED]: true,
    [FEATURES.DOCUMENT_ANALYSIS_ENABLED]: true,
    // Enterprise can have custom features added here
  },
};

// ==========================================
// ENVIRONMENT VARIABLE FEATURE OVERRIDES
// ==========================================
const getEnvironmentFeatureFlags = () => {
  return {
    [FEATURES.AI_CHAT_ENABLED]: process.env.AI_CHAT_ENABLED === 'true',
    [FEATURES.MCP_ENABLED]: process.env.MCP_ENABLED === 'true',
    [FEATURES.PINECONE_ENABLED]: process.env.PINECONE_ENABLED === 'true',
    [FEATURES.QUIZ_GENERATION_ENABLED]: process.env.QUIZ_GENERATION_ENABLED === 'true',
    [FEATURES.DOCUMENT_ANALYSIS_ENABLED]: process.env.DOCUMENT_ANALYSIS_ENABLED === 'true',
  };
};

// ==========================================
// UTILITY FUNCTIONS
// ==========================================

/**
 * Check if a feature is enabled for a given subscription tier
 * @param {string} feature - The feature name (from FEATURES object)
 * @param {string} tier - The subscription tier (from SUBSCRIPTION_TIERS object)
 * @param {object} envOverrides - Optional environment feature flags to override tier config
 * @returns {boolean} - Whether the feature is enabled
 */
export const isFeatureEnabledForTier = (feature, tier = SUBSCRIPTION_TIERS.PREMIUM, envOverrides = null) => {
  const overrides = envOverrides || getEnvironmentFeatureFlags();
  
  // Environment variables take precedence
  if (overrides[feature] !== undefined) {
    return overrides[feature];
  }
  
  // Fall back to tier configuration
  const tierFeatures = TIER_FEATURES[tier] || TIER_FEATURES[SUBSCRIPTION_TIERS.FREE];
  return tierFeatures[feature] || false;
};

/**
 * Get all enabled features for a given subscription tier
 * @param {string} tier - The subscription tier (from SUBSCRIPTION_TIERS object)
 * @param {object} envOverrides - Optional environment feature flags
 * @returns {object} - Object with all features and their enabled status
 */
export const getEnabledFeaturesForTier = (tier = SUBSCRIPTION_TIERS.PREMIUM, envOverrides = null) => {
  const overrides = envOverrides || getEnvironmentFeatureFlags();
  const tierFeatures = TIER_FEATURES[tier] || TIER_FEATURES[SUBSCRIPTION_TIERS.FREE];
  
  const enabledFeatures = {};
  
  Object.keys(FEATURES).forEach(featureKey => {
    const featureName = FEATURES[featureKey];
    enabledFeatures[featureName] = isFeatureEnabledForTier(featureName, tier, overrides);
  });
  
  return enabledFeatures;
};

/**
 * Get a summary of the current feature configuration
 * @returns {object} - Configuration summary including env vars and tier configs
 */
export const getFeatureConfigurationSummary = () => {
  const envFlags = getEnvironmentFeatureFlags();
  const summary = {
    environment: envFlags,
    tiers: {},
  };
  
  Object.values(SUBSCRIPTION_TIERS).forEach(tier => {
    summary.tiers[tier] = getEnabledFeaturesForTier(tier, envFlags);
  });
  
  return summary;
};

/**
 * Log feature configuration (useful for debugging)
 */
export const logFeatureConfiguration = () => {
  const config = getFeatureConfigurationSummary();
  logger.info('📋 Feature Configuration Summary:');
  logger.info('Environment Overrides:', JSON.stringify(config.environment, null, 2));
  Object.entries(config.tiers).forEach(([tier, features]) => {
    logger.info(`${tier} Tier:`, JSON.stringify(features, null, 2));
  });
};

// ==========================================
// EXPORTS
// ==========================================
export { FEATURES, SUBSCRIPTION_TIERS, TIER_FEATURES };

// Default export with current environment configuration
export default {
  FEATURES,
  SUBSCRIPTION_TIERS,
  TIER_FEATURES,
  isFeatureEnabledForTier,
  getEnabledFeaturesForTier,
  getFeatureConfigurationSummary,
  logFeatureConfiguration,
  environmentFlags: getEnvironmentFeatureFlags(),
};
