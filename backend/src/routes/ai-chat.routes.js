import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireFeature } from '../middleware/feature.middleware.js';
import { FEATURES } from '../config/features.config.js';
import aiChatController from '../controllers/ai-chat.controller.js';

const router = express.Router();

/**
 * AI Chat Routes for Quiz Creation and Analysis
 * Integrated with Pinecone for RAG
 * All routes wrapped with feature availability checks
 */

// General AI chat with conversation history
router.post(
  '/chat',
  authenticate,
  requireFeature(FEATURES.AI_CHAT_ENABLED),
  aiChatController.chat
);

// Teacher: Create quiz from natural language
router.post(
  '/quiz/create',
  authenticate,
  requireFeature(FEATURES.QUIZ_GENERATION_ENABLED),
  aiChatController.createQuizFromChat
);

// Student: Analyze quiz performance with AI
router.post(
  '/quiz/:quizId/analyze',
  authenticate,
  requireFeature(FEATURES.QUIZ_GENERATION_ENABLED),
  aiChatController.analyzeQuizWithAI
);

// Search documents with semantic search
router.get(
  '/documents/search',
  authenticate,
  requireFeature(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
  aiChatController.searchDocuments
);

// Chat with uploaded documents (RAG)
router.post(
  '/documents/chat',
  authenticate,
  requireFeature(FEATURES.DOCUMENT_ANALYSIS_ENABLED),
  aiChatController.chatWithDocuments
);

// Generate quiz questions from content
router.post(
  '/quiz/generate-questions',
  authenticate,
  requireFeature(FEATURES.QUIZ_GENERATION_ENABLED),
  aiChatController.generateQuizQuestions
);

// Get AI chat history
router.get(
  '/history/:userId',
  authenticate,
  requireFeature(FEATURES.AI_CHAT_ENABLED),
  aiChatController.getAIChatHistory
);

export default router;
