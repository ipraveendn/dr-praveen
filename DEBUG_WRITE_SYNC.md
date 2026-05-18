# CRITICAL DEBUGGING - Write Synchronization Issue

## Problem Diagnosis

**Symptom**: Mark Complete button shows COMPLETED for 1-2 seconds, then reverts to SERVING
**Likely Root Cause**: Backend update not persisting OR automatic refetch overwriting fresh state

---

## Phase 1: Add Comprehensive Debugging

### Backend Debugging (queueController.js)

Add these DEBUG LOGS to verify actual database writes:

```javascript
// BEFORE update - query database to verify current state
const beforeUpdate = await prisma.token.findUnique({
  where: { id: token.id },
});
console.log(`[DEBUG] BEFORE Prisma update - Database state:`, {
  id: beforeUpdate.id,
  tokenNumber: beforeUpdate.tokenNumber,
  status: beforeUpdate.status,
  updatedAt: beforeUpdate.updatedAt,
});

// Perform update
const updated = await prisma.token.update({
  where: { id: token.id },
  data: { status: "COMPLETED" },
  include: { patient: true },
});

// AFTER update - query database again to verify persistence
const afterUpdate = await prisma.token.findUnique({
  where: { id: token.id },
});
console.log(`[DEBUG] AFTER Prisma update - Database state:`, {
  id: afterUpdate.id,
  tokenNumber: afterUpdate.tokenNumber,
  status: afterUpdate.status,
  updatedAt: afterUpdate.updatedAt,
  updatedResponse: updated.status,
});

// Verify they match
if (afterUpdate.status !== "COMPLETED") {
  console.error(
    `[CRITICAL] DATABASE UPDATE FAILED - Status is still: ${afterUpdate.status}`,
  );
  throw new Error(
    `Database update did not persist: expected COMPLETED, got ${afterUpdate.status}`,
  );
}
```

### Frontend Debugging (AdminDashboard.jsx)

Add detailed logging to markDone():

```javascript
async function markDone() {
  console.log("[DEBUG] === MARK DONE START ===");
  console.log("[DEBUG] Current serving patient:", serving);
  console.log("[DEBUG] Current queue state:", queueData);

  if (!serving?.tokenNumber || completeLoading) {
    console.log(
      "[AdminDashboard] Cannot mark done - no serving patient or already in progress",
    );
    return;
  }

  setCompleteLoading(true);
  const servingTokenNumber = serving.tokenNumber;
  console.log(
    "[DEBUG] About to mark token",
    servingTokenNumber,
    "as COMPLETED",
  );

  // Store original state for comparison
  const originalQueueData = queueData;
  console.log(
    "[DEBUG] Original queue before optimistic update:",
    originalQueueData,
  );

  // OPTIMISTIC UPDATE
  setQueueData((prev) => {
    if (!prev) return prev;
    const updated = { ...prev };
    updated.patients = updated.patients.map((p) => {
      if (p.tokenNumber === servingTokenNumber) {
        console.log(
          "[DEBUG] Optimistic: marking token",
          p.tokenNumber,
          "as COMPLETED",
        );
        return { ...p, status: "COMPLETED" };
      }
      return p;
    });
    updated.currentToken = null;
    console.log("[DEBUG] Optimistic update completed, new state:", updated);
    return updated;
  });

  try {
    console.log(
      "[DEBUG] Sending PATCH to /queue/complete/" + servingTokenNumber,
    );
    const response = await apiRequest(`/queue/complete/${servingTokenNumber}`, {
      method: "PATCH",
      body: JSON.stringify({ clinic: clinicId }),
    });

    console.log("[DEBUG] API response received:", response);
    console.log("[DEBUG] response.success:", response?.success);
    console.log("[DEBUG] response.data:", response?.data);
    console.log(
      "[DEBUG] response.data.patients exists:",
      !!response?.data?.patients,
    );
    console.log(
      "[DEBUG] response.data.patients length:",
      response?.data?.patients?.length,
    );

    if (response?.data?.patients) {
      console.log("[DEBUG] USING response data to update state");
      const newQueueData = {
        currentToken: response.data.currentServing || null,
        waiting: response.data.waitingCount || 0,
        estimatedTime: response.data.estimatedTime || "0 mins",
        patients: response.data.patients,
      };
      console.log("[DEBUG] New queue data from response:", newQueueData);
      setQueueData(newQueueData);
      console.log("[DEBUG] State updated successfully");

      // Verify token is actually COMPLETED in response
      const completedToken = response.data.patients.find(
        (p) => p.tokenNumber === servingTokenNumber,
      );
      console.log("[DEBUG] Token in response:", completedToken);
      if (completedToken?.status !== "COMPLETED") {
        console.error(
          "[CRITICAL] Response shows token is NOT COMPLETED:",
          completedToken?.status,
        );
      }
    } else {
      console.error("[ERROR] Response missing patients array!");
      console.error("[ERROR] response structure:", response);
    }
  } catch (error) {
    console.error("[ERROR] Mark done API call failed:", error);
    console.log("[DEBUG] Calling refreshQueue as fallback");
    await refreshQueue(true);
  } finally {
    setCompleteLoading(false);
    console.log("[DEBUG] === MARK DONE END ===");
  }
}
```

---

## Phase 2: Root Cause Investigation

**After adding debug logs, check console for:**

1. ❌ **Is `BEFORE UPDATE` logged?**
   - If NO: Backend is crashing before reaching update
   - If YES: Backend can access token

2. ❌ **Is `AFTER UPDATE` logged?**
   - If NO: Prisma update is hanging or throwing error
   - If YES: Update query executed

3. ❌ **Do BEFORE and AFTER show different status values?**
   - If AFTER still shows SERVING: **DATABASE UPDATE FAILED** ← CRITICAL BUG
   - If AFTER shows COMPLETED: Update worked, issue is elsewhere

4. ❌ **Is response received in frontend?**
   - If NO: Response not reaching frontend (network/auth issue)
   - If YES: Check if patients array exists

5. ❌ **Does response.data.patients contain COMPLETED token?**
   - If NO: Backend returning wrong data
   - If YES: Data is correct, check if state is being overwritten

6. ❌ **After 1-2 seconds, does state revert?**
   - If YES: Something is fetching old data and overwriting state
   - If NO: State persists (database issue only)

---

## Phase 3: Likely Fixes Needed

Based on typical 1-2 second delay pattern:

### Scenario A: Backend Update Not Persisting

**Fix**: Ensure Prisma transaction completes properly

- Add explicit transaction commit
- Add error handling for Supabase write failures
- Add database connection verification

### Scenario B: Frontend State Overwritten by Cache

**Fix**: Ensure cache is properly invalidated

- Verify invalidateCache() is being called
- Add logging to cache operations
- Force fresh data on mutation response

### Scenario C: Automatic Refetch Overwrites State

**Fix**: Prevent automatic refetch after mutation

- Remove any setInterval polling
- Disable automatic refreshQueue calls
- Use AbortController to cancel pending requests

---

## Next Steps

1. **Add all debug logs above**
2. **Click "Mark Complete" and check console**
3. **Look for answers to the 6 questions**
4. **Post the console output**
5. **I'll provide specific fix based on which phase fails**
