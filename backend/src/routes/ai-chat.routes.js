import express from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import aiChatController from '../controllers/ai-chat.controller.js';

const router = express.Router();

/**
 * AI Chat Routes for Quiz Creation and Analysis
 * Integrated with Pinecone for RAG
 */

// General AI chat with conversation history
router.post(
  '/chat',
  authenticate,
  aiChatController.chat
);

// Teacher: Create quiz from natural language
router.post(
  '/quiz/create',
  authenticate,
  aiChatController.createQuizFromChat
);

// Student: Analyze quiz performance with AI
router.post(
  '/quiz/:quizId/analyze',
  authenticate,
  aiChatController.analyzeQuizWithAI
);

// Search documents with semantic search
router.get(
  '/documents/search',
  authenticate,
  aiChatController.searchDocuments
);

// Chat with uploaded documents (RAG)
router.post(
  '/documents/chat',
  authenticate,
  aiChatController.chatWithDocuments
);

// Generate quiz questions from content
router.post(
  '/quiz/generate-questions',
  authenticate,
  aiChatController.generateQuizQuestions
);

// Get AI chat history
router.get(
  '/history/:userId',
  authenticate,
  aiChatController.getAIChatHistory
);

export default router;
