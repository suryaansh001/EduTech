/**
 * No-Op (No Operation) Service Implementation
 * 
 * Provides a graceful degradation strategy for free-tier users.
 * All methods return failure responses without code branching in controllers.
 * This allows features to be disabled at the service level rather than via
 * multiple if/else checks throughout the codebase.
 */

import { BaseAIService } from './base.service.js';

/**
 * No-Op AI Service
 * 
 * Implements the AI service interface but returns "not available" responses
 * for all operations. Used when:
 * - User is on free tier with limited features
 * - Required service is not configured
 * - Feature is disabled for the user
 * 
 * Benefits:
 * - No need for tier checks in controllers/routes
 * - Consistent error handling
 * - Easy to enable features by swapping service instance
 */
export class NoOpAIService extends BaseAIService {
  constructor(serviceName = 'noop-service', featureName = 'Feature', config = {}) {
    super(serviceName, config);
    this.featureName = featureName;
  }

  /**
   * Initialize without actually doing anything
   * 
   * @async
   * @returns {Promise<void>}
   */
  async initialize() {
    this.initialized = true;
    this._log('info', `${this.featureName} disabled for this user tier`);
  }

  /**
   * Service is always unavailable
   * 
   * @async
   * @returns {Promise<boolean>} Always false
   */
  async isAvailable() {
    return false;
  }

  /**
   * Return unavailable status
   * 
   * @async
   * @returns {Promise<Object>} Status object indicating service is disabled
   */
  async getStatus() {
    return {
      healthy: false,
      initialized: true,
      available: false,
      message: `${this.featureName} is not available for your current tier`,
      tier_required: 'Premium'
    };
  }

  /**
   * Generic unavailable response
   * 
   * @private
   * @returns {Object} Standard unavailable response
   */
  _unavailableResponse() {
    return {
      success: false,
      message: `${this.featureName} is not available in your current tier. Upgrade to Premium to access this feature.`,
      data: null
    };
  }

  // Quiz Generation Methods
  async generateQuestions() {
    return this._unavailableResponse();
  }

  async generateAnswerKey() {
    return this._unavailableResponse();
  }

  async evaluateResponse() {
    return this._unavailableResponse();
  }

  // Document Analysis Methods
  async summarize() {
    return this._unavailableResponse();
  }

  async extractKeypoints() {
    return this._unavailableResponse();
  }

  async detectSentiment() {
    return this._unavailableResponse();
  }

  // RAG Service Methods
  async indexDocument() {
    return this._unavailableResponse();
  }

  async query() {
    return this._unavailableResponse();
  }

  async generateResponse() {
    return this._unavailableResponse();
  }

  // Content Generation Methods
  async generateContent() {
    return this._unavailableResponse();
  }

  async generateVariations() {
    return this._unavailableResponse();
  }

  // Chat Methods
  async sendMessage() {
    return this._unavailableResponse();
  }

  async getChatHistory() {
    return this._unavailableResponse();
  }

  // Fallback for any other method call
  async [Symbol.for('unknownMethod')]() {
    return this._unavailableResponse();
  }
}

/**
 * Factory function to create a NoOp service for a specific feature
 * 
 * @param {string} featureName - Human-readable feature name
 * @param {Object} config - Configuration object
 * @returns {NoOpAIService} Configured no-op service instance
 * 
 * @example
 * const quizService = createNoOpService('Quiz Generation');
 * const response = await quizService.generateQuestions('...');
 * // Returns: { success: false, message: 'Quiz Generation is not available...', data: null }
 */
export function createNoOpService(featureName, config = {}) {
  return new NoOpAIService(`noop-${featureName.toLowerCase().replace(/\s+/g, '-')}`, featureName, config);
}
