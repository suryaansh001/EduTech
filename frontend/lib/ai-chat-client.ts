const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

/**
 * AI Chat Client for Quiz Creation and Analysis with RAG
 */

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: Date;
}

interface QuizCreationRequest {
  classId: string;
  message: string;
  documentIds?: string[];
}

interface QuizAnalysisRequest {
  quizId: string;
  message: string;
  attemptId?: string;
}

interface GeneralChatRequest {
  message: string;
  conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  classId?: string;
  useRAG?: boolean;
}

class AIChatClient {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_URL}/ai-chat`;
  }

  getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  private async fetchAPI(url: string, options: RequestInit = {}) {
    const authHeaders = this.getAuthHeader();
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    const allHeaders = {
      ...baseHeaders,
      ...authHeaders,
      ...(options.headers as Record<string, string> || {}),
    };

    const response = await fetch(url, {
      ...options,
      headers: allHeaders as HeadersInit,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Request failed' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  /**
   * General AI chat with conversation history and RAG
   */
  async chat(request: GeneralChatRequest) {
    try {
      return await this.fetchAPI(`${this.baseURL}/chat`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error in AI chat:', error);
      throw error;
    }
  }

  /**
   * Create a quiz from natural language (Teacher)
   */
  async createQuizFromChat(request: QuizCreationRequest) {
    try {
      return await this.fetchAPI(`${this.baseURL}/quiz/create`, {
        method: 'POST',
        body: JSON.stringify(request),
      });
    } catch (error) {
      console.error('Error creating quiz from chat:', error);
      throw error;
    }
  }

  /**
   * Analyze quiz performance with AI (Student)
   */
  async analyzeQuizWithAI(request: QuizAnalysisRequest) {
    try {
      return await this.fetchAPI(
        `${this.baseURL}/quiz/${request.quizId}/analyze`,
        {
          method: 'POST',
          body: JSON.stringify({
            message: request.message,
            attemptId: request.attemptId,
          }),
        }
      );
    } catch (error) {
      console.error('Error analyzing quiz:', error);
      throw error;
    }
  }

  /**
   * Search uploaded documents with semantic search
   */
  async searchDocuments(query: string, classId?: string, topK = 5) {
    try {
      const params = new URLSearchParams({
        query,
        topK: String(topK),
        ...(classId && { classId }),
      });
      return await this.fetchAPI(`${this.baseURL}/documents/search?${params}`);
    } catch (error) {
      console.error('Error searching documents:', error);
      throw error;
    }
  }

  /**
   * Chat with documents using RAG
   */
  async chatWithDocuments(message: string, documentIds: string[] = []) {
    try {
      return await this.fetchAPI(`${this.baseURL}/documents/chat`, {
        method: 'POST',
        body: JSON.stringify({ message, documentIds }),
      });
    } catch (error) {
      console.error('Error chatting with documents:', error);
      throw error;
    }
  }

  /**
   * Generate quiz questions from content
   */
  async generateQuizQuestions(
    content: string,
    options: {
      questionCount?: number;
      questionTypes?: string[];
      difficulty?: 'easy' | 'medium' | 'hard';
    } = {}
  ) {
    try {
      return await this.fetchAPI(`${this.baseURL}/quiz/generate-questions`, {
        method: 'POST',
        body: JSON.stringify({
          content,
          questionCount: options.questionCount || 5,
          questionTypes: options.questionTypes || ['MULTIPLE_CHOICE'],
          difficulty: options.difficulty || 'medium',
        }),
      });
    } catch (error) {
      console.error('Error generating quiz questions:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a user
   */
  async getChatHistory(userId: string, limit = 50) {
    try {
      const params = new URLSearchParams({ limit: String(limit) });
      return await this.fetchAPI(`${this.baseURL}/history/${userId}?${params}`);
    } catch (error) {
      console.error('Error getting chat history:', error);
      throw error;
    }
  }
}

const aiChatClient = new AIChatClient();
export default aiChatClient;
