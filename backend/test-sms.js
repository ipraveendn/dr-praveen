/**
 * Test Twilio SMS Integration
 * Run with: node backend/test-sms.js
 */

import { sendSMS, sendAppointmentSMS, sendTokenNotificationSMS } from './utils/smsService.js'

async function testSMS() {
  console.log('╔════════════════════════════════════════════════╗')
  console.log('║  Twilio SMS Integration Test                  ║')
  console.log('╚════════════════════════════════════════════════╝\n')

  // Test 1: Raw SMS
  console.log('Test 1: Sending raw SMS...')
  const result1 = await sendSMS('+919876543210', 'This is a test SMS from Dr. Praveen Healthcare System')
  console.log('Result:', result1, '\n')

  // Test 2: Send appointment notification
  console.log('Test 2: Sending appointment notification SMS...')
  const result2 = await sendAppointmentSMS(
    '+919876543210',           // phone
    'Rajesh Kumar',             // patientName
    '07',                       // token
    '25',                       // waitTime
    'PCOS / PCOD'               // reason
  )
  console.log('Result:', result2, '\n')

  // Test 3: Send token notification using token data object
  console.log('Test 3: Sending token notification SMS (backward compatibility)...')
  const tokenData = {
    name: 'Priya Singh',
    phone: '+919123456780',
    tokenNumber: 12,
    clinic: 'diaplus',
    reason: 'Thyroid Consultation',
    estimatedTime: '15 mins'
  }
  const result3 = await sendTokenNotificationSMS(tokenData)
  console.log('Result:', result3, '\n')

  // Test 4: Multiple clinic types with proper formatting
  console.log('Test 4: Testing with different phone format (without country code)...')
  const result4 = await sendAppointmentSMS(
    '9987654321',               // phone without +91
    'Meera Iyer',               // patientName
    '03',                       // token
    '10',                       // waitTime
    'Diabetes Checkup'          // reason
  )
  console.log('Result:', result4, '\n')

  console.log('╔════════════════════════════════════════════════╗')
  console.log('║  Tests Complete                              ║')
  console.log('╚════════════════════════════════════════════════╝')
}

testSMS().catch(console.error)
