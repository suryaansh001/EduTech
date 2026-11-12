import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const groq = process.env.GROQ_API_KEY ? new Groq({ apiKey: process.env.GROQ_API_KEY }) : null;

class PredictionsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'edutech-predictions',
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
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'predict_final_grade',
          description: 'Predict final grade for a student in a class',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Student ID' },
              classId: { type: 'string', description: 'Class ID' },
              currentWeek: { type: 'number', description: 'Current week number' },
              totalWeeks: { type: 'number', description: 'Total weeks in course' },
            },
            required: ['userId', 'classId'],
          },
        },
        {
          name: 'predict_dropout_risk',
          description: 'Predict probability of student dropping out',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Student ID' },
              classId: { type: 'string', description: 'Class ID (optional)' },
            },
            required: ['userId'],
          },
        },
        {
          name: 'predict_topic_difficulty',
          description: 'Predict difficulty level of upcoming topics for a student',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Student ID' },
              subject: { type: 'string', description: 'Subject area' },
              topics: {
                type: 'array',
                items: { type: 'string' },
                description: 'List of topics to evaluate',
              },
            },
            required: ['userId', 'subject', 'topics'],
          },
        },
        {
          name: 'forecast_engagement',
          description: 'Forecast student engagement for upcoming period',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Student ID' },
              days: { type: 'number', description: 'Days to forecast', default: 7 },
            },
            required: ['userId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'predict_final_grade':
            return await this.predictFinalGrade(args);
          case 'predict_dropout_risk':
            return await this.predictDropoutRisk(args);
          case 'predict_topic_difficulty':
            return await this.predictTopicDifficulty(args);
          case 'forecast_engagement':
            return await this.forecastEngagement(args);
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

  async predictFinalGrade(args) {
    const { userId, classId, currentWeek = 8, totalWeeks = 16 } = args;

    const enrollment = await prisma.enrollment.findFirst({
      where: { userId, classId },
      include: {
        user: { select: { name: true } },
        class: { select: { title: true } },
      },
    });

    if (!enrollment) {
      throw new Error('Enrollment not found');
    }

    const quizzes = await prisma.quizAttempt.findMany({
      where: {
        userId,
        quiz: { classId },
      },
      select: { percentageScore: true, completedAt: true },
    });

    const avgScore = quizzes.reduce((a, b) => a + b.percentageScore, 0) / quizzes.length || 0;

    const prompt = `Predict the final grade for this student:

Student: ${enrollment.user.name}
Class: ${enrollment.class.title}
Current Week: ${currentWeek} of ${totalWeeks}
Progress: ${enrollment.progress}%
Current Grade: ${enrollment.currentGrade || 'N/A'}
Quiz Average: ${avgScore.toFixed(2)}%
Total Quizzes Taken: ${quizzes.length}
Attendance Rate: ${enrollment.attendanceRate || 'N/A'}
Engagement Score: ${enrollment.engagementScore || 'N/A'}

Based on current trajectory and historical performance, predict:
{
  "predictedGrade": <number 0-100>,
  "confidence": <number 0-1>,
  "trajectory": "improving|stable|declining",
  "factors": {
    "recentPerformance": <impact score>,
    "attendance": <impact score>,
    "engagement": <impact score>,
    "timeRemaining": <impact score>
  },
  "recommendations": [<array of suggestions>]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are a predictive analytics AI for education. Provide accurate predictions based on data.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const prediction = JSON.parse(completion.choices[0].message.content);

    await prisma.aIInsight.create({
      data: {
        userId,
        scope: 'student',
        type: 'prediction',
        title: `Final Grade Prediction - ${enrollment.class.title}`,
        description: `Predicted final grade: ${prediction.predictedGrade}%`,
        severity: prediction.predictedGrade < 60 ? 'warning' : 'info',
        confidence: prediction.confidence,
        model: 'llama-3.3-70b-versatile',
        dataPoints: quizzes.length,
        recommendations: prediction.recommendations,
        relatedMetrics: prediction.factors,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              student: enrollment.user.name,
              class: enrollment.class.title,
              current: { week: currentWeek, grade: enrollment.currentGrade },
              prediction,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async predictDropoutRisk(args) {
    const { userId, classId } = args;

    const where = { userId };
    if (classId) where.classId = classId;

    const enrollments = await prisma.enrollment.findMany({
      where,
      include: {
        class: { select: { title: true } },
        user: { select: { name: true, lastLogin: true } },
      },
    });

    if (enrollments.length === 0) {
      throw new Error('No enrollments found');
    }

    const activities = await prisma.learningActivity.findMany({
      where: {
        userId,
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const quizzes = await prisma.quizAttempt.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: 10,
    });

    const prompt = `Assess dropout risk for this student:

Student: ${enrollments[0].user.name}
Active Enrollments: ${enrollments.length}
Last Login: ${enrollments[0].user.lastLogin}
Recent Activities (30 days): ${activities.length}
Recent Quiz Average: ${quizzes.reduce((a, b) => a + b.percentageScore, 0) / quizzes.length || 0}%

Enrollment Details:
${enrollments.map((e) => `- ${e.class.title}: Progress ${e.progress}%, Attendance ${e.attendanceRate || 'N/A'}`).join('\n')}

Provide dropout risk assessment:
{
  "riskLevel": "low|medium|high|critical",
  "probability": <0-1>,
  "primaryFactors": [<factors>],
  "warningSign": [<signs>],
  "interventions": [<suggested actions>],
  "urgency": "low|medium|high"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an early warning system AI for student retention.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const risk = JSON.parse(completion.choices[0].message.content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              student: enrollments[0].user.name,
              enrollmentCount: enrollments.length,
              dropoutRisk: risk,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async predictTopicDifficulty(args) {
    const { userId, subject, topics } = args;

    const performance = await prisma.performanceRecord.findMany({
      where: { userId, subject },
      orderBy: { lastAttemptAt: 'desc' },
    });

    const prompt = `Predict difficulty levels for upcoming topics:

Student Historical Performance in ${subject}:
${performance.map((p) => `- ${p.topic}: ${p.accuracyRate}% accuracy, ${p.masteryLevel}, ${p.trend}`).join('\n')}

Upcoming Topics to Evaluate:
${topics.map((t, i) => `${i + 1}. ${t}`).join('\n')}

For each topic, predict:
{
  "topics": [
    {
      "name": "<topic>",
      "predictedDifficulty": "easy|moderate|difficult|very_difficult",
      "confidenceScore": <0-1>,
      "estimatedStudyHours": <number>,
      "prerequisites": [<related topics>],
      "recommendations": "<study approach>"
    }
  ]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an adaptive learning AI that predicts topic difficulty for students.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const predictions = JSON.parse(completion.choices[0].message.content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              subject,
              studentLevel: performance[0]?.masteryLevel || 'NOVICE',
              predictions,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async forecastEngagement(args) {
    const { userId, days = 7 } = args;

    const activities = await prisma.learningActivity.findMany({
      where: {
        userId,
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
      orderBy: { date: 'asc' },
    });

    const avgActivity =
      activities.reduce((a, b) => a + b.activityScore, 0) / activities.length || 0;

    const prompt = `Forecast engagement for next ${days} days:

Historical Activity (30 days): ${activities.length} active days
Average Activity Score: ${avgActivity.toFixed(2)}
Recent Trend: ${activities.slice(-7).map((a) => a.activityScore).join(', ')}

Forecast:
{
  "forecastDays": ${days},
  "predictions": [
    {
      "day": 1,
      "predictedActivityScore": <number>,
      "confidence": <0-1>,
      "expectedMinutes": <number>
    }
  ],
  "overallTrend": "increasing|stable|decreasing",
  "alerts": [<potential issues>],
  "suggestions": [<engagement boosters>]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an engagement forecasting AI.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const forecast = JSON.parse(completion.choices[0].message.content);

    return {
      content: [{ type: 'text', text: JSON.stringify(forecast, null, 2) }],
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('EduTech Predictions MCP Server running on stdio');
  }
}

const server = new PredictionsMCPServer();
server.run().catch(console.error);
