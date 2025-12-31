# EduTech Backend - Setup Guide

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher) - [Download](https://nodejs.org/)
- **pnpm** (v8 or higher) - `npm install -g pnpm`
- **PostgreSQL** (v14 or higher) - [Download](https://www.postgresql.org/download/)
- **Redis** (v6 or higher) - [Download](https://redis.io/download/) - **Optional but recommended**

---

## Quick Start Guide

### 1. Clone and Install Dependencies

```bash
cd backend
pnpm install
```

### 2. Setup PostgreSQL Database

#### Option A: Using psql command line

```bash
# Connect to PostgreSQL
psql -U postgres

# Create database
CREATE DATABASE edutech_db;

# Create user (optional)
CREATE USER edutech_user WITH PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE edutech_db TO edutech_user;

# Exit
\q
```

#### Option B: Using GUI Tools
- Use **pgAdmin**, **DBeaver**, or **TablePlus**
- Create a new database named `edutech_db`

### 3. Configure Environment Variables

```bash
# Copy the example file
cp .env.example .env

# Edit .env with your actual values
nano .env  # or use any text editor
```

**Required configurations:**

```env
# Database - Update with your PostgreSQL credentials
DATABASE_URL="postgresql://postgres:your_password@localhost:5432/edutech_db"

# JWT Secret - Generate a secure key
JWT_SECRET="your-super-secret-jwt-key-here"

# Optional: Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

**Generate a secure JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Setup Database Schema

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (creates tables)
pnpm db:push

# Or use migrations (recommended for production)
pnpm db:migrate

# Seed initial data (optional)
pnpm db:seed
```

### 5. Start Redis (Optional)

#### On Linux/macOS:
```bash
redis-server
```

#### On Windows:
- Download Redis for Windows or use WSL
- Or use a cloud Redis service (see below)

**Note:** The app will work without Redis but with reduced performance (no caching).

### 6. Start the Server

```bash
# Development mode (with auto-reload)
pnpm dev

# Production mode
pnpm start
```

The server should start on: `http://localhost:5000`

---

## Environment Variables Explained

### Essential Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NODE_ENV` | Environment mode | `development` or `production` |
| `PORT` | Server port | `5000` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://user:pass@localhost:5432/edutech_db` |
| `JWT_SECRET` | Secret key for JWT tokens | Generate with crypto |
| `JWT_EXPIRES_IN` | Token expiration time | `24h`, `7d`, etc. |

### Optional Services

#### Cloudinary (File Storage)
```env
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Setup:**
1. Sign up at [Cloudinary](https://cloudinary.com/)
2. Get credentials from dashboard
3. Add to `.env` file

#### Email Service (NodeMailer)
```env
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT=587
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
```

**Setup for Gmail:**
1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
3. Use the app password in `EMAIL_PASS`

#### Redis (Caching)
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_USERNAME=
REDIS_PASSWORD=
```

**Cloud Redis Options:**
- [Redis Cloud](https://redis.com/try-free/) - Free tier available
- [Upstash](https://upstash.com/) - Serverless Redis
- [AWS ElastiCache](https://aws.amazon.com/elasticache/)

---

## Troubleshooting

### Error: "PrismaClient" not found

**Solution:**
```bash
pnpm db:generate
```

### Error: Database connection failed

**Check:**
1. PostgreSQL is running: `pg_isready` or `brew services list`
2. Database exists: `psql -U postgres -l`
3. Credentials in `DATABASE_URL` are correct
4. Port 5432 is not blocked

**Test connection:**
```bash
psql -U postgres -d edutech_db
```

### Error: Redis connection refused

**Solutions:**
1. Start Redis: `redis-server`
2. Or disable Redis by not setting `REDIS_HOST` (app will work without it)
3. Check if Redis is running: `redis-cli ping` (should return "PONG")

### Error: Cannot connect to email service

**Solutions:**
1. This is optional - app will work without email
2. For Gmail, ensure you're using an App Password, not your regular password
3. Check firewall isn't blocking port 587

### Port 5000 already in use

**Solution:**
```bash
# Change PORT in .env file
PORT=5001

# Or kill the process using port 5000
lsof -ti:5000 | xargs kill -9
```

---

## Database Commands

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database (development)
pnpm db:push

# Create a migration (production)
pnpm db:migrate

# Reset database (WARNING: deletes all data)
npx prisma migrate reset

# Open Prisma Studio (GUI for database)
pnpm db:studio

# Seed database with sample data
pnpm db:seed
```

---

## Testing the API

### 1. Health Check

```bash
curl http://localhost:5000/health
```

Should return: `{"status": "ok", "timestamp": "..."}`

### 2. API Documentation

Visit: `http://localhost:5000/api`

### 3. Using Postman

Import the Postman collection:
```bash
backend/postman_collection.json
```

### 4. Example API Calls

**Register a user:**
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123",
    "role": "STUDENT"
  }'
```

**Login:**
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "john@example.com",
    "password": "password123"
  }'
```

---

## Production Deployment

### Environment Setup

1. Set `NODE_ENV=production`
2. Use strong `JWT_SECRET` (64+ characters)
3. Enable HTTPS
4. Use managed PostgreSQL (e.g., AWS RDS, Heroku Postgres)
5. Use managed Redis (e.g., Redis Cloud, AWS ElastiCache)

### Deployment Platforms

#### Heroku
```bash
# Add Heroku Postgres addon
heroku addons:create heroku-postgresql:mini

# Add Heroku Redis addon
heroku addons:create heroku-redis:mini

# Deploy
git push heroku main
```

#### Railway
1. Connect GitHub repository
2. Add PostgreSQL database
3. Add Redis (optional)
4. Set environment variables
5. Deploy

#### DigitalOcean App Platform
1. Connect GitHub repository
2. Add PostgreSQL database component
3. Add Redis component (optional)
4. Configure environment variables
5. Deploy

---

## Additional Resources

- **API Documentation**: [backend/API_EXAMPLES.md](./API_EXAMPLES.md)
- **Controllers Explained**: [backend/EXPLAIN_CONTROLLERS.md](./EXPLAIN_CONTROLLERS.md)
- **Project Structure**: [backend/EXPLAIN_OVERVIEW.md](./EXPLAIN_OVERVIEW.md)

---

## Common Issues & Solutions

### Issue: "Cannot find module '@prisma/client'"

**Solution:**
```bash
rm -rf node_modules
pnpm install
pnpm db:generate
```

### Issue: "Migration failed"

**Solution:**
```bash
npx prisma migrate reset
pnpm db:migrate
```

### Issue: "Port 5000 in use"

**Solution:**
```bash
# Find process
lsof -ti:5000

# Kill it
kill -9 <PID>

# Or change port in .env
PORT=5001
```

---

## Support

If you encounter issues:

1. Check the logs: `backend/logs/`
2. Review the error message carefully
3. Check environment variables are set correctly
4. Ensure all services (PostgreSQL, Redis) are running
5. Try cleaning and reinstalling: `rm -rf node_modules && pnpm install`

---

## Quick Commands Reference

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev

# Generate Prisma Client
pnpm db:generate

# Push database schema
pnpm db:push

# Open Prisma Studio
pnpm db:studio

# Run tests
pnpm test

# Check for errors
pnpm build
```

---

**Ready to go!** Start the server with `pnpm dev` and access it at `http://localhost:5000`
