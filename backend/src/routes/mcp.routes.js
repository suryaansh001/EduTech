import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import mcpController from '../controllers/mcp.controller.js';

const router = express.Router();

/**
 * MCP AI Analytics Routes
 * All routes require authentication
 */

// Analytics Tools
router.get(
  '/student/:userId/performance',
  authenticate,
  mcpController.getStudentPerformance
);

router.get(
  '/class/:classId/insights',
  authenticate,
  mcpController.getClassInsights
);

router.get(
  '/student/:userId/risk',
  authenticate,
  mcpController.predictStudentRisk
);

router.post(
  '/student/:userId/recommendations',
  authenticate,
  mcpController.generateRecommendations
);

// Prediction Tools
router.post(
  '/student/:userId/class/:classId/predict-grade',
  authenticate,
  mcpController.predictFinalGrade
);

router.get(
  '/student/:userId/dropout-risk',
  authenticate,
  mcpController.predictDropoutRisk
);

// Insights Tools
router.post(
  '/student/:userId/study-plan',
  authenticate,
  mcpController.suggestStudyPlan
);

router.get(
  '/student/:userId/anomalies',
  authenticate,
  mcpController.detectAnomalies
);

router.post(
  '/report/:scope/:targetId',
  authenticate,
  mcpController.generateReport
);

// AI Insights Management
router.get(
  '/insights/:userId',
  authenticate,
  mcpController.getUserInsights
);

router.patch(
  '/insights/:insightId/read',
  authenticate,
  mcpController.markInsightRead
);

router.patch(
  '/insights/:insightId/dismiss',
  authenticate,
  mcpController.dismissInsight
);

// System/Admin Routes
router.get(
  '/tools',
  authenticate,
  mcpController.listMCPTools
);

router.get(
  '/logs',
  authenticate,
  mcpController.getMCPQueryLogs
);

export default router;
