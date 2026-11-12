import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

class AnalyticsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'edutech-analytics',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.setupErrorHandling();
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
    // List available tools
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'get_student_performance',
          description: 'Get comprehensive performance analytics for a student',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'The ID of the student',
              },
              includeDetails: {
                type: 'boolean',
                description: 'Include detailed breakdown',
                default: false,
              },
            },
            required: ['userId'],
          },
        },
        {
          name: 'get_class_insights',
          description: 'Get analytics and insights for a class',
          inputSchema: {
            type: 'object',
            properties: {
              classId: {
                type: 'string',
                description: 'The ID of the class',
              },
              riskThreshold: {
                type: 'number',
                description: 'Risk score threshold (0-1)',
                default: 0.7,
              },
            },
            required: ['classId'],
          },
        },
        {
          name: 'predict_student_risk',
          description: 'Predict student risk level using AI analysis',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'The ID of the student',
              },
            },
            required: ['userId'],
          },
        },
        {
          name: 'compare_performance',
          description: 'Compare performance between students or time periods',
          inputSchema: {
            type: 'object',
            properties: {
              userIds: {
                type: 'array',
                items: { type: 'string' },
                description: 'Array of student IDs to compare',
              },
              metric: {
                type: 'string',
                enum: ['gpa', 'engagement', 'quiz_score', 'attendance'],
                description: 'Metric to compare',
              },
            },
            required: ['userIds', 'metric'],
          },
        },
        {
          name: 'generate_recommendations',
          description: 'Generate AI-powered recommendations for a student',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'The ID of the student',
              },
              focus: {
                type: 'string',
                enum: ['performance', 'engagement', 'wellness', 'general'],
                description: 'Focus area for recommendations',
              },
            },
            required: ['userId'],
          },
        },
        {
          name: 'analyze_learning_patterns',
          description: 'Analyze learning patterns and activity trends',
          inputSchema: {
            type: 'object',
            properties: {
              userId: {
                type: 'string',
                description: 'The ID of the student',
              },
              days: {
                type: 'number',
                description: 'Number of days to analyze',
                default: 30,
              },
            },
            required: ['userId'],
          },
        },
      ],
    }));

    // Handle tool calls
    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'get_student_performance':
            return await this.getStudentPerformance(args);
          case 'get_class_insights':
            return await this.getClassInsights(args);
          case 'predict_student_risk':
            return await this.predictStudentRisk(args);
          case 'compare_performance':
            return await this.comparePerformance(args);
          case 'generate_recommendations':
            return await this.generateRecommendations(args);
          case 'analyze_learning_patterns':
            return await this.analyzeLearningPatterns(args);
          default:
            throw new Error(`Unknown tool: ${name}`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: `Error: ${error.message}`,
            },
          ],
          isError: true,
        };
      }
    });
  }

  async getStudentPerformance(args) {
    const { userId, includeDetails = false } = args;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        studentProfile: true,
        enrollments: {
          include: {
            class: {
              select: { title: true, subject: true },
            },
          },
          where: { status: 'ACTIVE' },
        },
        quizAttempts: {
          orderBy: { completedAt: 'desc' },
          take: includeDetails ? 10 : 5,
          include: {
            quiz: {
              select: { title: true, totalMarks: true },
            },
          },
        },
      },
    });

    if (!user) {
      throw new Error('Student not found');
    }

    // Calculate performance metrics
    const quizStats = await prisma.quizAttempt.aggregate({
      where: { userId },
      _avg: { percentageScore: true },
      _count: true,
    });

    const result = {
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
      performance: {
        totalQuizzes: quizStats._count,
        averageScore: quizStats._avg.percentageScore || 0,
        activeEnrollments: user.enrollments.length,
      },
      recentQuizzes: user.quizAttempts.map((attempt) => ({
        quiz: attempt.quiz.title,
        score: attempt.percentageScore,
        date: attempt.completedAt,
      })),
      enrollments: user.enrollments.map((e) => ({
        class: e.class.title,
        subject: e.class.subject,
        progress: e.progress,
      })),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async getClassInsights(args) {
    const { classId, riskThreshold = 0.7 } = args;

    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: {
          select: { name: true, email: true },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          include: {
            user: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        quizzes: {
          include: {
            attempts: {
              select: {
                score: true,
                percentageScore: true,
                userId: true,
              },
            },
          },
        },
      },
    });

    if (!classData) {
      throw new Error('Class not found');
    }

    // Calculate class statistics
    const allAttempts = classData.quizzes.flatMap((q) => q.attempts);
    const avgScore =
      allAttempts.reduce((sum, a) => sum + a.percentageScore, 0) /
        allAttempts.length || 0;

    // Identify at-risk students (those below threshold)
    const studentScores = {};
    allAttempts.forEach((attempt) => {
      if (!studentScores[attempt.userId]) {
        studentScores[attempt.userId] = [];
      }
      studentScores[attempt.userId].push(attempt.percentageScore);
    });

    const atRiskStudents = Object.entries(studentScores)
      .filter(([_, scores]) => {
        const avgStudentScore = scores.reduce((a, b) => a + b, 0) / scores.length;
        return avgStudentScore < riskThreshold * 100;
      })
      .map(([userId]) => {
        const enrollment = classData.enrollments.find((e) => e.userId === userId);
        return enrollment?.user;
      })
      .filter(Boolean);

    const result = {
      class: {
        id: classData.id,
        title: classData.title,
        subject: classData.subject,
        teacher: classData.teacher.name,
      },
      statistics: {
        totalStudents: classData.enrollments.length,
        totalQuizzes: classData.quizzes.length,
        averageScore: avgScore.toFixed(2),
        atRiskCount: atRiskStudents.length,
      },
      atRiskStudents: atRiskStudents.map((s) => ({
        id: s.id,
        name: s.name,
        email: s.email,
      })),
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }

  async predictStudentRisk(args) {
    const { userId } = args;

    // Gather student data
    const studentData = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        quizAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 10,
          select: {
            percentageScore: true,
            completedAt: true,
          },
        },
        enrollments: {
          where: { status: 'ACTIVE' },
          select: {
            progress: true,
            currentGrade: true,
            attendanceRate: true,
            lastActivityAt: true,
          },
        },
      },
    });

    if (!studentData) {
      throw new Error('Student not found');
    }

    // Prepare data for AI analysis
    const recentScores = studentData.quizAttempts.map((a) => a.percentageScore);
    const avgScore = recentScores.reduce((a, b) => a + b, 0) / recentScores.length || 0;
    const avgProgress =
      studentData.enrollments.reduce((a, b) => a + b.progress, 0) /
        studentData.enrollments.length || 0;

    // Use Groq AI for risk prediction
    const prompt = `Analyze this student's performance and predict their risk level:
    
Student: ${studentData.name}
Recent Quiz Scores: ${recentScores.join(', ')}
Average Score: ${avgScore.toFixed(2)}%
Active Courses: ${studentData.enrollments.length}
Average Progress: ${avgProgress.toFixed(2)}%

Based on this data, provide:
1. Risk Level (LOW, MEDIUM, HIGH, or CRITICAL)
2. Risk Score (0-100)
3. Key Risk Factors (array of factors)
4. Specific Recommendations (array of actionable steps)

Respond in JSON format:
{
  "riskLevel": "...",
  "riskScore": ...,
  "riskFactors": [...],
  "recommendations": [...]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an educational analytics AI that predicts student risk levels. Always respond with valid JSON.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Log the MCP query
    await prisma.mCPQueryLog.create({
      data: {
        userId,
        serverName: 'analytics_server',
        query: 'predict_student_risk',
        queryType: 'ai_analysis',
        toolCalled: 'predict_student_risk',
        responseTime: completion.usage?.total_time || 0,
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
              student: {
                id: studentData.id,
                name: studentData.name,
              },
              prediction: aiResponse,
              dataPoints: {
                recentQuizzes: recentScores.length,
                activeCourses: studentData.enrollments.length,
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async comparePerformance(args) {
    const { userIds, metric } = args;

    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      include: {
        quizAttempts: true,
        enrollments: {
          where: { status: 'ACTIVE' },
        },
      },
    });

    const comparison = users.map((user) => {
      let value;
      switch (metric) {
        case 'quiz_score':
          const scores = user.quizAttempts.map((a) => a.percentageScore);
          value = scores.reduce((a, b) => a + b, 0) / scores.length || 0;
          break;
        case 'engagement':
          value = user.enrollments.length * 10; // Simplified engagement score
          break;
        case 'gpa':
          const grades = user.enrollments
            .map((e) => e.currentGrade)
            .filter(Boolean);
          value = grades.reduce((a, b) => a + b, 0) / grades.length || 0;
          break;
        case 'attendance':
          const rates = user.enrollments
            .map((e) => e.attendanceRate)
            .filter(Boolean);
          value = rates.reduce((a, b) => a + b, 0) / rates.length || 0;
          break;
        default:
          value = 0;
      }

      return {
        id: user.id,
        name: user.name,
        [metric]: value,
      };
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              metric,
              comparison: comparison.sort((a, b) => b[metric] - a[metric]),
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async generateRecommendations(args) {
    const { userId, focus = 'general' } = args;

    const userData = await this.getStudentPerformance({ userId, includeDetails: true });
    const performanceData = JSON.parse(userData.content[0].text);

    const prompt = `Generate personalized recommendations for this student:

Student: ${performanceData.student.name}
Focus Area: ${focus}
Average Quiz Score: ${performanceData.performance.averageScore}%
Total Quizzes: ${performanceData.performance.totalQuizzes}
Active Courses: ${performanceData.performance.activeEnrollments}

Recent Performance:
${performanceData.recentQuizzes.map((q) => `- ${q.quiz}: ${q.score}%`).join('\n')}

Provide 5-7 actionable recommendations in JSON format:
{
  "recommendations": [
    {
      "title": "...",
      "description": "...",
      "priority": "high|medium|low",
      "category": "study|engagement|wellness|time-management"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content:
            'You are an educational advisor AI. Generate practical, actionable recommendations for students.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const aiResponse = JSON.parse(completion.choices[0].message.content);

    // Store as AI insight
    await prisma.aIInsight.create({
      data: {
        userId,
        scope: 'student',
        type: 'recommendation',
        title: `Personalized Recommendations - ${focus}`,
        description: `AI-generated recommendations focusing on ${focus}`,
        severity: 'info',
        confidence: 0.85,
        model: 'llama-3.3-70b-versatile',
        dataPoints: performanceData.performance.totalQuizzes,
        recommendations: aiResponse.recommendations,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              student: performanceData.student,
              focus,
              recommendations: aiResponse.recommendations,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async analyzeLearningPatterns(args) {
    const { userId, days = 30 } = args;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const activities = await prisma.learningActivity.findMany({
      where: {
        userId,
        date: { gte: startDate },
      },
      orderBy: { date: 'asc' },
    });

    if (activities.length === 0) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({ message: 'No activity data found for this period' }),
          },
        ],
      };
    }

    const totalMinutes = activities.reduce((sum, a) => sum + a.minutesActive, 0);
    const avgMinutes = totalMinutes / activities.length;
    const totalQuizzes = activities.reduce((sum, a) => sum + a.quizzesAttempted, 0);

    // Identify trends using AI
    const prompt = `Analyze these learning patterns:

Days Analyzed: ${days}
Active Days: ${activities.length}
Total Study Time: ${totalMinutes} minutes
Average Daily Time: ${avgMinutes.toFixed(0)} minutes
Total Quizzes: ${totalQuizzes}

Daily Breakdown:
${activities
  .map(
    (a) =>
      `${a.date.toISOString().split('T')[0]}: ${a.minutesActive}min, ${a.quizzesAttempted} quizzes`
  )
  .join('\n')}

Provide analysis in JSON format:
{
  "trend": "improving|stable|declining",
  "consistency": "high|medium|low",
  "patterns": ["pattern1", "pattern2"],
  "insights": ["insight1", "insight2"],
  "suggestions": ["suggestion1", "suggestion2"]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a learning analytics AI. Analyze patterns and provide insights.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const aiAnalysis = JSON.parse(completion.choices[0].message.content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              period: { days, activeDays: activities.length },
              statistics: {
                totalMinutes,
                avgMinutes: avgMinutes.toFixed(1),
                totalQuizzes,
              },
              analysis: aiAnalysis,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('EduTech Analytics MCP Server running on stdio');
  }
}

const server = new AnalyticsMCPServer();
server.run().catch(console.error);
