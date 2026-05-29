/**
 * Base Abstract Service Class
 * 
 * Provides common functionality and abstract method definitions for all AI services.
 * Subclasses must implement the abstract methods.
 */

/**
 * Custom error class for NotImplementedError
 */
class NotImplementedError extends Error {
  constructor(methodName) {
    super(`Method '${methodName}' must be implemented by subclass`);
    this.name = 'NotImplementedError';
  }
}

/**
 * Abstract base class for AI services
 * 
 * Defines the contract that all AI services must follow. Provides:
 * - Lifecycle management (initialize, shutdown)
 * - Health checks (isAvailable, getStatus)
 * - Error handling
 * - Configuration management
 */
export class BaseAIService {
  /**
   * Create a new BaseAIService instance
   * 
   * @param {string} serviceName - Unique name for this service
   * @param {Object} config - Service configuration
   * @throws {TypeError} If serviceName is not provided
   */
  constructor(serviceName, config = {}) {
    if (!serviceName) {
      throw new TypeError('serviceName is required');
    }
    
    this.serviceName = serviceName;
    this.config = config;
    this.initialized = false;
    this.logger = config.logger || null;
    this.healthStatus = {
      healthy: false,
      lastChecked: null,
      errors: []
    };
  }

  /**
   * Log a message with the configured logger
   * 
   * @private
   * @param {string} level - Log level (info, warn, error, debug)
   * @param {string} message - Log message
   * @param {Object} data - Additional data to log
   */
  _log(level, message, data = {}) {
    if (this.logger && typeof this.logger[level] === 'function') {
      this.logger[level](`[${this.serviceName}] ${message}`, data);
    } else {
      console.log(`[${this.serviceName}] ${message}`, data);
    }
  }

  /**
   * Initialize the service
   * 
   * Override this method in subclasses to implement initialization logic.
   * Must set this.initialized = true when complete.
   * 
   * @async
   * @returns {Promise<void>}
   * @throws {NotImplementedError} If not overridden by subclass
   * 
   * @example
   * async initialize() {
   *   try {
   *     // Initialize connections, load configs, etc
   *     await this.connectToExternalService();
   *     this.initialized = true;
   *     this._log('info', 'Service initialized successfully');
   *   } catch (error) {
   *     this._log('error', 'Initialization failed', { error: error.message });
   *     throw error;
   *   }
   * }
   */
  async initialize() {
    throw new NotImplementedError('initialize');
  }

  /**
   * Check if the service is available and ready to use
   * 
   * Override this method in subclasses to implement availability checks.
   * Consider checking:
   * - Is initialization complete?
   * - Are external dependencies accessible?
   * - Are rate limits not exceeded?
   * 
   * @async
   * @returns {Promise<boolean>} True if service is available, false otherwise
   * @throws {NotImplementedError} If not overridden by subclass
   * 
   * @example
   * async isAvailable() {
   *   if (!this.initialized) return false;
   *   try {
   *     const response = await this.healthCheck();
   *     return response.status === 'ok';
   *   } catch {
   *     return false;
   *   }
   * }
   */
  async isAvailable() {
    throw new NotImplementedError('isAvailable');
  }

  /**
   * Get detailed status information about the service
   * 
   * Override this method in subclasses to provide service-specific status info.
   * Should return at minimum:
   * - healthy: boolean
   * - initialized: boolean
   * - message: string describing current state
   * 
   * Optionally include:
   * - uptime, requestCount, errorRate, rateLimitStatus, etc.
   * 
   * @async
   * @returns {Promise<Object>} Status object with health information
   * @throws {NotImplementedError} If not overridden by subclass
   * 
   * @example
   * async getStatus() {
   *   return {
   *     healthy: this.healthStatus.healthy,
   *     initialized: this.initialized,
   *     message: this.initialized ? 'Service ready' : 'Service not initialized',
   *     uptime: Date.now() - this.startTime,
   *     requestCount: this.metrics.totalRequests
   *   };
   * }
   */
  async getStatus() {
    throw new NotImplementedError('getStatus');
  }

  /**
   * Mark the service as healthy
   * 
   * @protected
   * @param {string} message - Status message
   */
  _markHealthy(message = 'Service is healthy') {
    this.healthStatus.healthy = true;
    this.healthStatus.lastChecked = new Date().toISOString();
    this.healthStatus.errors = [];
    this._log('info', `Health check passed: ${message}`);
  }

  /**
   * Mark the service as unhealthy
   * 
   * @protected
   * @param {string} error - Error message describing the issue
   */
  _markUnhealthy(error) {
    this.healthStatus.healthy = false;
    this.healthStatus.lastChecked = new Date().toISOString();
    this.healthStatus.errors.push({
      timestamp: new Date().toISOString(),
      message: error
    });
    this._log('warn', `Health check failed: ${error}`);
  }

  /**
   * Shutdown the service gracefully
   * 
   * Override this method if your service needs cleanup.
   * Called when the service is being taken offline.
   * 
   * @async
   * @returns {Promise<void>}
   */
  async shutdown() {
    this.initialized = false;
    this._log('info', 'Service shutdown complete');
  }
}

export { NotImplementedError };
