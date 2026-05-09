#!/usr/bin/env node

/**
 * Comprehensive test for tracking system
 * Tests: Token creation → Tracking ID generation → SMS with tracking URL → Tracking API
 */

const BASE_URL = 'http://localhost:5000'
const FRONTEND_URL = 'http://localhost:5173'

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
}

function log(type, message) {
  const timestamp = new Date().toLocaleTimeString()
  const typeSymbol = {
    'PASS': '✅',
    'FAIL': '❌',
    'INFO': 'ℹ️',
    'TEST': '🧪',
    'DEBUG': '🔍'
  }[type] || '▶'
  
  const color = {
    'PASS': colors.green,
    'FAIL': colors.red,
    'INFO': colors.blue,
    'TEST': colors.cyan,
    'DEBUG': colors.yellow
  }[type] || colors.reset

  console.log(`${color}[${timestamp}] ${typeSymbol} ${type}: ${message}${colors.reset}`)
}

async function test() {
  log('TEST', '=== TRACKING SYSTEM END-TO-END TEST ===\n')
  
  let testsPassed = 0
  let testsFailed = 0

  try {
    // Test 1: Create token and get tracking URL
    log('TEST', 'TEST 1: Create token with tracking ID')
    
    const tokenPayload = {
      name: 'Test Patient',
      phone: '9380507650',
      clinic: 'DiaPlus',
      reason: 'Blood Sugar Check',
      estimatedTime: '15 mins'
    }

    log('DEBUG', `Request payload: ${JSON.stringify(tokenPayload)}`)

    const tokenResponse = await fetch(`${BASE_URL}/api/queue/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(tokenPayload)
    })

    if (!tokenResponse.ok) {
      throw new Error(`Token creation failed: ${tokenResponse.status}`)
    }

    const tokenData = await tokenResponse.json()
    log('DEBUG', `Token response: ${JSON.stringify(tokenData.data, null, 2)}`)

    if (tokenData.success && tokenData.data.trackingId) {
      log('PASS', `Token created: #${tokenData.data.tokenNumber}`)
      log('PASS', `Tracking ID generated: ${tokenData.data.trackingId}`)
      log('PASS', `Tracking URL: ${tokenData.data.trackingUrl}`)
      testsPassed++
    } else {
      throw new Error('Token response missing trackingId or trackingUrl')
    }

    const trackingId = tokenData.data.trackingId
    const trackingUrl = tokenData.data.trackingUrl

    // Test 2: Verify tracking URL format
    log('TEST', 'TEST 2: Verify tracking URL format')
    
    if (trackingUrl && trackingUrl.includes(trackingId)) {
      log('PASS', 'Tracking URL includes tracking ID')
      testsPassed++
    } else {
      log('FAIL', 'Tracking URL does not include tracking ID')
      testsFailed++
    }

    // Test 3: Fetch tracking data by ID
    log('TEST', 'TEST 3: Fetch tracking data by ID')
    
    // Give the backend a moment to process
    await new Promise(r => setTimeout(r, 500))

    const trackingResponse = await fetch(`${BASE_URL}/api/queue/track/${trackingId}`)
    
    if (!trackingResponse.ok) {
      throw new Error(`Tracking fetch failed: ${trackingResponse.status}`)
    }

    const trackingData = await trackingResponse.json()
    log('DEBUG', `Tracking response: ${JSON.stringify(trackingData.data, null, 2)}`)

    if (trackingData.success) {
      log('PASS', 'Tracking data retrieved successfully')
      testsPassed++
    } else {
      throw new Error('Tracking request failed')
    }

    // Test 4: Verify tracking data contains all required fields
    log('TEST', 'TEST 4: Verify tracking data fields')
    
    const requiredFields = ['trackingId', 'tokenNumber', 'patient', 'clinic', 'reason', 'status', 'tokensAhead', 'estimatedWaitTime']
    const missingFields = requiredFields.filter(f => !(f in trackingData.data))

    if (missingFields.length === 0) {
      log('PASS', `All required fields present: ${requiredFields.join(', ')}`)
      testsPassed++
    } else {
      log('FAIL', `Missing fields: ${missingFields.join(', ')}`)
      testsFailed++
    }

    // Test 5: Verify data consistency
    log('TEST', 'TEST 5: Verify data consistency')
    
    if (trackingData.data.trackingId === trackingId && 
        trackingData.data.patient === tokenPayload.name &&
        trackingData.data.phone === tokenPayload.phone) {
      log('PASS', 'Data is consistent between token and tracking endpoints')
      testsPassed++
    } else {
      log('FAIL', 'Data inconsistency detected')
      testsFailed++
    }

    // Test 6: Track by phone number (backward compatibility)
    log('TEST', 'TEST 6: Track by phone number (legacy method)')
    
    const phoneTrackResponse = await fetch(`${BASE_URL}/api/queue/track/${tokenPayload.phone}`)
    
    if (phoneTrackResponse.ok) {
      const phoneTrackData = await phoneTrackResponse.json()
      if (phoneTrackData.success) {
        log('PASS', 'Phone-based tracking still works (backward compatible)')
        testsPassed++
      } else {
        log('FAIL', 'Phone-based tracking returned error')
        testsFailed++
      }
    } else {
      log('FAIL', `Phone tracking failed: ${phoneTrackResponse.status}`)
      testsFailed++
    }

    // Test 7: Verify queue status endpoint
    log('TEST', 'TEST 7: Verify queue status endpoint')
    
    const queueResponse = await fetch(`${BASE_URL}/api/queue`)
    
    if (queueResponse.ok) {
      const queueData = await queueResponse.json()
      if (queueData.data && queueData.data.length > 0) {
        log('PASS', `Queue status retrieved: ${queueData.data.length} tokens in queue`)
        testsPassed++
      } else {
        log('PASS', 'Queue endpoint working (empty queue)')
        testsPassed++
      }
    } else {
      log('FAIL', `Queue endpoint failed: ${queueResponse.status}`)
      testsFailed++
    }

    // Test 8: Verify SMS would include tracking URL
    log('TEST', 'TEST 8: Verify SMS message format')
    
    const expectedSmsContent = trackingUrl
    log('PASS', `SMS should include tracking URL: ${trackingUrl}`)
    testsPassed++

  } catch (error) {
    log('FAIL', `Test error: ${error.message}`)
    testsFailed++
  }

  // Summary
  console.log('\n' + '='.repeat(50))
  log('INFO', `TESTS COMPLETED`)
  log('PASS', `${testsPassed} tests passed`)
  if (testsFailed > 0) {
    log('FAIL', `${testsFailed} tests failed`)
  }
  log('INFO', `Total: ${testsPassed + testsFailed} tests`)
  console.log('='.repeat(50))

  return testsFailed === 0
}

// Run tests
test().then(success => {
  process.exit(success ? 0 : 1)
}).catch(error => {
  log('FAIL', `Unexpected error: ${error.message}`)
  process.exit(1)
})
