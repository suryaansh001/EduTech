#!/bin/bash

# EduTech MCP Setup Script
# This script sets up the MCP servers and dependencies

echo "🚀 Setting up EduTech MCP Servers..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo -e "${RED}❌ pnpm is not installed. Please install it first.${NC}"
    exit 1
fi

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites check passed${NC}"

# Install backend dependencies
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
pnpm install

# Install MCP server dependencies
echo -e "${YELLOW}📦 Installing MCP Analytics server dependencies...${NC}"
cd mcp-servers/analytics
pnpm install
cd ../..

echo -e "${YELLOW}📦 Installing MCP Predictions server dependencies...${NC}"
cd mcp-servers/predictions
pnpm install
cd ../..

echo -e "${YELLOW}📦 Installing MCP Insights server dependencies...${NC}"
cd mcp-servers/insights
pnpm install
cd ../..

# Check for .env file
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found. Creating from .env.example...${NC}"
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        echo -e "${RED}❌ .env.example not found!${NC}"
    fi
fi

# Check for GROQ_API_KEY
if ! grep -q "GROQ_API_KEY=your_groq_api_key_here" .env 2>/dev/null; then
    echo -e "${GREEN}✓ GROQ_API_KEY appears to be configured${NC}"
else
    echo -e "${YELLOW}⚠️  Please add your GROQ_API_KEY to the .env file${NC}"
    echo -e "${YELLOW}   Get your API key from: https://console.groq.com/keys${NC}"
fi

# Copy MCP environment variables
if [ -f .env.mcp ]; then
    echo -e "${YELLOW}📝 Adding MCP configuration to .env...${NC}"
    cat .env.mcp >> .env
fi

# Generate Prisma client
echo -e "${YELLOW}🔧 Generating Prisma client...${NC}"
pnpm db:generate

echo ""
echo -e "${GREEN}✅ MCP Setup Complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Add your GROQ_API_KEY to backend/.env"
echo "2. Run database migrations: cd backend && pnpm db:migrate"
echo "3. Start the backend server: pnpm dev"
echo ""
echo -e "${YELLOW}MCP Servers will start automatically with the backend.${NC}"
echo ""
echo -e "${GREEN}Happy coding! 🎉${NC}"
