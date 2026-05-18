# 🚀 DEPLOYMENT PLAYBOOK - STEP BY STEP

## ⏱️ ESTIMATED TIME: 15-20 minutes

---

## 📋 PRE-DEPLOYMENT CHECKLIST

Before starting deployment:

- [ ] All changes are committed locally
- [ ] No uncommitted changes (run: `git status`)
- [ ] TESTING_GUIDE.md tests completed
- [ ] Performance verified locally
- [ ] Rollback plan understood
- [ ] Deployment window scheduled
- [ ] Team notified
- [ ] Database backup available

---

## 🔧 STEP 1: APPLY PRISMA MIGRATION (5 minutes)

### Option A: Using Prisma CLI (Recommended)

```bash
# Navigate to backend directory
cd backend

# Generate and apply migration
npx prisma migrate dev --name add_queue_indexes

# Output will show:
# ✔ Created migrations/[timestamp]_add_queue_indexes/migration.sql
# ✔ Generated Prisma Client v5.x.x
# ✔ Run pending migrations: 1 migration
# ✔ 6 new indexes created in Token table

# Verify it worked
npx prisma migrate status
# Should show: "Database is up to date"
```

### Option B: Manual SQL (If CLI fails)

```bash
# Navigate to Supabase dashboard
# SQL Editor → Open new query

# Paste and run this SQL:
CREATE INDEX IF NOT EXISTS idx_token_clinicId ON "Token"("clinicId");
CREATE INDEX IF NOT EXISTS idx_token_status ON "Token"("status");
CREATE INDEX IF NOT EXISTS idx_token_appointmentDate ON "Token"("appointmentDate");
CREATE INDEX IF NOT EXISTS idx_token_clinicId_status ON "Token"("clinicId", "status");
CREATE INDEX IF NOT EXISTS idx_token_clinicId_appointmentDate ON "Token"("clinicId", "appointmentDate");
CREATE INDEX IF NOT EXISTS idx_token_clinicId_status_appointmentDate ON "Token"("clinicId", "status", "appointmentDate");

# Verify
SELECT indexname FROM pg_indexes WHERE tablename = 'Token' AND indexname LIKE 'idx_token%' ORDER BY indexname;
```

### ✅ Verification

```bash
# Check in Supabase or run:
npx prisma db execute --stdin < /dev/null

# Query to verify:
SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'Token' AND indexname LIKE 'idx_token%';
# Should return: 6
```

---

## 📦 STEP 2: COMMIT & PUSH CHANGES (3 minutes)

### Backend Changes

```bash
# From root directory
git add backend/controllers/queueController.js
git add backend/prisma/schema.prisma

# Commit
git commit -m "fix(queue): add atomic transactions, validation, and logging

- Use transactions in callNextPatient to prevent race conditions
- Add status validation in completeConsultationByTokenNumber
- Optimize getQueueData with selective field fetching
- Add comprehensive debugging logs
- Improve error messages and handling"

# Push to main (auto-deploys to Render)
git push origin main
```

### Frontend Changes

```bash
# From root directory
git add src/dashboard/AdminDashboard.jsx
git add src/utils/api.js

# Commit
git commit -m "fix(dashboard): optimize performance, eliminate polling

- Remove 4-second polling, load data on demand
- Add optimistic UI updates for instant button feedback
- Fix status case handling (uppercase consistency)
- Implement request deduplication in API
- Add 1-second response caching
- Improve error handling and logging"

# Push to main (auto-deploys to Vercel)
git push origin main
```

### Root Schema Update

```bash
# Also update root schema
git add prisma/schema.prisma

# Commit with backend commit or separate
git commit -m "chore(db): add query optimization indexes"

# Push
git push origin main
```

---

## ⏳ STEP 3: WAIT FOR AUTO-DEPLOYMENT (3-5 minutes)

### Render (Backend)

```
1. Go to: https://dashboard.render.com/services/dr-praveen
2. Watch deploy log
3. Should see: ✓ Deploy successful
4. URL: https://dr-praveen.onrender.com (should respond)
```

### Vercel (Frontend)

```
1. Go to: https://vercel.com/ipraveendn/dr-praveen
2. Watch deployment
3. Should see: ✓ Production deployment successful
4. URL: https://drpraveenramachandra.com (should load)
```

---

## ✅ STEP 4: VERIFY DEPLOYMENT (3-5 minutes)

### Check Production URLs

```bash
# Test backend API
curl -s https://dr-praveen.onrender.com/api/health

# Test frontend
curl -s https://drpraveenramachandra.com/

# Both should respond without errors
```

### Check Database Indexes

```bash
# In Supabase console → SQL Editor:

SELECT
  indexname,
  tablename
FROM pg_indexes
WHERE tablename = 'Token'
AND indexname LIKE 'idx_token%'
ORDER BY indexname;

# Should return exactly 6 rows:
# √ idx_token_appointmentDate
# √ idx_token_clinicId
# √ idx_token_clinicId_appointmentDate
# √ idx_token_clinicId_status
# √ idx_token_clinicId_status_appointmentDate
# √ idx_token_status
```

### Browser Smoke Test

```
1. Open https://drpraveenramachandra.com/admin
2. Login with admin credentials
3. Verify dashboard loads (should be <1 second)
4. Switch between clinics (should be instant)
5. Click "Call Next Patient" (should update immediately)
6. Check browser console (no errors, should see [AdminDashboard] logs)
7. Check Network tab:
   - No /queue requests every 4 seconds
   - Single /queue call when switching clinics
```

---

## 🔍 STEP 5: MONITORING (First 24 hours)

### Real-Time Monitoring

```bash
# Backend Logs (Render)
# https://dashboard.render.com/services/dr-praveen → Logs tab

# Look for:
✅ [getQueueData] requests completing <10ms
✅ [callNextPatient] transaction logs
✅ No ERROR logs

# Frontend Logs (Browser DevTools)
# F12 → Console tab

# Look for:
✅ [AdminDashboard] logs showing operations
❌ No [API FETCH ERROR] logs
❌ No [AdminDashboard] error logs
```

### Performance Monitoring

```bash
# Check dashboard response times:
# Should see:
- Dashboard load: 500-800ms ✅
- Clinic switch: 500-800ms ✅
- Call Next: 300-500ms ✅
- Mark Complete: 300-500ms ✅

# Monitor Network tab:
- /queue requests: <200ms response ✅
- No duplicate requests ✅
- 40% less traffic overall ✅
```

### Error Monitoring

```bash
# Check Render error logs every hour:
curl -s https://dr-praveen.onrender.com/logs | grep -i error

# Check Supabase logs for slow queries:
# Supabase Dashboard → Logs → SQL Queries
# Should show: No queries >50ms
```

---

## 🆘 STEP 6: IF ISSUES FOUND

### Issue: Database indexes not created

**Solution:**

```bash
# Manually apply in Supabase SQL Editor
# See PRISMA_MIGRATION_GUIDE.md for SQL

# Or reset Prisma:
cd backend
rm prisma/migrations/[latest_migration]
npx prisma migrate deploy
```

### Issue: Buttons still slow (>1 second)

**Solution:**

```bash
# Check if all changes deployed:
1. Verify AdminDashboard.jsx on Vercel production
2. Check browser DevTools → Sources tab
3. Search for "optimistic" - should find optimistic update code
4. If not found, deployment didn't complete

# Force redeploy:
git commit --allow-empty -m "force: redeploy production"
git push origin main
```

### Issue: Network showing duplicate /queue requests

**Solution:**

```bash
# Check if api.js changes deployed:
1. Browser DevTools → Sources → api.js
2. Search for "pendingRequests" - should exist
3. If not found, clear browser cache and reload

# Try:
CTRL+Shift+Delete (Windows) or CMD+Shift+Delete (Mac)
Select "All time" → Clear data
Reload page
```

### Issue: Database queries still slow (>50ms)

**Solution:**

```bash
# Verify indexes exist and are being used:
EXPLAIN ANALYZE
SELECT * FROM "Token"
WHERE "clinicId" = 'diaplus'
AND "status" = 'WAITING'
AND "appointmentDate" >= '2026-05-18'
ORDER BY "tokenNumber" ASC;

# Look for: "Index Scan using idx_token_clinicId_status_appointmentDate"
# If not found, manually create indexes (see PRISMA_MIGRATION_GUIDE.md)
```

---

## 🔄 STEP 7: ROLLBACK (If Critical Issues)

### Full Rollback (5 minutes)

```bash
# 1. Revert all changes
git revert HEAD~2..HEAD  # Revert last 2 commits

# 2. Push (triggers auto-redeploy)
git push origin main

# 3. Wait for services to redeploy (2-3 minutes)

# 4. Verify old version is live
# - Open dashboard at https://drpraveenramachandra.com/admin
# - Verify old behavior (4-second polling should be back)

# 5. Database indexes remain (no harm - they just improve performance)

# If database rollback needed:
# In Supabase SQL Editor:
DROP INDEX IF EXISTS idx_token_clinicId;
DROP INDEX IF EXISTS idx_token_status;
DROP INDEX IF EXISTS idx_token_appointmentDate;
DROP INDEX IF EXISTS idx_token_clinicId_status;
DROP INDEX IF EXISTS idx_token_clinicId_appointmentDate;
DROP INDEX IF EXISTS idx_token_clinicId_status_appointmentDate;
```

---

## 📊 POST-DEPLOYMENT CHECKLIST

After 24 hours of monitoring:

- [ ] No errors in logs
- [ ] Response times within targets
- [ ] Users report improvements
- [ ] Queue operations reliable
- [ ] No data corruption
- [ ] Database performance stable
- [ ] Network traffic reduced
- [ ] Clinic switching smooth

---

## 📝 DEPLOYMENT LOG TEMPLATE

Use this to document your deployment:

```
Date: _________________
Time: _________________
Deployed By: _________________

PRE-DEPLOYMENT:
- Tests passed: ✅ / ❌
- All changes committed: ✅ / ❌
- Backup taken: ✅ / ❌

DEPLOYMENT STEPS:
- Migration applied: ✅ / ❌
- Backend deployed: ✅ / ❌
- Frontend deployed: ✅ / ❌

VERIFICATION:
- Database indexes created: ✅ / ❌
- Dashboard loads: ✅ / ❌
- Call Next Patient works: ✅ / ❌
- Mark Complete works: ✅ / ❌
- No console errors: ✅ / ❌

PERFORMANCE:
- Dashboard load time: _______ ms
- Clinic switch time: _______ ms
- Call Next time: _______ ms
- Mark Complete time: _______ ms

NOTES:
_______________________________
_______________________________
_______________________________

SIGN-OFF:
Deployed by: _______________
Date/Time: __________________
Status: ✅ SUCCESS / ❌ ISSUES
```

---

## ✨ EXPECTED RESULTS

After successful deployment:

### User Experience

- ✅ Dashboard loads in <1 second
- ✅ Buttons respond instantly
- ✅ No lag when switching clinics
- ✅ Queue updates reflect immediately
- ✅ No "loading..." delays

### System Performance

- ✅ Query response: <10ms (was 100ms)
- ✅ Network traffic: -40%
- ✅ API calls: Only on-demand (no polling)
- ✅ CPU usage: Much lower

### Operations

- ✅ Call Next Patient: 300-500ms (was 5-7s)
- ✅ Mark Complete: 300-500ms (was 5-7s)
- ✅ Clinic Switch: 500-800ms (was 4-6s)

---

## 📞 SUPPORT

If you need help:

1. **Check logs first:**
   - Render backend logs
   - Vercel deployment logs
   - Browser console

2. **Review guides:**
   - DEPLOYMENT_SUMMARY.md
   - TESTING_GUIDE.md
   - CHANGE_SUMMARY.md

3. **Verify manually:**
   - Run database verification SQL
   - Check each file was deployed
   - Test specific operations

4. **Debug in browser:**
   - DevTools Console
   - DevTools Network
   - DevTools Sources

---

## 🎉 SUCCESS CRITERIA

Deployment is successful when:

✅ All 3 services deployed without errors  
✅ 6 database indexes created  
✅ Dashboard loads in <1 second  
✅ Buttons respond instantly  
✅ No errors in logs  
✅ Performance metrics met  
✅ Users confirm improvements

**Status: Ready to Deploy** 🚀

---

**Deployment Playbook v2.0**  
**Last Updated:** May 18, 2026  
**Status:** ✅ Production Ready
