#!/bin/bash

# EduTech Backend Startup Script
echo "🚀 Starting EduTech Backend Setup..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if npm is available
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not available. Please install npm first."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
fi

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "⚙️ Creating .env file from example..."
    cp .env.example .env
    echo "⚠️  Please configure your .env file with proper values before starting the server"
    echo "📝 Edit .env file and set:"
    echo "   - DATABASE_URL (PostgreSQL connection)"
    echo "   - JWT_SECRET (secure random string)"
    echo "   - EMAIL_USER and EMAIL_PASS (for sending emails)"
    echo "   - CLOUDINARY credentials (for file uploads)"
    exit 1
fi

echo "✅ Environment file found"

# Try to generate Prisma client
echo "🔧 Generating Prisma client..."
npx prisma generate

echo "🎉 Setup completed!"
echo ""
echo "Next steps:"
echo "1. Ensure your PostgreSQL database is running"
echo "2. Run 'npm run db:push' to setup database schema"
echo "3. Run 'npm run db:seed' to create sample data"
echo "4. Run 'npm run dev' to start the development server"
echo ""
echo "Default test credentials:"
echo "Admin: admin@edutech.com / admin123"
echo "Teacher: teacher@edutech.com / teacher123"  
echo "Student: student@edutech.com / student123"
