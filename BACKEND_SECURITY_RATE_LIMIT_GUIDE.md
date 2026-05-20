# Backend Security - Rate Limit Analysis & Tuning Guide

## Rate Limit Design Philosophy

The rate limits are set to **block attacks while allowing normal usage**. This document explains each limit and how to adjust if needed.

---

## 1. Global Rate Limiter

### Configuration
```javascript
const globalLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 100,                  // 100 requests
  skip: (req) => req.path === '/api/health' || req.path === '/api'
})
```

### Capacity
- **100 requests / 1 minute**
- **~1.67 requests/second**

### Usage by Operation
| Operation | Requests | Frequency | Total/Minute |
|-----------|----------|-----------|--------------|
| Load dashboard | 1 GET | Initial | 1 |
| Refresh queue | 1 GET | Every 2-5 sec | 12-30 |
| Add token | 1 POST | Per patient | 5-10 |
| Call next | 1 POST | Per action | 5-10 |
| Mark complete | 1 PATCH | Per action | 5-10 |

**Typical receptionist: 40-60 requests/minute** ✅ (well under 100)

### Attack Scenario
**Bot sending 500 requests/minute**
- Blocks after 100 ✅
- Remaining 400 rejected with 429
- **Attack prevented**

### Tuning
```javascript
max: 100  // Increase this if you need higher throughput
```

**When to increase:**
- Heavy concurrent usage (multiple receptionists)
- Automated integrations with external systems
- API clients polling frequently

**Recommended:** 100-200 for most deployments

---

## 2. Auth Rate Limiter (Login)

### Configuration
```javascript
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 5,                     // 5 attempts
  skipSuccessfulRequests: true
})
```

### Capacity
- **5 failed login attempts / 15 minutes**
- **Only counts failures** (successful logins don't count)

### Usage by User Type

#### Normal Doctor/Receptionist
- Logs in once per shift
- **0 failures**
- **No impact** ✅

#### User who Forgot Password
- Tries 3 times, then resets password
- **3 failures → Blocked for 15 minutes**
- **User can reset password** ✅

#### Attacker Brute Force
- Tries 100 passwords in 1 second
- **Blocked after 5 attempts** ✅
- **Remaining 95 rejected**
- **Attack prevented**

### Attack Math
```
Without rate limit:
- 100 passwords/second × 60 seconds × 60 minutes
= 360,000 attempts/hour possible

With rate limit:
- 5 attempts / 15 minutes
= 20 attempts/hour possible
= 18,000x slower ✅
```

### Tuning
```javascript
max: 5  // Increase if you get legitimate user complaints
```

**When to increase:**
- Users frequently mistype passwords
- System experiencing temporary issues

**When to decrease:**
- Extra security needed
- Suspicious login attempts detected

**Recommended:** 5-10 for standard deployment

---

## 3. Queue Operations Rate Limiter

### Configuration
```javascript
const queueLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 30,                   // 30 requests
  skip: (req) => req.method === 'GET'
})
```

### Capacity
- **30 write operations (POST/PATCH) / 1 minute**
- **GET requests ignored** (unlimited read access)

### Usage by Operation
| Operation | Method | /Minute | /Hour | /8-Hour Shift |
|-----------|--------|---------|-------|---------------|
| Add token | POST | 5-10 | 40-80 | 320-640 |
| Call next | POST | 5-10 | 40-80 | 320-640 |
| Mark complete | PATCH | 5-10 | 40-80 | 320-640 |
| **Typical shift total** | POST/PATCH | 15-30 | 120-240 | 960-1920 |

**Limit: 30/minute** = **1,800/hour** ✅
**Actual usage: ~150-250/hour** ✅✅
**Utilization: <14%** - Massive safety margin!

### Attack Scenarios

#### DoS: Flood with Add Tokens
```
Attacker sends 100 POST /api/queue/add per second
- Rate limit blocks after 30 per minute
- Attack rejected ✅
```

#### Data Manipulation: Rapid Complete Operations
```
Attacker sends 100 PATCH /api/queue/complete per second
- Rate limit blocks after 30 per minute
- Attack rejected ✅
```

#### Read Attack: Excessive Gets
```
Attacker fetches queue 1000 times per minute
- Gets are skipped (not rate limited)
- Server can handle read load
- No problem ✅
```

### Tuning
```javascript
max: 30  // Adjust this based on your usage
```

**When to increase:**
- Multiple concurrent receptionists
- Heavy token additions (events, campaigns)
- Bulk operations needed

**When to decrease:**
- Extra security needed
- Too many errors from legitimate users

**Recommended:**
- Light usage (1-2 receptionists): 30
- Medium usage (3-5 receptionists): 50
- Heavy usage (6+ receptionists): 100

---

## 4. Payment Operations Rate Limiter

### Configuration
```javascript
const paymentLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minute
  max: 10,                   // 10 requests
})
```

### Capacity
- **10 payment operations / 1 minute**

### Usage by Operation
| Scenario | Operations | Time | Total/Minute |
|----------|-----------|------|--------------|
| Single payment | 1 | < 5 sec | 1 |
| Multiple payments | 5 | 5 min | 1 |
| Refund | 1 | 10 sec | 1 |

**Typical usage: 1-5 payments/minute** ✅ (well under 10)

### Attack Scenarios

#### Fraud: Credit Card Testing
```
Attacker tests 100 stolen cards in 1 minute
- Rate limit blocks after 10 attempts
- Remaining 90 rejected ✅
- Only 10 charges, not 100
```

#### Refund Abuse
```
Attacker tries to refund same transaction 100 times
- Blocked after 10 attempts ✅
- System protected
```

### Tuning
```javascript
max: 10  // Adjust based on payment volume
```

**When to increase:**
- Bulk payments needed
- High-volume processing

**When to decrease:**
- Extra fraud protection needed

**Recommended:** 10-20 for standard usage

---

## Rate Limit Header Monitoring

### Response Headers Sent
```
RateLimit-Limit: 30
RateLimit-Remaining: 28
RateLimit-Reset: 1716223456
```

### What They Mean
- **RateLimit-Limit**: Max requests allowed in window
- **RateLimit-Remaining**: How many you have left
- **RateLimit-Reset**: Unix timestamp when counter resets

### Monitoring in Browser
1. Open DevTools → Network tab
2. Make a request
3. Click response headers
4. Look for `RateLimit-*` headers
5. Watch remaining count down

### Monitoring Example
```
Request 1: RateLimit-Remaining: 29
Request 2: RateLimit-Remaining: 28
...
Request 30: RateLimit-Remaining: 0
Request 31: Status 429 (Too Many Requests)
```

---

## 429 Error Handling

### What It Is
```json
{
  "success": false,
  "message": "Too many requests, please try again later"
}
```

**HTTP Status:** 429 (Too Many Requests)

### When It Happens
- Exceeded rate limit for endpoint
- Must wait for window to reset
- Standard HTTP behavior

### For Frontend
1. **Catch 429 errors**
   ```javascript
   if (error.status === 429) {
     console.log("Rate limited, wait 60 seconds")
   }
   ```

2. **Display user message**
   ```javascript
   alert("Too many requests. Please wait before trying again.")
   ```

3. **Implement backoff**
   ```javascript
   // Exponential backoff
   setTimeout(retry, Math.random() * 60000) // 0-60 seconds
   ```

---

## Production Tuning Checklist

### Before Deployment
- [ ] Tested with 10+ concurrent dashboard users
- [ ] Monitored rate limit headers
- [ ] No 429 errors in normal usage
- [ ] Auth limit tested with failed logins
- [ ] Payment operations tested
- [ ] Tested on Render staging environment

### After Deployment
- [ ] Monitor error logs for 429s
- [ ] Check user feedback for rate limit complaints
- [ ] Review rate limit metrics daily for first week
- [ ] Adjust limits based on actual usage patterns

### Ongoing Maintenance
- [ ] Weekly: Review 429 error logs
- [ ] Monthly: Analyze usage patterns
- [ ] Quarterly: Adjust limits if needed

---

## Comparison: Before vs After

### Before Security Middleware
```
Attack: Brute force login with 10,000 attempts
Result: ❌ 10,000 attempts processed
Cost:   ❌ High CPU, password guesses exposed
```

### After Security Middleware
```
Attack: Brute force login with 10,000 attempts
Result: ✅ Only 5 attempts allowed (100% blocked after)
Cost:   ✅ Minimal CPU, attacker immediately stopped
```

**Improvement: 2,000x more secure** ✅

---

## Scaling Considerations

### Single Server (Current)
- **In-memory rate limit store**
- **Suitable for:** 1 Render instance
- **Resets when server restarts**

### Multiple Servers (Future)
- **Need distributed store (Redis)**
- **Install:** `npm install rate-limit-redis`
- **Benefit:** Rate limits shared across instances

### Growth Timeline
- Months 0-6: Single server ✅
- Months 6-12: Consider Redis if high traffic
- Year 2+: Definitely use Redis

---

## Customization Examples

### Example 1: Very Strict (High Security)
```javascript
// Login: 3 attempts per 30 minutes
const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 3,
  skipSuccessfulRequests: true
})

// Queue: 20 ops per minute
const queueLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20
})
```

### Example 2: Very Lenient (High Availability)
```javascript
// Login: 10 attempts per 30 minutes
const authLimiter = rateLimit({
  windowMs: 30 * 60 * 1000,
  max: 10,
  skipSuccessfulRequests: true
})

// Queue: 50 ops per minute
const queueLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 50
})
```

### Example 3: Balanced (Recommended)
```javascript
// (Current configuration - well balanced)
// Keep as is unless you have specific needs
```

---

## Summary

| Limiter | Limit | Window | Purpose | Impact |
|---------|-------|--------|---------|--------|
| Global | 100 | 1 min | Overall protection | No impact on normal use |
| Auth | 5 | 15 min | Brute force protection | Users can retry safely |
| Queue | 30 | 1 min | Prevent abuse | Receptionists unaffected |
| Payment | 10 | 1 min | Fraud prevention | Normal payments unaffected |

**Key Point:** All limits are set **well above normal usage**, ensuring legitimate users are never affected while attackers are stopped immediately. ✅
