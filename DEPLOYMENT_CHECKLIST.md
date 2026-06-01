# EduTech Deployment Checklist

## ✅ Pre-Deployment (Dev Verification)

- [x] Frontend build completes without errors
- [x] Backend starts successfully
- [x] Database migrations applied
- [x] Test data seeded (4 test users)
- [x] Feature flags configured in .env
- [x] Service factory pattern implemented
- [x] Middleware feature guards active
- [x] React Context feature management setup
- [x] UI components gatekeeping free features

---

## ⏳ Deployment Steps (In Order)

### 1. Environment Setup
```bash
# Prepare .env files with production values
backend/.env                 # Update secrets, DB connection
frontend/.env.production     # Update API URLs
```

### 2. Database
```bash
# Run migrations
npx prisma migrate deploy

# Seed initial data
npx prisma db seed

# Verify schema
npx prisma db execute --stdin < verify-schema.sql
```

### 3. Backend
```bash
# Install dependencies
cd backend && npm install

# Build (if TypeScript)
npm run build

# Start server
npm start

# Verify health
curl https://api.edutech.com/api/health
```

### 4. Frontend
```bash
# Build optimized bundle
cd frontend && npm run build

# Deploy dist/ folder to CDN/static hosting
# OR run with: npm start

# Verify accessibility
curl https://edutech.com/
```

### 5. Services
```bash
# Start Redis
docker start edutech-redis

# Start PostgreSQL (or managed service)
# Verify connection string in .env

# Test all services
bash health-check.sh
```

---

## 🔒 Security Checklist

- [ ] All secrets stored in secure .env files (not in git)
- [ ] DATABASE_URL uses secure SSL connection
- [ ] JWT_SECRET is long random string (min 32 chars)
- [ ] CORS configured for specific domains only
- [ ] Rate limiting enabled
- [ ] Feature middleware cannot be bypassed
- [ ] No test users in production database
- [ ] Admin user created with strong password
- [ ] HTTPS/TLS enabled on all endpoints
- [ ] API keys rotated (Cloudinary, Pinecone, etc)

---

## 📊 Monitoring Checklist

- [ ] Error logging configured (CloudWatch, Datadog, etc)
- [ ] Performance monitoring enabled
- [ ] Database query monitoring active
- [ ] Feature flag changes logged
- [ ] Failed tier checks logged
- [ ] API rate limit violations logged
- [ ] Alerts set up for:
  - [ ] High error rate
  - [ ] Database connection failures
  - [ ] Redis connection failures
  - [ ] Memory usage > 80%

---

## 🧪 Post-Deployment Testing

### Automated Tests
```bash
# Run test suite
npm run test:integration

# Load testing
npm run test:load

# Security scanning
npm run test:security
```

### Manual Verification
1. **Test Free Tier**
   ```bash
   curl -H "Authorization: Bearer <FREE_TOKEN>" \
     https://api.edutech.com/api/ai-chat/send
   # Should return 403 Forbidden
   ```

2. **Test Premium Tier**
   ```bash
   curl -H "Authorization: Bearer <PREMIUM_TOKEN>" \
     https://api.edutech.com/api/ai-chat/send
   # Should return 200 OK
   ```

3. **Test Tier Upgrade**
   - Create free user
   - Verify AI features blocked
   - Upgrade to premium (admin)
   - Verify AI features now work

4. **Test Admin Override**
   - Create feature override for user
   - Verify override applies
   - Test expiration if set

---

## 📝 Documentation Review

- [ ] QUICK_START.md accurate for production
- [ ] API documentation up to date
- [ ] Feature matrix correct (FREE/PREMIUM/ENTERPRISE)
- [ ] Tier descriptions clear to customers
- [ ] Rate limits documented
- [ ] Error codes documented
- [ ] SDK/client library docs complete

---

## 🚀 Rollback Plan

If deployment fails:

1. **Database Issue**
   ```bash
   # Rollback migration
   npx prisma migrate resolve --rolled-back <migration_name>
   npx prisma migrate deploy --skip-seed
   ```

2. **Backend Issue**
   ```bash
   # Restart previous version
   docker restart edutech-backend:previous
   ```

3. **Frontend Issue**
   ```bash
   # Rollback to previous build
   # Revert /dist or point CDN to previous version
   ```

---

## ✅ Final Verification

Before declaring deployment complete:

- [ ] All services healthy
- [ ] User login works
- [ ] Free user blocked from AI features
- [ ] Premium user can use AI features
- [ ] Admin can upgrade users
- [ ] All endpoints responding
- [ ] Error messages helpful
- [ ] No test data in production
- [ ] Monitoring alerting works

---

## 🎯 Success Criteria

- ✅ 99.9% uptime SLA
- ✅ Sub-500ms API response times
- ✅ 0 security vulnerabilities
- ✅ All 3 tiers functioning correctly
- ✅ No feature leaks between tiers
- ✅ Rate limiting working
- ✅ Logs capturing all activity
- ✅ Metrics dashboard populated

---

## 📞 Escalation Contacts

- **Database Issues:** DevOps team
- **API Issues:** Backend team
- **Frontend Issues:** Frontend team
- **Security Issues:** Security team
- **Billing/Tier Issues:** Product team

---

## 📅 Post-Deployment (24-48 hours)

- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Review user feedback
- [ ] Verify billing calculations
- [ ] Confirm feature flags working as intended
- [ ] Check admin dashboard loads
- [ ] Test user support workflows

---

**Deployment Date:** _____________  
**Deployed By:** _____________  
**Approved By:** _____________
