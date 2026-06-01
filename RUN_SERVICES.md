# 🚀 EduTech - Running Services Guide

Quick reference for running all EduTech services.

---

## 📋 Prerequisites

```bash
# Install dependencies (one time)
cd backend && npm install
cd ../frontend && npm install

# Setup database (one time)
cd backend
npx prisma migrate deploy
npx prisma generate
npm run db:seed
```

---

## 🎯 Quick Start (Development)

### Option 1: Run All Services (Recommended)

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev

# Terminal 3 (Optional): Database UI
cd backend
npx prisma studio
```

### Option 2: Run Everything at Once

Create `run-all.sh`:

```bash
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

# Handle Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit 0" SIGINT

# Wait for both processes
wait
```

Run it:
```bash
chmod +x run-all.sh
./run-all.sh
```

---

## 🔧 Individual Services

### Backend Server

```bash
cd backend

# Development with auto-reload
npm run dev

# Production build & start
npm run build
npm start

# Run specific environment
NODE_ENV=production npm run dev

# With custom port
PORT=3001 npm run dev
```

**Access:** http://localhost:5000
**API Docs:** http://localhost:5000/api/docs (if available)

---

### Frontend App

```bash
cd frontend

# Development with hot reload
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# With custom port
PORT=3001 npm run dev
```

**Access:** http://localhost:3000
**Auto-opens:** Browser (usually)

---

### Database Services

#### Prisma Migrations

```bash
cd backend

# Apply pending migrations
npx prisma migrate deploy

# Create new migration
npx prisma migrate dev --name add_new_feature

# Reset database (WARNING: deletes data!)
npx prisma migrate reset

# View migration status
npx prisma migrate status
```

#### Seed Database

```bash
cd backend

# Run seed script
npm run db:seed

# Seed with logging
node prisma/seed.js
```

#### Prisma Studio (Visual Database UI)

```bash
cd backend

# Opens GUI at http://localhost:5555
npx prisma studio

# Custom port
npx prisma studio --port 5556
```

#### Generate Prisma Client

```bash
cd backend

# Generate after schema changes
npx prisma generate

# Generate + push schema
npx prisma db push
```

---

## 🧪 Testing

### Backend Tests

```bash
cd backend

# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- feature.middleware.test

# Run E2E tests
npm test -- --testPathPattern=e2e
```

### Frontend Tests

```bash
cd frontend

# Run tests
npm test

# Watch mode
npm test -- --watch

# Coverage
npm test -- --coverage
```

### Manual API Testing

```bash
# Test free user blocked from AI features
curl -X POST http://localhost:5000/api/ai-chat/chat \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"message": "hello"}'

# Expected: 403 Forbidden
```

---

## 🔍 Debugging

### Backend Debugging

```bash
cd backend

# Run with debug logging
DEBUG=* npm run dev

# Run with Node debugger
node --inspect server.js

# Open chrome://inspect in browser
```

### Frontend Debugging

```bash
cd frontend

# Run with source maps (default in dev)
npm run dev

# Open DevTools: F12 or Cmd+Option+I
```

### Database Inspection

```bash
cd backend

# Interactive SQL console
npx prisma db execute --stdin

# Then type SQL:
# SELECT * FROM users;
# SELECT * FROM "FeatureAccess";

# Or use Prisma Studio
npx prisma studio
```

---

## 📊 Monitoring

### View Logs

```bash
# Backend logs
tail -f backend/logs/app.log

# With timestamp filtering
tail -f backend/logs/app.log | grep "ERROR\|WARN"
```

### Check Running Processes

```bash
# List Node processes
lsof -i :5000  # Backend
lsof -i :3000  # Frontend

# Kill process on specific port
kill -9 $(lsof -t -i :5000)
```

### Performance Monitoring

```bash
cd backend

# View memory/CPU usage
npm run monitor

# Or manually
node --max-old-space-size=4096 server.js
```

---

## 🔄 Workflow Scripts

### Development Setup (New Developer)

Create `scripts/setup.sh`:

```bash
#!/bin/bash

echo "🔧 Setting up EduTech development environment..."

# Install dependencies
echo "📦 Installing dependencies..."
cd backend && npm install
cd ../frontend && npm install

# Setup database
echo "🗄️  Setting up database..."
cd ../backend
npx prisma migrate deploy
npx prisma generate
npm run db:seed

echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Terminal 1: cd backend && npm run dev"
echo "2. Terminal 2: cd frontend && npm run dev"
echo "3. Open http://localhost:3000"
```

Run it:
```bash
chmod +x scripts/setup.sh
./scripts/setup.sh
```

### Full Restart (Clean State)

Create `scripts/restart.sh`:

```bash
#!/bin/bash

echo "🔄 Restarting EduTech..."

# Kill existing processes
pkill -f "npm run dev"
pkill -f "node server.js"

sleep 2

# Reset database
cd backend
npx prisma migrate reset --force
npm run db:seed

# Restart services
echo "Starting services..."
npm run dev &
cd ../frontend
npm run dev &

echo "✅ Services restarted!"
```

---

## 📦 Production Deployment

### Build for Production

```bash
# Backend
cd backend
npm run build
npm install --production

# Frontend
cd frontend
npm run build
# Upload 'dist' folder to hosting
```

### Run Production Server

```bash
cd backend

# Set environment
export NODE_ENV=production
export DATABASE_URL="your-production-db"
export JWT_SECRET="your-production-secret"

# Start server
npm start

# Or with PM2 (process manager)
npm install -g pm2
pm2 start server.js --name "edutech-api"
pm2 start ../frontend/dist --name "edutech-web"
```

---

## 🐳 Docker

### Build & Run with Docker

```bash
# Backend Dockerfile
cd backend
docker build -t edutech-api .
docker run -p 5000:5000 --env-file .env edutech-api

# Frontend Dockerfile
cd frontend
docker build -t edutech-web .
docker run -p 3000:3000 edutech-web
```

### Docker Compose (All Services)

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://user:password@db:5432/edutech
      NODE_ENV: development
    depends_on:
      - db

  frontend:
    build: ./frontend
    ports:
      - "3000:3000"

volumes:
  postgres_data:
```

Run:
```bash
docker-compose up
```

---

## 📋 Troubleshooting

### Port Already in Use

```bash
# Free port 5000 (Backend)
lsof -i :5000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Free port 3000 (Frontend)
lsof -i :3000 | grep LISTEN | awk '{print $2}' | xargs kill -9

# Or run on different port
PORT=3001 npm run dev
```

### Database Connection Failed

```bash
# Check DATABASE_URL in .env
cat backend/.env | grep DATABASE_URL

# Test connection
npx prisma db execute --stdin
# Type: SELECT 1;

# Reset database
npx prisma migrate reset --force
```

### Module Not Found

```bash
# Reinstall dependencies
cd backend && rm -rf node_modules && npm install
cd ../frontend && rm -rf node_modules && npm install
```

### Clear Cache & Rebuild

```bash
cd backend
npm run build
npx prisma generate
npx prisma migrate deploy

cd ../frontend
npm run build
```

---

## ✅ Verification Checklist

After starting services, verify:

```bash
# ✅ Backend running
curl http://localhost:5000/api/health

# ✅ Frontend running
curl http://localhost:3000

# ✅ Database connected
cd backend && npx prisma studio
# Check users table has test data

# ✅ Test authentication
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"student@edutech.com","password":"Password123!"}'
# Should return token
```

---

## 🎯 Common Commands Reference

| Task | Command |
|------|---------|
| Start backend | `cd backend && npm run dev` |
| Start frontend | `cd frontend && npm run dev` |
| Seed database | `cd backend && npm run db:seed` |
| View database | `cd backend && npx prisma studio` |
| Run tests | `npm test` |
| Build for prod | `npm run build` |
| Check deps | `npm outdated` |
| Update deps | `npm update` |
| Clean install | `rm -rf node_modules && npm install` |

---

## 🔐 Environment Variables

### Backend (.env)

```env
# Core
NODE_ENV=development
PORT=5000
DATABASE_URL="postgres://..."
JWT_SECRET="dev-secret-key"

# Features
AI_CHAT_ENABLED=true
MCP_ENABLED=true
PINECONE_ENABLED=true
QUIZ_GENERATION_ENABLED=true
DOCUMENT_ANALYSIS_ENABLED=true

# Optional Services
REDIS_HOST=localhost
REDIS_PORT=6379
CLOUDINARY_CLOUD_NAME="..."
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:5000
VITE_APP_NAME=EduTech
```

---

## 💡 Tips

1. **Use `.env.local`** for personal/secret configs (not git-tracked)
2. **Keep logs open** in separate terminal: `tail -f logs/app.log`
3. **Use Prisma Studio** for quick database inspection
4. **Browser DevTools** for frontend debugging (F12)
5. **Postman/Insomnia** for API testing

---

**Happy Coding! 🚀**

For more details, see:
- `/backend/README.md`
- `/frontend/README.md`
- `AI_NON_AI_SEGREGATION_COMPLETE.md`
