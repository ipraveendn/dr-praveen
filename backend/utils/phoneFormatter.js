/**
 * Phone Number Formatter
 * Converts Indian phone numbers to E.164 format for Twilio
 * 
 * Supports multiple input formats:
 * - Already formatted: +919876543210
 * - With country code: 919876543210
 * - 10-digit: 9876543210
 */

/**
 * Format phone number to E.164 format (+919876543210)
 * @param {string|number} phone - Phone number in any format
 * @returns {string|null} - Formatted phone number or null if invalid
 */
export function formatPhoneNumber(phone) {
  try {
    console.log('\n[PHONE FORMATTER] Starting phone format conversion...')
    console.log('  Input:', phone)
    console.log('  Input type:', typeof phone)

    // ========== STEP 1: VALIDATE INPUT ==========
    if (!phone) {
      console.error('[ERROR] Phone number is empty or undefined')
      return null
    }

    // Convert to string and trim spaces
    let phoneStr = String(phone).trim()
    console.log('  After trim:', phoneStr)

    // ========== STEP 2: REMOVE INVALID CHARACTERS ==========
    // Keep only digits and + sign
    phoneStr = phoneStr.replace(/[^\d+]/g, '')
    console.log('  After cleaning:', phoneStr)

    if (!phoneStr) {
      console.error('[ERROR] Phone number contains no valid digits')
      return null
    }

    // ========== STEP 3: HANDLE DIFFERENT FORMATS ==========
    let formattedPhone = phoneStr

    // Format 1: Already has + sign (assume E.164)
    if (phoneStr.startsWith('+')) {
      console.log('  Format: Already has + prefix')
      formattedPhone = phoneStr

      // Validate E.164 format for India (+91XXXXXXXXXX = 13 chars)
      if (formattedPhone.length !== 13) {
        console.warn(`  [WARNING] E.164 format length unexpected: ${formattedPhone.length} chars (expected 13)`)
      }
    }
    // Format 2: Starts with 91 and has 12 digits total
    else if (phoneStr.startsWith('91') && phoneStr.length === 12) {
      console.log('  Format: Country code 91 with 10-digit number')
      formattedPhone = `+${phoneStr}`
    }
    // Format 3: Has exactly 10 digits (Indian mobile/landline)
    else if (phoneStr.length === 10) {
      console.log('  Format: 10-digit Indian number')
      formattedPhone = `+91${phoneStr}`
    }
    // Format 4: Has 12 digits starting with 91 (but we already handled this)
    else if (phoneStr.length === 12) {
      console.log('  Format: 12-digit number (might be 91 + 10 digits)')
      if (phoneStr.startsWith('91')) {
        formattedPhone = `+${phoneStr}`
      } else {
        console.error(`[ERROR] 12-digit number doesn't start with 91: ${phoneStr}`)
        return null
      }
    }
    // Invalid format
    else {
      console.error(`[ERROR] Invalid phone number length: ${phoneStr.length} digits`)
      console.error('  Expected: 10 digits (Indian) or 12 digits (with country code 91)')
      return null
    }

    // ========== STEP 4: FINAL VALIDATION ==========
    console.log('  Final formatted phone:', formattedPhone)

    // Ensure E.164 format for Indian numbers
    if (!formattedPhone.startsWith('+91') || formattedPhone.length !== 13) {
      console.error(`[ERROR] Final format invalid: ${formattedPhone}`)
      console.error('  Expected: +91XXXXXXXXXX (13 characters total)')
      return null
    }

    console.log('[PHONE FORMATTER] ✓ Successfully formatted phone number')
    console.log('  Output:', formattedPhone)

    return formattedPhone
  } catch (error) {
    console.error('[PHONE FORMATTER ERROR]', error.message)
    console.error('  Stack:', error.stack)
    return null
  }
}

/**
 * Validate phone number format
 * @param {string} phone - Phone number to validate
 * @returns {boolean} - True if valid E.164 format
 */
export function isValidPhoneNumber(phone) {
  if (!phone) return false
  
  const formatted = formatPhoneNumber(phone)
  return formatted !== null
}

export default { formatPhoneNumber, isValidPhoneNumber }
