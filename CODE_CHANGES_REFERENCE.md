# Code Changes - Write Synchronization Fix

## Quick Reference - Exact Changes Made

---

## 1️⃣ Backend: `backend/controllers/queueController.js`

### Function: `callNextPatient()` (Lines 238-310)

**KEY CHANGES**:

- ✅ Added: `include: { patient: true }` to find operations for logging
- ✅ Added: Logs showing BEFORE/AFTER status for both tokens
- ✅ CRITICAL: Added step 4 to fetch complete queue state
- ✅ CRITICAL: Return full patients array in response

**Response Changed From**:

```javascript
{
  success: true,
  message: `Calling next patient, Token #${updated.tokenNumber}.`,
  nextTokenNumber: updated.tokenNumber,
  patient: updated.patient.name
}
```

**Response Changed To**:

```javascript
{
  success: true,
  message: `Calling next patient, Token #${updated.tokenNumber}.`,
  data: {
    previousCompleted: previousTokenNumber,
    nextServing: updated.tokenNumber,
    queueUpdated: true,
    patients: allTokens.map(t => ({
      tokenNumber: t.tokenNumber,
      name: t.patient.name,
      status: t.status,
      phone: t.patient.phone
    }))
  }
}
```

**New Logging**:

```javascript
console.log(
  `[callNextPatient] TX STEP 2: BEFORE UPDATE - Token #${currentServing.tokenNumber} status: ${currentServing.status}`,
);
console.log(
  `[callNextPatient] TX STEP 2: AFTER UPDATE - Token #${updated.tokenNumber} status: ${updated.status}`,
);
console.log(
  `[callNextPatient] TX: Queue snapshot:`,
  allTokens.map((t) => ({ tokenNumber: t.tokenNumber, status: t.status })),
);
```

---

### Function: `completeConsultationByTokenNumber()` (Lines 336-413)

**KEY CHANGES**:

- ✅ Added: Logs showing BEFORE/AFTER status
- ✅ CRITICAL: After update, fetch complete queue state
- ✅ CRITICAL: Return full patients array in response

**Response Changed From**:

```javascript
{
  success: true,
  message: `Token #${tokenNumber} marked as complete.`,
  data: {
    tokenNumber: updated.tokenNumber,
    patient: updated.patient.name,
    status: updated.status
  }
}
```

**Response Changed To**:

```javascript
{
  success: true,
  message: `Token #${tokenNumber} marked as complete.`,
  data: {
    tokenUpdated: tokenNumber,
    completedStatus: 'COMPLETED',
    queueUpdated: true,
    currentServing: servingToken?.tokenNumber || null,
    waitingCount: waitingTokens.length,
    patients: allTokens.map(t => ({
      tokenNumber: t.tokenNumber,
      name: t.patient.name,
      status: t.status,
      phone: t.patient.phone
    }))
  }
}
```

**New Code**:

```javascript
// Fetch complete queue state (NEW)
const allTokens = await prisma.token.findMany({
  where: {
    clinicId: token.clinicId,
    appointmentDate: { gte: todayStart, lte: todayEnd },
  },
  orderBy: { tokenNumber: "asc" },
  include: { patient: true },
});

const servingToken = allTokens.find((t) => t.status === "SERVING");
const waitingTokens = allTokens.filter((t) => t.status === "WAITING");
```

---

### Function: `addToken()` (Lines 29-88)

**KEY CHANGES**:

- ✅ CRITICAL: After token creation, fetch complete queue state
- ✅ CRITICAL: Return full patients array in response

**Response Changed From**:

```javascript
return res.status(201).json({
  success: true,
  data: { tokenNumber: nextTokenNumber, patient: name, clinic },
  message: "Token created successfully.",
});
```

**Response Changed To**:

```javascript
return res.status(201).json({
  success: true,
  data: {
    tokenNumber: nextTokenNumber,
    patient: name,
    clinic,
    queueUpdated: true,
    currentServing: servingToken?.tokenNumber || null,
    waitingCount: allWaiting.length,
    patients: allTokens.map((t) => ({
      tokenNumber: t.tokenNumber,
      name: t.patient.name,
      status: t.status,
      phone: t.patient.phone,
      reason: t.reasonForVisit,
    })),
  },
  message: "Token created successfully.",
});
```

**New Code**:

```javascript
// Fetch complete queue state after creation (NEW)
const allTokens = await prisma.token.findMany({
  where: {
    clinicId: clinicRecord.id,
    appointmentDate: { gte: todayStart, lte: todayEnd },
  },
  orderBy: { tokenNumber: "asc" },
  include: { patient: true },
});

const servingToken = allTokens.find((t) => t.status === "SERVING");
const allWaiting = allTokens.filter((t) => t.status === "WAITING");
```

---

## 2️⃣ Frontend: `src/dashboard/AdminDashboard.jsx`

### Function: `callNext()` (Lines 93-137)

**KEY CHANGES**:

- ✅ CRITICAL: Use response.data.patients directly
- ✅ REMOVED: The separate `refreshQueue(true)` call
- ✅ Added: Logic to parse response and update state

**OLD CODE**:

```javascript
try {
  console.log('[AdminDashboard] Sending callNext request to backend')
  await apiRequest('/queue/next', {
    method: 'POST',
    body: JSON.stringify({ clinic: clinicId })
  })
  console.log('[AdminDashboard] CallNext succeeded')
  // After backend confirms, fetch fresh data (but UI already updated)
  await new Promise(resolve => setTimeout(resolve, 300))
  await refreshQueue(true)  // ❌ REMOVED: Separate fetch could get stale cache
} catch (error) {
  ...
  await refreshQueue(true)
}
```

**NEW CODE**:

```javascript
try {
  console.log('[AdminDashboard] Sending callNext request to backend')
  const response = await apiRequest('/queue/next', {
    method: 'POST',
    body: JSON.stringify({ clinic: clinicId })
  })
  console.log('[AdminDashboard] CallNext succeeded, response:', response)

  // ✅ NEW: Use backend response data directly
  if (response?.data?.patients) {
    console.log('[AdminDashboard] Updating queue from backend response with', response.data.patients.length, 'patients')
    setQueueData({
      currentToken: response.data.nextServing || null,
      waiting: response.data.patients.filter(p => p.status === 'WAITING').length,
      estimatedTime: response.data.estimatedTime || '0 mins',
      patients: response.data.patients
    })
  }
} catch (error) {
  ...
  await refreshQueue(true)  // Fallback only on error
}
```

---

### Function: `markDone()` (Lines 139-181)

**KEY CHANGES**:

- ✅ CRITICAL: Use response.data.patients directly
- ✅ REMOVED: The separate `refreshQueue(true)` call
- ✅ Added: Logic to parse response and update state

**OLD CODE**:

```javascript
try {
  console.log('[AdminDashboard] Sending complete request for token:', servingTokenNumber)
  await apiRequest(`/queue/complete/${servingTokenNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ clinic: clinicId })
  })
  console.log('[AdminDashboard] MarkDone succeeded')
  // After backend confirms, fetch fresh data
  await new Promise(resolve => setTimeout(resolve, 300))
  await refreshQueue(true)  // ❌ REMOVED: Separate fetch could get stale cache
} catch (error) {
  ...
  await refreshQueue(true)
}
```

**NEW CODE**:

```javascript
try {
  console.log('[AdminDashboard] Sending complete request for token:', servingTokenNumber)
  const response = await apiRequest(`/queue/complete/${servingTokenNumber}`, {
    method: 'PATCH',
    body: JSON.stringify({ clinic: clinicId })
  })
  console.log('[AdminDashboard] MarkDone succeeded, response:', response)

  // ✅ NEW: Use backend response data directly
  if (response?.data?.patients) {
    console.log('[AdminDashboard] Updating queue from backend response with', response.data.patients.length, 'patients')
    setQueueData({
      currentToken: response.data.currentServing || null,
      waiting: response.data.waitingCount || 0,
      estimatedTime: response.data.estimatedTime || '0 mins',
      patients: response.data.patients
    })
  }
} catch (error) {
  ...
  await refreshQueue(true)  // Fallback only on error
}
```

---

### Function: `addPatient()` (Lines 84-103)

**KEY CHANGES**:

- ✅ Added: Logic to use response data if available
- ✅ Updated: Fallback to refreshQueue only if response incomplete

**OLD CODE**:

```javascript
try {
  console.log('[AdminDashboard] Adding patient:', form)
  await apiRequest('/queue/add', {
    method: 'POST',
    body: JSON.stringify({ ... })
  })
  // Refresh queue after adding
  await refreshQueue(true)
  console.log('[AdminDashboard] Patient added successfully')
} catch (error) {
  ...
}
```

**NEW CODE**:

```javascript
try {
  console.log('[AdminDashboard] Adding patient:', form)
  const response = await apiRequest('/queue/add', {
    method: 'POST',
    body: JSON.stringify({ ... })
  })
  console.log('[AdminDashboard] Patient added successfully, response:', response)

  // ✅ NEW: Use response data if available
  if (response?.data?.patients) {
    console.log('[AdminDashboard] Updating queue from add response')
    setQueueData({
      currentToken: response.data.currentToken || queueData?.currentToken,
      waiting: response.data.patients.filter(p => p.status === 'WAITING').length,
      estimatedTime: response.data.estimatedTime || '0 mins',
      patients: response.data.patients
    })
  } else {
    // Fallback: refresh queue if response doesn't have patients
    await refreshQueue(true)
  }
} catch (error) {
  ...
}
```

---

## 3️⃣ Frontend: `src/utils/api.js`

### New Function: `invalidateCache()`

**ADDED BEFORE LINE 36**:

```javascript
/**
 * Invalidate cache for a specific endpoint
 */
function invalidateCache(url) {
  // Invalidate exact match and variations
  for (const [key] of requestCache) {
    if (key.includes(url)) {
      console.log(`[apiFetch] Invalidating cache for ${key}`);
      requestCache.delete(key);
    }
  }
}
```

---

### Modified Function: `apiFetch()` - Added Cache Invalidation

**ADDED AFTER response is received (around line 98)**:

```javascript
// CRITICAL: Invalidate cache after successful mutations on queue endpoints
if (
  response.ok &&
  (method === "POST" || method === "PATCH") &&
  url.includes("/queue")
) {
  console.log(
    `[apiFetch] Mutation detected on ${url}, invalidating queue cache`,
  );
  invalidateCache("/queue");
}
```

**Where to add**: Right after `console.log(\`[apiFetch] Response received. Status: ${response.status}\`)` and before the GET response caching block.

---

## 📊 Summary of Changes

| File               | Change                  | Impact                       |
| ------------------ | ----------------------- | ---------------------------- |
| queueController.js | Return full queue state | Frontend has all data needed |
| AdminDashboard.jsx | Use response directly   | Eliminates separate fetch    |
| api.js             | Invalidate cache        | No stale data                |

**Result**: Complete write persistence fix ✅

---

## 🧪 Testing the Changes

### Before Deployment: Local Testing

1. Start backend: `node backend/server.js`
2. Start frontend: `npm run dev`
3. Test each function: Call Next, Mark Complete, Add Patient
4. Check browser console for logs
5. Verify response structure

### After Deployment: Production Testing

1. Test all three operations
2. Verify logs in production
3. Check database with browser reload
4. Monitor error rates (should be 0)

---

## 🔄 How It Works Now

**Old Flow** (Problematic):

```
Frontend Mutation → Optimistic Update → Backend Update →
Backend Response (incomplete) → Frontend RefreshQueue →
Stale Cache Hit → UI Reverts ❌
```

**New Flow** (Fixed):

```
Frontend Mutation → Optimistic Update → Backend Update →
Backend Response (complete queue) → Cache Invalidated →
Frontend Uses Response Data → UI Persists ✅
```

---

## ✅ Verification After Each Change

After making each change, verify:

1. No syntax errors (`npm run build`)
2. Console shows no warnings/errors
3. API responses match expected structure
4. Logs appear in expected order
5. Tests pass (see DEPLOYMENT_CHECKLIST.md)
