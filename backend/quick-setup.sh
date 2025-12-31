#!/bin/bash

echo "=========================================="
echo "EduTech Backend - Quick Start Helper"
echo "=========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}This script will help you set up the database and start the server.${NC}"
echo ""

# Check if PostgreSQL is running
if ! pg_isready &> /dev/null; then
    echo -e "${RED}✗ PostgreSQL is not running${NC}"
    echo ""
    echo "Please start PostgreSQL first:"
    echo "  Ubuntu/Debian: sudo service postgresql start"
    echo "  macOS: brew services start postgresql"
    echo "  Windows: Use Services app or WSL"
    exit 1
fi

echo -e "${GREEN}✓ PostgreSQL is running${NC}"
echo ""

# Ask for database credentials
echo -e "${YELLOW}Please provide your PostgreSQL credentials:${NC}"
echo ""

read -p "PostgreSQL username (default: postgres): " PG_USER
PG_USER=${PG_USER:-postgres}

read -sp "PostgreSQL password: " PG_PASS
echo ""

read -p "Database name (default: edutech_db): " DB_NAME
DB_NAME=${DB_NAME:-edutech_db}

read -p "Database host (default: localhost): " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Database port (default: 5432): " DB_PORT
DB_PORT=${DB_PORT:-5432}

echo ""
echo -e "${BLUE}Testing database connection...${NC}"

# Test PostgreSQL connection
if PGPASSWORD=$PG_PASS psql -h $DB_HOST -p $DB_PORT -U $PG_USER -d postgres -c "SELECT 1;" &> /dev/null; then
    echo -e "${GREEN}✓ Database connection successful${NC}"
else
    echo -e "${RED}✗ Database connection failed${NC}"
    echo "Please check your credentials and try again"
    exit 1
fi

# Check if database exists
echo -e "${BLUE}Checking if database '$DB_NAME' exists...${NC}"

DB_EXISTS=$(PGPASSWORD=$PG_PASS psql -h $DB_HOST -p $DB_PORT -U $PG_USER -d postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'")

if [ "$DB_EXISTS" = "1" ]; then
    echo -e "${GREEN}✓ Database '$DB_NAME' exists${NC}"
else
    echo -e "${YELLOW}⚠ Database '$DB_NAME' does not exist${NC}"
    read -p "Create database '$DB_NAME'? (y/n): " CREATE_DB
    
    if [ "$CREATE_DB" = "y" ] || [ "$CREATE_DB" = "Y" ]; then
        if PGPASSWORD=$PG_PASS psql -h $DB_HOST -p $DB_PORT -U $PG_USER -d postgres -c "CREATE DATABASE $DB_NAME;" &> /dev/null; then
            echo -e "${GREEN}✓ Database '$DB_NAME' created successfully${NC}"
        else
            echo -e "${RED}✗ Failed to create database${NC}"
            exit 1
        fi
    else
        echo "Please create the database manually and run this script again"
        exit 1
    fi
fi

# Update .env file
echo ""
echo -e "${BLUE}Updating .env file...${NC}"

DATABASE_URL="postgresql://${PG_USER}:${PG_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

# Check if .env exists
if [ ! -f ".env" ]; then
    cp .env.example .env
    echo -e "${GREEN}✓ Created .env file from .env.example${NC}"
fi

# Update DATABASE_URL in .env
if grep -q "^DATABASE_URL=" .env; then
    # macOS/BSD sed compatibility
    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    else
        sed -i "s|^DATABASE_URL=.*|DATABASE_URL=\"$DATABASE_URL\"|" .env
    fi
    echo -e "${GREEN}✓ Updated DATABASE_URL in .env${NC}"
else
    echo "DATABASE_URL=\"$DATABASE_URL\"" >> .env
    echo -e "${GREEN}✓ Added DATABASE_URL to .env${NC}"
fi

# Check JWT_SECRET
if ! grep -q "^JWT_SECRET=" .env || grep -q "JWT_SECRET=\"your-super-secret-jwt-key-here\"" .env; then
    echo ""
    echo -e "${YELLOW}Generating secure JWT_SECRET...${NC}"
    JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(64).toString('hex'))")
    
    if grep -q "^JWT_SECRET=" .env; then
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^JWT_SECRET=.*|JWT_SECRET=\"$JWT_SECRET\"|" .env
        else
            sed -i "s|^JWT_SECRET=.*|JWT_SECRET=\"$JWT_SECRET\"|" .env
        fi
    else
        echo "JWT_SECRET=\"$JWT_SECRET\"" >> .env
    fi
    echo -e "${GREEN}✓ Generated and saved JWT_SECRET${NC}"
fi

# Push database schema
echo ""
echo -e "${BLUE}Creating database tables...${NC}"

if pnpm db:push; then
    echo -e "${GREEN}✓ Database tables created successfully${NC}"
else
    echo -e "${RED}✗ Failed to create database tables${NC}"
    echo "Please check the error above and try again"
    exit 1
fi

# All done!
echo ""
echo -e "${GREEN}=========================================="
echo "✓ Setup Complete!"
echo "==========================================${NC}"
echo ""
echo "Your backend is ready to run!"
echo ""
echo "Start the server with:"
echo -e "  ${BLUE}pnpm dev${NC}"
echo ""
echo "The server will be available at:"
echo -e "  ${BLUE}http://localhost:5000${NC}"
echo ""
echo "API Health Check:"
echo -e "  ${BLUE}curl http://localhost:5000/health${NC}"
echo ""
