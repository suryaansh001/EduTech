import { logger } from '../utils/logger.utils.js';

/**
 * No-Op MCP Service
 * 
 * Provides graceful degradation when MCP is disabled or not available.
 * Mimics the MCP service interface but returns failure responses.
 * 
 * Used when:
 * - MCP_ENABLED feature flag is false
 * - MCP initialization fails
 * - User is on free tier (no MCP access)
 */
class NoOpMCPService {
  constructor() {
    this.clients = {};
    this.initialized = true;
  }

  /**
   * No-op initialize - just logs that MCP is disabled
   */
  async initialize() {
    logger.info('[MCP] NoOp service initialized - MCP is not available');
    this.initialized = true;
  }

  /**
   * Return unavailable response for any tool call
   */
  async callTool(serverKey, toolName, args, userId = null) {
    logger.debug(`[MCP] Tool call blocked (MCP unavailable): ${serverKey}.${toolName}`);
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

  /**
   * Return empty tools list
   */
  async listTools(serverKey) {
    logger.debug(`[MCP] List tools blocked (MCP unavailable): ${serverKey}`);
    return [];
  }

  /**
   * Return empty tools object
   */
  async listAllTools() {
    logger.debug('[MCP] List all tools blocked (MCP unavailable)');
    return {};
  }

  /**
   * All convenience methods return unavailable responses
   */
  async getStudentPerformance(userId, includeDetails = false) {
    return this.callTool('analytics', 'get_student_performance', { userId, includeDetails }, userId);
  }

  async getClassInsights(classId, riskThreshold = 0.7, userId = null) {
    return this.callTool('analytics', 'get_class_insights', { classId, riskThreshold }, userId);
  }

  async predictStudentRisk(userId) {
    return this.callTool('analytics', 'predict_student_risk', { userId }, userId);
  }

  async generateRecommendations(userId, focus = 'general') {
    return this.callTool('analytics', 'generate_recommendations', { userId, focus }, userId);
  }

  async predictFinalGrade(userId, classId, currentWeek, totalWeeks) {
    return this.callTool('predictions', 'predict_final_grade', 
      { userId, classId, currentWeek, totalWeeks }, userId);
  }

  async predictDropoutRisk(userId, classId = null) {
    return this.callTool('predictions', 'predict_dropout_risk', { userId, classId }, userId);
  }

  async suggestStudyPlan(userId, duration = 'week', focus = null) {
    return this.callTool('insights', 'suggest_study_plan', { userId, duration, focus }, userId);
  }

  async detectAnomalies(userId, days = 14) {
    return this.callTool('insights', 'detect_anomalies', { userId, days }, userId);
  }

  async generateReport(scope, targetId, reportType = 'comprehensive', userId = null) {
    return this.callTool('insights', 'generate_report', 
      { scope, targetId, reportType }, userId);
  }

  /**
   * Graceful disconnect
   */
  async disconnect() {
    logger.debug('[MCP] NoOp service disconnect (no-op)');
  }
}

// Singleton instance
const noOpMcpService = new NoOpMCPService();

export default noOpMcpService;
