'use client';

import React, { useState, useRef, useEffect } from 'react';
import aiChatClient from '@/lib/ai-chat-client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Send, MessageCircle, TrendingUp, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface QuizAnalyzerChatProps {
  quizId: string;
  quizTitle: string;
  userScore?: number;
  attemptId?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  analysis?: {
    keyPoints?: string[];
    studyRecommendations?: string[];
    topicsToReview?: string[];
  };
}

export function QuizAnalyzerChat({
  quizId,
  quizTitle,
  userScore,
  attemptId,
}: QuizAnalyzerChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `I can help you understand your performance on "${quizTitle}"${
        userScore !== undefined ? ` (Score: ${userScore}%)` : ''
      }.\n\nAsk me anything like:\n- "Why did I get question 3 wrong?"\n- "How can I improve my score?"\n- "Explain the concept tested in question 5"\n- "What topics should I review?"`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = {
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await aiChatClient.analyzeQuizWithAI({
        quizId,
        message: input,
        attemptId,
      });

      const analysis = response.data.analysis;
      const assistantMessage: Message = {
        role: 'assistant',
        content: analysis.response,
        timestamp: new Date(),
        analysis: {
          keyPoints: analysis.keyPoints,
          studyRecommendations: analysis.studyRecommendations,
          topicsToReview: analysis.topicsToReview,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error: any) {
      const errorMessage: Message = {
        role: 'assistant',
        content: `Error: ${error.message}. Please try again.`,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageCircle className="h-5 w-5" />
          AI Quiz Analyzer
        </CardTitle>
        <CardDescription>
          Ask questions about your quiz performance and get personalized insights
        </CardDescription>
        {userScore !== undefined && (
          <Badge variant={userScore >= 70 ? 'default' : 'secondary'} className="w-fit">
            Your Score: {userScore}%
          </Badge>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        <ScrollArea className="h-[450px] pr-4">
          <div className="space-y-4">
            {messages.map((message, index) => (
              <div key={index} className="space-y-2">
                <div
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    }`}
                  >
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                </div>

                {message.analysis && (
                  <div className="ml-4 space-y-2 max-w-[80%]">
                    {message.analysis.keyPoints && message.analysis.keyPoints.length > 0 && (
                      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                        <CardContent className="p-3">
                          <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            Key Points
                          </p>
                          <ul className="text-xs space-y-1 list-disc list-inside">
                            {message.analysis.keyPoints.map((point, i) => (
                              <li key={i}>{point}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                    {message.analysis.studyRecommendations &&
                      message.analysis.studyRecommendations.length > 0 && (
                        <Card className="bg-green-50 dark:bg-green-950 border-green-200">
                          <CardContent className="p-3">
                            <p className="text-xs font-semibold mb-1">Study Recommendations</p>
                            <ul className="text-xs space-y-1 list-disc list-inside">
                              {message.analysis.studyRecommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </CardContent>
                        </Card>
                      )}

                    {message.analysis.topicsToReview &&
                      message.analysis.topicsToReview.length > 0 && (
                        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200">
                          <CardContent className="p-3">
                            <p className="text-xs font-semibold mb-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" />
                              Topics to Review
                            </p>
                            <div className="flex flex-wrap gap-1">
                              {message.analysis.topicsToReview.map((topic, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {topic}
                                </Badge>
                              ))}
                            </div>
                          </CardContent>
                        </Card>
                      )}
                  </div>
                )}
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="bg-muted rounded-lg p-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                </div>
              </div>
            )}
            <div ref={scrollRef} />
          </div>
        </ScrollArea>

        <div className="flex gap-2">
          <Input
            placeholder="Ask about your quiz... e.g., 'Why did I get question 3 wrong?'"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
          />
          <Button onClick={handleSend} disabled={loading || !input.trim()}>
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>

        <Alert>
          <AlertDescription className="text-xs">
            <strong>Tip:</strong> Be specific in your questions for better, more detailed
            explanations!
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
