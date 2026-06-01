/**
 * AI Service Factory
 * 
 * Central factory for creating and configuring AI services based on user tier and features.
 * Handles:
 * - Feature flag-based service selection (enabled/disabled per tier)
 * - Tier-based service configuration (Free, Premium, Enterprise)
 * - Service configuration management
 * - Instance pooling and reuse
 * - Fallback to NoOp services when features are unavailable
 * 
 * This pattern allows decoupling service instantiation from usage,
 * making it easy to swap implementations or disable features.
 */

import { BaseAIService, NotImplementedError } from './base.service.js';
import { NoOpAIService, createNoOpService } from './noop.service.js';
import {
  isFeatureEnabledForTier,
  FEATURES,
  SUBSCRIPTION_TIERS,
} from '../../config/features.config.js';
import { logger } from '../../utils/logger.utils.js';

/**
 * Service registry for mapping service names to their implementations
 * Populated during factory initialization with actual service classes
 * 
 * @type {Map<string, Function>}
 * @private
 */
const SERVICE_REGISTRY = new Map();

/**
 * Cached service instances organized by tier and service name
 * Prevents unnecessary service recreation
 * 
 * @type {Object}
 * @private
 */
const SERVICE_CACHE = {
  [SUBSCRIPTION_TIERS.FREE]: {},
  [SUBSCRIPTION_TIERS.PREMIUM]: {},
  [SUBSCRIPTION_TIERS.ENTERPRISE]: {}
};

/**
 * Service initialization status tracker
 * @type {Object}
 * @private
 */
const INITIALIZATION_STATUS = {
  initialized: false,
  services: {},
  errors: []
};

/**
 * Feature to service mapping
 * Maps feature flags to service names for lookup
 * @type {Object}
 * @private
 */
const FEATURE_SERVICE_MAP = {
  [FEATURES.AI_CHAT_ENABLED]: 'chat',
  [FEATURES.MCP_ENABLED]: 'mcp',
  [FEATURES.PINECONE_ENABLED]: 'rag',
  [FEATURES.QUIZ_GENERATION_ENABLED]: 'quiz',
  [FEATURES.DOCUMENT_ANALYSIS_ENABLED]: 'document-analysis',
};

/**
 * Register an AI service implementation
 * 
 * Called during app initialization to register actual service implementations.
 * Only registered services can be instantiated by the factory.
 * 
 * @param {string} serviceName - Unique identifier for the service (e.g., 'chat', 'mcp', 'quiz')
 * @param {Function} ServiceClass - Service class (must extend BaseAIService)
 * @throws {TypeError} If ServiceClass doesn't extend BaseAIService
 * 
 * @example
 * registerService('quiz', QuizGenerationService);
 * registerService('mcp', MCPService);
 */
export function registerService(serviceName, ServiceClass) {
  try {
    if (!(ServiceClass.prototype instanceof BaseAIService || ServiceClass === BaseAIService)) {
      throw new TypeError(
        `Service '${serviceName}' must extend BaseAIService. Got: ${ServiceClass.name}`
      );
    }
    
    SERVICE_REGISTRY.set(serviceName, ServiceClass);
    logger.info(`[ServiceFactory] Registered service: ${serviceName}`);
  } catch (error) {
    logger.error(`[ServiceFactory] Failed to register service ${serviceName}:`, error.message);
    throw error;
  }
}

/**
 * Create or retrieve a cached AI service instance
 * 
 * Returns appropriate service based on:
 * 1. User tier (FREE/PREMIUM/ENTERPRISE)
 * 2. Feature flag for the service
 * 3. Service registration status
 * 4. Cached instance (if exists)
 * 
 * Returns NoOp service if:
 * - Feature is disabled for user tier
 * - Service is not registered
 * - Initialization fails (graceful degradation)
 * 
 * @param {string} serviceName - Name of the service to create
 * @param {string} userTier - User subscription tier (defaults to FREE)
 * @param {Object} config - Service configuration
 * @param {Object} config.logger - Logger instance for service
 * @param {boolean} config.forceNoOp - Force NoOp service regardless of tier
 * @returns {BaseAIService} Service instance or NoOp fallback
 * 
 * @example
 * // Get MCP service for premium user
 * const mcpService = createAIService('mcp', SUBSCRIPTION_TIERS.PREMIUM, {
 *   logger: myLogger
 * });
 * 
 * // Get service for free user (will be NoOp if feature disabled)
 * const chatService = createAIService('chat', SUBSCRIPTION_TIERS.FREE);
 */
export function createAIService(serviceName, userTier = SUBSCRIPTION_TIERS.FREE, config = {}) {
  try {
    // Normalize and validate tier
    const tier = (userTier || SUBSCRIPTION_TIERS.FREE).toUpperCase();
    const validTiers = Object.values(SUBSCRIPTION_TIERS);
    
    if (!validTiers.includes(tier)) {
      logger.warn(`Invalid user tier: ${userTier}. Defaulting to FREE`);
      return createAIService(serviceName, SUBSCRIPTION_TIERS.FREE, config);
    }

    // Check cache first
    if (SERVICE_CACHE[tier][serviceName]) {
      logger.debug(`[ServiceFactory] Retrieved cached service: ${serviceName} for tier: ${tier}`);
      return SERVICE_CACHE[tier][serviceName];
    }

    // Check if feature is enabled for this tier
    const feature = Object.entries(FEATURE_SERVICE_MAP).find(([_, svc]) => svc === serviceName)?.[0];
    const forceNoOp = config.forceNoOp || !isFeatureEnabledForTier(feature || serviceName, tier);

    if (forceNoOp) {
      logger.info(`[ServiceFactory] Feature disabled or not available for ${serviceName} in ${tier} tier`);
      const noOpService = createNoOpService(serviceName, config);
      SERVICE_CACHE[tier][serviceName] = noOpService;
      return noOpService;
    }

    // Check if service is registered
    if (!SERVICE_REGISTRY.has(serviceName)) {
      logger.warn(
        `[ServiceFactory] Service '${serviceName}' not registered. ` +
        `Available services: ${Array.from(SERVICE_REGISTRY.keys()).join(', ')}`
      );
      const noOpService = createNoOpService(serviceName, config);
      SERVICE_CACHE[tier][serviceName] = noOpService;
      return noOpService;
    }

    // Create service instance with merged config
    const ServiceClass = SERVICE_REGISTRY.get(serviceName);
    const serviceConfig = {
      ...config,
      serviceName,
      tier,
      logger: config.logger || logger
    };

    const service = new ServiceClass(serviceConfig);
    logger.info(`[ServiceFactory] Created service instance: ${serviceName} for tier: ${tier}`);

    // Cache the instance
    SERVICE_CACHE[tier][serviceName] = service;

    return service;
  } catch (error) {
    logger.error(`[ServiceFactory] Error creating service ${serviceName}:`, error.message);
    // Return NoOp service for graceful degradation
    return createNoOpService(serviceName, config);
  }
}

/**
 * Initialize all services for a specific tier
 * 
 * Called on application startup to pre-initialize services.
 * Gracefully handles initialization failures without crashing.
 * 
 * @async
 * @param {Array<string>} serviceNames - Services to initialize
 * @param {string} tier - Subscription tier to initialize for
 * @param {Object} config - Configuration for services
 * @returns {Promise<Object>} Initialization results with success/failure status
 * 
 * @example
 * await initializeServicesForTier(['chat', 'mcp', 'quiz'], SUBSCRIPTION_TIERS.PREMIUM);
 */
export async function initializeServicesForTier(serviceNames = [], tier = SUBSCRIPTION_TIERS.PREMIUM, config = {}) {
  const results = {};
  logger.info(`[ServiceFactory] Initializing services for tier: ${tier}`);

  for (const serviceName of serviceNames) {
    try {
      const service = createAIService(serviceName, tier, config);
      
      // Initialize if not already initialized
      if (service.initialized === false && typeof service.initialize === 'function') {
        await service.initialize();
        logger.info(`[ServiceFactory] Initialized service: ${serviceName} for ${tier}`);
      }
      
      results[serviceName] = { 
        success: true, 
        message: 'Initialized successfully' 
      };
      INITIALIZATION_STATUS.services[`${serviceName}-${tier}`] = 'ready';
    } catch (error) {
      logger.warn(
        `[ServiceFactory] Service ${serviceName} failed to initialize for ${tier}:`,
        error.message
      );
      results[serviceName] = { 
        success: false, 
        message: error.message 
      };
      INITIALIZATION_STATUS.errors.push({
        service: serviceName,
        tier,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Get current initialization status
 * 
 * Useful for health checks and debugging
 * 
 * @returns {Object} Initialization status details
 */
export function getInitializationStatus() {
  return {
    ...INITIALIZATION_STATUS,
    totalErrors: INITIALIZATION_STATUS.errors.length
  };
}

/**
 * Get status of all services for a tier
 * 
 * Useful for health checks and monitoring
 * 
 * @async
 * @param {string} tier - User tier to check services for
 * @returns {Promise<Object>} Status of all services for that tier
 * 
 * @example
 * const status = await getServicesStatus(SUBSCRIPTION_TIERS.PREMIUM);
 */
export async function getServicesStatus(tier = SUBSCRIPTION_TIERS.PREMIUM) {
  const status = {};
  const cachedServices = SERVICE_CACHE[tier] || {};

  for (const [serviceName, service] of Object.entries(cachedServices)) {
    try {
      if (typeof service.getStatus === 'function') {
        status[serviceName] = await service.getStatus();
      } else {
        status[serviceName] = {
          healthy: false,
          message: 'Service does not support status checks'
        };
      }
    } catch (error) {
      status[serviceName] = {
        healthy: false,
        message: `Failed to get status: ${error.message}`
      };
    }
  }

  return status;
}

/**
 * Shutdown all services gracefully
 * 
 * Called on application shutdown to clean up connections and resources
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function shutdownAllServices() {
  logger.info('[ServiceFactory] Shutting down all services...');
  const promises = [];

  for (const tierCache of Object.values(SERVICE_CACHE)) {
    for (const service of Object.values(tierCache)) {
      if (typeof service.shutdown === 'function') {
        promises.push(
          service.shutdown().catch(err => {
            logger.error(`[ServiceFactory] Error shutting down ${service.serviceName}:`, err.message);
          })
        );
      }
    }
  }

  await Promise.all(promises);
  logger.info('[ServiceFactory] All services shut down');
  INITIALIZATION_STATUS.initialized = false;
}

/**
 * Clear service cache
 * 
 * Useful for testing or forcing service recreation
 * 
 * @param {string} tier - Tier to clear cache for (all tiers if not specified)
 */
export function clearServiceCache(tier) {
  if (tier) {
    SERVICE_CACHE[tier] = {};
    logger.debug(`[ServiceFactory] Cleared cache for tier: ${tier}`);
  } else {
    SERVICE_CACHE[SUBSCRIPTION_TIERS.FREE] = {};
    SERVICE_CACHE[SUBSCRIPTION_TIERS.PREMIUM] = {};
    SERVICE_CACHE[SUBSCRIPTION_TIERS.ENTERPRISE] = {};
    logger.debug('[ServiceFactory] Cleared all service caches');
  }
}

/**
 * Get all registered services
 * 
 * @returns {Array<string>} List of registered service names
 */
export function getRegisteredServices() {
  return Array.from(SERVICE_REGISTRY.keys());
}

/**
 * Check if a service is available for a tier
 * 
 * @param {string} serviceName - Service name
 * @param {string} tier - User tier
 * @returns {boolean} Whether the service is available
 */
export function isServiceAvailable(serviceName, tier = SUBSCRIPTION_TIERS.PREMIUM) {
  const feature = Object.entries(FEATURE_SERVICE_MAP).find(([_, svc]) => svc === serviceName)?.[0];
  return isFeatureEnabledForTier(feature || serviceName, tier);
}

// Export cache and registry for advanced use cases
export { SERVICE_CACHE, SERVICE_REGISTRY, SUBSCRIPTION_TIERS, FEATURES };
