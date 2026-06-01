# Quick Start - Service Commands

## Backend

```bash
# Navigate to backend
cd backend

# Install dependencies (first time only)
npm install

# Start server (development)
npm run dev

# Start server (production)
npm start

# Run database migrations
npx prisma migrate dev

# Seed database with test users
npx prisma db seed
```

**Port:** `5000`  
**Test Users:** 
- Admin: `admin@edutech.com`
- Teacher: `teacher@edutech.com`
- Student: `student@edutech.com`
- Premium Student: `premium-student@edutech.com`

---

## Frontend

```bash
# Navigate to frontend
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

**Port:** `3000`  
**API URL:** `http://localhost:5000` (configure in `.env`)

---

## Database (PostgreSQL)

```bash
# Using Docker
docker run -d \
  --name edutech-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=edutech \
  -p 5432:5432 \
  postgres:15

# Using existing connection
# Update `DATABASE_URL` in backend/.env with your connection string
```

---

## Redis (Optional - Caching)

```bash
# Using Docker
docker run -d \
  --name edutech-redis \
  -p 6379:6379 \
  redis:7

# Using Redis CLI
redis-cli ping  # Should return "PONG"
```

---

## All Services (Parallel)

```bash
# Terminal 1: Backend
cd backend && npm run dev

# Terminal 2: Frontend
cd frontend && npm run dev

# Terminal 3: Database (if using Docker)
docker start edutech-db

# Terminal 4: Redis (if using Docker)
docker start edutech-redis
```

---

## Environment Setup

Create `.env` files in `backend/` and `frontend/`:

**backend/.env** (check .env.example for template):
```
NODE_ENV=development
PORT=5000
DATABASE_URL=postgres://user:pass@localhost:5432/edutech
JWT_SECRET=your-secret-key-here
REDIS_HOST=localhost
REDIS_PORT=6379
```

**frontend/.env** (or .env.local):
```
VITE_API_URL=http://localhost:5000
VITE_WS_URL=ws://localhost:5000
```

---

## Health Checks

```bash
# Backend health
curl http://localhost:5000/api/health

# Frontend running
open http://localhost:3000
```

---

## Docker Compose (One Command)

```bash
docker-compose up -d
```

Create `docker-compose.yml` at project root:
```yaml
version: '3.8'
services:
  db:
    image: postgres:15
    environment:
      POSTGRES_DB: edutech
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: password
    ports:
      - "5432:5432"
  
  redis:
    image: redis:7
    ports:
      - "6379:6379"
```

---

## Feature Flags (AI Capabilities)

Three tiers available:
- **FREE:** No AI features (default)
- **PREMIUM:** All AI features enabled
- **ENTERPRISE:** Premium + admin features

Toggle via environment variable:
```bash
# backend/.env
AI_CHAT_ENABLED=true
MCP_ENABLED=true
PINECONE_ENABLED=true
QUIZ_GENERATION_ENABLED=true
DOCUMENT_ANALYSIS_ENABLED=true
```

Or test different tiers:
```bash
# User tier: FREE
curl -H "Authorization: Bearer <token>" http://localhost:5000/api/ai-chat
# Returns 403 if tier doesn't have access

# User tier: PREMIUM
# Same endpoint returns 200 with chat response
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `PORT 5000 in use` | `lsof -i :5000 && kill -9 <PID>` |
| `DATABASE connection failed` | Check `DATABASE_URL` in `.env` |
| `Frontend can't reach API` | Check `VITE_API_URL` matches backend |
| `Redis connection failed` | Start Redis: `docker start edutech-redis` |
| `Prisma migration error` | `npx prisma migrate reset` (dev only) |

---

**See RUN_SERVICES.md for detailed setup and troubleshooting.**
