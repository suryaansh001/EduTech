#!/bin/bash
cd "$(dirname "$0")"

echo "🚀 Starting EduTech Services..."
echo ""

# Start backend in background
echo "📦 Starting Backend (port 5000)..."
cd backend
npm run dev &
BACKEND_PID=$!

# Start frontend in background
echo "🎨 Starting Frontend (port 3000)..."
cd ../frontend
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Services Started!"
echo "   Backend:  http://localhost:5000"
echo "   Frontend: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services..."
echo ""