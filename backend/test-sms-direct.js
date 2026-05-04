import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendSMS, sendTokenNotificationSMS, formatTokenMessage } from './utils/smsService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '.env') });

console.log('Environment Check:');
console.log('MSG91_API_KEY:', process.env.MSG91_API_KEY ? '✓ Loaded' : '✗ Missing');
console.log('MSG91_SENDER_ID:', process.env.MSG91_SENDER_ID || 'Using Default');
console.log('---\n');

async function testSMS() {
  console.log('🚀 Test 1: Send Simple Direct SMS...\n');
  
  const result1 = await sendSMS('9380507650', 'Dr. Praveen Healthcare - Direct SMS Test ✓');
  
  console.log('📊 Test 1 Response:');
  console.log(JSON.stringify(result1, null, 2));
  console.log('\n---\n');

  console.log('🚀 Test 2: Send Token Notification SMS...\n');
  
  const tokenData = {
    name: 'Test User',
    phone: '9380507650',
    tokenNumber: 5,
    clinic: 'diaplus',
    estimatedTime: '15',
    reason: 'Diabetes Checkup'
  };

  console.log('📝 Formatted Message:');
  console.log(formatTokenMessage(tokenData));
  console.log('\n---\n');

  const result2 = await sendTokenNotificationSMS(tokenData);
  
  console.log('📊 Test 2 Response:');
  console.log(JSON.stringify(result2, null, 2));
  
  process.exit(0);
}

testSMS();


