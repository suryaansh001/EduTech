/**
 * Migration Example: Integrating Existing Services with AI Factory
 * 
 * This file shows how existing services (like chat.service.js, mcp.service.js)
 * can be wrapped to work with the new factory pattern without major refactoring.
 * 
 * Three approaches are shown:
 * 1. Gradual migration (wrap existing service)
 * 2. Full migration (extend BaseAIService directly)
 * 3. Selective features (some methods use old pattern, some new)
 */

import { BaseAIService } from './base.service.js';

/**
 * APPROACH 1: Wrap Existing Service (Minimal Changes)
 * 
 * Use this when you have a working service and want to integrate gradually.
 * Wraps the existing service with the new base class interface.
 */
export class WrappedChatService extends BaseAIService {
  constructor(config = {}) {
    super('chat', config);
    // Import the existing chat service
    // this.originalService = chatService;
  }

  async initialize() {
    try {
      // The existing chat service might not have initialize()
      // So we just mark ourselves as ready
      this.initialized = true;
      this._log('info', 'Chat service wrapper initialized');
    } catch (error) {
      this._markUnhealthy(error.message);
      throw error;
    }
  }

  async isAvailable() {
    // Check if underlying service is available
    return this.initialized;
  }

  async getStatus() {
    return {
      healthy: this.initialized,
      initialized: this.initialized,
      message: 'Chat service wrapper ready',
      wrappedService: 'chatService'
    };
  }

  // Wrap existing methods
  async sendMessage(classId, userId, messageText) {
    if (!await this.isAvailable()) {
      return { success: false, message: 'Chat service unavailable' };
    }

    try {
      // Call the existing service method
      // const result = await this.originalService.sendMessage(...);
      const result = { /* simulated result */ };
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      this._log('error', 'Message send failed', { error: error.message });
      return {
        success: false,
        message: 'Failed to send message',
        error: error.message
      };
    }
  }

  async getChatHistory(classId, userId) {
    if (!await this.isAvailable()) {
      return { success: false, message: 'Chat service unavailable' };
    }

    try {
      // const history = await this.originalService.getChatMessages(...);
      const history = { /* simulated result */ };
      
      return {
        success: true,
        data: history
      };
    } catch (error) {
      return {
        success: false,
        message: 'Failed to retrieve history',
        error: error.message
      };
    }
  }
}

/**
 * APPROACH 2: Full Migration (Clean Implementation)
 * 
 * Use this for new services or when doing a complete rewrite.
 * Extends BaseAIService directly with new implementation.
 */
export class NewMCPService extends BaseAIService {
  constructor(config = {}) {
    super('mcp', config);
    this.clients = {};
    this.servers = {
      analytics: {
        name: 'edutech-analytics',
        path: config.analyticsPath
      },
      predictions: {
        name: 'edutech-predictions',
        path: config.predictionsPath
      },
      insights: {
        name: 'edutech-insights',
        path: config.insightsPath
      },
      chat: {
        name: 'edutech-chat',
        path: config.chatPath
      }
    };
  }

  async initialize() {
    try {
      this._log('info', 'Initializing MCP service');
      
      for (const [key, server] of Object.entries(this.servers)) {
        await this.connectToServer(key, server);
      }
      
      this.initialized = true;
      this._markHealthy('All MCP servers connected');
      this._log('info', 'MCP service initialized successfully');
    } catch (error) {
      this._markUnhealthy(error.message);
      this._log('error', 'MCP initialization failed', { error: error.message });
      throw error;
    }
  }

  async isAvailable() {
    return this.initialized && Object.keys(this.clients).length === Object.keys(this.servers).length;
  }

  async getStatus() {
    return {
      healthy: this.healthStatus.healthy,
      initialized: this.initialized,
      message: this.initialized ? 'MCP service ready' : 'MCP not initialized',
      connectedServers: Object.keys(this.clients),
      totalServers: Object.keys(this.servers).length,
      lastChecked: this.healthStatus.lastChecked,
      errors: this.healthStatus.errors.slice(-3)
    };
  }

  async callTool(serverName, toolName, inputs) {
    if (!await this.isAvailable()) {
      return { success: false, message: 'MCP service not available' };
    }

    try {
      const client = this.clients[serverName];
      if (!client) {
        throw new Error(`Server '${serverName}' not connected`);
      }

      const result = await client.callTool(toolName, inputs);
      
      return {
        success: true,
        data: result
      };
    } catch (error) {
      this._log('error', `Tool call failed: ${serverName}.${toolName}`, { error: error.message });
      return {
        success: false,
        message: `Tool call failed: ${error.message}`,
        error: error.message
      };
    }
  }

  async connectToServer(key, server) {
    this._log('info', `Connecting to ${key} server`, { path: server.path });
    // Implementation for connecting to server
  }

  async shutdown() {
    try {
      for (const client of Object.values(this.clients)) {
        await client.close?.();
      }
      this.clients = {};
      await super.shutdown();
    } catch (error) {
      this._log('error', 'Shutdown error', { error: error.message });
    }
  }
}

/**
 * APPROACH 3: Hybrid (Selective Feature Integration)
 * 
 * Use this when you have a complex service and want to gradually integrate features.
 * Some methods follow the new pattern, others delegate to existing implementation.
 */
export class QuizServiceHybrid extends BaseAIService {
  constructor(config = {}) {
    super('quiz-hybrid', config);
    // Could import an existing quiz service
    // this.legacyService = legacyQuizService;
  }

  async initialize() {
    this.initialized = true;
    this._markHealthy('Quiz service ready');
  }

  async isAvailable() {
    return this.initialized;
  }

  async getStatus() {
    return {
      healthy: this.healthStatus.healthy,
      initialized: this.initialized,
      message: 'Quiz service operational'
    };
  }

  // New implementation following factory pattern
  async generateQuestions(content, count = 5, difficulty = 'medium') {
    if (!await this.isAvailable()) {
      return { success: false, message: 'Service unavailable' };
    }

    try {
      const questions = await this._generateWithAI(content, count, difficulty);
      return { success: true, data: questions };
    } catch (error) {
      return { success: false, message: error.message };
    }
  }

  // Legacy implementation (could delegate to old service)
  async retrieveQuizzes(classId) {
    // Could call: return await this.legacyService.getQuizzes(classId);
    return { success: true, data: [] };
  }

  // Helper methods
  async _generateWithAI(content, count, difficulty) {
    // LLM integration
    return [];
  }
}

/**
 * INTEGRATION EXAMPLES
 */

/**
 * Example 1: Register and use wrapped service
 * 
 * In app.js:
 * 
 *   import { registerService } from './services/ai/factory.js';
 *   import { WrappedChatService } from './services/ai/MIGRATION_EXAMPLE.js';
 *   
 *   registerService('chat', WrappedChatService);
 *   await initializeServices(['chat']);
 * 
 * In controller (no changes needed!):
 * 
 *   import { createAIService } from '../services/ai/factory.js';
 *   
 *   const chatService = createAIService('chat', userTier);
 *   const result = await chatService.sendMessage(classId, userId, text);
 *   res.json(result);
 */

/**
 * Example 2: Full migration of MCP service
 * 
 * In app.js:
 * 
 *   import { registerService } from './services/ai/factory.js';
 *   import { NewMCPService } from './services/ai/MIGRATION_EXAMPLE.js';
 *   
 *   registerService('mcp', NewMCPService);
 *   await initializeServices(['mcp'], {
 *     analyticsPath: './mcp-servers/analytics/server.js',
 *     predictionsPath: './mcp-servers/predictions/server.js',
 *     insightsPath: './mcp-servers/insights/server.js',
 *     chatPath: './mcp-servers/chat/server.js'
 *   });
 * 
 * Usage:
 * 
 *   const mcpService = createAIService('mcp', 'enterprise');
 *   const result = await mcpService.callTool('analytics', 'generateReport', {...});
 */

/**
 * Example 3: Hybrid approach with selective feature rollout
 * 
 * Phase 1: Keep old quiz service working
 * Phase 2: Add generateQuestions with new AI backend
 * Phase 3: Migrate all methods
 * Phase 4: Deprecate legacy service
 */

export default {
  WrappedChatService,
  NewMCPService,
  QuizServiceHybrid
};
