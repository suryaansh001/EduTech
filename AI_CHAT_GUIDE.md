# AI Chat & Quiz Generation - Quick Guide

## 🎯 New Features

### For Teachers: Create Quizzes with AI Chat
Ask AI to create quizzes in natural language:
- "Create a 10-question MCQ quiz on Photosynthesis"
- "Make a quiz from my uploaded Biology PDF"
- "Generate 5 true/false questions about World War II"

### For Students: Analyze Quiz Performance
Ask AI to explain your quiz results:
- "Why did I get question 3 wrong?"
- "How can I improve my score?"
- "Explain the concept in question 5"

## 🚀 Setup

### 1. Install Chat MCP Server
```bash
cd backend/mcp-servers/chat
pnpm install
```

### 2. Optional: Setup Pinecone (for RAG with documents)
```bash
# Sign up at https://www.pinecone.io/ (FREE tier)
# Add to backend/.env:
PINECONE_API_KEY=your_key_here
PINECONE_INDEX_NAME=edutech-documents
```

### 3. Update Backend Package
```bash
cd backend
pnpm install @pinecone-database/pinecone pdf-parse
```

## 📍 API Endpoints

### Teacher - Create Quiz from Chat
```bash
POST /api/chat/quiz/create
Body: {
  "classId": "class-id",
  "message": "Create a 10-question quiz on Python basics",
  "documentIds": ["doc1", "doc2"] // optional
}
```

### Student - Analyze Quiz
```bash
POST /api/chat/quiz/:quizId/analyze
Body: {
  "message": "Why did I get question 3 wrong?",
  "attemptId": "attempt-id" // optional
}
```

### Search Documents
```bash
GET /api/chat/documents/search?query=photosynthesis&classId=class-id
```

### Chat with Documents (RAG)
```bash
POST /api/chat/documents/chat
Body: {
  "message": "Summarize this document",
  "documentIds": ["doc1", "doc2"]
}
```

### Generate Questions from Content
```bash
POST /api/chat/quiz/generate-questions
Body: {
  "content": "Your content here...",
  "questionCount": 5,
  "questionTypes": ["MULTIPLE_CHOICE", "TRUE_FALSE"],
  "difficulty": "medium"
}
```

## 🎨 Frontend Usage

### Teacher: AI Quiz Creator
```tsx
import { AIQuizCreator } from '@/components/ai/ai-quiz-creator';

<AIQuizCreator 
  classId={classId}
  onQuizCreated={(quizId) => {
    console.log('Quiz created:', quizId);
  }}
/>
```

### Student: Quiz Analyzer Chat
```tsx
import { QuizAnalyzerChat } from '@/components/ai/quiz-analyzer-chat';

<QuizAnalyzerChat
  quizId={quizId}
  quizTitle={quiz.title}
  userScore={75}
  attemptId={attemptId}
/>
```

### Using AI Chat Client Directly
```tsx
import aiChatClient from '@/lib/ai-chat-client';

// Create quiz
const result = await aiChatClient.createQuizFromChat({
  classId: 'class-123',
  message: 'Create a quiz on AI with 10 MCQs'
});

// Analyze quiz
const analysis = await aiChatClient.analyzeQuizWithAI({
  quizId: 'quiz-123',
  message: 'Explain question 3'
});

// Search documents
const docs = await aiChatClient.searchDocuments('photosynthesis');

// Chat with documents
const response = await aiChatClient.chatWithDocuments(
  'Summarize this document',
  ['doc1', 'doc2']
);
```

## 💡 Example Conversations

### Teacher Creating Quiz:
```
Teacher: "Create a 10-question quiz on Machine Learning basics"

AI: I'll create a comprehensive quiz on Machine Learning. 
    - 7 Multiple Choice Questions
    - 3 True/False Questions
    - Covering: supervised learning, neural networks, etc.
    - Total: 20 marks, 30 minutes

Quiz created! ID: quiz-abc123
```

### Student Analyzing Quiz:
```
Student: "Why did I get question 5 wrong?"

AI: Question 5 was about gradient descent. You selected option B 
    (learning rate doesn't affect convergence), but the correct 
    answer is A. 
    
    Here's why:
    - Learning rate directly impacts how quickly the algorithm 
      converges
    - Too high = overshooting, too low = slow convergence
    
    Study topics:
    - Gradient Descent optimization
    - Hyperparameter tuning
    
    Resources: Check Chapter 5 in your textbook
```

## 🔥 Features

✅ Natural language quiz creation  
✅ AI explains quiz answers  
✅ Document-based quiz generation (RAG)  
✅ Semantic document search  
✅ Chat with uploaded PDFs  
✅ Automatic question generation  
✅ Multiple question types (MCQ, T/F, Short Answer)  
✅ Personalized study recommendations  

## ⚠️ Requirements

- **Required**: Groq API key
- **Optional**: Pinecone API key (for document RAG)
- Backend: Node.js 18+
- Frontend: React 18+

## 📚 Integration Points

The chat MCP server integrates with:
- Existing Quiz system
- File upload system
- Student profiles
- Teacher dashboards
- Analytics tracking

## 🆘 Troubleshooting

**Chat server not starting:**
- Check GROQ_API_KEY in .env
- Verify dependencies installed

**Document search not working:**
- Pinecone is optional
- Features work without it (limited functionality)

**Quiz not created:**
- Verify user is a teacher
- Check classId is valid
- Review server logs

## 🎉 That's It!

Students can now analyze quizzes and teachers can create them using natural language! 🚀
