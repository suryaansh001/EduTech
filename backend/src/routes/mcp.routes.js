import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireMCPAccess } from '../middleware/mcp-access.middleware.js';
import mcpController from '../controllers/mcp.controller.js';

const router = express.Router();

/**
 * MCP AI Analytics Routes
 * All routes require authentication and MCP access based on subscription tier
 */

// Analytics Tools
router.get(
  '/student/:userId/performance',
  authenticate,
  requireMCPAccess,
  mcpController.getStudentPerformance
);

router.get(
  '/class/:classId/insights',
  authenticate,
  requireMCPAccess,
  mcpController.getClassInsights
);

router.get(
  '/student/:userId/risk',
  authenticate,
  requireMCPAccess,
  mcpController.predictStudentRisk
);

router.post(
  '/student/:userId/recommendations',
  authenticate,
  requireMCPAccess,
  mcpController.generateRecommendations
);

// Prediction Tools
router.post(
  '/student/:userId/class/:classId/predict-grade',
  authenticate,
  requireMCPAccess,
  mcpController.predictFinalGrade
);

router.get(
  '/student/:userId/dropout-risk',
  authenticate,
  requireMCPAccess,
  mcpController.predictDropoutRisk
);

// Insights Tools
router.post(
  '/student/:userId/study-plan',
  authenticate,
  requireMCPAccess,
  mcpController.suggestStudyPlan
);

router.get(
  '/student/:userId/anomalies',
  authenticate,
  requireMCPAccess,
  mcpController.detectAnomalies
);

router.post(
  '/report/:scope/:targetId',
  authenticate,
  requireMCPAccess,
  mcpController.generateReport
);

// AI Insights Management
router.get(
  '/insights/:userId',
  authenticate,
  requireMCPAccess,
  mcpController.getUserInsights
);

router.patch(
  '/insights/:insightId/read',
  authenticate,
  requireMCPAccess,
  mcpController.markInsightRead
);

router.patch(
  '/insights/:insightId/dismiss',
  authenticate,
  requireMCPAccess,
  mcpController.dismissInsight
);

// System/Admin Routes
router.get(
  '/tools',
  authenticate,
  requireMCPAccess,
  mcpController.listMCPTools
);

router.get(
  '/logs',
  authenticate,
  requireMCPAccess,
  mcpController.getMCPQueryLogs
);

export default router;
