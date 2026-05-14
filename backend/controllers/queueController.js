// Queue Controller
// Handles queue management, token booking, and queue tracking

import { sendTokenNotificationSMS } from '../utils/smsService.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
// ===== IN-MEMORY QUEUE STATE =====
// Stores all tokens for today's queue
// Persists while server is running, resets on restart
let queueArray = []
let nextTokenNumber = 1
let currentServingToken = null

// Track mapping: maps tracking ID to token
const trackingIdMap = new Map()

console.log('[MODULE INIT] queueController loaded: nextTokenNumber =', nextTokenNumber, ', queueArray.length =', queueArray.length)

/**
 * Seed initial queue data for demos so UI is never empty.
 * Only seeds when queue is currently empty.
 */
export const seedDemoQueue = () => {
  const shouldSeed = (process.env.DEMO_SEED_QUEUE || 'true').toLowerCase() !== 'false'
  if (!shouldSeed) return { seeded: false, reason: 'disabled' }

  if (queueArray.length > 0) {
    return { seeded: false, reason: 'already_has_data', count: queueArray.length }
  }

  const now = Date.now()
  const demoPatients = [
    { name: 'Aarav Sharma', phone: '9876543210', reason: 'Diabetes Checkup', clinic: 'diaplus' },
    { name: 'Meera Iyer', phone: '9123456780', reason: 'Thyroid Consultation', clinic: 'thyroplus' },
    { name: 'Rohan Verma', phone: '9988776655', reason: 'PCOS / PCOD', clinic: 'diaplus' },
    { name: 'Neha Gupta', phone: '9012345678', reason: 'Hormone Imbalance', clinic: 'thyroplus' }
  ]

  queueArray = demoPatients.map((p, idx) => ({
    tokenNumber: idx + 1,
    ...p,
    timestamp: new Date(now - (demoPatients.length - idx) * 60_000).toISOString(),
    status: idx === 0 ? 'serving' : 'waiting'
  }))

  currentServingToken = queueArray[0]
  nextTokenNumber = queueArray.length + 1

  console.log('[DEMO SEED] Preloaded queue tokens:', {
    count: queueArray.length,
    serving: currentServingToken.tokenNumber,
    nextTokenNumber
  })

  return { seeded: true, count: queueArray.length, serving: currentServingToken.tokenNumber }
}

/**
 * Get current queue data
 * Returns real queue status with sequential tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getQueueData = async (req, res) => {
  try {
    const { clinic } = req.query
    console.log('CLINIC QUERY:', clinic)

    const filteredQueue = clinic
      ? queueArray.filter(token => token.clinic === clinic)
      : queueArray

    const waitingTokens = filteredQueue.filter(token => token.status === 'waiting')
    const waitingCount = waitingTokens.length

    const estimatedTime = waitingCount * 5

    const serving = filteredQueue.find(token => token.status === 'serving')
    const currentToken = serving
      ? serving.tokenNumber
      : (filteredQueue.length > 0 ? filteredQueue[0].tokenNumber : 0)

    const patients = filteredQueue.map(p => ({
      tokenNumber: p.tokenNumber,
      name: p.name,
      phone: p.phone,
      clinic: p.clinic,
      status: p.status,
      reason: p.reason
    }))

    const queueData = {
      currentToken,
      waiting: waitingCount,
      estimatedTime: `${estimatedTime} mins`,
      patients
    }

    res.status(200).json({
      success: true,
      data: queueData,
      message: 'Queue data retrieved'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Add new token to queue
 * Accepts patient details and generates SEQUENTIAL token number
 * @param {Object} req - Express request object with body {name, phone, reason, clinic, trackingUrl}
 * @param {Object} res - Express response object
 */
export const addToken = async (req, res) => {
  try {
    const {
  name,
  phone,
  reason,
  clinic,
  trackingUrl
} = req.body
    console.log("CLINIC RECEIVED:", clinic)
    console.log("TRACKING URL FROM FRONTEND:", trackingUrl);

    console.log('[DEBUG] addToken called', { name, phone, reason, clinic, trackingUrl })
    console.log('[DEBUG] nextTokenNumber BEFORE increment:', nextTokenNumber)
    console.log('[DEBUG] queueArray length:', queueArray.length)

    // Validate required fields
    if (!name || !phone || !reason || !clinic) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name, phone, reason, and clinic are required',
        required: ['name', 'phone', 'reason', 'clinic']
      })
    }

    // Generate SEQUENTIAL token number (increments by 1)
    const tokenNumber = nextTokenNumber++

    console.log('[DEBUG] nextTokenNumber AFTER increment:', nextTokenNumber)
    console.log('[DEBUG] Generated tokenNumber:', tokenNumber)

    const tokenData = {
      tokenNumber,
      name,
      phone,
      reason,
      clinic,
      timestamp: new Date().toISOString(),
      status: 'waiting'
    }
try {
  console.log('[PRISMA] Starting database insert')

    console.log('[DB STEP 1] Searching patient with phone:', phone)

    let patient = await prisma.patient.findUnique({
      where: {
        phone: String(phone)
      }
    })

    console.log('[DB STEP 2] Existing patient result:', patient)

    console.log('[DB STEP 3] Finding or creating clinic')
    
    const clinicRecord = await prisma.clinic.findUnique({
      where: {
        name: String(clinic)
      }
    })
    
    let clinic_id = null
    
    if (clinicRecord) {
      console.log('[DB STEP 4] Clinic found:', clinicRecord.id)
      clinic_id = clinicRecord.id
    } else {
      console.log('[DB STEP 4a] Clinic not found, creating new clinic')
      const newClinic = await prisma.clinic.create({
        data: {
          name: String(clinic),
          address: 'Default Address'
        }
      })
      console.log('[DB STEP 4b] Clinic created:', newClinic.id)
      clinic_id = newClinic.id
    }

    if (!patient) {
      console.log('[DB STEP 5] Creating new patient with clinic')
      
      // Generate unique patientId
      const patientId = `PAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

      patient = await prisma.patient.create({
        data: {
          patientId: patientId,
          name: String(name),
          phone: String(phone),
          email: null,
          age: 0,  // Default age since not provided
          gender: 'Not Specified',  // Default gender
          reason: String(reason),
          clinicId: clinic_id
        }
      })
      
      console.log('[DB STEP 6] Patient created successfully')
      console.log('[DB STEP 6 DATA]', patient)
    } else {
      console.log('[DB STEP 5] Patient already exists, using existing patient:', patient.id)
    }

    console.log('[DB STEP 7] Creating token')

    const tokenRecord = await prisma.token.create({
      data: {
        tokenNumber: Number(tokenNumber),
        reason: String(reason || "General Consultation"),
        status: 'WAITING',
        clinicId: clinic_id,
        patientId: patient.id
      }
    })

    console.log('[DB STEP 8] Token created successfully')
    console.log(tokenRecord)

  console.log('[PRISMA] Token created:', tokenRecord.id)

} catch (dbError) {
  console.error('[PRISMA DATABASE ERROR]')
  console.error('========== DATABASE ERROR ==========')
  console.error(dbError)
  console.error('ERROR MESSAGE:', dbError.message)
  console.error('ERROR STACK:', dbError.stack)


  return res.status(500).json({
    success: false,
    error: 'Database insert failed',
    details: dbError.message
  })
}
    // Add token to queue array
    queueArray.push(tokenData)

    console.log('[TOKEN CREATED]', {
      tokenNumber,
      patient: name,
      clinic,
      totalInQueue: queueArray.length
    })

    // Calculate estimated wait time
    const waitingPatients = queueArray.filter(p => p.status === 'waiting').length
    const estimatedTime = `${waitingPatients * 5} mins`

    console.log("SMS TRACKING URL USED:", trackingUrl);
    // ========== SEND SMS NOTIFICATION ==========
    console.log('[SMS TRIGGER]')
    console.log('  TOKEN CREATED:', tokenNumber)
    console.log('  PATIENT NAME:', name)
    console.log('  PHONE NUMBER:', phone)
    console.log('  REASON:', reason)
    console.log('  CLINIC:', clinic)
    console.log('  TRACKING URL:', trackingUrl)

    let smsResult = { success: false, error: 'SMS not sent' }

    // Validate phone number before sending SMS
    if (!phone || phone.toString().trim() === '') {
      console.error('[PHONE NUMBER MISSING] Cannot send SMS without patient phone number')
    } else {
      console.log('  CALLING sendTokenNotificationSMS()...')
      
      const smsPayload = {
        name,
        phone,
        tokenNumber,
        clinic,
        reason,
        estimatedTime,
        trackingUrl
      }
      
      try {
        // Send SMS and wait for result
        smsResult = await sendTokenNotificationSMS(smsPayload)
        
        if (smsResult.success) {
          console.log('[SMS SENT SUCCESSFULLY]')
          console.log('  MESSAGE ID:', smsResult.data?.messageSid)
          console.log('  STATUS:', smsResult.data?.status)
          console.log('  TO:', smsResult.data?.to)
        } else {
          console.error('[SMS SEND ERROR]', smsResult.error)
          console.error('  DETAILS:', smsResult.details)
        }
      } catch (err) {
        console.error('[SMS SEND EXCEPTION]', err.message)
        console.error('  STACK:', err.stack)
        smsResult = {
          success: false,
          error: err.message
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        tokenNumber,
        clinic,
        patient: name,
        phone,
        reason,
        estimatedTime,
        trackingUrl
      },
      sms: smsResult,
      message: 'Token created successfully'
    })
  } catch (error) {
    console.error('[ADD TOKEN ERROR] Exception occurred')
    console.error('  Error name:', error.name)
    console.error('  Error message:', error.message)
    console.error('  Error code:', error.code)
    console.error('  Error stack:', error.stack)
    if (error.meta) {
      console.error('  Prisma meta:', error.meta)
    }
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    })
  }
}

/**
 * Book a queue token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const bookToken = async (req, res) => {
  try {
    // For this project, "book token" is the same as creating a new token entry.
    // Keep a dedicated endpoint for frontend compatibility.
    const { name, phone, reason, clinic } = req.body

    if (!name || !phone || !reason || !clinic) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name, phone, reason, and clinic are required',
        required: ['name', 'phone', 'reason', 'clinic']
      })
    }

    const tokenNumber = nextTokenNumber++

    const tokenData = {
      tokenNumber,
      name,
      phone,
      reason,
      clinic,
      timestamp: new Date().toISOString(),
      status: 'waiting'
    }

    queueArray.push(tokenData)

    console.log('[TOKEN BOOKED]', {
      tokenNumber,
      patient: name,
      clinic,
      totalInQueue: queueArray.length
    })

    res.status(201).json({
      success: true,
      data: {
        tokenNumber,
        clinic,
        patient: name,
        phone,
        reason
      },
      message: 'Token booked successfully'
    })
  } catch (error) {
    console.error('[BOOK TOKEN ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Track queue by phone number
 * @param {Object} req - Express request object with params {phone}
 * @param {Object} res - Express response object
 */
export const trackQueue = async (req, res) => {
  try {
    const { phone } = req.query

    console.log('[TRACK QUEUE REQUEST]')
    console.log('  Phone (query):', phone)

    let token = null

    if (phone) {
      const searchPhone = phone
      console.log('  Method: Tracking by phone')
      token = queueArray.find(t => t.phone === searchPhone)
      
      if (!token) {
        console.warn('[PHONE NOT FOUND]', searchPhone)
        return res.status(404).json({
          error: 'Not Found',
          message: 'Token not found for this phone number'
        })
      }
    }
    else {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Phone number required'
      })
    }

    // Count how many tokens are ahead in the queue
    const tokenIndex = queueArray.indexOf(token)
    const tokensAhead = queueArray.filter((t, idx) => idx < tokenIndex && t.status === 'waiting').length

    const trackingData = {
      tokenNumber: token.tokenNumber,
      patient: token.name,
      phone: token.phone,
      clinic: token.clinic,
      reason: token.reason,
      status: token.status,
      tokensAhead,
      estimatedWaitTime: `${tokensAhead * 5} mins`,
      bookedAt: token.timestamp,
      position: tokenIndex + 1,
      totalInQueue: queueArray.length
    }

    console.log('[QUEUE TRACKED]', {
      tokenNumber: token.tokenNumber,
      status: token.status,
      tokensAhead,
      position: tokenIndex + 1
    })

    res.status(200).json({
      success: true,
      data: trackingData,
      message: 'Queue tracking data retrieved'
    })
  } catch (error) {
    console.error('[TRACK QUEUE ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Get queue status for a clinic
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getQueueStatus = async (req, res) => {
  try {
    const { clinicId } = req.params

    // Get all tokens for this clinic
    const clinicTokens = queueArray.filter(token => token.clinic === clinicId)
    const waitingCount = clinicTokens.filter(t => t.status === 'waiting').length
    const servingToken = clinicTokens.find(t => t.status === 'serving')

    const statusData = {
      clinic: clinicId,
      currentToken: servingToken ? servingToken.tokenNumber : null,
      waitingCount,
      totalTokens: clinicTokens.length,
      estimatedTime: `${waitingCount * 5} mins`
    }

    res.status(200).json({
      success: true,
      data: statusData,
      message: 'Queue status retrieved'
    })
  } catch (error) {
    console.error('[GET QUEUE STATUS ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Call next patient in queue
 * @param {Object} req - Express request object with body {clinic}
 * @param {Object} res - Express response object
 */
export const callNextPatient = async (req, res) => {
  try {
    const { clinic } = req.body

    if (!clinic) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'clinic is required'
      })
    }

    // Mark previous serving token as done
    if (currentServingToken) {
      currentServingToken.status = 'done'
    }

    // Get first waiting token for this clinic
    const nextToken = queueArray.find(
      t => t.clinic === clinic && t.status === 'waiting'
    )

    if (!nextToken) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No waiting tokens in queue'
      })
    }

    // Update token status to serving
    nextToken.status = 'serving'
    currentServingToken = nextToken

    console.log('[PATIENT CALLED]', {
      tokenNumber: nextToken.tokenNumber,
      patient: nextToken.name,
      clinic
    })

    res.status(200).json({
      success: true,
      data: {
        tokenNumber: nextToken.tokenNumber,
        patient: nextToken.name,
        phone: nextToken.phone,
        reason: nextToken.reason,
        clinic
      },
      message: 'Next patient called'
    })
  } catch (error) {
    console.error('[CALL NEXT PATIENT ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Mark consultation as complete
 * @param {Object} req - Express request object with body {tokenNumber}
 * @param {Object} res - Express response object
 */
export const completeConsultation = async (req, res) => {
  try {
    const { tokenNumber } = req.body

    if (!tokenNumber) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'tokenNumber is required'
      })
    }

    // Find token by number
    const token = queueArray.find(t => t.tokenNumber === tokenNumber)

    if (!token) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Token not found'
      })
    }

    // Mark token as done
    token.status = 'done'

    if (currentServingToken && currentServingToken.tokenNumber === tokenNumber) {
      currentServingToken = null
    }

    console.log('[CONSULTATION COMPLETED]', {
      tokenNumber,
      patient: token.name
    })

    res.status(200).json({
      success: true,
      data: {
        tokenNumber,
        patient: token.name,
        status: 'done'
      },
      message: 'Consultation marked as complete'
    })
  } catch (error) {
    console.error('[COMPLETE CONSULTATION ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Complete consultation by token number (route param)
 * PATCH /api/queue/complete/:tokenNumber
 */
export const completeConsultationByTokenNumber = async (req, res) => {
  try {
    const tokenNumber = Number(req.params.tokenNumber)

    if (!tokenNumber || Number.isNaN(tokenNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'tokenNumber must be a number'
      })
    }

    const token = queueArray.find(t => t.tokenNumber === tokenNumber)

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Token not found'
      })
    }

    if (token.status === 'serving') {
      token.status = 'done'
      if (currentServingToken && currentServingToken.tokenNumber === tokenNumber) {
        currentServingToken = null
      }
    }

    const waitingCount = queueArray.filter(t => t.status === 'waiting').length
    const estimatedTime = waitingCount * 5
    const serving = currentServingToken || queueArray.find(t => t.status === 'serving')
    const currentToken = serving ? serving.tokenNumber : (queueArray.length > 0 ? queueArray[0].tokenNumber : 0)

    const patients = queueArray.map(p => ({
      tokenNumber: p.tokenNumber,
      name: p.name,
      phone: p.phone,
      clinic: p.clinic,
      status: p.status,
      reason: p.reason
    }))

    console.log('[CONSULTATION COMPLETED]', { tokenNumber })

    return res.status(200).json({
      success: true,
      data: {
        currentToken,
        waiting: waitingCount,
        estimatedTime: `${estimatedTime} mins`,
        patients
      },
      message: 'Consultation marked as complete'
    })
  } catch (error) {
    console.error('[COMPLETE CONSULTATION BY TOKEN ERROR]', error)
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Get all tokens in queue (for admin/monitoring)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllTokens = async (req, res) => {
  try {
    const stats = {
      total: queueArray.length,
      waiting: queueArray.filter(t => t.status === 'waiting').length,
      serving: queueArray.filter(t => t.status === 'serving').length,
      done: queueArray.filter(t => t.status === 'done').length,
      nextTokenNumber
    }

    res.status(200).json({
      success: true,
      data: {
        stats,
        tokens: queueArray
      },
      message: 'All tokens retrieved'
    })
  } catch (error) {
    console.error('[GET ALL TOKENS ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Reset queue for new day (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const resetQueue = async (req, res) => {
  try {
    const oldTokenCount = queueArray.length
    queueArray = []
    nextTokenNumber = 1
    currentServingToken = null

    console.log('[QUEUE RESET]', {
      previousTokenCount: oldTokenCount,
      message: 'Queue reset for new day'
    })

    res.status(200).json({
      success: true,
      data: {
        previousTokenCount: oldTokenCount,
        newTokenNumber: nextTokenNumber
      },
      message: 'Queue reset successfully'
    })
  } catch (error) {
    console.error('[RESET QUEUE ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Move queue forward
 * Marks current serving patient as done and moves next waiting patient to serving
 * Used in Admin Dashboard for demo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const moveQueueForward = async (req, res) => {
  try {
    // Mark current serving patient as done
    if (currentServingToken) {
      currentServingToken.status = 'done'
      console.log('[QUEUE FORWARD] Marked token', currentServingToken.tokenNumber, 'as done')
    }

    // Find next waiting patient
    const nextWaitingToken = queueArray.find(t => t.status === 'waiting')

    if (!nextWaitingToken) {
      // Queue is empty or no more waiting patients
      currentServingToken = null
      
      const waitingCount = queueArray.filter(t => t.status === 'waiting').length
      const estimatedTime = waitingCount * 5

      console.log('[QUEUE FORWARD] No more waiting tokens')

      return res.status(200).json({
        success: true,
        data: {
          message: 'Queue is now empty',
          currentToken: null,
          waiting: waitingCount,
          estimatedTime: `${estimatedTime} mins`,
          lastUpdated: new Date().toISOString()
        },
        message: 'Queue moved forward - no more patients waiting'
      })
    }

    // Move next waiting patient to serving
    nextWaitingToken.status = 'serving'
    currentServingToken = nextWaitingToken

    // Calculate queue metrics
    const waitingCount = queueArray.filter(t => t.status === 'waiting').length
    const estimatedTime = waitingCount * 5

    console.log('[QUEUE FORWARD] Moved token', nextWaitingToken.tokenNumber, 'to serving')
    console.log('[QUEUE STATUS]', {
      currentToken: nextWaitingToken.tokenNumber,
      patient: nextWaitingToken.name,
      waitingCount,
      estimatedTime: `${estimatedTime} mins`
    })

    res.status(200).json({
      success: true,
      data: {
        currentToken: nextWaitingToken.tokenNumber,
        patient: nextWaitingToken.name,
        phone: nextWaitingToken.phone,
        reason: nextWaiting.reason,
        clinic: nextWaitingToken.clinic,
        waiting: waitingCount,
        estimatedTime: `${estimatedTime} mins`,
        lastUpdated: new Date().toISOString()
      },
      message: 'Queue moved forward successfully'
    })
  } catch (error) {
    console.error('[MOVE QUEUE FORWARD ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}
