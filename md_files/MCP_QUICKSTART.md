# MCP Quick Start Guide

## 🚀 Setup (5 minutes)

### 1. Get Groq API Key (FREE)
```bash
# Visit: https://console.groq.com/keys
# Sign up (GitHub/Google)
# Copy your API key
```

### 2. Configure Environment
```bash
# Edit backend/.env and add:
GROQ_API_KEY=gsk_your_key_here
```

### 3. Run Setup Script
```bash
chmod +x setup-mcp.sh
./setup-mcp.sh
```

### 4. Run Migrations
```bash
cd backend
pnpm db:migrate
```

### 5. Start Application
```bash
# Terminal 1 - Backend
cd backend
pnpm dev

# Terminal 2 - Frontend
cd frontend
pnpm dev
```

## 📍 Test It Works

### Backend Test
```bash
curl http://localhost:5000/api/mcp/tools \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Expected: List of MCP tools

### Frontend Test
1. Login to the application
2. Go to student dashboard
3. You should see "AI Insights" panel

## 🎯 Quick Integration

### Option 1: Add to Student Dashboard
```tsx
import { MCPProvider } from '@/lib/mcp-context';
import { AIInsightsPanel } from '@/components/ai/ai-insights-panel';
import { AIActions } from '@/components/ai/ai-actions';

// Wrap your app
<MCPProvider>
  <YourApp />
</MCPProvider>

// In student dashboard
<AIInsightsPanel userId={userId} />
<AIActions userId={userId} />
```

### Option 2: Use Hook Directly
```tsx
import { useMCP } from '@/lib/mcp-context';

function MyComponent() {
  const { predictStudentRisk, loading } = useMCP();
  
  const analyze = async () => {
    const result = await predictStudentRisk(userId);
    console.log(result);
  };
}
```

## 🔥 Quick API Examples

### Predict Risk
```bash
GET /api/mcp/student/:userId/risk
```

### Get Recommendations
```bash
POST /api/mcp/student/:userId/recommendations
Body: { "focus": "performance" }
```

### Generate Study Plan
```bash
POST /api/mcp/student/:userId/study-plan
Body: { "duration": "week" }
```

## ⚠️ Common Issues

### Issue: MCP servers not starting
**Fix**: Check Groq API key in `.env`

### Issue: Database errors
**Fix**: Run `pnpm db:migrate`

### Issue: Frontend errors
**Fix**: Wrap app in `<MCPProvider>`

## 📊 What You Get

✅ **AI Risk Prediction** - Identify at-risk students  
✅ **Smart Recommendations** - Personalized suggestions  
✅ **Study Plans** - AI-generated schedules  
✅ **Pattern Detection** - Unusual behavior alerts  
✅ **Grade Predictions** - Final grade forecasting  
✅ **Dropout Prevention** - Early warning system

## 📚 Full Documentation

- **Implementation Guide**: `MCP_IMPLEMENTATION.md`
- **Summary**: `MCP_SUMMARY.md`
- **Schema Details**: `SCHEMA_AI_ANALYTICS_MCP.md`

## 🆘 Need Help?

1. Check logs: `backend/logs/`
2. Check MCP query logs in database
3. Review error messages
4. Verify Groq API key is valid

## 🎉 You're Done!

The MCP AI analytics system is now ready to use. Start exploring AI-powered insights!
