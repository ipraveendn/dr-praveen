/**
 * Test SMS Integration
 * Run with: node backend/test-sms.js
 */

import { sendSMS, sendTokenNotificationSMS, formatTokenMessage } from './utils/smsService.js'

async function testSMS() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║  SMS Integration Test                         ║')
  console.log('╚════════════════════════════════════════════════╝\n')

  // Test 1: Raw SMS
  console.log('Test 1: Sending raw SMS...')
  const result1 = await sendSMS('9876543210', 'This is a test SMS from Dr. Praveen Healthcare System')
  console.log('Result:', result1, '\n')

  // Test 2: Format token message
  console.log('Test 2: Token notification message format...')
  const tokenData = {
    name: 'Rajesh Kumar',
    phone: '9876543210',
    tokenNumber: 7,
    clinic: 'diaplus',
    reason: 'PCOS / PCOD',
    estimatedTime: '25 mins'
  }
  const formattedMessage = formatTokenMessage(tokenData)
  console.log('Formatted Message:')
  console.log(formattedMessage)
  console.log('\n')

  // Test 3: Send token notification
  console.log('Test 3: Sending token notification SMS...')
  const result3 = await sendTokenNotificationSMS(tokenData)
  console.log('Result:', result3, '\n')

  // Test 4: Multiple clinic types
  console.log('Test 4: Testing ThyroPlus clinic...')
  const tokenData2 = {
    name: 'Priya Singh',
    phone: '9123456780',
    tokenNumber: 12,
    clinic: 'thyroplus',
    reason: 'Thyroid Consultation',
    estimatedTime: '15 mins'
  }
  const result4 = await sendTokenNotificationSMS(tokenData2)
  console.log('Result:', result4, '\n')

  console.log('╔════════════════════════════════════════════════╗')
  console.log('║  Tests Complete                              ║')
  console.log('╚════════════════════════════════════════════════╝')
}

testSMS().catch(console.error)
