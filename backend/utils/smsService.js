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
 * Send WhatsApp message via Twilio WhatsApp channel
 * @param {string} phone - Phone number with country code
 * @param {string} message - WhatsApp message body
 * @returns {Promise<Object>} - Response with send result
 */
export async function sendWhatsApp(phone, message) {
  try {
    console.log('\n' + '='.repeat(70))
    console.log('[WHATSAPP SERVICE] Starting WhatsApp send process...')
    console.log('='.repeat(70))

    if (!twilioClient) {
      console.error('[ERROR] Twilio client not initialized')
      return { success: false, reason: 'TWILIO_NOT_INITIALIZED' }
    }

    const formattedPhone = formatPhoneNumber(phone)
    if (!formattedPhone) {
      console.error('[ERROR] Failed to format phone number for WhatsApp')
      return { success: false, reason: 'INVALID_PHONE_NUMBER' }
    }

    const whatsappFrom = process.env.TWILIO_WHATSAPP_FROM
    if (!whatsappFrom) {
      console.error('[ERROR] TWILIO_WHATSAPP_FROM not configured in .env')
      return { success: false, reason: 'WHATSAPP_FROM_NOT_CONFIGURED' }
    }

    const fromValue = whatsappFrom.startsWith('whatsapp:') ? whatsappFrom : `whatsapp:${whatsappFrom}`
    const toValue = `whatsapp:${formattedPhone}`

    console.log('\n[TWILIO WHATSAPP REQUEST]')
    console.log('  From:', fromValue)
    console.log('  To:', toValue)
    console.log('  Message length:', message.length)

    const smsResponse = await twilioClient.messages.create({
      from: fromValue,
      to: toValue,
      body: message
    })

    console.log('\n[TWILIO RESPONSE]')
    console.log('  Status:', smsResponse.status)
    console.log('  SID:', smsResponse.sid)
    console.log('  To:', smsResponse.to)

    if (['queued', 'sent', 'sending', 'accepted'].includes(smsResponse.status)) {
      return {
        success: true,
        data: {
          messageSid: smsResponse.sid,
          status: smsResponse.status,
          to: smsResponse.to
        }
      }
    }

    return {
      success: false,
      error: `Unexpected WhatsApp status: ${smsResponse.status}`,
      status: smsResponse.status
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
export async function sendAppointmentSMS(phone, patientName, token, waitTime, reason, trackingLink) {
  const message = `Hi ${patientName},

Your appointment token at Dr. Praveen's DiaPlus Clinic is confirmed.

Token: #${token}
Clinic: DiaPlus
Estimated Wait: ${waitTime} mins
Reason: ${reason}

Please arrive on time and keep your token number safe.

Track your queue:
${trackingLink}

- Dr. Praveen Ramachandra
Endocrinologist`;

  return await sendSMS(phone, message);
}

/**
 * Send token notification SMS using token data object
 * (Backward compatibility wrapper)
 * @param {Object} tokenData - Token details {name, phone, tokenNumber, clinic, estimatedTime, reason, trackingUrl}
 * @returns {Promise<Object>} - SMS send result
 */
export async function sendTokenNotificationSMS(tokenData) {
  const { name, phone, tokenNumber, clinic, estimatedTime, reason } = tokenData;
  const trackingLink = `https://dr-praveen.onrender.com/track?phone=${phone}`;
  const waitTimeNum = typeof estimatedTime === 'string' ? estimatedTime.replace(/\D/g, '') || '0' : estimatedTime;

  const message = `Hi ${name},

Your appointment token at Dr. Praveen's DiaPlus Clinic is confirmed.

Token: #${String(tokenNumber).padStart(2, '0')}
Clinic: ${clinic}
Estimated Wait: ${waitTimeNum} mins
Reason: ${reason}

Please arrive on time and keep your token number safe.

Track your queue:
${trackingLink}

- Dr. Praveen Ramachandra
Endocrinologist`;

  return await sendSMS(phone, message);
}

export default { sendSMS, sendAppointmentSMS, sendTokenNotificationSMS };