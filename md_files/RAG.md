# RAG (Retrieval-Augmented Generation) Implementation Guide

**Purpose**: Implement RAG-based AI chatbot for students and teachers in EduTech platform

**Benefits**:
- Students can query their notes and study materials intelligently
- Teachers can generate question sets from uploaded materials
- Personalized learning assistance
- Reduced manual question creation effort

---

## Table of Contents

1. [Overview](#overview)
2. [Use Cases](#use-cases)
3. [Architecture](#architecture)
4. [Technology Stack](#technology-stack)
5. [Implementation Steps](#implementation-steps)
6. [Student RAG Implementation](#student-rag-implementation)
7. [Teacher RAG Implementation](#teacher-rag-implementation)
8. [Database Schema Updates](#database-schema-updates)
9. [API Endpoints](#api-endpoints)
10. [Frontend Integration](#frontend-integration)
11. [Cost Optimization](#cost-optimization)
12. [Security Considerations](#security-considerations)

---

## Overview

**What is RAG?**

RAG (Retrieval-Augmented Generation) combines:
- **Retrieval**: Finding relevant documents from a knowledge base
- **Generation**: Using AI (like GPT) to generate responses based on retrieved documents

**How it works**:
```
User Question → Vector Search → Retrieve Relevant Docs → LLM (with context) → Answer
```

**Why RAG over fine-tuning?**
- ✅ Cost-effective (no expensive model training)
- ✅ Up-to-date information (add new docs anytime)
- ✅ Transparent (see which docs were used)
- ✅ Domain-specific without retraining

---

## Use Cases

### For Students:
1. **Study Assistant**
   - "Explain the concept of photosynthesis from my biology notes"
   - "What did the teacher say about quadratic equations?"
   - "Summarize Chapter 5 from my class materials"
   - "Quiz me on today's notes"

2. **Homework Help**
   - "How do I solve this type of problem?" (based on class examples)
   - "What formula should I use for..."
   - "Give me practice questions similar to the homework"

3. **Exam Preparation**
   - "Create a practice test from all my notes"
   - "What are the key topics I should focus on?"
   - "Explain this topic in simpler terms"

### For Teachers:
1. **Question Generation**
   - Upload PDF/document → Generate MCQs, True/False, Short answer questions
   - "Create 20 questions from this chapter"
   - "Generate a quiz covering topics X, Y, Z"
   - Automatic answer key generation

2. **Content Creation**
   - Generate lesson summaries
   - Create study guides from textbooks
   - Extract key concepts from materials

3. **Assessment Design**
   - Bloom's Taxonomy-aligned questions
   - Difficulty level customization
   - Question bank building

---

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     EduTech Frontend                        │
│  ┌─────────────────┐        ┌─────────────────┐           │
│  │  Student Chat   │        │  Teacher Q Gen  │           │
│  │   Interface     │        │   Interface     │           │
│  └────────┬────────┘        └────────┬────────┘           │
└───────────┼──────────────────────────┼─────────────────────┘
            │                          │
            ▼                          ▼
┌─────────────────────────────────────────────────────────────┐
│               Express Backend (Node.js)                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  RAG Service (rag.service.js)                        │  │
│  │  • Document ingestion                                │  │
│  │  • Vector search                                     │  │
│  │  • LLM integration                                   │  │
│  └──────────────────────────────────────────────────────┘  │
└───────────┬─────────────────────────┬────────────────────┬─┘
            │                         │                    │
            ▼                         ▼                    ▼
┌────────────────────┐   ┌─────────────────┐   ┌──────────────────┐
│  Vector Database   │   │  PostgreSQL     │   │  OpenAI API      │
│  (Pinecone/Qdrant) │   │  (Documents     │   │  (GPT-4/3.5)     │
│  - Embeddings      │   │   metadata)     │   │  - Chat          │
│  - Semantic search │   │                 │   │  - Embeddings    │
└────────────────────┘   └─────────────────┘   └──────────────────┘
```

### Data Flow

#### Student Query Flow:
```
1. Student asks question → Backend
2. Convert question to embedding (OpenAI)
3. Search vector DB for similar content
4. Retrieve top 5 relevant chunks
5. Build prompt: "Based on these notes: [chunks], answer: [question]"
6. Send to GPT-4 → Get answer
7. Return answer + sources to student
```

#### Teacher Question Generation Flow:
```
1. Teacher uploads document → Backend
2. Extract text from PDF/DOCX
3. Chunk text (500-1000 tokens each)
4. Generate embeddings for each chunk
5. Store in vector DB
6. Teacher requests questions → Backend
7. Retrieve relevant chunks
8. Prompt GPT: "Generate 10 MCQ questions from: [chunks]"
9. Parse questions + answers
10. Return structured question set
```

---

## Technology Stack

### Vector Database Options:

#### Option 1: Pinecone (Recommended for Production)
**Pros**:
- Fully managed (no infrastructure)
- Fast and scalable
- Free tier: 100K vectors
- Easy integration

**Cons**:
- Paid for large scale
- External dependency

**Setup**:
```bash
npm install @pinecone-database/pinecone
```

#### Option 2: Qdrant (Self-hosted)
**Pros**:
- Open-source
- Self-hosted (full control)
- Cost-effective for large scale
- Docker deployment

**Cons**:
- Need to manage infrastructure
- More setup required

**Setup**:
```bash
# Docker
docker run -p 6333:6333 qdrant/qdrant

# npm
npm install @qdrant/js-client-rest
```

#### Option 3: PostgreSQL + pgvector (Budget Option)
**Pros**:
- Use existing PostgreSQL
- No additional service
- Free and open-source

**Cons**:
- Slower for large datasets
- Manual optimization needed

**Setup**:
```sql
CREATE EXTENSION vector;
```

### LLM Options:

#### Option 1: OpenAI (Recommended)
```bash
npm install openai
```
- **GPT-4**: Best quality, expensive
- **GPT-3.5-turbo**: Good quality, cheaper
- **text-embedding-ada-002**: For embeddings

#### Option 2: Open-Source (Cost-effective)
- **Ollama** (local): Free, privacy-focused
- **Mistral API**: Cheaper alternative
- **Cohere**: Good for embeddings

---

## Implementation Steps

### Phase 1: Setup Foundation (Week 1)

#### Step 1: Install Dependencies

```bash
cd backend
npm install @pinecone-database/pinecone openai pdf-parse mammoth docx langchain
```

**Package purposes**:
- `@pinecone-database/pinecone`: Vector database
- `openai`: GPT API + embeddings
- `pdf-parse`: Extract text from PDFs
- `mammoth`: Extract text from DOCX
- `langchain`: RAG orchestration (optional but helpful)

#### Step 2: Environment Variables

Add to `.env`:
```env
# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_EMBEDDING_MODEL=text-embedding-ada-002
OPENAI_CHAT_MODEL=gpt-3.5-turbo

# Pinecone
PINECONE_API_KEY=...
PINECONE_ENVIRONMENT=us-east-1-aws
PINECONE_INDEX_NAME=edutech-rag

# RAG Settings
RAG_CHUNK_SIZE=1000
RAG_CHUNK_OVERLAP=200
RAG_TOP_K_RESULTS=5
```

#### Step 3: Create Vector Database Index

**Pinecone Setup**:
```javascript
// backend/src/config/pinecone.js
import { Pinecone } from '@pinecone-database/pinecone';
import { logger } from '../utils/logger.utils.js';

let pinecone;
let index;

export const initPinecone = async () => {
  try {
    pinecone = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });

    // Create index if doesn't exist
    const indexList = await pinecone.listIndexes();
    const indexName = process.env.PINECONE_INDEX_NAME;

    if (!indexList.indexes?.find(i => i.name === indexName)) {
      await pinecone.createIndex({
        name: indexName,
        dimension: 1536, // OpenAI embedding dimension
        metric: 'cosine',
        spec: {
          serverless: {
            cloud: 'aws',
            region: 'us-east-1'
          }
        }
      });
      logger.info(`Created Pinecone index: ${indexName}`);
    }

    index = pinecone.Index(indexName);
    logger.info('Pinecone initialized successfully');

    return index;
  } catch (error) {
    logger.error('Failed to initialize Pinecone:', error);
    throw error;
  }
};

export const getPineconeIndex = () => {
  if (!index) {
    throw new Error('Pinecone not initialized. Call initPinecone() first.');
  }
  return index;
};
```

#### Step 4: Create OpenAI Service

```javascript
// backend/src/config/openai.js
import OpenAI from 'openai';
import { logger } from '../utils/logger.utils.js';

let openai;

export const initOpenAI = () => {
  try {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    logger.info('OpenAI initialized successfully');
    return openai;
  } catch (error) {
    logger.error('Failed to initialize OpenAI:', error);
    throw error;
  }
};

export const getOpenAI = () => {
  if (!openai) {
    throw new Error('OpenAI not initialized. Call initOpenAI() first.');
  }
  return openai;
};

// Generate embeddings
export const generateEmbedding = async (text) => {
  try {
    const response = await openai.embeddings.create({
      model: process.env.OPENAI_EMBEDDING_MODEL || 'text-embedding-ada-002',
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    logger.error('Failed to generate embedding:', error);
    throw error;
  }
};

// Chat completion
export const chatCompletion = async (messages, options = {}) => {
  try {
    const response = await openai.chat.completions.create({
      model: options.model || process.env.OPENAI_CHAT_MODEL || 'gpt-3.5-turbo',
      messages,
      temperature: options.temperature || 0.7,
      max_tokens: options.maxTokens || 1000,
      top_p: options.topP || 1,
      ...options,
    });
    return response.choices[0].message.content;
  } catch (error) {
    logger.error('Failed to get chat completion:', error);
    throw error;
  }
};
```

### Phase 2: Document Processing (Week 1-2)

#### Step 5: Create Document Processing Utilities

```javascript
// backend/src/utils/document-processor.utils.js
import pdf from 'pdf-parse';
import mammoth from 'mammoth';
import fs from 'fs/promises';
import { logger } from './logger.utils.js';

// Extract text from PDF
export const extractTextFromPDF = async (filePath) => {
  try {
    const dataBuffer = await fs.readFile(filePath);
    const data = await pdf(dataBuffer);
    return data.text;
  } catch (error) {
    logger.error('Failed to extract text from PDF:', error);
    throw new Error('Failed to process PDF file');
  }
};

// Extract text from DOCX
export const extractTextFromDOCX = async (filePath) => {
  try {
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  } catch (error) {
    logger.error('Failed to extract text from DOCX:', error);
    throw new Error('Failed to process DOCX file');
  }
};

// Extract text based on file type
export const extractTextFromFile = async (filePath, mimeType) => {
  if (mimeType === 'application/pdf') {
    return await extractTextFromPDF(filePath);
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    mimeType === 'application/msword'
  ) {
    return await extractTextFromDOCX(filePath);
  } else if (mimeType.startsWith('text/')) {
    return await fs.readFile(filePath, 'utf-8');
  } else {
    throw new Error('Unsupported file type');
  }
};

// Split text into chunks
export const chunkText = (text, chunkSize = 1000, overlap = 200) => {
  const chunks = [];
  let startIndex = 0;

  while (startIndex < text.length) {
    const endIndex = Math.min(startIndex + chunkSize, text.length);
    const chunk = text.slice(startIndex, endIndex);
    
    chunks.push({
      text: chunk,
      startIndex,
      endIndex,
    });

    startIndex += chunkSize - overlap;
  }

  return chunks;
};

// Clean text (remove extra whitespace, etc.)
export const cleanText = (text) => {
  return text
    .replace(/\s+/g, ' ') // Multiple spaces to single
    .replace(/\n\s*\n/g, '\n') // Multiple newlines to single
    .trim();
};
```

### Phase 3: RAG Service Implementation (Week 2)

#### Step 6: Create RAG Service

```javascript
// backend/src/services/rag.service.js
import { getPineconeIndex } from '../config/pinecone.js';
import { generateEmbedding, chatCompletion } from '../config/openai.js';
import { prisma } from '../config/database.js';
import { 
  extractTextFromFile, 
  chunkText, 
  cleanText 
} from '../utils/document-processor.utils.js';
import { logger } from '../utils/logger.utils.js';
import crypto from 'crypto';

export const ragService = {
  // ==========================================
  // DOCUMENT INGESTION
  // ==========================================
  
  /**
   * Ingest document for RAG
   * - Extract text from file
   * - Chunk text
   * - Generate embeddings
   * - Store in vector DB
   */
  ingestDocument: async (fileId, userId, metadata = {}) => {
    try {
      // 1. Get file from database
      const file = await prisma.fileUpload.findUnique({
        where: { id: fileId },
        include: { class: true }
      });

      if (!file) {
        throw new Error('File not found');
      }

      // 2. Extract text from file
      logger.info(`Extracting text from file: ${file.fileName}`);
      const rawText = await extractTextFromFile(file.filePath, file.fileType);
      const cleanedText = cleanText(rawText);

      // 3. Chunk text
      const chunkSize = parseInt(process.env.RAG_CHUNK_SIZE) || 1000;
      const chunkOverlap = parseInt(process.env.RAG_CHUNK_OVERLAP) || 200;
      const chunks = chunkText(cleanedText, chunkSize, chunkOverlap);

      logger.info(`Created ${chunks.length} chunks from document`);

      // 4. Generate embeddings and store
      const pineconeIndex = getPineconeIndex();
      const vectors = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const chunkId = `${fileId}-chunk-${i}`;

        // Generate embedding
        const embedding = await generateEmbedding(chunk.text);

        // Prepare vector with metadata
        vectors.push({
          id: chunkId,
          values: embedding,
          metadata: {
            fileId,
            userId,
            fileName: file.fileName,
            classId: file.classId || 'none',
            className: file.class?.title || 'none',
            chunkIndex: i,
            text: chunk.text,
            startIndex: chunk.startIndex,
            endIndex: chunk.endIndex,
            ...metadata,
          }
        });

        // Batch upsert every 100 vectors
        if (vectors.length >= 100) {
          await pineconeIndex.upsert(vectors);
          vectors.length = 0; // Clear array
        }
      }

      // Upsert remaining vectors
      if (vectors.length > 0) {
        await pineconeIndex.upsert(vectors);
      }

      // 5. Update file record
      await prisma.fileUpload.update({
        where: { id: fileId },
        data: { 
          ragIndexed: true,
          ragChunkCount: chunks.length,
          ragIndexedAt: new Date()
        }
      });

      logger.info(`Successfully indexed ${chunks.length} chunks for file: ${file.fileName}`);

      return {
        fileId,
        fileName: file.fileName,
        chunkCount: chunks.length,
        status: 'indexed'
      };

    } catch (error) {
      logger.error('Failed to ingest document:', error);
      throw error;
    }
  },

  // ==========================================
  // SEMANTIC SEARCH
  // ==========================================

  /**
   * Search for relevant content
   */
  search: async (query, filters = {}, topK = 5) => {
    try {
      // 1. Generate query embedding
      const queryEmbedding = await generateEmbedding(query);

      // 2. Search Pinecone
      const pineconeIndex = getPineconeIndex();
      
      const searchFilters = {};
      if (filters.userId) searchFilters.userId = filters.userId;
      if (filters.classId) searchFilters.classId = filters.classId;
      if (filters.fileId) searchFilters.fileId = filters.fileId;

      const searchResults = await pineconeIndex.query({
        vector: queryEmbedding,
        topK,
        includeMetadata: true,
        filter: Object.keys(searchFilters).length > 0 ? searchFilters : undefined
      });

      // 3. Format results
      const results = searchResults.matches.map(match => ({
        id: match.id,
        score: match.score,
        text: match.metadata.text,
        fileName: match.metadata.fileName,
        classId: match.metadata.classId,
        className: match.metadata.className,
        chunkIndex: match.metadata.chunkIndex,
      }));

      return results;

    } catch (error) {
      logger.error('Failed to search:', error);
      throw error;
    }
  },

  // ==========================================
  // STUDENT QUERY
  // ==========================================

  /**
   * Answer student question based on their materials
   */
  answerStudentQuestion: async (studentId, question, classId = null) => {
    try {
      // 1. Search for relevant content
      const filters = { userId: studentId };
      if (classId) filters.classId = classId;

      const relevantDocs = await ragService.search(question, filters, 5);

      if (relevantDocs.length === 0) {
        return {
          answer: "I couldn't find any relevant information in your notes. Could you please upload more study materials or ask your question differently?",
          sources: [],
          hasContext: false
        };
      }

      // 2. Build context from retrieved documents
      const context = relevantDocs
        .map((doc, idx) => `[${idx + 1}] From "${doc.fileName}":\n${doc.text}`)
        .join('\n\n');

      // 3. Build prompt
      const systemPrompt = `You are a helpful study assistant for students. Answer questions based ONLY on the provided study materials. 
If the materials don't contain the answer, say so clearly.
Be concise, clear, and educational.
Always cite which source ([1], [2], etc.) you used for each part of your answer.`;

      const userPrompt = `Study Materials:
${context}

Student Question: ${question}

Please provide a helpful answer based on the study materials above. Cite your sources.`;

      // 4. Get answer from GPT
      const answer = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.7,
        maxTokens: 500
      });

      // 5. Log interaction
      await prisma.ragInteraction.create({
        data: {
          userId: studentId,
          type: 'STUDENT_QUERY',
          query: question,
          response: answer,
          classId,
          sourcesUsed: relevantDocs.map(d => d.id),
        }
      });

      return {
        answer,
        sources: relevantDocs.map(d => ({
          fileName: d.fileName,
          className: d.className,
          relevance: d.score
        })),
        hasContext: true
      };

    } catch (error) {
      logger.error('Failed to answer student question:', error);
      throw error;
    }
  },

  // ==========================================
  // TEACHER QUESTION GENERATION
  // ==========================================

  /**
   * Generate quiz questions from materials
   */
  generateQuestions: async (teacherId, options = {}) => {
    try {
      const {
        fileIds = [],
        classId,
        questionCount = 10,
        questionTypes = ['MULTIPLE_CHOICE'],
        difficulty = 'MEDIUM',
        topics = []
      } = options;

      // 1. Get relevant content
      let relevantDocs;
      
      if (fileIds.length > 0) {
        // Search specific files
        relevantDocs = [];
        for (const fileId of fileIds) {
          const docs = await ragService.search(
            topics.join(' '), 
            { fileId }, 
            10
          );
          relevantDocs.push(...docs);
        }
      } else if (classId) {
        // Search entire class materials
        relevantDocs = await ragService.search(
          topics.join(' ') || 'main concepts',
          { classId },
          20
        );
      } else {
        throw new Error('Must specify fileIds or classId');
      }

      if (relevantDocs.length === 0) {
        throw new Error('No content found for question generation');
      }

      // 2. Build context
      const context = relevantDocs
        .slice(0, 10) // Limit to top 10 chunks
        .map(doc => doc.text)
        .join('\n\n');

      // 3. Build prompt
      const systemPrompt = `You are an expert educator creating assessment questions.
Generate high-quality, educational questions based on the provided study material.
Ensure questions test understanding, not just memorization.
Format output as valid JSON array.`;

      const questionTypeInstructions = {
        'MULTIPLE_CHOICE': 'Each question should have 4 options with one correct answer.',
        'TRUE_FALSE': 'Each question should be a true/false statement.',
        'SHORT_ANSWER': 'Each question should require a brief written answer.',
        'ESSAY': 'Each question should require a detailed written response.'
      };

      const userPrompt = `Study Material:
${context}

Generate ${questionCount} ${difficulty} difficulty ${questionTypes.join(', ')} questions.

${questionTypes.map(type => questionTypeInstructions[type]).join('\n')}

Return ONLY a JSON array in this exact format:
[
  {
    "type": "MULTIPLE_CHOICE",
    "question": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option B",
    "explanation": "Why this is correct",
    "difficulty": "${difficulty}",
    "points": 10
  }
]

Requirements:
- Questions must be based on the study material provided
- No duplicate or near-duplicate questions
- Clear, unambiguous wording
- Appropriate difficulty level
- Valid JSON format`;

      // 4. Get questions from GPT
      const response = await chatCompletion([
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ], {
        temperature: 0.8,
        maxTokens: 2000,
        model: 'gpt-4' // Use GPT-4 for better quality
      });

      // 5. Parse response
      let questions;
      try {
        // Extract JSON from response (in case GPT adds extra text)
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (!jsonMatch) {
          throw new Error('No JSON array found in response');
        }
        questions = JSON.parse(jsonMatch[0]);
      } catch (parseError) {
        logger.error('Failed to parse generated questions:', parseError);
        throw new Error('Failed to parse generated questions');
      }

      // 6. Log generation
      await prisma.ragInteraction.create({
        data: {
          userId: teacherId,
          type: 'QUESTION_GENERATION',
          query: `Generate ${questionCount} questions`,
          response: JSON.stringify(questions),
          classId,
          metadata: {
            questionCount: questions.length,
            questionTypes,
            difficulty
          }
        }
      });

      return {
        questions,
        metadata: {
          generated: questions.length,
          requested: questionCount,
          sources: relevantDocs.slice(0, 5).map(d => ({
            fileName: d.fileName,
            className: d.className
          }))
        }
      };

    } catch (error) {
      logger.error('Failed to generate questions:', error);
      throw error;
    }
  },

  // ==========================================
  // DELETE DOCUMENT FROM INDEX
  // ==========================================

  /**
   * Remove document from vector DB when file is deleted
   */
  deleteDocument: async (fileId) => {
    try {
      const pineconeIndex = getPineconeIndex();

      // Delete all chunks for this file
      // Pinecone uses prefix matching
      await pineconeIndex.deleteMany({
        filter: { fileId }
      });

      logger.info(`Deleted document from index: ${fileId}`);

      return { success: true };

    } catch (error) {
      logger.error('Failed to delete document:', error);
      throw error;
    }
  }
};
```

---

## Database Schema Updates

Add to `prisma/schema.prisma`:

```prisma
// RAG-specific fields for FileUpload
model FileUpload {
  // ... existing fields ...
  
  // RAG indexing status
  ragIndexed      Boolean   @default(false)
  ragChunkCount   Int?
  ragIndexedAt    DateTime?
}

// Store RAG interactions for analytics
model RagInteraction {
  id            String   @id @default(cuid())
  userId        String
  type          RagInteractionType
  query         String   @db.Text
  response      String   @db.Text
  classId       String?
  sourcesUsed   Json?
  metadata      Json?
  createdAt     DateTime @default(now())
  
  user   User   @relation(fields: [userId], references: [id])
  class  Class? @relation(fields: [classId], references: [id])
  
  @@map("rag_interactions")
}

enum RagInteractionType {
  STUDENT_QUERY
  QUESTION_GENERATION
  SUMMARY_GENERATION
  OTHER
}
```

Run migration:
```bash
npx prisma migrate dev --name add_rag_support
```

---

## API Endpoints

### Create RAG Controller

```javascript
// backend/src/controllers/rag.controller.js
import { ragService } from '../services/rag.service.js';
import { successResponse, errorResponse } from '../utils/response.utils.js';

export const ragController = {
  // Student asks question
  askQuestion: async (req, res, next) => {
    try {
      const studentId = req.user.id;
      const { question, classId } = req.body;

      if (!question || question.trim().length === 0) {
        return errorResponse(res, 'Question is required', 400);
      }

      const result = await ragService.answerStudentQuestion(
        studentId,
        question,
        classId
      );

      successResponse(res, result, 'Question answered successfully');
    } catch (error) {
      next(error);
    }
  },

  // Teacher generates questions
  generateQuestions: async (req, res, next) => {
    try {
      const teacherId = req.user.id;
      const options = req.body;

      const result = await ragService.generateQuestions(teacherId, options);

      successResponse(res, result, 'Questions generated successfully');
    } catch (error) {
      next(error);
    }
  },

  // Index a file for RAG
  indexFile: async (req, res, next) => {
    try {
      const { fileId } = req.body;
      const userId = req.user.id;

      const result = await ragService.ingestDocument(fileId, userId);

      successResponse(res, result, 'File indexed successfully', 201);
    } catch (error) {
      next(error);
    }
  }
};
```

### Create RAG Routes

```javascript
// backend/src/routes/rag.routes.js
import express from 'express';
import { ragController } from '../controllers/rag.controller.js';
import { authenticate, authorize } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validation.middleware.js';
import Joi from 'joi';

const router = express.Router();

// Validation schemas
const askQuestionSchema = Joi.object({
  question: Joi.string().min(5).max(1000).required(),
  classId: Joi.string().optional()
});

const generateQuestionsSchema = Joi.object({
  fileIds: Joi.array().items(Joi.string()).optional(),
  classId: Joi.string().optional(),
  questionCount: Joi.number().integer().min(1).max(50).default(10),
  questionTypes: Joi.array().items(
    Joi.string().valid('MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY')
  ).default(['MULTIPLE_CHOICE']),
  difficulty: Joi.string().valid('EASY', 'MEDIUM', 'HARD').default('MEDIUM'),
  topics: Joi.array().items(Joi.string()).optional()
});

const indexFileSchema = Joi.object({
  fileId: Joi.string().required()
});

// All RAG routes require authentication
router.use(authenticate);

// Student routes
router.post(
  '/ask',
  authorize('STUDENT'),
  validate(askQuestionSchema),
  ragController.askQuestion
);

// Teacher routes
router.post(
  '/generate-questions',
  authorize('TEACHER', 'ADMIN'),
  validate(generateQuestionsSchema),
  ragController.generateQuestions
);

// File indexing (any authenticated user)
router.post(
  '/index-file',
  validate(indexFileSchema),
  ragController.indexFile
);

export default router;
```

### Register routes in app.js:

```javascript
// In src/app.js
import ragRoutes from './routes/rag.routes.js';

// Add with other routes
app.use('/api/rag', ragRoutes);
```

---

## Frontend Integration

### Student Chat Interface

```typescript
// frontend/components/student/rag-chat.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';

export function RAGChat({ classId }: { classId?: string }) {
  const [question, setQuestion] = useState('');
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!question.trim()) return;

    setLoading(true);
    setMessages(prev => [...prev, { role: 'user', content: question }]);

    try {
      const response = await api.post('/rag/ask', {
        question,
        classId
      });

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: response.data.answer,
          sources: response.data.sources
        }
      ]);

      setQuestion('');
    } catch (error) {
      console.error('Failed to get answer:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg, idx) => (
          <Card key={idx} className={`p-4 ${msg.role === 'user' ? 'bg-blue-50' : 'bg-gray-50'}`}>
            <div className="font-semibold mb-2">
              {msg.role === 'user' ? 'You' : 'Study Assistant'}
            </div>
            <div className="whitespace-pre-wrap">{msg.content}</div>
            {msg.sources && (
              <div className="mt-3 text-sm text-gray-600">
                <div className="font-semibold">Sources:</div>
                <ul className="list-disc list-inside">
                  {msg.sources.map((source: any, i: number) => (
                    <li key={i}>{source.fileName} - {source.className}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        ))}
      </div>

      <div className="p-4 border-t flex gap-2">
        <Input
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAsk()}
          placeholder="Ask a question about your study materials..."
          disabled={loading}
        />
        <Button onClick={handleAsk} disabled={loading || !question.trim()}>
          {loading ? 'Asking...' : 'Ask'}
        </Button>
      </div>
    </div>
  );
}
```

### Teacher Question Generator

```typescript
// frontend/components/teacher/question-generator.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { api } from '@/lib/api';

export function QuestionGenerator({ classId }: { classId: string }) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<any[]>([]);
  const [options, setOptions] = useState({
    questionCount: 10,
    questionTypes: ['MULTIPLE_CHOICE'],
    difficulty: 'MEDIUM'
  });

  const handleGenerate = async () => {
    setLoading(true);
    try {
      const response = await api.post('/rag/generate-questions', {
        classId,
        ...options
      });

      setQuestions(response.data.questions);
    } catch (error) {
      console.error('Failed to generate questions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-4">
        <Select
          value={options.questionCount}
          onChange={(v) => setOptions({ ...options, questionCount: v })}
          label="Number of Questions"
        >
          {[5, 10, 15, 20, 25].map(n => (
            <option key={n} value={n}>{n}</option>
          ))}
        </Select>

        <Select
          value={options.difficulty}
          onChange={(v) => setOptions({ ...options, difficulty: v })}
          label="Difficulty"
        >
          <option value="EASY">Easy</option>
          <option value="MEDIUM">Medium</option>
          <option value="HARD">Hard</option>
        </Select>
      </div>

      <Button onClick={handleGenerate} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Questions'}
      </Button>

      {questions.length > 0 && (
        <div className="mt-6 space-y-4">
          {questions.map((q, idx) => (
            <Card key={idx} className="p-4">
              <div className="font-semibold mb-2">
                {idx + 1}. {q.question}
              </div>
              {q.options && (
                <ul className="list-disc list-inside ml-4">
                  {q.options.map((opt: string, i: number) => (
                    <li key={i} className={opt === q.correctAnswer ? 'text-green-600 font-semibold' : ''}>
                      {opt}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-2 text-sm text-gray-600">
                <strong>Answer:</strong> {q.correctAnswer}
              </div>
              <div className="text-sm text-gray-600">
                <strong>Explanation:</strong> {q.explanation}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

## Cost Optimization

### Estimated Costs (OpenAI):

**Embeddings** (text-embedding-ada-002):
- $0.0001 per 1K tokens
- Average document: 5000 tokens = $0.0005
- 1000 documents = $0.50

**Chat** (GPT-3.5-turbo):
- $0.0015 per 1K input tokens
- $0.002 per 1K output tokens
- Average query: 2K input + 500 output = $0.004
- 1000 queries = $4

**Chat** (GPT-4):
- $0.03 per 1K input tokens
- $0.06 per 1K output tokens
- Use only for question generation (better quality)

### Cost Reduction Strategies:

1. **Cache common queries**: Store frequent Q&A pairs
2. **Use GPT-3.5 for students**: Cheaper, good enough for Q&A
3. **Use GPT-4 for teachers**: Better question generation
4. **Batch processing**: Process multiple documents at once
5. **Smart chunking**: Optimal chunk sizes reduce redundant embeddings
6. **Query optimization**: Filter by class/file to reduce search scope

---

## Security Considerations

1. **Access Control**:
   - Students can only query their own materials
   - Teachers can only generate from their class materials
   - Implement file ownership checks

2. **Rate Limiting**:
   ```javascript
   const ragLimiter = rateLimit({
     windowMs: 15 * 60 * 1000,
     max: 50, // 50 requests per 15 minutes
     message: 'Too many RAG requests, please try again later'
   });
   
   router.use('/api/rag', ragLimiter);
   ```

3. **Input Validation**:
   - Sanitize user queries (no malicious prompts)
   - Validate file types before processing
   - Limit question length (prevent prompt injection)

4. **Data Privacy**:
   - Don't store sensitive data in metadata
   - Encrypt embeddings at rest (Pinecone does this)
   - GDPR compliance: Allow users to delete their data

5. **Prompt Injection Protection**:
   ```javascript
   const sanitizeQuery = (query) => {
     // Remove potential prompt injection patterns
     return query
       .replace(/ignore (previous|above) instructions/gi, '')
       .replace(/you are now/gi, '')
       .slice(0, 1000); // Max length
   };
   ```

---

## Testing

### Unit Tests:

```javascript
// backend/tests/rag.test.js
import { ragService } from '../src/services/rag.service.js';

describe('RAG Service', () => {
  test('should chunk text correctly', () => {
    const text = 'A'.repeat(2000);
    const chunks = chunkText(text, 1000, 200);
    expect(chunks.length).toBeGreaterThan(1);
  });

  test('should generate embeddings', async () => {
    const embedding = await generateEmbedding('test query');
    expect(embedding).toHaveLength(1536);
  });

  test('should answer student question', async () => {
    const result = await ragService.answerStudentQuestion(
      'student-id',
      'What is photosynthesis?'
    );
    expect(result).toHaveProperty('answer');
    expect(result).toHaveProperty('sources');
  });
});
```

---

## Deployment Checklist

- [ ] Environment variables configured
- [ ] Pinecone index created
- [ ] OpenAI API key validated
- [ ] Database migrations run
- [ ] RAG routes registered
- [ ] Frontend components integrated
- [ ] Rate limiting configured
- [ ] Security measures implemented
- [ ] Cost monitoring setup
- [ ] Error logging configured
- [ ] User documentation written

---

## Future Enhancements

1. **Multi-modal RAG**: Support images, diagrams, videos
2. **Conversation memory**: Remember previous questions in session
3. **Collaborative study**: Students can share Q&A sessions
4. **Auto-indexing**: Index files automatically on upload
5. **Smart summaries**: Auto-generate chapter summaries
6. **Quiz adaptation**: Generate personalized quizzes based on weak areas
7. **Voice interface**: Ask questions via speech
8. **Mobile app**: RAG chat on mobile

---

## Troubleshooting

**Issue**: Embeddings fail
- Check OpenAI API key
- Verify internet connection
- Check rate limits

**Issue**: No relevant results
- Check if documents are indexed (`ragIndexed = true`)
- Verify user has access to documents
- Try broader search query

**Issue**: Poor question quality
- Use GPT-4 instead of GPT-3.5
- Increase context window
- Improve prompts

**Issue**: High costs
- Enable caching
- Use GPT-3.5 for students
- Optimize chunk sizes
- Implement query throttling

---

**Documentation Version**: 1.0
**Last Updated**: 2025-01-01
**Author**: EduTech Development Team
