'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import mcpClient from './mcp-client';

interface AIInsight {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: 'info' | 'warning' | 'critical';
  confidence: number;
  recommendations?: any;
  isRead: boolean;
  isDismissed: boolean;
  createdAt: string;
}

interface MCPContextType {
  insights: AIInsight[];
  loading: boolean;
  error: string | null;
  fetchInsights: (userId: string) => Promise<void>;
  markInsightRead: (insightId: string) => Promise<void>;
  dismissInsight: (insightId: string) => Promise<void>;
  getStudentPerformance: (userId: string, includeDetails?: boolean) => Promise<any>;
  getClassInsights: (classId: string, riskThreshold?: number) => Promise<any>;
  predictStudentRisk: (userId: string) => Promise<any>;
  generateRecommendations: (userId: string, focus?: string) => Promise<any>;
  suggestStudyPlan: (userId: string, duration?: string, focus?: string) => Promise<any>;
  detectAnomalies: (userId: string, days?: number) => Promise<any>;
}

const MCPContext = createContext<MCPContextType | undefined>(undefined);

export function MCPProvider({ children }: { children: React.ReactNode }) {
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mcpClient.getUserInsights(userId, {
        limit: 20,
        isActive: true,
      });
      setInsights(response.data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch insights');
      console.error('Error fetching insights:', err);
    } finally {
      setLoading(false);
    }
  };

  const markInsightRead = async (insightId: string) => {
    try {
      await mcpClient.markInsightRead(insightId);
      setInsights((prev) =>
        prev.map((insight) =>
          insight.id === insightId ? { ...insight, isRead: true } : insight
        )
      );
    } catch (err: any) {
      setError(err.message || 'Failed to mark insight as read');
      console.error('Error marking insight as read:', err);
    }
  };

  const dismissInsight = async (insightId: string) => {
    try {
      await mcpClient.dismissInsight(insightId);
      setInsights((prev) => prev.filter((insight) => insight.id !== insightId));
    } catch (err: any) {
      setError(err.message || 'Failed to dismiss insight');
      console.error('Error dismissing insight:', err);
    }
  };

  const getStudentPerformance = async (userId: string, includeDetails = false) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mcpClient.getStudentPerformance(userId, includeDetails);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to get student performance');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getClassInsights = async (classId: string, riskThreshold = 0.7) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mcpClient.getClassInsights(classId, riskThreshold);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to get class insights');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const predictStudentRisk = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mcpClient.predictStudentRisk(userId);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to predict student risk');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async (userId: string, focus = 'general') => {
    setLoading(true);
    setError(null);
    try {
      const response = await mcpClient.generateRecommendations(userId, focus);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const suggestStudyPlan = async (
    userId: string,
    duration = 'week',
    focus: string | null = null
  ) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mcpClient.suggestStudyPlan(userId, duration, focus);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to suggest study plan');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const detectAnomalies = async (userId: string, days = 14) => {
    setLoading(true);
    setError(null);
    try {
      const response = await mcpClient.detectAnomalies(userId, days);
      return response.data;
    } catch (err: any) {
      setError(err.message || 'Failed to detect anomalies');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <MCPContext.Provider
      value={{
        insights,
        loading,
        error,
        fetchInsights,
        markInsightRead,
        dismissInsight,
        getStudentPerformance,
        getClassInsights,
        predictStudentRisk,
        generateRecommendations,
        suggestStudyPlan,
        detectAnomalies,
      }}
    >
      {children}
    </MCPContext.Provider>
  );
}

export function useMCP() {
  const context = useContext(MCPContext);
  if (context === undefined) {
    throw new Error('useMCP must be used within an MCPProvider');
  }
  return context;
}
