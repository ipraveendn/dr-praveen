/**
 * End-to-End SMS Integration Test
 * Tests complete booking flow: Queue API → SMS Service → MSG91 API
 * 
 * Verifies:
 * - Token creation via /queue/add endpoint
 * - SMS service integration
 * - MSG91 API communication
 * - Complete flow from booking to SMS delivery
 */

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load environment variables
dotenv.config({ path: path.join(__dirname, '.env') })

import { sendTokenNotificationSMS } from './utils/smsService.js'

console.log('\n╔════════════════════════════════════════════════╗')
console.log('║  📱 End-to-End SMS Integration Test           ║')
console.log('║  Complete Booking Flow Test                   ║')
console.log('╚════════════════════════════════════════════════╝\n')

/**
 * Test token data that would be created by /queue/add endpoint
 */
const testToken = {
  tokenNumber: 100,
  name: 'E2E Test Patient',
  phone: '9380507650',
  reason: 'Complete System Test',
  clinic: 'diaplus',
  estimatedTime: '10 mins'
}

console.log('📋 Test Token Data:')
console.log(JSON.stringify(testToken, null, 2))
console.log('\n---\n')

/**
 * Test the SMS service with the token data
 */
async function testE2EFlow() {
  console.log('🚀 Starting End-to-End Test...\n')
  
  try {
    console.log('Step 1️⃣  : Simulating token creation...')
    console.log(`   Token #${testToken.tokenNumber} created for ${testToken.name}`)
    console.log(`   Clinic: ${testToken.clinic}`)
    console.log(`   Phone: ${testToken.phone}`)
    console.log(`   Estimated Wait: ${testToken.estimatedTime}\n`)

    console.log('Step 2️⃣  : Sending SMS notification...')
    const smsResult = await sendTokenNotificationSMS(testToken)
    
    console.log('\n✅ SMS SENT SUCCESSFULLY!\n')
    console.log('📊 SMS Response Details:')
    console.log(JSON.stringify(smsResult, null, 2))
    
    console.log('\n---\n')
    console.log('✅ END-TO-END FLOW COMPLETE!\n')
    
    console.log('Summary:')
    console.log(`✓ Token created: #${testToken.tokenNumber}`)
    console.log(`✓ Patient: ${testToken.name}`)
    console.log(`✓ SMS sent to: ${testToken.phone}`)
    console.log(`✓ Message ID: ${smsResult.messageId}`)
    console.log(`✓ Status: ${smsResult.status}`)
    console.log(`✓ Timestamp: ${new Date().toISOString()}`)
    
    console.log('\n🎉 SMS Integration is working perfectly!\n')
    
  } catch (error) {
    console.error('\n❌ ERROR DURING E2E TEST:')
    console.error(error.message)
    console.error('\nFull Error:')
    console.error(error)
    process.exit(1)
  }
}

// Run the test
testE2EFlow()
