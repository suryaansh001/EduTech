/**
 * AI Service Factory
 * 
 * Central factory for creating and configuring AI services based on user tier.
 * Handles:
 * - Tier-based service selection (Free, Premium, Enterprise)
 * - Service configuration management
 * - Instance pooling and reuse
 * - Fallback to NoOp services when features are unavailable
 * 
 * This pattern allows decoupling service instantiation from usage,
 * making it easy to swap implementations or disable features.
 */

import { BaseAIService, NotImplementedError } from './base.service.js';
import { NoOpAIService, createNoOpService } from './noop.service.js';

/**
 * Service registry for mapping service names to their implementations
 * Will be populated with actual service classes in next phase
 * 
 * @type {Map<string, Function>}
 * @private
 */
const SERVICE_REGISTRY = new Map();

/**
 * Cached service instances organized by tier and service name
 * 
 * @type {Object}
 * @private
 */
const SERVICE_CACHE = {
  free: {},
  premium: {},
  enterprise: {}
};

/**
 * Feature availability by tier
 * 
 * Defines which features are available for each user tier.
 * Can be overridden via config during factory initialization.
 * 
 * @type {Object}
 */
export const TIER_FEATURES = {
  free: {
    // Free tier has limited AI features
    quizGeneration: false,
    documentAnalysis: false,
    ragService: false,
    contentGeneration: false,
    advancedChat: false
  },
  premium: {
    // Premium tier has most AI features
    quizGeneration: true,
    documentAnalysis: true,
    ragService: true,
    contentGeneration: true,
    advancedChat: true
  },
  enterprise: {
    // Enterprise tier has all features plus extended capabilities
    quizGeneration: true,
    documentAnalysis: true,
    ragService: true,
    contentGeneration: true,
    advancedChat: true,
    customModels: true,
    dedicatedSupport: true
  }
};

/**
 * Register an AI service implementation
 * 
 * Called during app initialization to register actual service implementations.
 * 
 * @param {string} serviceName - Unique identifier for the service
 * @param {Function} ServiceClass - Service class (must extend BaseAIService)
 * @throws {TypeError} If ServiceClass doesn't extend BaseAIService
 * 
 * @example
 * registerService('quiz', QuizGenerationService);
 * registerService('rag', RAGService);
 * registerService('chat', AdvancedChatService);
 */
export function registerService(serviceName, ServiceClass) {
  if (!(ServiceClass.prototype instanceof BaseAIService || ServiceClass === BaseAIService)) {
    throw new TypeError(
      `Service '${serviceName}' must extend BaseAIService. ` +
      `Got: ${ServiceClass.name}`
    );
  }
  
  SERVICE_REGISTRY.set(serviceName, ServiceClass);
  console.log(`[ServiceFactory] Registered service: ${serviceName}`);
}

/**
 * Create or retrieve a cached AI service instance
 * 
 * Returns appropriate service based on:
 * 1. User tier (free/premium/enterprise)
 * 2. Feature availability for that tier
 * 3. Service configuration
 * 
 * Returns NoOp service if feature is not available for the user tier.
 * Caches instances to avoid recreating them.
 * 
 * @param {string} serviceName - Name of the service to create
 * @param {string} userTier - User subscription tier (free/premium/enterprise)
 * @param {Object} config - Service configuration
 * @param {Object} config.logger - Logger instance
 * @param {Object} config.featureOverrides - Override feature availability
 * @param {boolean} config.forceNoOp - Force NoOp service regardless of tier
 * @returns {BaseAIService} Service instance or NoOp fallback
 * 
 * @throws {Error} If service is not registered
 * 
 * @example
 * // Get quiz service for premium user
 * const quizService = createAIService('quiz', 'premium', {
 *   logger: myLogger,
 *   apiKey: process.env.QUIZ_SERVICE_KEY
 * });
 * 
 * // Get chat service, will be NoOp for free tier
 * const chatService = createAIService('chat', 'free');
 * const response = await chatService.sendMessage('hello');
 * // Returns: { success: false, message: '...' }
 */
export function createAIService(serviceName, userTier = 'free', config = {}) {
  // Normalize tier
  const tier = (userTier || 'free').toLowerCase();
  if (!['free', 'premium', 'enterprise'].includes(tier)) {
    throw new Error(`Invalid user tier: ${userTier}. Must be one of: free, premium, enterprise`);
  }

  // Check cache first
  const cacheKey = `${serviceName}-${tier}`;
  if (SERVICE_CACHE[tier][serviceName]) {
    return SERVICE_CACHE[tier][serviceName];
  }

  // Get feature availability for this tier
  const featureOverrides = config.featureOverrides || {};
  const tierFeatures = {
    ...TIER_FEATURES[tier],
    ...featureOverrides
  };

  // Convert camelCase to snake_case for feature lookup
  const featureKey = serviceName
    .replace(/([A-Z])/g, '_$1')
    .toLowerCase()
    .replace(/^_/, '');
  
  const featureAvailable = tierFeatures[featureKey] !== false;

  // Force NoOp if requested or feature not available
  if (config.forceNoOp || !featureAvailable) {
    const noOpService = createNoOpService(serviceName, config);
    SERVICE_CACHE[tier][serviceName] = noOpService;
    return noOpService;
  }

  // Check if service is registered
  if (!SERVICE_REGISTRY.has(serviceName)) {
    console.warn(
      `[ServiceFactory] Service '${serviceName}' not registered. ` +
      `Available services: ${Array.from(SERVICE_REGISTRY.keys()).join(', ')}`
    );
    // Return NoOp if service not registered
    const noOpService = createNoOpService(serviceName, config);
    SERVICE_CACHE[tier][serviceName] = noOpService;
    return noOpService;
  }

  // Create service instance
  const ServiceClass = SERVICE_REGISTRY.get(serviceName);
  const service = new ServiceClass(config);

  // Cache the instance
  SERVICE_CACHE[tier][serviceName] = service;

  return service;
}

/**
 * Initialize all registered services
 * 
 * Called on application startup to initialize all AI services.
 * Should be awaited before the application starts handling requests.
 * 
 * @async
 * @param {Array<string>} servicesToInitialize - Services to initialize (all if not specified)
 * @param {Object} config - Configuration for services
 * @returns {Promise<Object>} Initialization results with success/failure status
 * 
 * @example
 * const results = await initializeServices(['quiz', 'rag', 'chat']);
 * console.log(results);
 * // { quiz: true, rag: true, chat: false }
 */
export async function initializeServices(servicesToInitialize = [], config = {}) {
  const results = {};
  const tiers = ['premium', 'enterprise']; // Initialize these tiers, free tier uses NoOp

  for (const serviceName of servicesToInitialize) {
    results[serviceName] = {};
    
    for (const tier of tiers) {
      try {
        const service = createAIService(serviceName, tier, config);
        if (service.initialized === false) {
          await service.initialize();
        }
        results[serviceName][tier] = { success: true, message: 'Initialized' };
      } catch (error) {
        results[serviceName][tier] = { 
          success: false, 
          message: error.message 
        };
        console.error(
          `[ServiceFactory] Failed to initialize ${serviceName} for ${tier} tier:`,
          error.message
        );
      }
    }
  }

  return results;
}

/**
 * Get status of all services
 * 
 * Useful for health checks and monitoring.
 * 
 * @async
 * @param {string} tier - User tier to check services for
 * @returns {Promise<Object>} Status of all services for that tier
 * 
 * @example
 * const status = await getServicesStatus('premium');
 * console.log(status);
 * // { quiz: { healthy: true, message: '...' }, rag: { healthy: false, ... } }
 */
export async function getServicesStatus(tier = 'premium') {
  const status = {};
  const cachedServices = SERVICE_CACHE[tier] || {};

  for (const [serviceName, service] of Object.entries(cachedServices)) {
    try {
      status[serviceName] = await service.getStatus();
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
 * Shutdown all services
 * 
 * Called on application shutdown or restart.
 * Ensures graceful cleanup of connections and resources.
 * 
 * @async
 * @returns {Promise<void>}
 */
export async function shutdownAllServices() {
  const promises = [];

  for (const tierCache of Object.values(SERVICE_CACHE)) {
    for (const service of Object.values(tierCache)) {
      if (typeof service.shutdown === 'function') {
        promises.push(service.shutdown().catch(err => {
          console.error(`[ServiceFactory] Error shutting down ${service.serviceName}:`, err);
        }));
      }
    }
  }

  await Promise.all(promises);
  console.log('[ServiceFactory] All services shut down');
}

/**
 * Clear service cache
 * 
 * Useful for testing or forcing service recreation.
 * 
 * @param {string} tier - Tier to clear cache for (all tiers if not specified)
 */
export function clearServiceCache(tier) {
  if (tier) {
    SERVICE_CACHE[tier] = {};
  } else {
    SERVICE_CACHE.free = {};
    SERVICE_CACHE.premium = {};
    SERVICE_CACHE.enterprise = {};
  }
}

// Export cache and registry for advanced use cases
export { SERVICE_CACHE, SERVICE_REGISTRY };
