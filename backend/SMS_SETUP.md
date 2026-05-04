# SMS Integration Setup - MSG91

## Overview

This project uses **MSG91** for sending SMS notifications when patients receive queue tokens. Patients receive their token number, clinic name, estimated wait time, and consultation reason via SMS.

## Prerequisites

- Active MSG91 account (https://msg91.com)
- MSG91 API Key
- Sender ID (default: `DRPRAVEENDENT`)

## Setup Instructions

### 1. Create MSG91 Account

1. Visit https://msg91.com
2. Sign up and verify your account
3. Add your business details and verify

### 2. Get API Credentials

1. Go to **Panel > API** in MSG91 dashboard
2. Copy your **Authentication Key** (API Key)
3. Note your **Sender ID** (or use default: `DRPRAVEENDENT`)
4. Verify the Sender ID is approved by MSG91

### 3. Configure Environment Variables

In `/backend/.env`, add:

```env
MSG91_API_KEY=your_msg91_authentication_key_here
MSG91_SENDER_ID=DRPRAVEENDENT
MSG91_ROUTE=4
```

**Route Types:**

- `1` = Transactional (OTP, alerts)
- `4` = Promotional (Offers, messages)
- Use `4` for appointment notifications

### 4. How It Works

When a patient creates a token (books appointment):

```javascript
// POST /api/queue/add
{
  name: "John Doe",
  phone: "9876543210",
  reason: "Diabetes Checkup",
  clinic: "diaplus"
}
```

The system:

1. Creates the token
2. Calculates estimated wait time
3. Sends SMS with details:

```
Hi John Doe,

Your appointment token at Dr. Praveen's DiaPlus Clinic:

🎫 Token: #05
📍 Clinic: DiaPlus
⏱️ Estimated Wait: 20 mins
🏥 Reason: Diabetes Checkup

Please keep your token safe. You'll receive updates when it's your turn.

Dr. Praveen Ramachandra
Endocrinologist
```

### 5. Testing

**Test SMS sending:**

```bash
# Run the test script
node backend/test-sms.js
```

**Manual test:**
Make a POST request to `/api/queue/add`:

```bash
curl -X POST http://localhost:5000/api/queue/add \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "phone": "9876543210",
    "reason": "Diabetes Checkup",
    "clinic": "diaplus"
  }'
```

Check the server logs for SMS delivery status.

### 6. SMS Costs

- Check MSG91 pricing on your account dashboard
- Typical SMS cost: ₹1-2 per message in India
- Recommend adding SMS credits to account

### 7. Troubleshooting

**SMS not sending?**

- Check `MSG91_API_KEY` is correct in `.env`
- Verify sender ID is approved by MSG91
- Check MSG91 account has SMS credits
- Review server logs for error messages
- Test with MSG91 provided test API

**Check Delivery:**

- MSG91 dashboard shows delivery reports
- Monitor `/backend/server.js` logs for `[SMS SENT]` or `[SMS ERROR]`

**Invalid phone numbers:**

- Phone must be 10 digits (for India)
- Automatically converted to 91XXXXXXXXXX format
- Verify format: `9876543210` ✓ or `919876543210` ✓

### 8. Optimization

**Future enhancements:**

- Send SMS when consultation is starting (call next patient)
- Send SMS when consultation is complete
- Send SMS reminders before appointment
- Track SMS delivery status in database
- Handle SMS failures gracefully

### 9. API Reference

**SMS Service Functions:**

```javascript
import {
  sendSMS,
  sendTokenNotificationSMS,
  formatTokenMessage,
} from "./utils/smsService.js";

// Send raw SMS
await sendSMS("9876543210", "Your message here");

// Send token notification (automatic formatting)
await sendTokenNotificationSMS({
  name: "John",
  phone: "9876543210",
  tokenNumber: 5,
  clinic: "diaplus",
  reason: "Checkup",
  estimatedTime: "20 mins",
});

// Format token message
const message = formatTokenMessage(tokenData);
```

---

**Note:** Token creation continues even if SMS fails. SMS sending is non-blocking to ensure smooth user experience.
