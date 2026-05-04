# MSG91 SMS Integration Troubleshooting Guide

## Current Status ❌

- API calls are being made
- MSG91 returning **404 Not Found** error
- Both `/apisms/send` and `/http/sendhttp.php` endpoints failing

## Credentials Being Used

- **API Key**: 513704AeGfIrNB1D69f8366dP1
- **Sender ID**: Pranathi
- **Route**: 4 (Promotional/Transactional)

## What to Check in MSG91 Dashboard

### 1. Verify API Key Status

- Login to https://www.msg91.com
- Go to **API Documentation** → **Authentication**
- Check if the API key is **Active** and not **Disabled**
- If red/disabled, regenerate a new API key

### 2. Check Sender ID Status

- Go to **SMS** → **Sender IDs**
- Verify "Pranathi" sender ID is **Approved** (blue status)
- If pending, approve it or use default sender ID temporarily

### 3. Verify Account Balance

- Go to **Dashboard** → **Wallet/Balance**
- Ensure you have **SMS credits available**
- 404 errors sometimes occur when account has no credits

### 4. Check Route Configuration

- Route 4 is for promotional/transactional messages
- Try Route 1 (promotional) if Route 4 is not available for your account

### 5. Test in MSG91 Dashboard

- Go to **SMS** → **Send SMS** → **Test Send**
- Send a test SMS directly from their dashboard
- If it fails here too, the account has issues

## Alternative Solution

If MSG91 is not working, we can switch to:

- **Twilio** - More reliable international SMS
- **AWS SNS** - Integrated with AWS services
- **Firebase Cloud Messaging** - Free for India
- **Nexmo/Vonage** - Widely used

## To Use These Credentials Now

If your MSG91 account is working, run:

```bash
node backend/test-sms-direct.js
```

The SMS test will automatically use the credentials from `backend/.env`
