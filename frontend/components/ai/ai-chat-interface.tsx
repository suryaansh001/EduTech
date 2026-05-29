'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import aiChatClient from '@/lib/ai-chat-client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import {
  Loader2,
  Send,
  Sparkles,
  FileText,
  Paperclip,
  RotateCcw,
  Copy,
  Check,
  ChevronDown,
  Bot,
  User,
  Search,
  BookOpen,
  Lightbulb,
  MessageSquare,
  Trash2,
  Plus,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: Array<{
    id: string;
    title: string;
    excerpt: string;
    score?: number;
  }>;
  isStreaming?: boolean;
}

interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

interface AIChatInterfaceProps {
  userId: string;
  classId?: string;
  documentIds?: string[];
  mode?: 'general' | 'document' | 'quiz';
  onQuizCreated?: (quizId: string) => void;
}

const suggestedPrompts = [
  {
    icon: <Search className="h-4 w-4" />,
    text: 'Search my course materials',
    prompt: 'Search my uploaded documents for information about',
  },
  {
    icon: <BookOpen className="h-4 w-4" />,
    text: 'Explain a concept',
    prompt: 'Explain the concept of',
  },
  {
    icon: <Lightbulb className="h-4 w-4" />,
    text: 'Quiz me on a topic',
    prompt: 'Create practice questions about',
  },
  {
    icon: <FileText className="h-4 w-4" />,
    text: 'Summarize my notes',
    prompt: 'Summarize the key points from my notes on',
  },
];

export function AIChatInterface({
  userId,
  classId,
  documentIds = [],
  mode = 'general',
  onQuizCreated,
}: AIChatInterfaceProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversation, setActiveConversation] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [selectedDocs, setSelectedDocs] = useState<string[]>(documentIds);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const generateMessageId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Build conversation history from messages
  const getConversationHistory = () => {
    return messages
      .filter((m) => m.role !== 'system' && !m.isStreaming)
      .map((m) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      }));
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: generateMessageId(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    const assistantMessageId = generateMessageId();
    const streamingMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
    };

    setMessages((prev) => [...prev, userMessage, streamingMessage]);
    const currentInput = input.trim();
    setInput('');
    setIsLoading(true);

    try {
      // Use the general chat endpoint with conversation history
      const conversationHistory = getConversationHistory();
      const response = await aiChatClient.chat({
        message: currentInput,
        conversationHistory,
        classId,
        useRAG: true,
      });

      const assistantContent = response.data?.response || 
        response.data?.answer || 
        'I apologize, but I could not generate a response. Please try again.';
      
      const sources = response.data?.sources || response.data?.results?.map((r: any) => ({
        id: r.id,
        title: r.source || r.title || 'Document',
        excerpt: r.text?.substring(0, 150) + '...' || '',
        score: r.score,
      }));

      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: assistantContent,
                sources,
                isStreaming: false,
              }
            : msg
        )
      );
    } catch (error: any) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: `I encountered an error: ${error.message}. Please try again.`,
                isStreaming: false,
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const formatSearchResults = (results: any[]) => {
    if (!results || results.length === 0) {
      return "I couldn't find any relevant information in your documents. Try rephrasing your question or uploading more materials.";
    }
    return `I found ${results.length} relevant result(s) in your documents. Here's what I discovered:\n\n${results
      .slice(0, 3)
      .map((r, i) => `**${i + 1}. ${r.source || 'Document'}**\n${r.text?.substring(0, 200)}...`)
      .join('\n\n')}`;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = async (id: string, content: string) => {
    await navigator.clipboard.writeText(content);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleRegenerate = async (messageId: string) => {
    const messageIndex = messages.findIndex((m) => m.id === messageId);
    if (messageIndex === -1) return;

    // Find the user message before this assistant message
    const userMessage = messages
      .slice(0, messageIndex)
      .reverse()
      .find((m) => m.role === 'user');
    
    if (!userMessage) return;

    // Remove messages from the regenerated one onwards
    setMessages((prev) => prev.slice(0, messageIndex));
    
    // Resend with the original user input
    setInput(userMessage.content);
    setTimeout(() => handleSend(), 100);
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInput(prompt + ' ');
    textareaRef.current?.focus();
  };

  const renderMessage = (message: Message) => {
    const isUser = message.role === 'user';
    const isStreaming = message.isStreaming;

    return (
      <div
        key={message.id}
        className={cn(
          'group flex gap-4 px-4 py-6',
          isUser ? 'bg-background' : 'bg-muted/50'
        )}
      >
        <Avatar className="h-8 w-8 shrink-0">
          {isUser ? (
            <>
              <AvatarFallback className="bg-primary text-primary-foreground">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </>
          ) : (
            <>
              <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                <Sparkles className="h-4 w-4" />
              </AvatarFallback>
            </>
          )}
        </Avatar>

        <div className="flex-1 space-y-2 overflow-hidden">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm">
              {isUser ? 'You' : 'EduTech AI'}
            </span>
            <span className="text-xs text-muted-foreground">
              {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>

          <div className="prose prose-sm dark:prose-invert max-w-none">
            {isStreaming ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                <span className="text-muted-foreground">Thinking...</span>
              </div>
            ) : (
              <div className="whitespace-pre-wrap">{message.content}</div>
            )}
          </div>

          {/* Sources */}
          {message.sources && message.sources.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <FileText className="h-3 w-3" />
                Sources
              </div>
              <div className="flex flex-wrap gap-2">
                {message.sources.map((source, idx) => (
                  <TooltipProvider key={source.id || idx}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="cursor-pointer hover:bg-secondary/80"
                        >
                          {source.title}
                          {source.score && (
                            <span className="ml-1 text-[10px] opacity-70">
                              {Math.round(source.score * 100)}%
                            </span>
                          )}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-xs">
                        <p className="text-xs">{source.excerpt}</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons for assistant messages */}
          {!isUser && !isStreaming && (
            <div className="flex items-center gap-1 pt-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleCopy(message.id, message.content)}
                    >
                      {copiedId === message.id ? (
                        <Check className="h-4 w-4 text-green-500" />
                      ) : (
                        <Copy className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Copy</TooltipContent>
                </Tooltip>
              </TooltipProvider>

              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleRegenerate(message.id)}
                    >
                      <RotateCcw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Regenerate</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] max-h-[800px] bg-background rounded-lg border shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h2 className="font-semibold text-sm">EduTech AI Assistant</h2>
            <p className="text-xs text-muted-foreground">
              Powered by RAG • Ask anything about your courses
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {selectedDocs.length > 0 && (
            <Badge variant="outline" className="text-xs">
              <FileText className="h-3 w-3 mr-1" />
              {selectedDocs.length} docs
            </Badge>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Options</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleClearChat}>
                <Trash2 className="h-4 w-4 mr-2" />
                Clear chat
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Messages area */}
      <ScrollArea className="flex-1">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-violet-500/20 to-purple-600/20 flex items-center justify-center mb-6">
              <MessageSquare className="h-8 w-8 text-violet-500" />
            </div>
            <h3 className="text-xl font-semibold mb-2">How can I help you today?</h3>
            <p className="text-muted-foreground text-sm max-w-md mb-8">
              I can help you search your course materials, explain concepts, create quizzes, and more.
            </p>
            
            {/* Suggested prompts */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
              {suggestedPrompts.map((item, idx) => (
                <Button
                  key={idx}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-start text-left"
                  onClick={() => handleSuggestedPrompt(item.prompt)}
                >
                  <span className="mr-3 text-muted-foreground">{item.icon}</span>
                  <span className="text-sm">{item.text}</span>
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <div className="divide-y">
            {messages.map(renderMessage)}
            <div ref={scrollRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input area */}
      <div className="border-t p-4">
        <div className="relative max-w-4xl mx-auto">
          <div className="relative flex items-end gap-2 rounded-xl border bg-background shadow-sm focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2">
            <Textarea
              ref={textareaRef}
              placeholder="Ask anything about your courses..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              className="min-h-[52px] max-h-[200px] resize-none border-0 focus-visible:ring-0 focus-visible:ring-offset-0 pr-24"
              rows={1}
            />
            <div className="absolute right-2 bottom-2 flex items-center gap-1">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-muted-foreground hover:text-foreground"
                      disabled
                    >
                      <Paperclip className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>Attach files (coming soon)</TooltipContent>
                </Tooltip>
              </TooltipProvider>
              
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                size="icon"
                className="h-8 w-8 rounded-lg bg-primary hover:bg-primary/90"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
          <p className="text-[11px] text-center text-muted-foreground mt-2">
            EduTech AI can make mistakes. Verify important information with your instructor.
          </p>
        </div>
      </div>
    </div>
  );
}

export default AIChatInterface;
