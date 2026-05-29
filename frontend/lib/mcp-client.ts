const API_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api';

/**
 * MCP AI Analytics API Client
 * Provides methods to interact with MCP-powered AI analytics
 */

interface MCPOptions {
  limit?: number;
  type?: string;
  isActive?: boolean;
  serverName?: string;
  success?: boolean;
}

class MCPClient {
  private baseURL: string;

  constructor() {
    this.baseURL = `${API_URL}/mcp`;
  }

  // Get authorization header
  getAuthHeader(): Record<string, string> {
    const token = localStorage.getItem('token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // Helper method for API calls
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

  // ============ Analytics Tools ============

  /**
   * Get comprehensive performance analytics for a student
   */
  async getStudentPerformance(userId: string, includeDetails = false) {
    try {
      const params = new URLSearchParams({ includeDetails: String(includeDetails) });
      return await this.fetchAPI(
        `${this.baseURL}/student/${userId}/performance?${params}`
      );
    } catch (error) {
      console.error('Error getting student performance:', error);
      throw error;
    }
  }

  /**
   * Get analytics and insights for a class
   */
  async getClassInsights(classId: string, riskThreshold = 0.7) {
    try {
      const params = new URLSearchParams({ riskThreshold: String(riskThreshold) });
      return await this.fetchAPI(
        `${this.baseURL}/class/${classId}/insights?${params}`
      );
    } catch (error) {
      console.error('Error getting class insights:', error);
      throw error;
    }
  }

  /**
   * Predict student risk level using AI analysis
   */
  async predictStudentRisk(userId: string) {
    try {
      return await this.fetchAPI(`${this.baseURL}/student/${userId}/risk`);
    } catch (error) {
      console.error('Error predicting student risk:', error);
      throw error;
    }
  }

  /**
   * Generate AI-powered recommendations
   */
  async generateRecommendations(userId: string, focus = 'general') {
    try {
      return await this.fetchAPI(`${this.baseURL}/student/${userId}/recommendations`, {
        method: 'POST',
        body: JSON.stringify({ focus }),
      });
    } catch (error) {
      console.error('Error generating recommendations:', error);
      throw error;
    }
  }

  // ============ Prediction Tools ============

  /**
   * Predict final grade for a student in a class
   */
  async predictFinalGrade(userId: string, classId: string, currentWeek: number, totalWeeks: number) {
    try {
      return await this.fetchAPI(
        `${this.baseURL}/student/${userId}/class/${classId}/predict-grade`,
        {
          method: 'POST',
          body: JSON.stringify({ currentWeek, totalWeeks }),
        }
      );
    } catch (error) {
      console.error('Error predicting final grade:', error);
      throw error;
    }
  }

  /**
   * Predict probability of student dropping out
   */
  async predictDropoutRisk(userId: string, classId: string | null = null) {
    try {
      const params = classId ? new URLSearchParams({ classId }) : '';
      return await this.fetchAPI(
        `${this.baseURL}/student/${userId}/dropout-risk${params ? '?' + params : ''}`
      );
    } catch (error) {
      console.error('Error predicting dropout risk:', error);
      throw error;
    }
  }

  // ============ Insights Tools ============

  /**
   * Generate personalized study plan
   */
  async suggestStudyPlan(userId: string, duration = 'week', focus: string | null = null) {
    try {
      return await this.fetchAPI(`${this.baseURL}/student/${userId}/study-plan`, {
        method: 'POST',
        body: JSON.stringify({ duration, focus }),
      });
    } catch (error) {
      console.error('Error suggesting study plan:', error);
      throw error;
    }
  }

  /**
   * Detect unusual patterns in student behavior
   */
  async detectAnomalies(userId: string, days = 14) {
    try {
      const params = new URLSearchParams({ days: String(days) });
      return await this.fetchAPI(
        `${this.baseURL}/student/${userId}/anomalies?${params}`
      );
    } catch (error) {
      console.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  /**
   * Generate comprehensive analytics report
   */
  async generateReport(scope: string, targetId: string, reportType = 'comprehensive') {
    try {
      return await this.fetchAPI(`${this.baseURL}/report/${scope}/${targetId}`, {
        method: 'POST',
        body: JSON.stringify({ reportType }),
      });
    } catch (error) {
      console.error('Error generating report:', error);
      throw error;
    }
  }

  // ============ AI Insights Management ============

  /**
   * Get AI insights for a user
   */
  async getUserInsights(userId: string, options: MCPOptions = {}) {
    try {
      const { limit = 10, type, isActive = true } = options;
      const params = new URLSearchParams({
        limit: String(limit),
        isActive: String(isActive),
        ...(type && { type }),
      });
      return await this.fetchAPI(`${this.baseURL}/insights/${userId}?${params}`);
    } catch (error) {
      console.error('Error getting user insights:', error);
      throw error;
    }
  }

  /**
   * Mark an insight as read
   */
  async markInsightRead(insightId: string) {
    try {
      return await this.fetchAPI(`${this.baseURL}/insights/${insightId}/read`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Error marking insight as read:', error);
      throw error;
    }
  }

  /**
   * Dismiss an insight
   */
  async dismissInsight(insightId: string) {
    try {
      return await this.fetchAPI(`${this.baseURL}/insights/${insightId}/dismiss`, {
        method: 'PATCH',
      });
    } catch (error) {
      console.error('Error dismissing insight:', error);
      throw error;
    }
  }

  // ============ System/Admin ============

  /**
   * List all available MCP tools
   */
  async listMCPTools() {
    try {
      return await this.fetchAPI(`${this.baseURL}/tools`);
    } catch (error) {
      console.error('Error listing MCP tools:', error);
      throw error;
    }
  }

  /**
   * Get MCP query logs (admin only)
   */
  async getMCPQueryLogs(options: MCPOptions = {}) {
    try {
      const { limit = 50, serverName, success } = options;
      const params = new URLSearchParams({
        limit: String(limit),
        ...(serverName && { serverName }),
        ...(success !== undefined && { success: String(success) }),
      });
      return await this.fetchAPI(`${this.baseURL}/logs?${params}`);
    } catch (error) {
      console.error('Error getting MCP query logs:', error);
      throw error;
    }
  }
}

// Export singleton instance
const mcpClient = new MCPClient();
export default mcpClient;
