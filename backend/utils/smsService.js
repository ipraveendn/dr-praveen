/**
 * SMS Service using Twilio Messaging Service
 * Handles sending SMS notifications for token creation and updates
 * 
 * Clean implementation with proper error handling and logging
 */

import dotenv from 'dotenv'
import twilio from 'twilio'
import path from 'path'
import { fileURLToPath } from 'url'
import { formatPhoneNumber } from './phoneFormatter.js'

// Get __dirname for ES modules
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// ========== STEP 1: ENSURE DOTENV IS LOADED ==========
console.log('[DOTENV INIT] Loading environment variables...')
const envPath = path.join(__dirname, '../.env')
console.log('[DOTENV] Loading from:', envPath)
const result = dotenv.config({ path: envPath })
if (result.error) {
  console.warn('[DOTENV WARNING] Error loading .env:', result.error.message)
} else {
  console.log('[DOTENV] ✓ Loaded successfully')
}

// ========== STEP 2: VERIFY TWILIO CONFIGURATION ==========
console.log('[CONFIG] Initializing Twilio SMS Service...')

/**
 * Initialize Twilio client with credentials from environment variables
 * @returns {Object} - Twilio client instance
 */
function initializeTwilio() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID
  const authToken = process.env.TWILIO_AUTH_TOKEN

  console.log('\n[TWILIO INIT CHECK]')
  console.log('  TWILIO_ACCOUNT_SID:', accountSid ? `✓ Loaded (${accountSid.substring(0, 5)}...)` : '✗ MISSING')
  console.log('  TWILIO_AUTH_TOKEN:', authToken ? `✓ Loaded (${authToken.substring(0, 5)}...)` : '✗ MISSING')

  if (!accountSid || !authToken) {
    console.error('[ERROR] Twilio credentials not configured in .env')
    console.error('  Required: TWILIO_ACCOUNT_SID and TWILIO_AUTH_TOKEN')
    return null
  }

  return twilio(accountSid, authToken)
}

let twilioClient = initializeTwilio()

/**
 * Send SMS via Twilio Messaging Service
 * @param {string} phone - Phone number with country code (e.g., +919876543210)
 * @param {string} message - SMS message text
 * @returns {Promise<Object>} - Response with SMS send result
 */
export async function sendSMS(phone, message) {
  try {
    console.log('\n' + '='.repeat(70))
    console.log('[SMS SERVICE] Starting SMS send process...')
    console.log('='.repeat(70))

    // ========== STEP 3: VERIFY CLIENT ==========
    if (!twilioClient) {
      console.error('[ERROR] Twilio client not initialized')
      return { success: false, reason: 'TWILIO_NOT_INITIALIZED' }
    }

    // ========== STEP 4: FORMAT PHONE NUMBER TO E.164 ==========
    console.log('\n[PHONE NUMBER FORMATTING]')
    const formattedPhone = formatPhoneNumber(phone)
    
    if (!formattedPhone) {
      console.error('[ERROR] Failed to format phone number')
      return { success: false, reason: 'INVALID_PHONE_NUMBER' }
    }
    
    console.log('Formatted phone:', formattedPhone)

    // ========== STEP 5: LOAD TWILIO CONFIG ==========
    console.log('\n[TWILIO CONFIG CHECK]')
    const messagingServiceSid = process.env.TWILIO_MESSAGING_SERVICE_SID

    console.log('  TWILIO_MESSAGING_SERVICE_SID:', messagingServiceSid ? `✓ Loaded: ${messagingServiceSid}` : '✗ MISSING')

    if (!messagingServiceSid) {
      console.error('[ERROR] TWILIO_MESSAGING_SERVICE_SID not configured in .env')
      return { success: false, reason: 'MESSAGING_SERVICE_SID_NOT_CONFIGURED' }
    }

    // ========== STEP 6: PREPARE MESSAGE ==========
    console.log('\n[MESSAGE PREPARATION]')
    console.log('  Message length:', message.length, 'characters')
    if (message.length > 1600) {
      console.warn('[WARNING] Message exceeds SMS length limits')
    }
    console.log('  First 50 chars:', message.substring(0, 50) + '...')

    // ========== STEP 7: SEND SMS VIA TWILIO ==========
    console.log('\n[TWILIO API REQUEST]')
    console.log('  Method: POST (Twilio REST API)')
    console.log('  Service:', 'Twilio Messaging Service')
    console.log('  Sending SMS to:', formattedPhone)

    const smsResponse = await twilioClient.messages.create({
      messagingServiceSid: messagingServiceSid,
      to: formattedPhone,
      body: message
    })

    // ========== STEP 8: PROCESS RESPONSE ==========
    console.log('\n[TWILIO RESPONSE]')
    console.log('  Status:', smsResponse.status)
    console.log('  SID:', smsResponse.sid)
    console.log('  Message SID:', smsResponse.sid.substring(0, 10) + '...')

    if (smsResponse.status === 'queued' || smsResponse.status === 'sent' || smsResponse.status === 'sending' || smsResponse.status === 'accepted') {
      console.log('\n[SUCCESS] SMS sent successfully!')
      console.log('  Message ID:', smsResponse.sid)
      console.log('  Status:', smsResponse.status)
      console.log('  To:', smsResponse.to)
      console.log('='.repeat(70))

      return {
        success: true,
        data: {
          messageSid: smsResponse.sid,
          status: smsResponse.status,
          to: smsResponse.to
        }
      }
    } else {
      console.error('[ERROR] Unexpected SMS status:', smsResponse.status)
      console.log('='.repeat(70))

      return {
        success: false,
        error: `Unexpected status: ${smsResponse.status}`,
        status: smsResponse.status
      }
    }
  } catch (error) {
    console.log('\n[ERROR CAUGHT]')
    console.error('  Error Type:', error.name)
    console.error('  Error Message:', error.message)

    if (error.response) {
      console.error('\n[TWILIO API ERROR]')
      console.error('  Status Code:', error.response?.status)
      console.error('  Error Code:', error.code)
      console.error('  Details:', error.response?.data || error.message)
    } else if (error.request) {
      console.error('  No response received from Twilio')
    }

    console.log('='.repeat(70))

    return {
      success: false,
      error: error.message,
      details: error.response?.data || error.message,
      errorCode: error.code
    }
  }
}

/**
 * Send appointment token notification SMS
 * @param {string} phone - Phone number with country code
 * @param {string} patientName - Patient name
 * @param {string|number} token - Token number
 * @param {string|number} waitTime - Estimated wait time in minutes
 * @param {string} reason - Reason for appointment
 * @param {string} trackingUrl - Optional tracking URL for live queue status
 * @returns {Promise<Object>} - SMS send result
 */
export async function sendAppointmentSMS(phone, patientName, token, waitTime, reason, trackingUrl = null) {
  try {
    console.log('\n' + '='.repeat(70))
    console.log('[APPOINTMENT SMS] Starting appointment notification...')
    console.log('='.repeat(70))

    const appointmentData = {
      patientName,
      phone,
      token,
      waitTime,
      reason,
      trackingUrl
    }

    console.log('\n[APPOINTMENT DATA]')
    console.log('  Patient Name:', patientName)
    console.log('  Phone:', phone)
    console.log('  Token:', token)
    console.log('  Wait Time:', waitTime, 'mins')
    console.log('  Reason:', reason)
    console.log('  Tracking URL:', trackingUrl || 'Not provided')

    // Format message exactly as specified
    let message = `Hi ${patientName},

Your appointment token at Dr. Praveen's DiaPlus Clinic:

Token: ${token}
Clinic: DiaPlus
Estimated Wait: ${waitTime} mins
Reason: ${reason}

Please keep your token safe. You'll receive updates when it's your turn.`

    // Add tracking link if provided
    if (trackingUrl) {
      message += `

Track your live appointment status:
${trackingUrl}`
    }

    message += `

Dr. Praveen Ramachandra
Endocrinologist`

    console.log('\n[MESSAGE CONTENT]')
    console.log(message)

    // Send SMS
    console.log('\n[SENDING SMS...]')
    const result = await sendSMS(phone, message)

    console.log('\n[APPOINTMENT SMS RESULT]')
    console.log('  Success:', result.success)
    if (result.success) {
      console.log('  Message SID:', result.data.messageSid)
      console.log('  Status:', result.data.status)
    } else {
      console.log('  Error:', result.error)
    }
    console.log('='.repeat(70) + '\n')

    return result
  } catch (error) {
    console.error('[APPOINTMENT SMS ERROR]', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

/**
 * Send token notification SMS using token data object
 * (Backward compatibility wrapper)
 * @param {Object} tokenData - Token details {name, phone, tokenNumber, clinic, estimatedTime, reason, trackingUrl}
 * @returns {Promise<Object>} - SMS send result
 */
export async function sendTokenNotificationSMS(tokenData) {
  try {
    console.log('\n' + '='.repeat(70))
    console.log('[TOKEN NOTIFICATION SMS] Processing token notification...')
    console.log('='.repeat(70))

    const { name, phone, tokenNumber, clinic, estimatedTime, reason, trackingUrl } = tokenData

    console.log('\n[TOKEN DATA]')
    console.log('  Name:', name)
    console.log('  Phone:', phone)
    console.log('  Token Number:', tokenNumber)
    console.log('  Clinic:', clinic)
    console.log('  Estimated Time:', estimatedTime)
    console.log('  Reason:', reason)
    console.log('  Tracking URL:', trackingUrl || 'Not provided')

    // Extract wait time number from estimated time string if needed
    let waitTimeNum = estimatedTime
    if (typeof estimatedTime === 'string') {
      waitTimeNum = estimatedTime.replace(/\D/g, '') || '0'
    }

    // Call the main appointment SMS function with tracking URL
    const result = await sendAppointmentSMS(
      phone, 
      name, 
      `#${String(tokenNumber).padStart(2, '0')}`, 
      waitTimeNum, 
      reason,
      trackingUrl
    )

    console.log('\n[TOKEN SMS RESULT]')
    console.log('  Success:', result.success)
    if (result.success) {
      console.log('  Message SID:', result.data.messageSid)
    } else {
      console.log('  Error:', result.error)
    }
    console.log('='.repeat(70) + '\n')

    return result
  } catch (error) {
    console.error('[TOKEN NOTIFICATION ERROR]', error.message)
    return {
      success: false,
      error: error.message
    }
  }
}

export default { sendSMS, sendAppointmentSMS, sendTokenNotificationSMS }
