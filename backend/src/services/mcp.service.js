import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { logger } from '../utils/logger.utils.js';
import { isFeatureEnabledForTier, FEATURES } from '../config/features.config.js';
import path from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const prisma = new PrismaClient();

class MCPService {
  constructor() {
    this.clients = {};
    this.servers = {
      analytics: {
        name: 'edutech-analytics',
        path: path.join(__dirname, '../../mcp-servers/analytics/server.js'),
      },
      predictions: {
        name: 'edutech-predictions',
        path: path.join(__dirname, '../../mcp-servers/predictions/server.js'),
      },
      insights: {
        name: 'edutech-insights',
        path: path.join(__dirname, '../../mcp-servers/insights/server.js'),
      },
      chat: {
        name: 'edutech-chat',
        path: path.join(__dirname, '../../mcp-servers/chat/server.js'),
      },
    };
    this.initialized = false;
    this.enabled = isFeatureEnabledForTier(FEATURES.MCP_ENABLED, 'PREMIUM');
  }

  async initialize() {
    if (this.initialized) return;

    // Check if MCP is disabled via feature flag
    if (!this.enabled) {
      logger.info('[MCP] Initialization skipped - MCP_ENABLED feature flag is disabled');
      this.initialized = true;
      return;
    }

    try {
      logger.info('[MCP] Starting initialization of MCP servers...');
      let successCount = 0;
      let failureCount = 0;

      for (const [key, server] of Object.entries(this.servers)) {
        try {
          await this.connectToServer(key, server);
          successCount++;
        } catch (error) {
          logger.warn(`[MCP] Failed to connect to ${key} server, continuing with other servers:`, error.message);
          failureCount++;
        }
      }

      this.initialized = true;
      logger.info(`[MCP] Service initialized successfully (${successCount} servers connected, ${failureCount} failed)`);
      
      // Don't throw - we want graceful degradation
      if (successCount === 0) {
        logger.warn('[MCP] No MCP servers connected - service will return errors for all requests');
      }
    } catch (error) {
      logger.error('[MCP] Unexpected error during initialization:', error);
      // Mark as initialized to prevent retry loops, but set a flag that we're degraded
      this.initialized = true;
      this.degraded = true;
    }
  }

  async connectToServer(key, server) {
    try {
      const client = new Client(
        {
          name: 'edutech-backend',
          version: '1.0.0',
        },
        {
          capabilities: {},
        }
      );

      const serverProcess = spawn('node', [server.path], {
        stdio: ['pipe', 'pipe', 'pipe'],
        env: { ...process.env },
      });

      serverProcess.stderr.on('data', (data) => {
        logger.debug(`[MCP ${key}] ${data.toString()}`);
      });

      serverProcess.on('error', (error) => {
        logger.error(`[MCP ${key}] Process error:`, error);
      });

      const transport = new StdioClientTransport({
        reader: serverProcess.stdout,
        writer: serverProcess.stdin,
      });

      await client.connect(transport);

      this.clients[key] = {
        client,
        process: serverProcess,
        name: server.name,
      };

      logger.info(`[MCP] Connected to server: ${key}`);
    } catch (error) {
      logger.error(`[MCP] Failed to connect to ${key} server:`, error.message);
      throw error;
    }
  }

  async callTool(serverKey, toolName, args, userId = null) {
    // Check if MCP is disabled
    if (!this.enabled) {
      logger.debug(`[MCP] Tool call blocked (MCP disabled): ${serverKey}.${toolName}`);
      return {
        success: false,
        message: 'MCP service is not available in your current tier. Upgrade to Premium to access this feature.',
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'MCP_NOT_AVAILABLE',
            message: 'MCP service is not available for your tier'
          })
        }]
      };
    }

    if (!this.initialized) {
      await this.initialize();
    }

    // Handle degraded mode
    if (this.degraded) {
      logger.warn(`[MCP] Tool call attempted in degraded mode: ${serverKey}.${toolName}`);
      return {
        success: false,
        message: 'MCP service is currently unavailable. Please try again later.',
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'MCP_SERVICE_UNAVAILABLE',
            message: 'MCP service is currently unavailable'
          })
        }]
      };
    }

    const serverClient = this.clients[serverKey];
    if (!serverClient) {
      logger.error(`[MCP] Server not found: ${serverKey}`);
      return {
        success: false,
        message: `MCP server '${serverKey}' is not available`,
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'MCP_SERVER_NOT_FOUND',
            message: `Server ${serverKey} not found`
          })
        }]
      };
    }

    const startTime = Date.now();
    let success = false;
    let error = null;
    let result = null;

    try {
      result = await serverClient.client.callTool({
        name: toolName,
        arguments: args,
      });

      success = !result.isError;
      
      // Log the query
      await this.logQuery({
        userId,
        serverName: serverKey,
        query: toolName,
        queryType: 'tool_call',
        toolCalled: toolName,
        responseTime: Date.now() - startTime,
        success,
        contextSize: JSON.stringify(args).length,
        resultCount: result.content?.length || 0,
      });

      return result;
    } catch (err) {
      error = err.message;
      success = false;

      await this.logQuery({
        userId,
        serverName: serverKey,
        query: toolName,
        queryType: 'tool_call',
        toolCalled: toolName,
        responseTime: Date.now() - startTime,
        success,
        error,
      });

      logger.error(`[MCP] Tool call failed: ${serverKey}.${toolName} - ${error}`);
      return {
        success: false,
        message: `Tool call failed: ${error}`,
        isError: true,
        content: [{
          type: 'text',
          text: JSON.stringify({
            error: 'MCP_TOOL_CALL_FAILED',
            message: error
          })
        }]
      };
    }
  }

  async logQuery(data) {
    try {
      await prisma.mCPQueryLog.create({ data });
    } catch (error) {
      logger.error('Failed to log MCP query:', error);
    }
  }

  async listTools(serverKey) {
    if (!this.enabled) {
      return [];
    }

    if (!this.initialized) {
      await this.initialize();
    }

    const serverClient = this.clients[serverKey];
    if (!serverClient) {
      return [];
    }

    try {
      const tools = await serverClient.client.listTools();
      return tools.tools;
    } catch (error) {
      logger.error(`[MCP] Failed to list tools for ${serverKey}:`, error.message);
      return [];
    }
  }

  async listAllTools() {
    if (!this.enabled) {
      return {};
    }

    const allTools = {};
    try {
      for (const key of Object.keys(this.clients)) {
        allTools[key] = await this.listTools(key);
      }
    } catch (error) {
      logger.error('[MCP] Failed to list all tools:', error.message);
    }
    return allTools;
  }

  // Convenience methods for common operations
  async getStudentPerformance(userId, includeDetails = false) {
    return this.callTool('analytics', 'get_student_performance', {
      userId,
      includeDetails,
    }, userId);
  }

  async getClassInsights(classId, riskThreshold = 0.7, userId = null) {
    return this.callTool('analytics', 'get_class_insights', {
      classId,
      riskThreshold,
    }, userId);
  }

  async predictStudentRisk(userId) {
    return this.callTool('analytics', 'predict_student_risk', { userId }, userId);
  }

  async generateRecommendations(userId, focus = 'general') {
    return this.callTool('analytics', 'generate_recommendations', {
      userId,
      focus,
    }, userId);
  }

  async predictFinalGrade(userId, classId, currentWeek, totalWeeks) {
    return this.callTool('predictions', 'predict_final_grade', {
      userId,
      classId,
      currentWeek,
      totalWeeks,
    }, userId);
  }

  async predictDropoutRisk(userId, classId = null) {
    return this.callTool('predictions', 'predict_dropout_risk', {
      userId,
      classId,
    }, userId);
  }

  async suggestStudyPlan(userId, duration = 'week', focus = null) {
    return this.callTool('insights', 'suggest_study_plan', {
      userId,
      duration,
      focus,
    }, userId);
  }

  async detectAnomalies(userId, days = 14) {
    return this.callTool('insights', 'detect_anomalies', {
      userId,
      days,
    }, userId);
  }

  async generateReport(scope, targetId, reportType = 'comprehensive', userId = null) {
    return this.callTool('insights', 'generate_report', {
      scope,
      targetId,
      reportType,
    }, userId);
  }

  async disconnect() {
    try {
      for (const [key, client] of Object.entries(this.clients)) {
        try {
          if (client.process) {
            client.process.kill();
          }
          logger.info(`[MCP] Disconnected from server: ${key}`);
        } catch (error) {
          logger.error(`[MCP] Error disconnecting from ${key}:`, error.message);
        }
      }
      this.clients = {};
      this.initialized = false;
    } catch (error) {
      logger.error('[MCP] Error during disconnect:', error.message);
    }
  }
}

// Singleton instance
const mcpService = new MCPService();

// Cleanup on process exit
process.on('SIGINT', async () => {
  await mcpService.disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await mcpService.disconnect();
  process.exit(0);
});

export default mcpService;
