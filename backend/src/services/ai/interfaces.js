/**
 * AI Service Interfaces and Type Definitions
 * 
 * Defines contracts for all AI-powered services in EduTech.
 * Services must implement these interfaces to maintain consistency
 * and enable the factory pattern for tier-based service provisioning.
 */

/**
 * @typedef {Object} IAIService
 * @description Base interface for all AI services
 * 
 * @property {Function} initialize - Initialize the service and its dependencies
 * @returns {Promise<void>} Resolves when initialization is complete
 * 
 * @property {Function} isAvailable - Check if service is available/configured
 * @returns {Promise<boolean>} True if service is ready to use
 * 
 * @property {Function} getStatus - Get detailed status of the service
 * @returns {Promise<Object>} Status object with health info
 */
export const IAIService = {
  initialize: 'async function',
  isAvailable: 'async function',
  getStatus: 'async function'
};

/**
 * @typedef {Object} IQuizGenerator
 * @description Interface for AI-powered quiz generation services
 * Extends IAIService
 * 
 * @property {Function} generateQuestions
 * @param {string} content - Source content/topic for questions
 * @param {number} count - Number of questions to generate
 * @param {string} difficulty - Question difficulty level (easy/medium/hard)
 * @returns {Promise<Array>} Array of generated questions
 * 
 * @property {Function} generateAnswerKey
 * @param {Array} questions - Array of question objects
 * @returns {Promise<Array>} Array of answers with explanations
 * 
 * @property {Function} evaluateResponse
 * @param {string} question - The question asked
 * @param {string} studentAnswer - Student's response
 * @param {string} correctAnswer - Correct answer
 * @returns {Promise<Object>} Evaluation with score and feedback
 */
export const IQuizGenerator = {
  ...IAIService,
  generateQuestions: 'async function',
  generateAnswerKey: 'async function',
  evaluateResponse: 'async function'
};

/**
 * @typedef {Object} IDocumentAnalyzer
 * @description Interface for AI document analysis services
 * Extends IAIService
 * 
 * @property {Function} summarize
 * @param {string} content - Document content to summarize
 * @param {Object} options - Summarization options
 * @returns {Promise<string>} Summarized content
 * 
 * @property {Function} extractKeypoints
 * @param {string} content - Document content to analyze
 * @param {number} count - Number of keypoints to extract
 * @returns {Promise<Array>} Array of key points
 * 
 * @property {Function} detectSentiment
 * @param {string} content - Content to analyze
 * @returns {Promise<Object>} Sentiment analysis result
 */
export const IDocumentAnalyzer = {
  ...IAIService,
  summarize: 'async function',
  extractKeypoints: 'async function',
  detectSentiment: 'async function'
};

/**
 * @typedef {Object} IRAGService
 * @description Interface for Retrieval-Augmented Generation services
 * Extends IAIService
 * 
 * @property {Function} indexDocument
 * @param {string} documentId - Unique identifier for document
 * @param {string} content - Document content to index
 * @param {Object} metadata - Additional metadata
 * @returns {Promise<Object>} Indexing result
 * 
 * @property {Function} query
 * @param {string} query - Search/query text
 * @param {Object} options - Query options (limit, filters, etc)
 * @returns {Promise<Array>} Retrieved documents/results
 * 
 * @property {Function} generateResponse
 * @param {string} query - User query
 * @param {Array} retrievedDocs - Documents retrieved from indexing
 * @returns {Promise<string>} Generated response based on retrieved context
 */
export const IRAGService = {
  ...IAIService,
  indexDocument: 'async function',
  query: 'async function',
  generateResponse: 'async function'
};

/**
 * @typedef {Object} IContentGenerator
 * @description Interface for AI content generation services
 * Extends IAIService
 * 
 * @property {Function} generateContent
 * @param {string} prompt - Generation prompt/instruction
 * @param {Object} options - Generation options (length, style, etc)
 * @returns {Promise<string>} Generated content
 * 
 * @property {Function} generateVariations
 * @param {string} content - Original content
 * @param {number} count - Number of variations
 * @returns {Promise<Array>} Array of content variations
 */
export const IContentGenerator = {
  ...IAIService,
  generateContent: 'async function',
  generateVariations: 'async function'
};

/**
 * Standard response format for service operations
 * @typedef {Object} ServiceResponse
 * @property {boolean} success - Operation success status
 * @property {*} data - Response data (type depends on operation)
 * @property {string} [message] - Human-readable message
 * @property {Object} [error] - Error details if failed
 */
export const ServiceResponse = {
  success: true,
  data: null,
  message: '',
  error: null
};
