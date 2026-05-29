#!/bin/bash

# AI Chat & Quiz Generation Setup Script
# This extends the MCP setup with chat and RAG capabilities

set -e

echo "🤖 Setting up AI Chat & Quiz Generation..."
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if in project root
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo "❌ Error: Please run this script from the project root directory"
    exit 1
fi

echo -e "${BLUE}📦 Installing Chat MCP Server dependencies...${NC}"
cd backend/mcp-servers/chat
pnpm install
cd ../../..

echo -e "${BLUE}📦 Installing backend dependencies...${NC}"
cd backend
pnpm add @pinecone-database/pinecone pdf-parse
cd ..

echo -e "${GREEN}✅ Dependencies installed${NC}"
echo ""

# Check for environment variables
echo -e "${BLUE}🔑 Checking environment configuration...${NC}"

if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  Creating .env file from .env.mcp template${NC}"
    cp backend/.env.mcp backend/.env
fi

# Check for Groq API key
if ! grep -q "GROQ_API_KEY=gsk_" backend/.env 2>/dev/null; then
    echo -e "${YELLOW}⚠️  GROQ_API_KEY not configured${NC}"
    echo "   Get your API key from: https://console.groq.com/keys"
    echo "   Add to backend/.env: GROQ_API_KEY=your_key_here"
else
    echo -e "${GREEN}✅ Groq API key configured${NC}"
fi

# Check for Pinecone (optional)
if ! grep -q "PINECONE_API_KEY=" backend/.env 2>/dev/null || ! grep -q "PINECONE_API_KEY=pc_" backend/.env 2>/dev/null; then
    echo -e "${YELLOW}ℹ️  Pinecone not configured (optional for RAG)${NC}"
    echo "   Sign up at: https://www.pinecone.io/ (FREE tier available)"
    echo "   Add to backend/.env:"
    echo "   PINECONE_API_KEY=your_key_here"
    echo "   PINECONE_INDEX_NAME=edutech-documents"
else
    echo -e "${GREEN}✅ Pinecone configured${NC}"
fi

echo ""
echo -e "${GREEN}✅ AI Chat & Quiz Generation setup complete!${NC}"
echo ""
echo "📚 Next steps:"
echo "   1. Make sure GROQ_API_KEY is set in backend/.env"
echo "   2. (Optional) Set up Pinecone for document-based quizzes"
echo "   3. Start the backend: cd backend && pnpm dev"
echo "   4. Use the AI components in your frontend"
echo ""
echo "📖 Read AI_CHAT_GUIDE.md for usage examples"
echo ""
