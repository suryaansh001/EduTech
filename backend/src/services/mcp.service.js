import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { spawn } from 'child_process';
import { logger } from '../utils/logger.utils.js';
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
  }

  async initialize() {
    if (this.initialized) return;

    try {
      for (const [key, server] of Object.entries(this.servers)) {
        await this.connectToServer(key, server);
      }
      this.initialized = true;
      logger.info('MCP Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize MCP Service:', error);
      throw error;
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

      logger.info(`Connected to MCP server: ${key}`);
    } catch (error) {
      logger.error(`Failed to connect to ${key} server:`, error);
      throw error;
    }
  }

  async callTool(serverKey, toolName, args, userId = null) {
    if (!this.initialized) {
      await this.initialize();
    }

    const serverClient = this.clients[serverKey];
    if (!serverClient) {
      throw new Error(`MCP server '${serverKey}' not found`);
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

      throw err;
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
    if (!this.initialized) {
      await this.initialize();
    }

    const serverClient = this.clients[serverKey];
    if (!serverClient) {
      throw new Error(`MCP server '${serverKey}' not found`);
    }

    const tools = await serverClient.client.listTools();
    return tools.tools;
  }

  async listAllTools() {
    const allTools = {};
    for (const key of Object.keys(this.clients)) {
      allTools[key] = await this.listTools(key);
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
    for (const [key, client] of Object.entries(this.clients)) {
      try {
        if (client.process) {
          client.process.kill();
        }
        logger.info(`Disconnected from MCP server: ${key}`);
      } catch (error) {
        logger.error(`Error disconnecting from ${key}:`, error);
      }
    }
    this.clients = {};
    this.initialized = false;
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
