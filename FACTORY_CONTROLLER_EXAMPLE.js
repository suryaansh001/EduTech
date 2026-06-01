/**
 * Example: Updated AI Chat Controller with Factory Pattern
 * 
 * This shows how to update existing controllers to use the AI Service Factory
 * instead of direct service imports.
 * 
 * This is a REFERENCE file - copy patterns to your actual controller files
 */

import { 
  createAIService,
  isServiceAvailable,
  SUBSCRIPTION_TIERS 
} from '../services/ai/index.js';
import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.utils.js';

const prisma = new PrismaClient();

/**
 * BEFORE: Direct service import
 * 
 * import mcpService from '../services/mcp.service.js';
 * 
 * PROBLEMS:
 * - No tier-based routing
 * - No feature flag support
 * - No graceful degradation
 * - Hard to test different tiers
 * 
 * 
 * AFTER: Using AI Service Factory
 * 
 * const chatService = createAIService('chat', userTier);
 * 
 * BENEFITS:
 * - Automatic tier-based routing
 * - Feature flag support
 * - Graceful degradation via NoOp
 * - Easy tier testing
 */

// ============================================================================
// EXAMPLE 1: Chat Endpoint with Factory
// ============================================================================

/**
 * Chat endpoint using factory pattern
 * 
 * Handles:
 * - Tier-based service selection
 * - NoOp service for disabled features
 * - Upgrade prompts for free tier users
 */
export const chat = async (req, res) => {
  try {
    const { message, conversationHistory, classId, useRAG } = req.body;
    const userId = req.user.id;
    
    // Get user's subscription tier (will be added to User model)
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

    // Validate input
    if (!message) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    // Create service instance for this user's tier
    // If feature is disabled, returns NoOp service
    const chatService = createAIService('chat', userTier, {
      logger,
      // Optional: Pass additional config
      userId,
      classId
    });

    // Call service - works the same whether it's real or NoOp
    const result = await chatService.sendMessage({
      userId,
      message,
      conversationHistory: conversationHistory || [],
      classId,
      useRAG: useRAG !== false,
    });

    // NoOp service returns { success: false, message: '...' }
    // Real service returns actual result
    if (!result.success && userTier === SUBSCRIPTION_TIERS.FREE) {
      // Prompt upgrade for free tier users
      return res.status(402).json({
        ...result,
        requiresUpgrade: true,
        currentTier: userTier,
        upgradeUrl: '/pricing'
      });
    }

    res.json({
      success: result.success,
      data: result.data,
      message: result.message
    });
    
  } catch (error) {
    logger.error('Error in AI chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to process chat message',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================================
// EXAMPLE 2: Quiz Generation with Feature Check
// ============================================================================

/**
 * Quiz generation endpoint
 * 
 * Best practice: Check if feature is available before attempting to use it
 * This provides better UX than silent fallback
 */
export const generateQuizQuestions = async (req, res) => {
  try {
    const { content, questionCount = 5, questionTypes = ['MULTIPLE_CHOICE'], difficulty = 'medium' } = req.body;
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;
    
    // Validate input
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required',
      });
    }

    // OPTIONAL: Check if feature is available upfront
    // This gives better UX than returning NoOp response
    if (!isServiceAvailable('quiz', userTier)) {
      return res.status(402).json({
        success: false,
        message: `Quiz generation is not available in the ${userTier} tier. Upgrade to Premium or Enterprise to access this feature.`,
        requiresUpgrade: true,
        requiredTier: 'PREMIUM',
        currentTier: userTier
      });
    }

    // Create quiz service for this tier
    const quizService = createAIService('quiz', userTier, {
      logger,
      maxQuestionsPerRequest: userTier === SUBSCRIPTION_TIERS.ENTERPRISE ? 100 : 50
    });

    // Call service
    const result = await quizService.generateQuestions({
      content,
      count: Math.min(questionCount, 50),
      types: questionTypes,
      difficulty
    });

    res.json({
      success: result.success,
      data: result.data,
      message: result.message
    });
    
  } catch (error) {
    logger.error('Error generating quiz questions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate quiz questions',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================================
// EXAMPLE 3: Document Analysis with Config
// ============================================================================

/**
 * Document analysis endpoint
 * 
 * Passes tier-specific configuration to service
 */
export const summarizeDocument = async (req, res) => {
  try {
    const { documentId, length = 'medium' } = req.body;
    const userId = req.user.id;
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

    if (!documentId) {
      return res.status(400).json({
        success: false,
        message: 'Document ID is required',
      });
    }

    // Fetch document
    const document = await prisma.document.findUnique({
      where: { id: documentId }
    });

    if (!document || document.userId !== userId) {
      return res.status(404).json({
        success: false,
        message: 'Document not found',
      });
    }

    // Create document analysis service
    // Configuration can vary by tier
    const analysisService = createAIService('document-analysis', userTier, {
      logger,
      userId,
      // Tier-specific limits
      maxDocumentSize: userTier === SUBSCRIPTION_TIERS.ENTERPRISE ? '50MB' : '10MB',
      summaryLength: userTier === SUBSCRIPTION_TIERS.ENTERPRISE ? { min: 100, max: 2000 } : { min: 100, max: 500 }
    });

    // Analyze document
    const result = await analysisService.summarize({
      content: document.content,
      length
    });

    res.json({
      success: result.success,
      data: result.data,
      documentId,
      userTier
    });
    
  } catch (error) {
    logger.error('Error analyzing document:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to analyze document',
    });
  }
};

// ============================================================================
// EXAMPLE 4: RAG Search with Multiple Services
// ============================================================================

/**
 * Semantic search with RAG (Retrieval-Augmented Generation)
 * 
 * Shows using multiple services together
 */
export const searchWithRAG = async (req, res) => {
  try {
    const { query, classId, topK = 5 } = req.body;
    const userId = req.user.id;
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query is required',
      });
    }

    // Check if RAG service available
    if (!isServiceAvailable('rag', userTier)) {
      return res.status(402).json({
        success: false,
        message: 'Document search is not available in your tier',
        requiresUpgrade: true,
        requiredTier: 'PREMIUM'
      });
    }

    // Create RAG service
    const ragService = createAIService('rag', userTier, {
      logger,
      userId,
      classId
    });

    // Perform search
    const results = await ragService.query({
      query,
      limit: topK,
      classId
    });

    res.json({
      success: results.success,
      data: results.data,
      count: results.data?.length || 0
    });
    
  } catch (error) {
    logger.error('Error in RAG search:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to perform search',
    });
  }
};

// ============================================================================
// EXAMPLE 5: MCP Tool Calling with Factory
// ============================================================================

/**
 * Call MCP tools via factory pattern
 * 
 * Replaces direct mcpService.callTool() usage
 */
export const createQuizFromChat = async (req, res) => {
  try {
    const { classId, message, documentIds = [] } = req.body;
    const userId = req.user.id;
    const userTier = req.user.subscriptionTier || SUBSCRIPTION_TIERS.FREE;

    // Verify user is teacher
    if (req.user.role !== 'TEACHER') {
      return res.status(403).json({
        success: false,
        message: 'Only teachers can create quizzes',
      });
    }

    // Create MCP service via factory
    const mcpService = createAIService('mcp', userTier, {
      logger,
      userId,
      classId
    });

    // Check if MCP is available
    if (!isServiceAvailable('mcp', userTier)) {
      return res.status(402).json({
        success: false,
        message: 'Quiz creation is not available in your tier',
        requiresUpgrade: true
      });
    }

    // Call tool through MCP service
    // (MCP service would implement this method)
    const result = await mcpService.callTool('chat', 'create_quiz_from_chat', {
      userId,
      classId,
      chatMessage: message,
      documentIds
    });

    const data = result?.content?.[0]?.text ? JSON.parse(result.content[0].text) : result;

    res.json({
      success: true,
      data,
    });
    
  } catch (error) {
    logger.error('Error creating quiz from chat:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create quiz',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined,
    });
  }
};

// ============================================================================
// EXPORT ALL CONTROLLERS
// ============================================================================

export default {
  chat,
  generateQuizQuestions,
  summarizeDocument,
  searchWithRAG,
  createQuizFromChat
};

/**
 * MIGRATION CHECKLIST
 * 
 * [ ] Add subscriptionTier to User model (Prisma)
 * [ ] Update auth middleware to set req.user.subscriptionTier
 * [ ] Register all services in app.js startup
 * [ ] Update each controller to use createAIService()
 * [ ] Remove direct service imports (e.g., import mcpService from...)
 * [ ] Test with different user tiers
 * [ ] Verify NoOp services work for free tier
 * [ ] Add upgrade prompts for UX
 * [ ] Test with feature flags disabled
 * [ ] Update error responses to include tier info
 * [ ] Add service status to health check endpoint
 */
