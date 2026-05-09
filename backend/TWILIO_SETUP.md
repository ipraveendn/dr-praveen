# Twilio SMS Integration Setup

## Overview

This project uses **Twilio** for sending SMS notifications when patients receive queue tokens. Patients receive their token number, clinic name, estimated wait time, and consultation reason via SMS.

## Prerequisites

- Active Twilio account (https://www.twilio.com)
- Twilio Account SID
- Twilio Auth Token
- Twilio Messaging Service SID
- Verified phone numbers (for trial accounts)

## Setup Instructions

### 1. Create Twilio Account

1. Visit https://www.twilio.com/try-twilio
2. Sign up with your email address
3. Verify your email address
4. Complete account setup

### 2. Get Twilio Credentials

#### Account SID & Auth Token

1. Go to **Twilio Dashboard** (https://console.twilio.com)
2. On the main dashboard, you'll see:
   - **Account SID** (under "Account")
   - **Auth Token** (shown with "Show" button)
3. Copy these values to your `.env` file

#### Phone Number

1. In Twilio Dashboard, go to **Explore > Phone Numbers**
2. Click **Create your first Twilio phone number** or go to **Manage > Phone Numbers > Active Numbers**
3. A phone number will be assigned to you (e.g., +1234567890)
4. Note this number for the Messaging Service configuration

### 3. Create Messaging Service

1. Go to **Messaging > Services** in Twilio Dashboard
2. Click **Create Service**
3. Enter a service name (e.g., "Dr. Praveen SMS Service")
4. Select service type: **Messaging**
5. Click **Create Service**
6. On the service page, go to **Sender Pool**
7. Add your Twilio phone number as a sender
8. Under **Sender Types**, add:
   - **Phone Numbers**: Select your Twilio number
9. Copy the **Service SID** (starts with `MG`)

### 4. Configure Environment Variables

Update `.env` in the backend folder:

```env
# Twilio SMS Configuration
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_MESSAGING_SERVICE_SID=MGxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

### 5. Install Dependencies

```bash
cd backend
npm install twilio dotenv
```

## Usage

### Send Simple SMS

```javascript
import { sendSMS } from "./utils/smsService.js";

const result = await sendSMS(
  "+919876543210", // Phone number with country code
  "Hello! This is your appointment token.",
);
```

### Send Appointment Notification

```javascript
import { sendAppointmentSMS } from "./utils/smsService.js";

const result = await sendAppointmentSMS(
  "+919876543210", // phone
  "Rajesh Kumar", // patientName
  "07", // token
  "25", // waitTime (minutes)
  "PCOS / PCOD", // reason
);
```

### Automatic SMS on Token Creation

When a patient books a token via `/queue/add` or `/queue/book`, SMS is automatically sent:

```javascript
// In queueController.js
const smsPayload = {
  name,
  phone,
  tokenNumber,
  clinic,
  reason,
  estimatedTime,
};
sendTokenNotificationSMS(smsPayload).catch((err) => {
  console.error("[SMS SEND FAILED]", err);
});
```

## SMS Format

**Message Sent to Patient:**

```
Hi Rajesh Kumar,

Your appointment token at Dr. Praveen's DiaPlus Clinic:

Token: 07
Clinic: DiaPlus
Estimated Wait: 25 mins
Reason: PCOS / PCOD

Please keep your token safe. You'll receive updates when it's your turn.

Dr. Praveen Ramachandra
Endocrinologist
```

## Testing

Run the test script:

```bash
cd backend
node test-sms.js
```

This will:

1. Send a test SMS with basic message
2. Send a test appointment notification
3. Send a test using token data object
4. Test phone number formatting

## Phone Number Formats Supported

The SMS service automatically handles various phone number formats:

- `+919876543210` (with country code and +)
- `919876543210` (with country code, no +)
- `9876543210` (10-digit number, auto-adds +91)

All are converted to: `+919876543210` (Indian format)

## Troubleshooting

### Error: "TWILIO_ACCOUNT_SID not configured"

- Ensure `.env` file has TWILIO_ACCOUNT_SID value
- Verify the value is copied correctly from Twilio Dashboard

### Error: "TWILIO_MESSAGING_SERVICE_SID not configured"

- Create a Messaging Service in Twilio Dashboard (see Setup Step 3)
- Copy the Service SID to `.env` file
- Service SID starts with `MG`

### SMS Not Sending

1. **Check credentials** - Verify all three environment variables are set
2. **Check phone number** - Ensure it's in valid format with country code
3. **Check Twilio balance** - For trial accounts, ensure sender number is verified
4. **Check logs** - Run test-sms.js to see detailed logging

### Trial Account Limitations

- **Can only send to verified phone numbers**
- **Send messages only from your Twilio number** (or verified senders)
- To send to any number, upgrade to a paid account

### Production Readiness

#### Before Production Deployment

1. ✅ Upgrade Twilio account to paid (remove sender verification requirement)
2. ✅ Set up phone number pool if handling high volume
3. ✅ Configure webhook for delivery receipts (optional)
4. ✅ Set up monitoring and error alerts
5. ✅ Test with real patient data
6. ✅ Implement SMS opt-in/opt-out handling (legal requirement)

#### Deployment Configuration

- Store TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_MESSAGING_SERVICE_SID in production secrets
- Use environment-specific configuration
- Enable error logging and monitoring

## API Reference

### sendSMS(phone, message)

**Parameters:**

- `phone` (string): Phone number in any format
- `message` (string): SMS text content

**Returns:** Promise resolving to `{ success: boolean, data?: Object, error?: string }`

### sendAppointmentSMS(phone, patientName, token, waitTime, reason)

**Parameters:**

- `phone` (string): Phone number
- `patientName` (string): Patient's full name
- `token` (string|number): Token number
- `waitTime` (string|number): Estimated wait time in minutes
- `reason` (string): Consultation reason

**Returns:** Promise resolving to `{ success: boolean, data?: Object, error?: string }`

### sendTokenNotificationSMS(tokenData)

**Parameters:**

- `tokenData` (object):
  - `name` (string): Patient name
  - `phone` (string): Phone number
  - `tokenNumber` (number): Token number
  - `clinic` (string): Clinic name (e.g., 'diaplus')
  - `estimatedTime` (string|number): Wait time
  - `reason` (string): Consultation reason

**Returns:** Promise resolving to `{ success: boolean, data?: Object, error?: string }`

## Indian SMS Restrictions & Compliance

- **Country Code**: Use +91 for Indian numbers
- **Sender Name**: Must be registered with telecom authority (Twilio handles this)
- **Content Rules**: No promotional/marketing content
- **Opt-in/Opt-out**: Must provide mechanism for users to unsubscribe

## Support & Documentation

- Twilio Documentation: https://www.twilio.com/docs
- Twilio SMS API: https://www.twilio.com/docs/sms
- Twilio Node.js Helper: https://www.twilio.com/docs/sms/quickstart/node
- Twilio Dashboard: https://console.twilio.com
