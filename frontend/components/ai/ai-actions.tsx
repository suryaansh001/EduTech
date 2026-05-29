'use client';

import React, { useState } from 'react';
import { useMCP } from '@/lib/mcp-context';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Brain, TrendingUp, AlertTriangle, BookOpen } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AIActionsProps {
  userId: string;
  classId?: string;
}

export function AIActions({ userId, classId }: AIActionsProps) {
  const {
    loading,
    predictStudentRisk,
    generateRecommendations,
    suggestStudyPlan,
    detectAnomalies,
  } = useMCP();

  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedFocus, setSelectedFocus] = useState('general');
  const [selectedDuration, setSelectedDuration] = useState('week');

  const handlePredictRisk = async () => {
    try {
      setError(null);
      setResult(null);
      const data = await predictStudentRisk(userId);
      setResult({ type: 'risk', data });
    } catch (err: any) {
      setError(err.message || 'Failed to predict risk');
    }
  };

  const handleGenerateRecommendations = async () => {
    try {
      setError(null);
      setResult(null);
      const data = await generateRecommendations(userId, selectedFocus);
      setResult({ type: 'recommendations', data });
    } catch (err: any) {
      setError(err.message || 'Failed to generate recommendations');
    }
  };

  const handleSuggestStudyPlan = async () => {
    try {
      setError(null);
      setResult(null);
      const data = await suggestStudyPlan(userId, selectedDuration);
      setResult({ type: 'studyPlan', data });
    } catch (err: any) {
      setError(err.message || 'Failed to suggest study plan');
    }
  };

  const handleDetectAnomalies = async () => {
    try {
      setError(null);
      setResult(null);
      const data = await detectAnomalies(userId, 14);
      setResult({ type: 'anomalies', data });
    } catch (err: any) {
      setError(err.message || 'Failed to detect anomalies');
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            AI-Powered Actions
          </CardTitle>
          <CardDescription>
            Use AI to analyze performance, predict outcomes, and get personalized recommendations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Predict Risk */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="h-8 w-8 text-orange-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Risk Assessment</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      AI predicts your risk level and identifies factors
                    </p>
                    <Button
                      onClick={handlePredictRisk}
                      disabled={loading}
                      size="sm"
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Assess Risk'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Generate Recommendations */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-8 w-8 text-green-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Get Recommendations</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      AI generates personalized improvement suggestions
                    </p>
                    <Select value={selectedFocus} onValueChange={setSelectedFocus}>
                      <SelectTrigger className="mb-2">
                        <SelectValue placeholder="Focus area" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General</SelectItem>
                        <SelectItem value="performance">Performance</SelectItem>
                        <SelectItem value="engagement">Engagement</SelectItem>
                        <SelectItem value="wellness">Wellness</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleGenerateRecommendations}
                      disabled={loading}
                      size="sm"
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        'Generate'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Plan */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <BookOpen className="h-8 w-8 text-blue-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Study Plan</h4>
                    <p className="text-sm text-muted-foreground mb-2">
                      AI creates a personalized study schedule
                    </p>
                    <Select value={selectedDuration} onValueChange={setSelectedDuration}>
                      <SelectTrigger className="mb-2">
                        <SelectValue placeholder="Duration" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="week">1 Week</SelectItem>
                        <SelectItem value="month">1 Month</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleSuggestStudyPlan}
                      disabled={loading}
                      size="sm"
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Creating...
                        </>
                      ) : (
                        'Create Plan'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Detect Anomalies */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Brain className="h-8 w-8 text-purple-500 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold mb-1">Pattern Analysis</h4>
                    <p className="text-sm text-muted-foreground mb-3">
                      Detect unusual patterns in your learning behavior
                    </p>
                    <Button
                      onClick={handleDetectAnomalies}
                      disabled={loading}
                      size="sm"
                      className="w-full"
                    >
                      {loading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Analyzing...
                        </>
                      ) : (
                        'Analyze Patterns'
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Results Display */}
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>AI Analysis Results</CardTitle>
          </CardHeader>
          <CardContent>
            {result.type === 'risk' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-semibold">Risk Level:</span>
                  <Badge
                    variant={
                      result.data.prediction.riskLevel === 'HIGH' ||
                      result.data.prediction.riskLevel === 'CRITICAL'
                        ? 'destructive'
                        : 'default'
                    }
                  >
                    {result.data.prediction.riskLevel}
                  </Badge>
                </div>
                <div>
                  <span className="font-semibold">Risk Score: </span>
                  <span>{result.data.prediction.riskScore}/100</span>
                </div>
                {result.data.prediction.riskFactors && (
                  <div>
                    <p className="font-semibold mb-2">Risk Factors:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.data.prediction.riskFactors.map((factor: string, idx: number) => (
                        <li key={idx}>{factor}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {result.data.prediction.recommendations && (
                  <div>
                    <p className="font-semibold mb-2">Recommendations:</p>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.data.prediction.recommendations.map((rec: string, idx: number) => (
                        <li key={idx}>{rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}

            {result.type === 'recommendations' && (
              <div className="space-y-3">
                {result.data.recommendations.map((rec: any, idx: number) => (
                  <Card key={idx}>
                    <CardContent className="p-3">
                      <div className="flex items-start gap-2">
                        <Badge>{rec.priority || 'medium'}</Badge>
                        <div>
                          <h5 className="font-semibold text-sm">{rec.title}</h5>
                          <p className="text-sm text-muted-foreground">{rec.description}</p>
                          {rec.category && (
                            <Badge variant="outline" className="mt-1">
                              {rec.category}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {result.type === 'studyPlan' && (
              <div className="space-y-3">
                <pre className="text-sm bg-muted p-4 rounded-md overflow-auto">
                  {JSON.stringify(result.data.studyPlan, null, 2)}
                </pre>
              </div>
            )}

            {result.type === 'anomalies' && (
              <div className="space-y-3">
                {result.data.anomaliesDetected ? (
                  <>
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Anomalies Detected</AlertTitle>
                      <AlertDescription>
                        {result.data.anomalies?.length || 0} unusual patterns found
                      </AlertDescription>
                    </Alert>
                    {result.data.anomalies?.map((anomaly: any, idx: number) => (
                      <Card key={idx}>
                        <CardContent className="p-3">
                          <Badge variant="outline">{anomaly.type}</Badge>
                          <p className="text-sm mt-2">{anomaly.description}</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {anomaly.recommendation}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </>
                ) : (
                  <Alert>
                    <AlertTitle>No Anomalies</AlertTitle>
                    <AlertDescription>
                      Your learning patterns look normal and healthy!
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
