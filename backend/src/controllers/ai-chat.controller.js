import mcpService from '../services/mcp.service.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * AI Chat Controller for Quiz Creation and Analysis
 */

// Create quiz from natural language chat
export const createQuizFromChat = async (req, res) => {
  try {
    const { classId, message, documentIds } = req.body;
    const userId = req.user.id;

    // Verify user is teacher
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create quizzes',
      });
    }

    const result = await mcpService.callTool(
      'chat',
      'create_quiz_from_chat',
      {
        userId,
        classId,
        chatMessage: message,
        documentIds: documentIds || [],
      },
      userId
    );

    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error creating quiz from chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: error.message,
    });
  }
};

// Analyze quiz with AI
export const analyzeQuizWithAI = async (req, res) => {
  try {
    const { quizId } = req.params;
    const { message, attemptId } = req.body;
    const userId = req.user.id;

    const result = await mcpService.callTool(
      'chat',
      'analyze_quiz_with_ai',
      {
        userId,
        quizId,
        attemptId,
        chatMessage: message,
      },
      userId
    );

    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error analyzing quiz:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze quiz',
      error: error.message,
    });
  }
};

// Search documents with semantic search
export const searchDocuments = async (req, res) => {
  try {
    const { query, classId, topK } = req.query;

    const result = await mcpService.callTool(
      'chat',
      'search_documents',
      {
        query,
        classId,
        topK: topK ? parseInt(topK) : 5,
      },
      req.user.id
    );

    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error searching documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to search documents',
      error: error.message,
    });
  }
};

// Chat with documents (RAG)
export const chatWithDocuments = async (req, res) => {
  try {
    const { message, documentIds } = req.body;
    const userId = req.user.id;

    const result = await mcpService.callTool(
      'chat',
      'chat_with_documents',
      {
        userId,
        message,
        documentIds: documentIds || [],
      },
      userId
    );

    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error chatting with documents:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to chat with documents',
      error: error.message,
    });
  }
};

// Generate quiz questions from content
export const generateQuizQuestions = async (req, res) => {
  try {
    const { content, questionCount, questionTypes, difficulty } = req.body;

    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    const result = await mcpService.callTool(
      'chat',
      'generate_quiz_questions',
      {
        content,
        questionCount: questionCount || 5,
        questionTypes: questionTypes || ['MULTIPLE_CHOICE'],
        difficulty: difficulty || 'medium',
      },
      req.user.id
    );

    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error generating quiz questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz questions',
      error: error.message,
    });
  }
};

// General AI chat with conversation history and RAG
export const chat = async (req, res) => {
  try {
    const { message, conversationHistory, classId, useRAG } = req.body;
    const userId = req.user.id;

    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    const result = await mcpService.callTool(
      'chat',
      'general_chat',
      {
        userId,
        message,
        conversationHistory: conversationHistory || [],
        classId,
        useRAG: useRAG !== false,
      },
      userId
    );

    const data = JSON.parse(result.content[0].text);

    res.json({
      success: true,
      data,
    });
  } catch (error) {
    console.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: error.message,
    });
  }
};

// Get AI chat history for a user
export const getAIChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;

    // Get MCP query logs that represent chat interactions
    const chatHistory = await prisma.mCPQueryLog.findMany({
      where: {
        userId,
        serverName: 'chat_server',
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
    });

    res.json({
      success: true,
      data: chatHistory,
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get chat history',
      error: error.message,
    });
  }
};

export default {
  createQuizFromChat,
  analyzeQuizWithAI,
  searchDocuments,
  chatWithDocuments,
  generateQuizQuestions,
  getAIChatHistory,
  chat,
};
