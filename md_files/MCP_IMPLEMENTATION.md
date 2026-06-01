# EduTech MCP Implementation Guide

## Overview

This implementation adds **Model Context Protocol (MCP)** powered AI analytics to the EduTech platform using **Groq LLM**. The system provides:

- **AI-powered student risk prediction**
- **Personalized recommendations**
- **Learning pattern analysis**
- **Automated study plan generation**
- **Anomaly detection in student behavior**

## Architecture

```
Backend
├── mcp-servers/
│   ├── analytics/      # Student performance analytics
│   ├── predictions/    # Grade predictions & risk assessment
│   └── insights/       # Study plans & anomaly detection
├── src/
│   ├── services/
│   │   └── mcp.service.js       # MCP client integration
│   ├── controllers/
│   │   └── mcp.controller.js    # API endpoints
│   └── routes/
│       └── mcp.routes.js        # Route definitions

Frontend
├── lib/
│   ├── mcp-client.ts       # API client
│   └── mcp-context.tsx     # React context
└── components/
    └── ai/
        ├── ai-insights-panel.tsx   # Display AI insights
        └── ai-actions.tsx          # AI action buttons
```

## Setup Instructions

### 1. Install Dependencies

```bash
# Run the setup script
chmod +x setup-mcp.sh
./setup-mcp.sh

# Or manually:
cd backend
pnpm install

cd mcp-servers/analytics
pnpm install

cd ../predictions
pnpm install

cd ../insights
pnpm install
```

### 2. Configure Environment

Add to `backend/.env`:

```env
# Groq API Configuration
GROQ_API_KEY=your_groq_api_key_here

# Get your free API key from: https://console.groq.com/keys
```

### 3. Run Database Migrations

Update your Prisma schema with the new MCP tables:

```bash
cd backend
pnpm db:migrate
```

### 4. Start the Application

```bash
# Backend (MCP servers start automatically)
cd backend
pnpm dev

# Frontend
cd frontend
pnpm dev
```

## MCP Servers

### Analytics Server

**Tools:**
- `get_student_performance` - Comprehensive performance analytics
- `get_class_insights` - Class-level insights with at-risk students
- `predict_student_risk` - AI risk level prediction
- `compare_performance` - Compare student metrics
- `generate_recommendations` - Personalized suggestions
- `analyze_learning_patterns` - Activity trend analysis

### Predictions Server

**Tools:**
- `predict_final_grade` - Predict final course grade
- `predict_dropout_risk` - Dropout probability assessment
- `predict_topic_difficulty` - Topic difficulty for student
- `forecast_engagement` - Engagement forecasting

### Insights Server

**Tools:**
- `identify_struggling_topics` - Find weak areas
- `suggest_study_plan` - Generate study schedules
- `detect_anomalies` - Unusual behavior patterns
- `generate_report` - Comprehensive analytics reports

## API Endpoints

### Analytics

```
GET  /api/mcp/student/:userId/performance
GET  /api/mcp/class/:classId/insights
GET  /api/mcp/student/:userId/risk
POST /api/mcp/student/:userId/recommendations
```

### Predictions

```
POST /api/mcp/student/:userId/class/:classId/predict-grade
GET  /api/mcp/student/:userId/dropout-risk
```

### Insights

```
POST /api/mcp/student/:userId/study-plan
GET  /api/mcp/student/:userId/anomalies
POST /api/mcp/report/:scope/:targetId
```

### AI Insights Management

```
GET   /api/mcp/insights/:userId
PATCH /api/mcp/insights/:insightId/read
PATCH /api/mcp/insights/:insightId/dismiss
```

### Admin

```
GET /api/mcp/tools
GET /api/mcp/logs
```

## Frontend Usage

### 1. Wrap your app with MCPProvider

```tsx
import { MCPProvider } from '@/lib/mcp-context';

export default function App() {
  return (
    <MCPProvider>
      <YourApp />
    </MCPProvider>
  );
}
```

### 2. Use AI Components

```tsx
import { AIInsightsPanel } from '@/components/ai/ai-insights-panel';
import { AIActions } from '@/components/ai/ai-actions';

export function StudentDashboard({ userId }) {
  return (
    <div>
      <AIInsightsPanel userId={userId} />
      <AIActions userId={userId} />
    </div>
  );
}
```

### 3. Use the MCP Hook

```tsx
import { useMCP } from '@/lib/mcp-context';

function MyComponent() {
  const { 
    insights,
    loading,
    getStudentPerformance,
    predictStudentRisk 
  } = useMCP();

  // Use MCP functions...
}
```

## Example API Calls

### Predict Student Risk

```javascript
// Frontend
const { predictStudentRisk } = useMCP();
const result = await predictStudentRisk(userId);

// Backend curl
curl -X GET http://localhost:5000/api/mcp/student/USER_ID/risk \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Generate Study Plan

```javascript
// Frontend
const { suggestStudyPlan } = useMCP();
const plan = await suggestStudyPlan(userId, 'week', 'math');

// Backend curl
curl -X POST http://localhost:5000/api/mcp/student/USER_ID/study-plan \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration": "week", "focus": "math"}'
```

## Groq LLM Configuration

The implementation uses Groq's **Llama 3.3 70B** model for AI analysis:

- **Model:** `llama-3.3-70b-versatile`
- **Temperature:** 0.3-0.7 (depending on task)
- **Response Format:** JSON for structured data
- **Average Response Time:** 1-3 seconds

### Why Groq?

- ⚡ **Fast:** 10x faster than other LLM providers
- 💰 **Free Tier:** Generous free API usage
- 🎯 **Accurate:** State-of-the-art Llama 3.3 model
- 📊 **Structured Output:** Native JSON response support

## Database Schema

New tables added:

- `AnalyticsProfile` - Pre-calculated student metrics
- `ClassAnalytics` - Class-level aggregates
- `LearningActivity` - Daily activity snapshots
- `PerformanceRecord` - Topic-level performance
- `AIInsight` - AI-generated insights
- `MCPQueryLog` - MCP query tracking
- `AnalyticsJob` - Background job tracking

## Performance Considerations

- **Pre-aggregation:** Metrics calculated every 6 hours
- **Efficient indexing:** Optimized database queries
- **Memory optimization:** SmallInt for counts, DoublePrecision for scores
- **Caching:** Redis caching for frequent queries (recommended)

## Troubleshooting

### MCP Server Not Starting

```bash
# Check if MCP servers are running
ps aux | grep mcp-servers

# Check logs
tail -f backend/logs/app.log
```

### Groq API Errors

```bash
# Verify API key
echo $GROQ_API_KEY

# Test API connection
curl https://api.groq.com/openai/v1/models \
  -H "Authorization: Bearer $GROQ_API_KEY"
```

### Database Errors

```bash
# Reset database
cd backend
pnpm db:push --force-reset

# Re-run migrations
pnpm db:migrate
```

## Security Notes

- All MCP endpoints require authentication
- API keys stored in environment variables
- MCP query logs for audit trail
- Rate limiting on AI endpoints
- Input validation on all requests

## Next Steps

1. ✅ Configure GROQ_API_KEY
2. ✅ Run database migrations
3. ✅ Test MCP endpoints
4. Add MCP components to your dashboards
5. Configure background jobs for analytics calculation
6. Set up monitoring for MCP query logs

## Support

For issues or questions:
- Check the logs: `backend/logs/`
- Review MCP query logs: `GET /api/mcp/logs`
- Check database for AI insights: `AIInsight` table

## License

Same as EduTech platform
