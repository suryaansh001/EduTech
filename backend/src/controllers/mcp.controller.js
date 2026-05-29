import mcpService from '../services/mcp.service.js';
import { logger } from '../utils/logger.utils.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * MCP Analytics Controller
 * Handles AI-powered analytics requests via MCP servers
 */

// Get student performance analytics
export const getStudentPerformance = async (req, res) => {
  try {
    const { userId } = req.params;
    const { includeDetails } = req.query;

    const result = await mcpService.getStudentPerformance(
      userId,
      includeDetails === 'true'
    );

    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error getting student performance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get student performance',
      error: error.message,
    });
  }
};

// Get class insights
export const getClassInsights = async (req, res) => {
  try {
    const { classId } = req.params;
    const { riskThreshold } = req.query;

    const result = await mcpService.getClassInsights(
      classId,
      parseFloat(riskThreshold) || 0.7,
      req.user.id
    );

    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error getting class insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get class insights',
      error: error.message,
    });
  }
};

// Predict student risk level
export const predictStudentRisk = async (req, res) => {
  try {
    const { userId } = req.params;

    const result = await mcpService.predictStudentRisk(userId);
    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error predicting student risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict student risk',
      error: error.message,
    });
  }
};

// Generate AI recommendations
export const generateRecommendations = async (req, res) => {
  try {
    const { userId } = req.params;
    const { focus } = req.body;

    const result = await mcpService.generateRecommendations(userId, focus || 'general');
    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate recommendations',
      error: error.message,
    });
  }
};

// Predict final grade
export const predictFinalGrade = async (req, res) => {
  try {
    const { userId, classId } = req.params;
    const { currentWeek, totalWeeks } = req.body;

    const result = await mcpService.predictFinalGrade(
      userId,
      classId,
      currentWeek,
      totalWeeks
    );
    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error predicting final grade:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict final grade',
      error: error.message,
    });
  }
};

// Predict dropout risk
export const predictDropoutRisk = async (req, res) => {
  try {
    const { userId } = req.params;
    const { classId } = req.query;

    const result = await mcpService.predictDropoutRisk(userId, classId);
    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error predicting dropout risk:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to predict dropout risk',
      error: error.message,
    });
  }
};

// Suggest study plan
export const suggestStudyPlan = async (req, res) => {
  try {
    const { userId } = req.params;
    const { duration, focus } = req.body;

    const result = await mcpService.suggestStudyPlan(userId, duration || 'week', focus);
    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error suggesting study plan:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to suggest study plan',
      error: error.message,
    });
  }
};

// Detect anomalies
export const detectAnomalies = async (req, res) => {
  try {
    const { userId } = req.params;
    const { days } = req.query;

    const result = await mcpService.detectAnomalies(userId, parseInt(days) || 14);
    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error detecting anomalies:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to detect anomalies',
      error: error.message,
    });
  }
};

// Generate comprehensive report
export const generateReport = async (req, res) => {
  try {
    const { scope, targetId } = req.params;
    const { reportType } = req.body;

    const result = await mcpService.generateReport(
      scope,
      targetId,
      reportType || 'comprehensive',
      req.user.id
    );
    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    logger.error('Error generating report:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate report',
      error: error.message,
    });
  }
};

// List available MCP tools
export const listMCPTools = async (req, res) => {
  try {
    const tools = await mcpService.listAllTools();

    res.json({
      success: true,
      data: tools,
    });
  } catch (error) {
    logger.error('Error listing MCP tools:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to list MCP tools',
      error: error.message,
    });
  }
};

// Get AI insights for user
export const getUserInsights = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 10, type, isActive = true } = req.query;

    const where = { userId, isActive: isActive === 'true' };
    if (type) where.type = type;

    const insights = await prisma.aIInsight.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: insights,
    });
  } catch (error) {
    logger.error('Error getting user insights:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get user insights',
      error: error.message,
    });
  }
};

// Mark insight as read
export const markInsightRead = async (req, res) => {
  try {
    const { insightId } = req.params;

    const insight = await prisma.aIInsight.update({
      where: { id: insightId },
      data: { isRead: true },
    });

    res.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    logger.error('Error marking insight as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark insight as read',
      error: error.message,
    });
  }
};

// Dismiss insight
export const dismissInsight = async (req, res) => {
  try {
    const { insightId } = req.params;

    const insight = await prisma.aIInsight.update({
      where: { id: insightId },
      data: { isDismissed: true, isActive: false },
    });

    res.json({
      success: true,
      data: insight,
    });
  } catch (error) {
    logger.error('Error dismissing insight:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to dismiss insight',
      error: error.message,
    });
  }
};

// Get MCP query logs (for debugging)
export const getMCPQueryLogs = async (req, res) => {
  try {
    const { limit = 50, serverName, success } = req.query;

    const where = {};
    if (serverName) where.serverName = serverName;
    if (success !== undefined) where.success = success === 'true';

    const logs = await prisma.mCPQueryLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: logs,
    });
  } catch (error) {
    logger.error('Error getting MCP query logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get MCP query logs',
      error: error.message,
    });
  }
};

export default {
  getStudentPerformance,
  getClassInsights,
  predictStudentRisk,
  generateRecommendations,
  predictFinalGrade,
  predictDropoutRisk,
  suggestStudyPlan,
  detectAnomalies,
  generateReport,
  listMCPTools,
  getUserInsights,
  markInsightRead,
  dismissInsight,
  getMCPQueryLogs,
};
