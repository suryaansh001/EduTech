import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';
import { PrismaClient } from '@prisma/client';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

class InsightsMCPServer {
  constructor() {
    this.server = new Server(
      {
        name: 'edutech-insights',
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
          name: 'identify_struggling_topics',
          description: 'Identify topics where students are struggling',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Student ID (optional)' },
              classId: { type: 'string', description: 'Class ID (optional)' },
              subject: { type: 'string', description: 'Subject filter (optional)' },
              threshold: {
                type: 'number',
                description: 'Accuracy threshold',
                default: 0.6,
              },
            },
          },
        },
        {
          name: 'suggest_study_plan',
          description: 'Generate personalized study plan',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Student ID' },
              duration: { type: 'string', enum: ['week', 'month'], default: 'week' },
              focus: { type: 'string', description: 'Focus area (optional)' },
            },
            required: ['userId'],
          },
        },
        {
          name: 'detect_anomalies',
          description: 'Detect unusual patterns in student behavior',
          inputSchema: {
            type: 'object',
            properties: {
              userId: { type: 'string', description: 'Student ID' },
              days: { type: 'number', description: 'Days to analyze', default: 14 },
            },
            required: ['userId'],
          },
        },
        {
          name: 'generate_report',
          description: 'Generate comprehensive analytics report',
          inputSchema: {
            type: 'object',
            properties: {
              scope: {
                type: 'string',
                enum: ['student', 'class', 'teacher'],
                description: 'Report scope',
              },
              targetId: { type: 'string', description: 'ID of target entity' },
              reportType: {
                type: 'string',
                enum: ['performance', 'engagement', 'comprehensive'],
                default: 'comprehensive',
              },
            },
            required: ['scope', 'targetId'],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case 'identify_struggling_topics':
            return await this.identifyStrugglingTopics(args);
          case 'suggest_study_plan':
            return await this.suggestStudyPlan(args);
          case 'detect_anomalies':
            return await this.detectAnomalies(args);
          case 'generate_report':
            return await this.generateReport(args);
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

  async identifyStrugglingTopics(args) {
    const { userId, classId, subject, threshold = 0.6 } = args;

    const where = { accuracyRate: { lt: threshold * 100 } };
    if (userId) where.userId = userId;
    if (classId) where.classId = classId;
    if (subject) where.subject = subject;

    const strugglingRecords = await prisma.performanceRecord.findMany({
      where,
      include: {
        user: { select: { name: true } },
        class: { select: { title: true } },
      },
      orderBy: { accuracyRate: 'asc' },
      take: 20,
    });

    const grouped = {};
    strugglingRecords.forEach((record) => {
      const key = record.subject;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push({
        topic: record.topic,
        accuracy: record.accuracyRate,
        attempts: record.attemptCount,
        trend: record.trend,
        student: record.user.name,
      });
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              threshold: threshold * 100,
              strugglingAreas: grouped,
              totalTopics: strugglingRecords.length,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async suggestStudyPlan(args) {
    const { userId, duration = 'week', focus } = args;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: true },
        },
      },
    });

    if (!user) throw new Error('User not found');

    const performance = await prisma.performanceRecord.findMany({
      where: { userId },
      orderBy: { accuracyRate: 'asc' },
      take: 10,
    });

    const activities = await prisma.learningActivity.findMany({
      where: {
        userId,
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const avgMinutes =
      activities.reduce((a, b) => a + b.minutesActive, 0) / activities.length || 0;

    const prompt = `Create a personalized ${duration} study plan:

Student: ${user.name}
Active Courses: ${user.enrollments.length}
Average Daily Study Time: ${avgMinutes.toFixed(0)} minutes
${focus ? `Focus Area: ${focus}` : ''}

Weak Areas:
${performance.map((p) => `- ${p.subject}: ${p.topic} (${p.accuracyRate}% accuracy, ${p.trend})`).join('\n')}

Active Classes:
${user.enrollments.map((e) => `- ${e.class.title} (${e.class.subject})`).join('\n')}

Create a structured study plan:
{
  "duration": "${duration}",
  "totalHours": <recommended hours>,
  "dailySchedule": [
    {
      "day": 1,
      "activities": [
        {
          "time": "morning|afternoon|evening",
          "subject": "<subject>",
          "topic": "<topic>",
          "duration": <minutes>,
          "type": "review|practice|quiz|reading",
          "priority": "high|medium|low"
        }
      ],
      "goals": [<daily goals>]
    }
  ],
  "weeklyGoals": [<goals>],
  "resources": [<recommended resources>],
  "checkpoints": [<milestones>]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an AI study planner creating personalized, realistic study schedules.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const studyPlan = JSON.parse(completion.choices[0].message.content);

    await prisma.aIInsight.create({
      data: {
        userId,
        scope: 'student',
        type: 'recommendation',
        title: `Personalized Study Plan - ${duration}`,
        description: `AI-generated ${duration} study plan with ${studyPlan.totalHours || 'recommended'} hours`,
        severity: 'info',
        confidence: 0.88,
        model: 'llama-3.3-70b-versatile',
        dataPoints: performance.length + activities.length,
        recommendations: studyPlan,
      },
    });

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({ student: user.name, studyPlan }, null, 2),
        },
      ],
    };
  }

  async detectAnomalies(args) {
    const { userId, days = 14 } = args;

    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const activities = await prisma.learningActivity.findMany({
      where: { userId, date: { gte: startDate } },
      orderBy: { date: 'asc' },
    });

    if (activities.length < 3) {
      return {
        content: [
          { type: 'text', text: JSON.stringify({ message: 'Insufficient data for analysis' }) },
        ],
      };
    }

    const avgMinutes = activities.reduce((a, b) => a + b.minutesActive, 0) / activities.length;
    const avgQuizzes = activities.reduce((a, b) => a + b.quizzesAttempted, 0) / activities.length;

    const prompt = `Detect behavioral anomalies:

Period: Last ${days} days
Total Active Days: ${activities.length}
Average Daily Minutes: ${avgMinutes.toFixed(0)}
Average Daily Quizzes: ${avgQuizzes.toFixed(1)}

Daily Data:
${activities
  .map(
    (a) =>
      `${a.date.toISOString().split('T')[0]}: ${a.minutesActive}min, ${a.quizzesAttempted} quizzes, score: ${a.activityScore}`
  )
  .join('\n')}

Identify anomalies:
{
  "anomaliesDetected": true/false,
  "anomalies": [
    {
      "type": "sudden_drop|sudden_spike|pattern_break|unusual_timing",
      "date": "<date>",
      "description": "<what happened>",
      "severity": "low|medium|high",
      "possibleCauses": [<reasons>],
      "recommendation": "<action>"
    }
  ],
  "overallHealth": "excellent|good|concerning|critical",
  "insights": [<observations>]
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an anomaly detection AI for student learning patterns.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.4,
      response_format: { type: 'json_object' },
    });

    const analysis = JSON.parse(completion.choices[0].message.content);

    if (analysis.anomaliesDetected && analysis.anomalies?.length > 0) {
      await prisma.aIInsight.create({
        data: {
          userId,
          scope: 'student',
          type: 'alert',
          title: 'Unusual Activity Pattern Detected',
          description: `${analysis.anomalies.length} anomalies detected in recent activity`,
          severity: analysis.anomalies.some((a) => a.severity === 'high') ? 'critical' : 'warning',
          confidence: 0.82,
          model: 'llama-3.3-70b-versatile',
          dataPoints: activities.length,
          recommendations: analysis.anomalies.map((a) => a.recommendation),
        },
      });
    }

    return {
      content: [{ type: 'text', text: JSON.stringify(analysis, null, 2) }],
    };
  }

  async generateReport(args) {
    const { scope, targetId, reportType = 'comprehensive' } = args;

    let data;
    if (scope === 'student') {
      data = await this.generateStudentReport(targetId, reportType);
    } else if (scope === 'class') {
      data = await this.generateClassReport(targetId, reportType);
    } else if (scope === 'teacher') {
      data = await this.generateTeacherReport(targetId, reportType);
    } else {
      throw new Error('Invalid scope');
    }

    const prompt = `Generate a ${reportType} ${scope} report:

${JSON.stringify(data, null, 2)}

Create a professional report:
{
  "title": "<report title>",
  "summary": "<executive summary>",
  "keyMetrics": {<key performance indicators>},
  "strengths": [<positive points>],
  "concerns": [<areas of concern>],
  "trends": [<observed trends>],
  "recommendations": [<actionable recommendations>],
  "conclusion": "<overall assessment>"
}`;

    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: 'You are an educational analytics report generator. Create clear, actionable insights.',
        },
        { role: 'user', content: prompt },
      ],
      model: 'llama-3.3-70b-versatile',
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const report = JSON.parse(completion.choices[0].message.content);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              scope,
              reportType,
              generatedAt: new Date().toISOString(),
              report,
              rawData: data,
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async generateStudentReport(userId, type) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        enrollments: {
          where: { status: 'ACTIVE' },
          include: { class: true },
        },
        quizAttempts: {
          orderBy: { completedAt: 'desc' },
          take: 10,
        },
      },
    });

    const activities = await prisma.learningActivity.findMany({
      where: {
        userId,
        date: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
      },
    });

    const performance = await prisma.performanceRecord.findMany({
      where: { userId },
    });

    return {
      student: {
        id: user.id,
        name: user.name,
        email: user.email,
        lastLogin: user.lastLogin,
      },
      enrollments: user.enrollments.length,
      quizAverage:
        user.quizAttempts.reduce((a, b) => a + b.percentageScore, 0) /
          user.quizAttempts.length || 0,
      activeDays: activities.length,
      totalMinutes: activities.reduce((a, b) => a + b.minutesActive, 0),
      performanceRecords: performance.length,
    };
  }

  async generateClassReport(classId, type) {
    const classData = await prisma.class.findUnique({
      where: { id: classId },
      include: {
        teacher: { select: { name: true } },
        enrollments: { where: { status: 'ACTIVE' } },
        quizzes: {
          include: { attempts: true },
        },
      },
    });

    return {
      class: {
        id: classData.id,
        title: classData.title,
        subject: classData.subject,
        teacher: classData.teacher.name,
      },
      students: classData.enrollments.length,
      quizzes: classData.quizzes.length,
      avgScore:
        classData.quizzes.flatMap((q) => q.attempts).reduce((a, b) => a + b.percentageScore, 0) /
          classData.quizzes.flatMap((q) => q.attempts).length || 0,
    };
  }

  async generateTeacherReport(teacherId, type) {
    const teacher = await prisma.user.findUnique({
      where: { id: teacherId },
      include: {
        createdClasses: {
          include: {
            enrollments: true,
            quizzes: { include: { attempts: true } },
          },
        },
      },
    });

    return {
      teacher: {
        id: teacher.id,
        name: teacher.name,
        email: teacher.email,
      },
      totalClasses: teacher.createdClasses.length,
      totalStudents: teacher.createdClasses.reduce((a, c) => a + c.enrollments.length, 0),
      totalQuizzes: teacher.createdClasses.reduce((a, c) => a + c.quizzes.length, 0),
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('EduTech Insights MCP Server running on stdio');
  }
}

const server = new InsightsMCPServer();
server.run().catch(console.error);
