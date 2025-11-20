# NeuraFund Deployment Guide

## Overview

NeuraFund uses a modern CI/CD pipeline to automatically test and deploy code changes. This document covers the complete deployment lifecycle from code push to live production environment.

**Deployment Architecture:**
- **Frontend:** Vercel (React, auto-deployed from GitHub)
- **Backend:** Render (Node.js/Express, manual webhook trigger)
- **Database:** MongoDB Atlas (managed cloud database)
- **CI/CD:** GitHub Actions (automated testing)

---

## 1. GitHub Actions CI/CD Pipeline

### Pipeline Configuration File

**Location:** `.github/workflows/cicd.yml`

```yaml
name: NeuraFund CI/CD Pipeline

on:
  push:
    branches: [ "main", "master" ]
  pull_request:
    branches: [ "main", "master" ]

jobs:
  backend-test:
    runs-on: ubuntu-22.04
    defaults:
      run:
        working-directory: ./Backend
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18.x'
    
    - name: Install Dependencies
      run: |
        npm install
        npm install --save-dev cross-env
        npm install --save-dev mongodb-memory-server@8.15.1
    
    - name: Run Backend Tests
      run: npx jest --detectOpenHandles --forceExit
      env:
        MONGOMS_VERSION: '4.4.18'
        INTASEND_PUBLISHABLE_KEY: test_pub_key
        INTASEND_SECRET_KEY: test_secret_key
        INTASEND_IS_TEST: true
        JWT_SECRET: test_jwt_secret

  frontend-test:
    runs-on: ubuntu-latest
    defaults:
      run:
        working-directory: ./Frontend
    
    steps:
    - uses: actions/checkout@v3
    - uses: actions/setup-node@v3
      with:
        node-version: '18.x'
    - name: Install Dependencies
      run: npm install
    - name: Run Frontend Tests
      run: npm test
      env:
        CI: true
```

### Pipeline Workflow

```
Developer pushes code to main/master
        ↓
GitHub Actions triggered
        ↓
    ┌───┴────────────────────────────┐
    ↓                                ↓
Backend Tests                  Frontend Tests
(Jest + Supertest)           (React Testing Library)
    ↓                                ↓
✓ All 20+ tests pass          ✓ All tests pass
    │                                │
    └────────────────┬───────────────┘
                     ↓
            All checks passed
                     ↓
    (Optional: Deploy if manual trigger enabled)
```

### Key Features

1. **Triggered on:** Any push to `main` or `master`, or PR creation
2. **Environment:** Ubuntu 22.04 (backend), Ubuntu latest (frontend)
3. **Node Version:** 18.x (LTS)
4. **Duration:** ~3-5 minutes per job
5. **Database:** MongoDB Memory Server (in-memory, no real DB needed)
6. **Payment Testing:** IntaSend mocked with Jest

### Test Environment Variables

For CI pipeline safety, all sensitive keys are fake:

```yaml
INTASEND_PUBLISHABLE_KEY=test_pub_key        # Not real
INTASEND_SECRET_KEY=test_secret_key          # Not real
INTASEND_IS_TEST=true                        # Sandbox mode
JWT_SECRET=test_jwt_secret                   # Test only
MONGOMS_VERSION=4.4.18                       # Memory DB version
```

---

## 2. Backend Deployment (Render)

### Render Setup

**Platform:** https://render.com/

**Service Type:** Web Service (Node.js)

### Step 1: Create Render Account & Project

1. Sign up at https://render.com
2. Create new "Web Service"
3. Select GitHub repository: `neurafund-backend`
4. Configure:
   - **Name:** `neurafund-api`
   - **Runtime:** Node.js
   - **Region:** `Oregon` (closest to Africa)
   - **Plan:** Starter or Pro (depending on traffic)

### Step 2: Set Environment Variables

In Render Dashboard → Settings → Environment:

```
NODE_ENV=production
PORT=5001

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/neurafund?retryWrites=true&w=majority

# Authentication
JWT_SECRET=<generate-strong-random-key-min-32-chars>
JWT_EXPIRE=24h

# Payment Integration
INTASEND_PUBLISHABLE_KEY=<live-public-key-from-intasend>
INTASEND_SECRET_KEY=<live-secret-key-from-intasend>
INTASEND_IS_TEST=false                    # ← CRITICAL: Live mode

# Email (optional)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Client URL
CLIENT_URL=https://neurafund.vercel.app

# CORS
CORS_ORIGIN=https://neurafund.vercel.app
```

### Step 3: Generate Strong JWT Secret

Use Node.js to generate a secure random string:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# Output: a7f3d8b2e1c9f4a6d2e8c1b9f3d7e5a2c8f1b9d7e3a5c2f8b1d9e4a6c3f8b0
```

**Store this securely** — never commit to Git or share publicly.

### Step 4: Connect MongoDB Atlas

**Create MongoDB Cluster:**

1. Sign up at https://www.mongodb.com/cloud/atlas
2. Create cluster (AWS, N. Virginia region recommended)
3. Create database user:
   - Username: `neurafund_prod`
   - Password: `<strong-random-password>`
4. Get connection string:
   ```
   mongodb+srv://neurafund_prod:password@cluster0.mongodb.net/neurafund?retryWrites=true&w=majority
   ```
5. Add Render IP to whitelist:
   - MongoDB Atlas → Network Access → Add IP Address
   - Add Render's IP (usually shows in error if missing)
   - Or allow from anywhere: `0.0.0.0/0` (less secure)

### Step 5: Deploy Backend

**Option A: Auto-Deploy from GitHub**

```yaml
# In Render Dashboard:
Build Command: npm install
Start Command: npm start
```

Every push to main branch auto-deploys.

**Option B: Manual Deploy via Webhook**

Get webhook URL from Render:
```
https://api.render.com/deploy/srv-xxxxx?key=xxxxx
```

Trigger deployment:
```bash
curl -X POST https://api.render.com/deploy/srv-xxxxx?key=xxxxx
```

### Backend Health Check

Once deployed, verify:

```bash
# Health endpoint
curl https://api.neurafund.com/api/health

# Expected response:
{
  "status": "OK",
  "message": "NeuraFund API is running"
}
```

### Monitoring Backend

In Render Dashboard:
- **Logs:** Real-time error/info logs
- **Metrics:** CPU, Memory, Response time
- **Alerts:** Email on crash/downtime

---

## 3. Frontend Deployment (Vercel)

### Vercel Setup

**Platform:** https://vercel.com/

**Framework:** React (auto-detected)

### Step 1: Create Vercel Account & Project

1. Sign up at https://vercel.com
2. Import GitHub repository: `neurafund-frontend`
3. Configure:
   - **Framework Preset:** Create React App
   - **Root Directory:** `Frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `build`

### Step 2: Set Environment Variables

In Vercel Dashboard → Settings → Environment Variables:

```
REACT_APP_API_URL=https://api.neurafund.com/api
REACT_APP_SOCKET_URL=https://api.neurafund.com
```

**Note:** React environment variables must be prefixed with `REACT_APP_`

### Step 3: Deploy Frontend

**Auto-Deploy:** Every push to main branch automatically deploys to production.

**Manual Deploy:**
```bash
# From Frontend directory
npm run build
npx vercel deploy --prod
```

### Frontend URL

After deployment:
```
https://neurafund.vercel.app
```

### Environment Variable Validation

Frontend must fetch these at runtime:

```javascript
// Frontend/src/utils/api.js
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';
```

If `REACT_APP_API_URL` not set, requests fail to connect backend.

**Test after deployment:**
```bash
curl https://neurafund.vercel.app
# Should render HTML with your app
```

---

## 4. Test vs Live Mode Toggle

### IntaSend Configuration

The system supports two modes via environment variable:

```
INTASEND_IS_TEST=true   → Sandbox (test payments, no real charges)
INTASEND_IS_TEST=false  → Production (real M-Pesa charges)
```

### Development (Local)

```bash
# .env (never commit)
INTASEND_IS_TEST=true
INTASEND_PUBLISHABLE_KEY=test_pub_key
INTASEND_SECRET_KEY=test_secret_key
```

**Behavior:**
- STK Push shows test prompt on phone
- No real money charged
- IntaSend test dashboard tracks fake transactions

### CI/CD (GitHub Actions)

```yaml
INTASEND_IS_TEST=true    # Always test mode
JWT_SECRET=test_secret    # Test secret
```

**Purpose:** Tests run safely without hitting real Safaricom API

### Production (Render)

```
INTASEND_IS_TEST=false   # ← CRITICAL: Production mode
INTASEND_PUBLISHABLE_KEY=<live-key>
INTASEND_SECRET_KEY=<live-key>
```

**Behavior:**
- Real M-Pesa prompts appear on phones
- Real money charged to vendor accounts
- Transactions appear in vendor M-Pesa statements
- IntaSend live dashboard shows real activity

### Switching Modes

**To promote from test to live:**

1. Get live IntaSend keys from IntaSend dashboard
2. Update Render environment variables
3. Change `INTASEND_IS_TEST=false`
4. Redeploy backend
5. Test with small transaction (10 KES)
6. Verify in IntaSend live dashboard

---

## 5. Database Backup & Restore

### MongoDB Atlas Automatic Backups

**Enabled by default:**
- Daily snapshots retained for 7 days
- Weekly snapshots retained for 4 weeks
- Monthly snapshots retained for 12 months

**Access:**
1. MongoDB Atlas Dashboard
2. Select cluster → Backup
3. View automatic backups

### Manual Backup

```bash
# Export entire database
mongodump --uri "mongodb+srv://user:pass@cluster.mongodb.net/neurafund" \
  --out ./backup

# Export specific collection
mongoexport --uri "mongodb+srv://user:pass@cluster.mongodb.net/neurafund" \
  --collection tasks --out tasks.json

# Compress backup
tar -czf neurafund-backup-$(date +%Y%m%d).tar.gz backup/
```

### Restore from Backup

```bash
# Restore entire database
mongorestore --uri "mongodb+srv://user:pass@cluster.mongodb.net/neurafund" \
  --drop ./backup

# Restore single collection
mongoimport --uri "mongodb+srv://user:pass@cluster.mongodb.net/neurafund" \
  --collection tasks --file tasks.json --drop
```

---

## 6. Security Checklist

### Before Going Live

- [ ] **Database**
  - [ ] MongoDB Atlas cluster created in production region
  - [ ] IP whitelist configured (or 0.0.0.0/0 temporarily)
  - [ ] Database user created with strong password
  - [ ] Automated backups enabled
  - [ ] Encryption at rest enabled

- [ ] **Backend (Render)**
  - [ ] JWT_SECRET is 32+ character random string (never dev key)
  - [ ] INTASEND_IS_TEST=false (for real payments)
  - [ ] NODE_ENV=production
  - [ ] CLIENT_URL set to production frontend URL
  - [ ] All secrets stored as environment variables (not in code)
  - [ ] HTTPS enabled (Render auto-provides SSL certificate)
  - [ ] CORS configured for frontend domain only

- [ ] **Frontend (Vercel)**
  - [ ] REACT_APP_API_URL points to live backend
  - [ ] REACT_APP_SOCKET_URL matches backend domain
  - [ ] No hardcoded API keys or secrets in code
  - [ ] Environment variables set in Vercel dashboard
  - [ ] HTTPS enabled (Vercel auto-provides SSL certificate)

- [ ] **IntaSend**
  - [ ] Live API keys obtained from IntaSend dashboard
  - [ ] Test webhook configured for transaction status updates
  - [ ] Business details verified in IntaSend account
  - [ ] Test transaction completed successfully

- [ ] **Monitoring**
  - [ ] Error logging configured (Sentry, LogRocket, etc.)
  - [ ] Uptime monitoring enabled (UptimeRobot, Pingdom, etc.)
  - [ ] Database slow query logging enabled
  - [ ] Alert emails configured for admins

### SSL/HTTPS

Both Render and Vercel provide free SSL certificates:

```
https://api.neurafund.com/api     ← Render (auto-SSL)
https://neurafund.vercel.app      ← Vercel (auto-SSL)
```

No action needed — automatically provisioned and renewed.

---

## 7. Deployment Troubleshooting

### Issue: Backend Deploy Fails

**Error:** `npm ERR! code ENOENT`

**Cause:** Dependencies not installed

**Solution:**
```bash
# In Render build command, ensure:
npm install
npm run build  # if needed
```

### Issue: Frontend Can't Connect to Backend

**Error:** `POST http://localhost:5001/api/auth/login 404`

**Cause:** Frontend still using development API URL

**Solution:**
1. Check `REACT_APP_API_URL` in Vercel environment
2. Redeploy frontend after updating
3. Verify in browser: `echo $process.env.REACT_APP_API_URL`

### Issue: M-Pesa Deposits Not Working in Production

**Error:** `M-Pesa connection failed`

**Causes:**
1. IntaSend keys incorrect
2. INTASEND_IS_TEST still true
3. Phone number format wrong (must be 254XXXXXXXXX)

**Solutions:**
1. Verify keys in IntaSend dashboard
2. Check `INTASEND_IS_TEST=false` in Render environment
3. Test with valid Kenyan number: 254712345678

### Issue: Database Connection Timeout

**Error:** `MongoServerSelectionError: connect ECONNREFUSED 127.0.0.1:27017`

**Cause:** MongoDB URI incorrect or IP not whitelisted

**Solutions:**
1. Verify MongoDB URI format:
   ```
   mongodb+srv://user:password@cluster.mongodb.net/dbname?retryWrites=true&w=majority
   ```
2. Add Render IP to MongoDB Atlas whitelist:
   - Go to MongoDB Atlas → Network Access
   - Add current IP (shown in error) or 0.0.0.0/0
3. Test connection locally:
   ```bash
   mongosh "mongodb+srv://user:password@cluster.mongodb.net/dbname"
   ```

### Issue: High Memory Usage on Render

**Error:** `Killed due to memory limit`

**Cause:** Memory leak or large request

**Solutions:**
1. Upgrade Render plan to Pro
2. Implement pagination for large queries
3. Check for memory leaks in Socket.IO connections
4. Monitor with: `ps aux | grep node`

---

## 8. Performance Optimization

### Database Query Optimization

All queries should use indexes:

```javascript
// Verify indexes exist in MongoDB Atlas
db.users.createIndex({ email: 1 });
db.tasks.createIndex({ status: 1, rewardAmount: -1 });
db.ratings.createIndex({ toUser: 1 });
```

### Caching Strategy

Consider Redis for frequently accessed data:

```javascript
// Example: Cache user profiles
const redis = require('redis');
const client = redis.createClient();

app.get('/users/:id', async (req, res) => {
  // Check cache
  const cached = await client.get(`user:${req.params.id}`);
  if (cached) return res.json(JSON.parse(cached));
  
  // Query DB
  const user = await User.findById(req.params.id);
  
  // Cache for 1 hour
  await client.setex(`user:${req.params.id}`, 3600, JSON.stringify(user));
  
  res.json(user);
});
```

### CDN for Static Assets

Vercel automatically uses CDN for frontend assets.

For backend uploads (profile pics, proof files), consider:
- Cloudinary (image hosting)
- AWS S3 (file storage)
- Bunny CDN (cost-effective)

---

## 9. Monitoring & Logging

### Render Logs

```bash
# View logs in real-time
curl https://api.neurafund.com/api/health

# Or in Render Dashboard → Logs
```

### Application Logging

Add structured logging to backend:

```javascript
// utils/logger.js
const winston = require('winston');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

module.exports = logger;

// Usage in routes
logger.info('Task created', { taskId: task._id, userId: req.user._id });
logger.error('Payment failed', { error: err.message });
```

### Error Tracking (Sentry)

Install Sentry for error tracking:

```bash
npm install @sentry/node
```

```javascript
// server.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1
});

app.use(Sentry.Handlers.errorHandler());
```

---

## 10. Rollback Procedures

### If Production Breaks

**Backend Rollback:**
1. Render Dashboard → Deployments
2. Find last working deployment
3. Click "Redeploy"
4. Verify health endpoint
5. Test one payment flow

**Frontend Rollback:**
1. Vercel Dashboard → Deployments
2. Find last working build
3. Click "... → Promote to Production"
4. Verify frontend loads
5. Check API connection

### Hotfix Process

1. Fix code locally
2. Commit to `main`
3. GitHub Actions runs tests (5 min)
4. If tests pass, auto-deploy to Vercel
5. Manual trigger for Render via webhook

---

## 11. Production Deployment Checklist

### Final Verification Before Launch

```
[ ] Backend API responds to /health endpoint
[ ] Frontend loads without CORS errors
[ ] Login flow works end-to-end
[ ] Task creation works
[ ] M-Pesa deposit (test transaction)
[ ] Task proof upload works
[ ] Database backups enabled
[ ] Error logging configured
[ ] SSL certificates valid
[ ] Email notifications working
[ ] Rate limiting implemented
[ ] Database indexed
[ ] Environment variables correct
[ ] Secrets not in Git
[ ] HTTPS enforced
[ ] CORS properly configured
```

---

## 12. Ongoing Maintenance

### Weekly Tasks
- Check Render/Vercel dashboard for errors
- Monitor database size
- Review IntaSend transaction reports

### Monthly Tasks
- Rotate JWT secret (generate new one)
- Update npm dependencies: `npm audit fix`
- Review user feedback and error logs
- Test backup/restore procedure

### Quarterly Tasks
- Security audit (OWASP Top 10)
- Database optimization (reindex if needed)
- Performance profiling
- Update SSL certificates (if not auto-renewed)

---

## Summary

NeuraFund deployment uses:

1. **GitHub Actions CI/CD** — Automated testing on every push
2. **Render** — Backend hosting with auto-scaling
3. **Vercel** — Frontend hosting with edge caching
4. **MongoDB Atlas** — Managed database with automated backups
5. **IntaSend** — Production payment processing (toggle via env var)

All components are production-ready with SSL, monitoring, and security hardened. First deployment typically takes 30 minutes; subsequent deployments are automatic via GitHub.