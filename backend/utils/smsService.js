/**
 * SMS Service using MSG91 Flow API
 * Handles sending SMS notifications for token creation and updates using template-based Flow API
 * 
 * DEBUGGING ENHANCED - All steps logged for troubleshooting SMS delivery
 */

import dotenv from 'dotenv'
import axios from 'axios'
import path from 'path'
import { fileURLToPath } from 'url'

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

// ========== STEP 2: VERIFY MSG91 CONFIGURATION ==========
const MSG91_FLOW_URL = 'https://control.msg91.com/api/v5/flow/'
console.log('[CONFIG] MSG91_FLOW_URL:', MSG91_FLOW_URL, '(with trailing slash: ✓)')

/**
 * Send SMS via MSG91 Flow API with COMPLETE DEBUGGING
 * @param {string} phone - 10-digit phone number or with country code
 * @param {string} message - SMS message text (for logging)
 * @param {Object} templateVars - Template variables {var1, var2, var3, var4}
 * @returns {Promise<Object>} - Response from MSG91 API
 */
export async function sendSMS(phone, message, templateVars = {}) {
  try {
    console.log('\n' + '='.repeat(70))
    console.log('[SMS SERVICE] Starting SMS send process...')
    console.log('='.repeat(70))

    // ========== STEP 3: LOAD AND DEBUG CREDENTIALS ==========
    const MSG91_API_KEY = process.env.MSG91_API_KEY
    const MSG91_TEMPLATE_ID = process.env.MSG91_TEMPLATE_ID

    console.log('\n[CREDENTIALS CHECK]')
    console.log('  MSG91_API_KEY:', MSG91_API_KEY ? `✓ Loaded (${MSG91_API_KEY.substring(0, 10)}...)` : '✗ MISSING')
    console.log('  MSG91_TEMPLATE_ID:', MSG91_TEMPLATE_ID ? `✓ Loaded: ${MSG91_TEMPLATE_ID}` : '✗ MISSING')
    console.log('  TEMPLATE_ID Length:', MSG91_TEMPLATE_ID?.length || 0, '(should be 24)')

    if (!MSG91_API_KEY) {
      console.error('[SMS ERROR] MSG91_API_KEY not configured in .env')
      return { success: false, reason: 'API_KEY_NOT_CONFIGURED' }
    }

    if (!MSG91_TEMPLATE_ID) {
      console.error('[SMS ERROR] MSG91_TEMPLATE_ID not configured in .env')
      return { success: false, reason: 'TEMPLATE_ID_NOT_CONFIGURED' }
    }

    // ========== STEP 4: VALIDATE AND FORMAT MOBILE NUMBER ==========
    console.log('\n[PHONE NUMBER VALIDATION]')
    console.log('  Input phone:', phone)
    console.log('  Phone type:', typeof phone)
    
    const phoneStr = String(phone).trim()
    const phoneWithCountryCode = phoneStr.startsWith('91') ? phoneStr : `91${phoneStr.slice(-10)}`
    
    console.log('  Formatted phone:', phoneWithCountryCode)
    console.log('  Phone format check: 91XXXXXXXXXX (10 digits) ✓')

    // ========== STEP 5: PREPARE TEMPLATE VARIABLES ==========
    console.log('\n[TEMPLATE VARIABLES CHECK]')
    const { var1, var2, var3, var4 } = templateVars
    
    console.log('  var1:', var1 || 'UNDEFINED')
    console.log('  var2:', var2 || 'UNDEFINED')
    console.log('  var3:', var3 || 'UNDEFINED')
    console.log('  var4:', var4 || 'UNDEFINED')
    
    // Check for undefined values
    if (!var1 || !var2 || !var3 || !var4) {
      console.warn('[SMS WARNING] Some variables are undefined - using defaults')
    }

    // ========== STEP 6: BUILD REQUEST BODY ==========
    console.log('\n[REQUEST BODY CONSTRUCTION]')
    const requestBody = {
      template_id: MSG91_TEMPLATE_ID,  // MUST be snake_case, not camelCase
      recipients: [
        {
          mobiles: phoneWithCountryCode,
          var1: var1 || 'Patient',
          var2: var2 || 'Token',
          var3: var3 || 'Pending',
          var4: var4 || 'Appointment'
        }
      ]
    }

    console.log('  Request body structure:')
    console.log(JSON.stringify(requestBody, null, 2))

    // ========== STEP 7: PREPARE HEADERS ==========
    console.log('\n[HEADERS PREPARATION]')
    const headers = {
      authkey: MSG91_API_KEY,
      'Content-Type': 'application/json'
    }
    console.log('  Headers:')
    console.log('    authkey:', `✓ Set (${MSG91_API_KEY.substring(0, 10)}...)`)
    console.log('    Content-Type:', headers['Content-Type'])

    // ========== STEP 8: MAKE POST REQUEST ==========
    console.log('\n[API REQUEST]')
    console.log('  Method: POST ✓')
    console.log('  Endpoint:', MSG91_FLOW_URL)
    console.log('  Sending request to MSG91...')

    const response = await axios.post(MSG91_FLOW_URL, requestBody, { headers })

    // ========== STEP 9: PROCESS RESPONSE ==========
    console.log('\n[MSG91 RESPONSE]')
    console.log('  Status Code:', response.status)
    console.log('  Response Data:', JSON.stringify(response.data, null, 2))

    if (response.status === 200 || response.status === 201) {
      console.log('\n[SUCCESS] SMS sent successfully!')
      console.log('  Message ID:', response.data?.data?.message || response.data?.message)
      console.log('  Type:', response.data?.data?.type || 'success')
      
      console.log('='.repeat(70))
      return { success: true, data: response.data }
    } else {
      console.error('[ERROR] Unexpected status code:', response.status)
      console.log('='.repeat(70))
      return { success: false, error: response.data, status: response.status }
    }

  } catch (error) {
    console.log('\n[ERROR CAUGHT]')
    console.error('  Error Type:', error.name)
    console.error('  Error Message:', error.message)
    
    if (error.response) {
      console.error('\n[HTTP ERROR DETAILS]')
      console.error('  Status Code:', error.response.status)
      console.error('  Status Text:', error.response.statusText)
      console.error('  Response Data:', JSON.stringify(error.response.data, null, 2))
      
      // Check for specific MSG91 errors
      if (error.response.data?.msg) {
        console.error('  MSG91 Error Message:', error.response.data.msg)
      }
      if (error.response.data?.error) {
        console.error('  MSG91 Error Details:', error.response.data.error)
      }
    } else if (error.request) {
      console.error('  No response received from MSG91')
      console.error('  Request sent to:', MSG91_FLOW_URL)
    }

    console.log('='.repeat(70))
    
    return { 
      success: false, 
      error: error.message,
      details: error.response?.data,
      statusCode: error.response?.status
    }
  }
}

/**
 * Format token notification message
 * @param {Object} tokenData - Token details {name, tokenNumber, clinic, estimatedTime, reason}
 * @returns {string} - Formatted SMS message
 */
export function formatTokenMessage(tokenData) {
  const { name, tokenNumber, clinic, estimatedTime, reason } = tokenData

  const clinicName = clinic === 'diaplus' ? 'DiaPlus' : 'ThyroPlus'

  const message = `Hi ${name},

Your appointment token at Dr. Praveen's ${clinicName} Clinic:

Token: #${String(tokenNumber).padStart(2, '0')}
Clinic: ${clinicName}
Estimated Wait: ${estimatedTime} mins
Reason: ${reason}

Please keep your token safe. You will be notified when your turn comes.

Dr. Praveen Ramachandra`

  return message
}

/**
 * Send token notification SMS using template
 * @param {Object} tokenData - Token details {name, phone, tokenNumber, clinic, estimatedTime, reason}
 * @returns {Promise<Object>} - SMS send result
 */
export async function sendTokenNotificationSMS(tokenData) {
  try {
    console.log('\n' + '='.repeat(70))
    console.log('[TOKEN NOTIFICATION SMS] Starting token SMS process...')
    console.log('='.repeat(70))

    const { name, phone, tokenNumber, clinic, estimatedTime, reason } = tokenData

    console.log('\n[TOKEN DATA]')
    console.log('  Name:', name)
    console.log('  Phone:', phone)
    console.log('  Token Number:', tokenNumber)
    console.log('  Clinic:', clinic)
    console.log('  Estimated Time:', estimatedTime)
    console.log('  Reason:', reason)

    // Prepare template variables EXACTLY as required by MSG91
    const templateVars = {
      var1: name || 'Patient',
      var2: `#${String(tokenNumber).padStart(2, '0')}`,
      var3: String(estimatedTime) || 'Pending',
      var4: reason || 'Appointment'
    }

    console.log('\n[TEMPLATE VARIABLES MAPPED]')
    console.log('  var1 (Name):', templateVars.var1)
    console.log('  var2 (Token):', templateVars.var2)
    console.log('  var3 (Wait Time):', templateVars.var3)
    console.log('  var4 (Reason):', templateVars.var4)

    // Call sendSMS with template variables
    console.log('\n[CALLING sendSMS with template variables...]')
    const result = await sendSMS(phone, `Token SMS for ${name}`, templateVars)

    console.log('\n[TOKEN SMS RESULT]')
    console.log('  Success:', result.success)
    if (result.success) {
      console.log('  Message ID:', result.data?.data?.message)
    } else {
      console.log('  Error:', result.error)
    }
    console.log('='.repeat(70) + '\n')

    return result
  } catch (error) {
    console.error('[TOKEN SMS ERROR]', error)
    console.log('='.repeat(70) + '\n')
    return { success: false, error: error.message }
  }
}
