#!/bin/bash

echo "========================================"
echo "EduTech Backend - System Check"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check Node.js
echo -n "Checking Node.js... "
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✓ Installed ($NODE_VERSION)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Please install Node.js from https://nodejs.org/"
fi

# Check pnpm
echo -n "Checking pnpm... "
if command -v pnpm &> /dev/null; then
    PNPM_VERSION=$(pnpm --version)
    echo -e "${GREEN}✓ Installed ($PNPM_VERSION)${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Install with: npm install -g pnpm"
fi

# Check PostgreSQL
echo -n "Checking PostgreSQL... "
if command -v psql &> /dev/null; then
    PG_VERSION=$(psql --version | cut -d' ' -f3)
    echo -e "${GREEN}✓ Installed ($PG_VERSION)${NC}"
    
    # Check if PostgreSQL is running
    echo -n "  Checking if PostgreSQL is running... "
    if pg_isready &> /dev/null; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${YELLOW}⚠ Not running${NC}"
        echo "  Start with: sudo service postgresql start"
    fi
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Please install PostgreSQL from https://www.postgresql.org/download/"
fi

# Check Redis
echo -n "Checking Redis... "
if command -v redis-cli &> /dev/null; then
    REDIS_VERSION=$(redis-cli --version | cut -d' ' -f2)
    echo -e "${GREEN}✓ Installed ($REDIS_VERSION)${NC}"
    
    # Check if Redis is running
    echo -n "  Checking if Redis is running... "
    if redis-cli ping &> /dev/null; then
        echo -e "${GREEN}✓ Running${NC}"
    else
        echo -e "${YELLOW}⚠ Not running (optional)${NC}"
        echo "  Start with: redis-server"
    fi
else
    echo -e "${YELLOW}⚠ Not installed (optional)${NC}"
    echo "  App will work without Redis but with reduced performance"
fi

# Check .env file
echo -n "Checking .env file... "
if [ -f ".env" ]; then
    echo -e "${GREEN}✓ Found${NC}"
    
    # Check if DATABASE_URL is set
    if grep -q "DATABASE_URL=" .env && ! grep -q "DATABASE_URL=\"\"" .env; then
        echo -e "  ${GREEN}✓ DATABASE_URL configured${NC}"
    else
        echo -e "  ${YELLOW}⚠ DATABASE_URL not configured${NC}"
        echo "    Edit .env and set your PostgreSQL connection string"
    fi
    
    # Check if JWT_SECRET is set
    if grep -q "JWT_SECRET=" .env && ! grep -q "JWT_SECRET=\"your-super-secret-jwt-key-here\"" .env; then
        echo -e "  ${GREEN}✓ JWT_SECRET configured${NC}"
    else
        echo -e "  ${YELLOW}⚠ JWT_SECRET not configured${NC}"
        echo "    Generate with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    fi
else
    echo -e "${RED}✗ Not found${NC}"
    echo "  Copy from example: cp .env.example .env"
fi

# Check node_modules
echo -n "Checking dependencies... "
if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓ Installed${NC}"
else
    echo -e "${RED}✗ Not installed${NC}"
    echo "  Run: pnpm install"
fi

# Check Prisma Client
echo -n "Checking Prisma Client... "
if [ -d "node_modules/.pnpm/@prisma+client"* ]; then
    echo -e "${GREEN}✓ Generated${NC}"
else
    echo -e "${RED}✗ Not generated${NC}"
    echo "  Run: pnpm db:generate"
fi

echo ""
echo "========================================"
echo "Summary"
echo "========================================"

# Overall status
ERRORS=0

if ! command -v node &> /dev/null; then ((ERRORS++)); fi
if ! command -v pnpm &> /dev/null; then ((ERRORS++)); fi
if ! command -v psql &> /dev/null; then ((ERRORS++)); fi
if [ ! -f ".env" ]; then ((ERRORS++)); fi
if [ ! -d "node_modules" ]; then ((ERRORS++)); fi

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All required components are ready!${NC}"
    echo ""
    echo "Next steps:"
    echo "  1. Ensure PostgreSQL is running"
    echo "  2. Run: pnpm db:push (to create database tables)"
    echo "  3. Run: pnpm dev (to start the server)"
else
    echo -e "${RED}✗ $ERRORS required component(s) missing${NC}"
    echo ""
    echo "Please fix the issues above before starting the server"
fi

echo ""
