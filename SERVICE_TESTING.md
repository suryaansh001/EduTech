# Service Testing & Verification

## Backend API Testing

### Health Check
```bash
curl http://localhost:5000/api/health
```

### Authentication
```bash
# Login (get JWT token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "student@edutech.com",
    "password": "password123"
  }'
```

### Feature Access by Tier

```bash
# FREE Tier - Should return 403 (Forbidden)
curl -H "Authorization: Bearer <FREE_TOKEN>" \
  http://localhost:5000/api/ai-chat/send \
  -X POST
# Response: { "message": "Feature not available for tier", "tier": "FREE" }

# PREMIUM Tier - Should return 200
curl -H "Authorization: Bearer <PREMIUM_TOKEN>" \
  http://localhost:5000/api/ai-chat/send \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{ "message": "Hello AI" }'
```

### Test Users
```bash
# Get test users from database
npx prisma db execute --stdin << EOF
SELECT email, "subscriptionTier" FROM "User";
EOF
```

---

## Frontend Testing

### Check Build
```bash
# Verify frontend built successfully
ls -la frontend/dist/

# Should contain:
# - index.html
# - assets/index-*.js
# - assets/index-*.css
```

### Dev Server
```bash
cd frontend
npm run dev
# Open http://localhost:3000 in browser
```

### Feature Gates
```javascript
// Open browser console (F12) and test:

// Check feature availability
const { useFeatureFlag } = await import('./hooks/useFeatureFlag.js');
useFeatureFlag('AI_CHAT');  // true/false based on tier

// Test FeatureGate component
import { FeatureGate } from './components/FeatureGate.jsx';
// Should show upgrade prompt for free users
```

---

## Database Testing

### Verify Migrations
```bash
# Check applied migrations
npx prisma migrate status

# See all tables
npx prisma db execute --stdin << EOF
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public';
EOF
```

### Check Feature Access
```bash
npx prisma db execute --stdin << EOF
SELECT f.name, f.description, a."subscriptionTier", a.available 
FROM "Feature" f
LEFT JOIN "FeatureAccess" a ON f.id = a."featureId"
ORDER BY f.name, a."subscriptionTier";
EOF
```

### Verify Test Users
```bash
npx prisma db execute --stdin << EOF
SELECT id, email, "subscriptionTier", "createdAt" 
FROM "User"
ORDER BY email;
EOF
```

---

## Docker Testing

### Check Running Services
```bash
# List running containers
docker ps

# Check logs
docker logs edutech-db      # Database logs
docker logs edutech-redis   # Redis logs

# Access database
docker exec -it edutech-db psql -U postgres -d edutech

# Test Redis
docker exec -it edutech-redis redis-cli ping
```

---

## Performance Testing

### Backend Load Test
```bash
# Using curl in loop (simple load test)
for i in {1..10}; do
  curl -s http://localhost:5000/api/health | jq .
done
```

### Database Query Performance
```bash
npx prisma db execute --stdin << EOF
EXPLAIN ANALYZE
SELECT u.*, f.* 
FROM "User" u
LEFT JOIN "FeatureAccess" f ON u."subscriptionTier" = f."subscriptionTier"
WHERE u.email = 'premium-student@edutech.com';
EOF
```

### Frontend Bundle Size
```bash
# Check bundle analysis
cd frontend
npm run build
du -sh dist/
du -sh dist/assets/

# Gzip size (from build output)
# dist/assets/index-DVxfFuo7.js   557.53 kB │ gzip: 163.01 kB
```

---

## Integration Testing

### End-to-End Scenario

1. **User Registration (FREE tier)**
   ```bash
   curl -X POST http://localhost:5000/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "email": "newuser@test.com",
       "password": "password123",
       "name": "New User"
     }'
   ```

2. **Try to Access AI Feature**
   ```bash
   # Get token from login response
   TOKEN=$(curl -s -X POST http://localhost:5000/api/auth/login \
     -H "Content-Type: application/json" \
     -d '{"email": "newuser@test.com", "password": "password123"}' | jq -r '.token')
   
   # Try AI chat (should fail)
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5000/api/ai-chat/send
   # Expects 403 Forbidden
   ```

3. **Upgrade to PREMIUM**
   ```bash
   # Admin upgrades user
   curl -X POST http://localhost:5000/api/admin/users/newuser@test.com/upgrade \
     -H "Authorization: Bearer <ADMIN_TOKEN>" \
     -H "Content-Type: application/json" \
     -d '{ "tier": "PREMIUM" }'
   ```

4. **Access AI Feature Now**
   ```bash
   # Same request should work now
   curl -H "Authorization: Bearer $TOKEN" \
     http://localhost:5000/api/ai-chat/send \
     -X POST \
     -H "Content-Type: application/json" \
     -d '{ "message": "Hello" }'
   # Expects 200 OK with AI response
   ```

---

## Logs & Debugging

### Backend Logs
```bash
# Real-time logs
cd backend && npm run dev

# Check log level
grep LOG_LEVEL backend/.env

# Add debug output (edit .env)
LOG_LEVEL=debug
```

### Feature Middleware Logs
```bash
# Should see entries like:
# [FEATURE] User john@test.com denied access to AI_CHAT (tier: FREE, required: PREMIUM)
# [FEATURE] User jane@test.com granted access to AI_CHAT (tier: PREMIUM)
```

### Frontend Console Errors
```javascript
// Open DevTools (F12) and check:
// - Network tab for API failures
// - Console for React warnings
// - Application tab for localStorage (tokens)
```

---

## Quick Health Check Script

Save as `health-check.sh`:
```bash
#!/bin/bash

echo "🔍 Health Check..."

# Backend
echo -n "Backend: "
curl -s http://localhost:5000/api/health >/dev/null && echo "✓" || echo "✗"

# Frontend
echo -n "Frontend: "
curl -s http://localhost:3000 >/dev/null && echo "✓" || echo "✗"

# Database
echo -n "Database: "
docker exec edutech-db pg_isready -U postgres >/dev/null 2>&1 && echo "✓" || echo "✗"

# Redis
echo -n "Redis: "
docker exec edutech-redis redis-cli ping >/dev/null 2>&1 && echo "✓" || echo "✗"

echo "✅ Health check complete"
```

Run with: `bash health-check.sh`
