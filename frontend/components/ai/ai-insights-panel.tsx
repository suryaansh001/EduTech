'use client';

import React, { useEffect, useState } from 'react';
import { useMCP } from '@/lib/mcp-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Info, X, Eye } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface AIInsightsPanelProps {
  userId: string;
}

export function AIInsightsPanel({ userId }: AIInsightsPanelProps) {
  const { insights, loading, error, fetchInsights, markInsightRead, dismissInsight } = useMCP();
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (userId) {
      fetchInsights(userId);
    }
  }, [userId]);

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-500" />;
      default:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'warning':
        return 'warning';
      case 'info':
      default:
        return 'default';
    }
  };

  const filteredInsights = insights.filter((insight) => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !insight.isRead;
    return insight.type === filter;
  });

  if (loading && insights.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>Loading insights...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Insights</CardTitle>
          <CardDescription>
            AI-powered recommendations and alerts based on your activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={filter === 'all' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('all')}
            >
              All
            </Button>
            <Button
              variant={filter === 'unread' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('unread')}
            >
              Unread
            </Button>
            <Button
              variant={filter === 'recommendation' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('recommendation')}
            >
              Recommendations
            </Button>
            <Button
              variant={filter === 'alert' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('alert')}
            >
              Alerts
            </Button>
            <Button
              variant={filter === 'prediction' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter('prediction')}
            >
              Predictions
            </Button>
          </div>

          {filteredInsights.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Info className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No insights available yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredInsights.map((insight) => (
                <Card
                  key={insight.id}
                  className={`${!insight.isRead ? 'border-l-4 border-l-blue-500' : ''}`}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        {getSeverityIcon(insight.severity)}
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-semibold text-sm">{insight.title}</h4>
                            <Badge variant={getSeverityColor(insight.severity) as any}>
                              {insight.type}
                            </Badge>
                            {!insight.isRead && (
                              <Badge variant="secondary">New</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {insight.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>Confidence: {(insight.confidence * 100).toFixed(0)}%</span>
                            <span>•</span>
                            <span>
                              {new Date(insight.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          {insight.recommendations && Array.isArray(insight.recommendations) && (
                            <div className="mt-3 space-y-1">
                              <p className="text-xs font-medium">Recommendations:</p>
                              <ul className="text-xs space-y-1 list-disc list-inside text-muted-foreground">
                                {insight.recommendations.slice(0, 3).map((rec: any, idx: number) => (
                                  <li key={idx}>
                                    {typeof rec === 'string' ? rec : rec.title || rec.description}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        {!insight.isRead && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => markInsightRead(insight.id)}
                            title="Mark as read"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => dismissInsight(insight.id)}
                          title="Dismiss"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
