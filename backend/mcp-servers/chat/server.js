import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import { Pinecone } from '@pinecone-database/pinecone';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;
const pinecone = process.env.PINECONE_API_KEY ? new Pinecone({ apiKey: process.env.PINECONE_API_KEY }) : null;

class ChatMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'edutech-chat',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.pineconeIndex = null;
    this.setupHandlers();
    this.setupErrorHandling();
    this.initializePinecone();
  }

  async initializePinecone() {
    try {
      if (process.env.PINECONE_INDEX_NAME && pinecone) {
        this.pineconeIndex = pinecone.index(process.env.PINECONE_INDEX_NAME);
        console.error('Pinecone initialized successfully');
      }
    } catch (error) {
      console.error('Pinecone initialization failed:', error);
    }
  }

  setupErrorHandling() {
    this.server.onerror = (error) => {
      console.error('[MCP Error]', error);
    };

    process.on('SIGINT', async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  }

  setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'create_quiz_from_chat',
          description: 'Create a quiz from natural language conversation with document context',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Teacher user ID' },
              classId: { type: 'string', description: 'Class ID' },
              chatMessage: { type: 'string', description: 'Teacher request message' },
              documentIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Optional document IDs to use as context',
              },
            },
            required: ['userId', 'classId', 'chatMessage'],
          },
        },
        {
          name: 'analyze_quiz_with_ai',
          description: 'Student analyzes quiz performance using AI',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Student user ID' },
              quizId: { type: 'string', description: 'Quiz ID' },
              attemptId: { type: 'string', description: 'Quiz attempt ID (optional)' },
              chatMessage: { type: 'string', description: 'Student question about the quiz' },
            },
            required: ['userId', 'quizId', 'chatMessage'],
          },
        },
        {
          name: 'search_documents',
          description: 'Search uploaded documents using semantic search',
          inputSchema: {
            type: 'object',
            properties: {
              query: { type: 'string', description: 'Search query' },
              classId: { type: 'string', description: 'Class ID to filter documents' },
              topK: { type: 'number', description: 'Number of results', default: 5 },
            },
            required: ['query'],
          },
        },
        {
          name: 'chat_with_documents',
          description: 'Chat with uploaded documents using RAG',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'User ID' },
              message: { type: 'string', description: 'User message' },
              documentIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Document IDs to chat with',
              },
            },
            required: ['userId', 'message'],
          },
        },
        {
          name: 'general_chat',
          description: 'General AI assistant conversation with optional RAG context',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'User ID' },
              message: { type: 'string', description: 'User message' },
              conversationHistory: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    role: { type: 'string', enum: ['user', 'assistant'] },
                    content: { type: 'string' },
                  },
                },
                description: 'Previous conversation messages for context',
              },
              classId: { type: 'string', description: 'Optional class ID to filter context' },
              useRAG: { type: 'boolean', description: 'Whether to search documents for context', default: true },
            },
            required: ['userId', 'message'],
          },
        },
        {
          name: 'generate_quiz_questions',
          description: 'Generate quiz questions from content',
          inputSchema: {
            type: 'object',
            properties: {
              content: { type: 'string', description: 'Content to generate questions from' },
              questionCount: { type: 'number', description: 'Number of questions', default: 5 },
              questionTypes: {
                type: 'array',
                items: { type: 'string', enum: ['MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER'] },
                description: 'Types of questions to generate',
              },
              difficulty: {
                type: 'string',
                enum: ['easy', 'medium', 'hard'],
                default: 'medium',
              },
            },
            required: ['content'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'create_quiz_from_chat':
            return await this.createQuizFromChat(args);
          case 'analyze_quiz_with_ai':
            return await this.analyzeQuizWithAI(args);
          case 'search_documents':
            return await this.searchDocuments(args);
          case 'chat_with_documents':
            return await this.chatWithDocuments(args);
          case 'general_chat':
            return await this.generalChat(args);
          case 'generate_quiz_questions':
            return await this.generateQuizQuestions(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true,
        };
      }
    });
  }

  async createQuizFromChat(args) {
    const { userId, classId, chatMessage, documentIds = [] } = args;

    // Get user and class info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true },
    });

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      select: { title: true, subject: true },
    });

    if (user.role !== 'TEACHER') {
      throw new Error('Only teachers can create quizzes');
    }

    // Fetch document context if provided
    let documentContext = '';
    if (documentIds.length > 0 && this.pineconeIndex) {
      const docs = await prisma.fileUpload.findMany({
        where: { id: { in: documentIds }, classId },
      });

      // Search Pinecone for relevant content
      for (const doc of docs) {
        const searchResult = await this.searchInPinecone(
          `${doc.originalName} ${chatMessage}`,
          5
        );
        documentContext += searchResult.map((r) => r.text).join('\n\n');
      }
    }

    // Use LLM to understand the request and generate quiz structure
    const prompt = `You are an AI assistant helping a teacher create a quiz.

Teacher: ${user.name}
Class: ${classData.title} (${classData.subject})
Request: ${chatMessage}

${documentContext ? `\nDocument Context:\n${documentContext}\n` : ''}

Based on the teacher's request, create a quiz structure with the following:

1. Determine quiz details:
   - Title
   - Description
   - Time limit (in minutes)
   - Total marks

2. Generate appropriate questions based on the request
   - Extract question count from request (default: 5)
   - Determine question types (MULTIPLE_CHOICE, TRUE_FALSE, SHORT_ANSWER)
   - Create questions with proper options and correct answers
   - Assign marks per question

Response format (JSON):
{
  "quiz": {
    "title": "...",
    "description": "...",
    "timeLimit": <minutes>,
    "totalMarks": <number>
  },
  "questions": [
    {
      "type": "MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER",
      "question": "...",
      "options": ["A", "B", "C", "D"], // empty array for SHORT_ANSWER
      "correctAnswer": "...",
      "marks": <number>,
      "explanation": "..." // optional
    }
  ],
  "summary": "Brief summary of what was created"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert quiz creator. Always respond with valid JSON.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const quizData = JSON.parse(completion.choices[0].message.content);

    // Create the quiz in database
    const quiz = await prisma.quiz.create({
      data: {
        title: quizData.quiz.title,
        description: quizData.quiz.description,
        timeLimit: quizData.quiz.timeLimit,
        totalMarks: quizData.quiz.totalMarks,
        classId,
        isActive: false, // Teacher needs to activate it
      },
    });

    // Create questions
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      await prisma.question.create({
        data: {
          quizId: quiz.id,
          type: q.type,
          question: q.question,
          options: q.options || [],
          correctAnswer: q.correctAnswer,
          marks: q.marks,
          order: i + 1,
        },
      });
    }

    // Log the AI interaction
    await prisma.mCPQueryLog.create({
      data: {
        userId,
        serverName: 'chat_server',
        query: chatMessage,
        queryType: 'quiz_creation',
        toolCalled: 'create_quiz_from_chat',
        responseTime: 2000,
        success: true,
        tokensUsed: completion.usage?.total_tokens || 0,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              success: true,
              quizId: quiz.id,
              quiz: quizData.quiz,
              questionsCreated: quizData.questions.length,
              summary: quizData.summary,
              message:
                'Quiz created successfully! Review and activate it when ready.',
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async analyzeQuizWithAI(args) {
    const { userId, quizId, attemptId, chatMessage } = args;

    // Get quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: true,
        class: { select: { title: true, subject: true } },
      },
    });

    if (!quiz) {
      throw new Error('Quiz not found');
    }

    // Get user's attempt(s)
    const attempts = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quizId,
        ...(attemptId && { id: attemptId }),
      },
      orderBy: { completedAt: 'desc' },
    });

    if (attempts.length === 0) {
      throw new Error('No quiz attempts found');
    }

    const latestAttempt = attempts[0];

    // Prepare analysis context
    const prompt = `You are an AI tutor helping a student understand their quiz performance.

Quiz: ${quiz.title}
Subject: ${quiz.class.subject}
Total Questions: ${quiz.questions.length}
Total Marks: ${quiz.totalMarks}

Student Performance:
- Score: ${latestAttempt.score}/${latestAttempt.totalMarks} (${latestAttempt.percentageScore}%)
- Time Spent: ${latestAttempt.timeSpentMinutes || 'N/A'} minutes

Questions:
${quiz.questions
  .map((q, i) => {
    const userAnswer = latestAttempt.answers?.[`q${i + 1}`] || 'Not answered';
    const isCorrect = userAnswer === q.correctAnswer;
    return `${i + 1}. ${q.question}
   Type: ${q.type}
   Correct Answer: ${q.correctAnswer}
   Your Answer: ${userAnswer} ${isCorrect ? '✓' : '✗'}`;
  })
  .join('\n\n')}

Student Question: ${chatMessage}

Provide a helpful, educational response that:
1. Answers the student's specific question
2. Explains concepts they got wrong
3. Provides tips for improvement
4. Encourages learning

Response format (JSON):
{
  "response": "Your detailed response...",
  "keyPoints": ["point1", "point2"],
  "studyRecommendations": ["recommendation1", "recommendation2"],
  "topicsToReview": ["topic1", "topic2"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI tutor. Be encouraging and educational.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              quizTitle: quiz.title,
              yourScore: `${latestAttempt.percentageScore}%`,
              analysis,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async searchDocuments(args) {
    const { query, classId, topK = 5 } = args;

    if (!this.pineconeIndex) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              message: 'Pinecone not configured. Please set up PINECONE_API_KEY and PINECONE_INDEX_NAME',
              results: [],
            }),
          },
        ],
      };
    }

    const results = await this.searchInPinecone(query, topK, classId);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ query, results }, null, 2),
        },
      ],
    };
  }

  async searchInPinecone(query, topK = 5, classId = null) {
    if (!this.pineconeIndex) return [];

    try {
      // Generate embedding for query using Groq or OpenAI
      // For now, using a simple text search fallback
      const filter = classId ? { classId } : {};

      const queryResponse = await this.pineconeIndex.query({
        topK,
        includeMetadata: true,
        filter,
      });

      return (
        queryResponse.matches?.map((match) => ({
          id: match.id,
          score: match.score,
          text: match.metadata?.text || '',
          source: match.metadata?.source || '',
        })) || []
      );
    } catch (error) {
      console.error('Pinecone search error:', error);
      return [];
    }
  }

  async chatWithDocuments(args) {
    const { userId, message, documentIds = [] } = args;

    // Get document context
    let context = '';
    if (documentIds.length > 0 && this.pineconeIndex) {
      const results = await this.searchInPinecone(message, 5);
      context = results.map((r) => r.text).join('\n\n');
    }

    const prompt = `Based on the following documents, answer the user's question:

Documents:
${context || 'No documents provided'}

User Question: ${message}

Provide a clear, concise answer based on the document content. If the answer is not in the documents, say so.`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a helpful AI assistant that answers questions based on provided documents.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              response: completion.choices[0].message.content,
              sourcesUsed: documentIds.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async generalChat(args) {
    const { userId, message, conversationHistory = [], classId, useRAG = true } = args;

    // Get user info for personalization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, role: true },
    });

    // Get RAG context if enabled
    let ragContext = '';
    let sources = [];
    
    if (useRAG && this.pineconeIndex) {
      try {
        const searchResults = await this.searchInPinecone(message, 5, classId);
        if (searchResults.length > 0) {
          ragContext = searchResults.map((r) => r.text).join('\n\n');
          sources = searchResults.map((r) => ({
            id: r.id,
            title: r.source || 'Document',
            excerpt: r.text?.substring(0, 150) + '...',
            score: r.score,
          }));
        }
      } catch (error) {
        console.error('RAG search error:', error);
      }
    }

    // Build conversation messages
    const systemPrompt = `You are EduTech AI, an intelligent educational assistant for the EduTech learning platform. 
You help students learn, understand concepts, prepare for quizzes, and navigate their coursework.
You help teachers create quizzes, analyze student performance, and manage their classes.

Current user: ${user?.name || 'Student'} (${user?.role || 'STUDENT'})

Guidelines:
- Be friendly, encouraging, and educational
- Provide clear explanations with examples when helpful
- If you're unsure, say so and suggest how to find the answer
- When discussing course materials, cite sources when available
- Keep responses concise but thorough
${ragContext ? '\n\nRelevant course materials for context:\n' + ragContext : ''}`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10).map(msg => ({
        role: msg.role,
        content: msg.content,
      })),
      { role: 'user', content: message },
    ];

    const completion = await groq.chat.completions.create({
      messages,
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      max_tokens: 1024,
    });

    const response = completion.choices[0].message.content;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              response,
              sources: sources.length > 0 ? sources : undefined,
              tokensUsed: completion.usage?.total_tokens || 0,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async generateQuizQuestions(args) {
    const {
      content,
      questionCount = 5,
      questionTypes = ['MULTIPLE_CHOICE'],
      difficulty = 'medium',
    } = args;

    const prompt = `Generate ${questionCount} quiz questions from the following content:

Content:
${content}

Requirements:
- Question Types: ${questionTypes.join(', ')}
- Difficulty: ${difficulty}
- Each question should have clear, unambiguous answers
- For MULTIPLE_CHOICE: provide 4 options (A, B, C, D)
- For TRUE_FALSE: answer should be "True" or "False"
- For SHORT_ANSWER: provide a concise correct answer

Response format (JSON):
{
  "questions": [
    {
      "type": "MULTIPLE_CHOICE|TRUE_FALSE|SHORT_ANSWER",
      "question": "...",
      "options": ["A", "B", "C", "D"], // empty for non-MCQ
      "correctAnswer": "...",
      "marks": 1,
      "explanation": "Why this is the correct answer"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an expert quiz question generator. Create high-quality, educational questions.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const result = JSON.parse(completion.choices[0].message.content);

    return {
      content: [{ type: 'text', text: JSON.stringify(result, null, 2) }],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('EduTech Chat MCP Server running on stdio');
  }
}

const server = new ChatMCPServer();
server.run().catch(console.error);
