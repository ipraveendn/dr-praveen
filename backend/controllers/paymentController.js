// Payment Controller
// Handles payment processing, verification, and refunds

import { sendAppointmentSMS } from '../utils/smsService.js'

// Razorpay Configuration (placeholder - to be replaced with real keys)
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || 'rzp_test_key_placeholder'
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'rzp_test_secret_placeholder'

// Mock order storage (for development only)
const mockOrders = new Map()

/**
 * Create Razorpay order
 * Accepts amount and generates mock order ID
 * @param {Object} req - Express request object with body {amount}
 * @param {Object} res - Express response object
 */
export const createOrder = async (req, res) => {
  try {
    console.log('[createOrder] Request received:', JSON.stringify(req.body))
    const { amount } = req.body

    // Validate amount
    if (!amount || amount <= 0) {
      console.warn('[createOrder] Invalid amount:', amount)
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Valid amount is required',
        example: { amount: 500 }
      })
    }

    // Generate mock order ID
    const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

    // Store order in mock storage
    mockOrders.set(orderId, {
      amount,
      status: 'created',
      createdAt: new Date().toISOString(),
      currency: 'INR'
    })

    console.log('[RAZORPAY ORDER CREATED]', {
      orderId,
      amount,
      currency: 'INR'
    })

    res.status(201).json({
      success: true,
      orderId,
      amount,
      currency: 'INR',
      message: 'Order created successfully'
    })
  } catch (error) {
    console.error('[CREATE ORDER ERROR]', error)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

export const verifyPaymentRazorpay = async (req, res) => {
  try {
    console.log('\n' + '='.repeat(70))
    console.log('[PAYMENT VERIFICATION STARTED]')
    console.log('='.repeat(70))
    
    console.log('[PAYMENT VERIFICATION] Request received:', JSON.stringify(req.body))
    
    // Extract payment details
    const { orderId, paymentId, signature, name, phone, reason, clinic, amount } = req.body

    console.log('[PAYMENT DATA]')
    console.log('  Order ID:', orderId)
    console.log('  Payment ID:', paymentId)
    console.log('  Signature:', signature ? '✓ Provided' : '✗ Missing')
    console.log('  Patient Details:', name ? '✓ Provided' : '✗ Missing')
    console.log('  Phone:', phone ? phone : '✗ Missing')
    console.log('  Amount:', amount)

    // Validate required fields
    if (!orderId || !paymentId || !signature) {
      console.warn('[PAYMENT VALIDATION FAILED] Missing required fields:', { orderId, paymentId, signature })
      return res.status(400).json({
        error: 'Bad Request',
        message: 'orderId, paymentId, and signature are required',
        required: ['orderId', 'paymentId', 'signature']
      })
    }

    // Add realistic delay for payment verification (0.5-1 second)
    const verificationDelay = 500 + Math.random() * 500
    await new Promise(resolve => setTimeout(resolve, verificationDelay))

    // Check if order exists in mock storage
    const order = mockOrders.get(orderId)
    if (!order) {
      console.warn('[PAYMENT VERIFICATION FAILED] Order not found:', orderId)
      return res.status(404).json({
        error: 'Not Found',
        message: 'Order not found',
        success: false
      })
    }

    // Optional simulation of occasional backend verification failures.
    // Keep demos deterministic by default: enable only when explicitly requested.
    const simulateFailures = (process.env.SIMULATE_PAYMENT_FAILURES || 'false').toLowerCase() === 'true'
    if (simulateFailures) {
      const randomValue = Math.random() * 100
      if (randomValue < 5) {
        console.log('[SIMULATED VERIFICATION FAILURE]', {
          orderId,
          paymentId,
          reason: 'Backend verification timeout'
        })
        
        return res.status(500).json({
          error: 'Verification Failed',
          message: 'Payment verification service temporarily unavailable. Please retry.',
          success: false
        })
      }
    }

    // TODO: Replace with real Razorpay signature verification
    // Real implementation:
    // const crypto = require('crypto')
    // const generated_signature = crypto
    //   .createHmac('sha256', RAZORPAY_KEY_SECRET)
    //   .update(orderId + '|' + paymentId)
    //   .digest('hex')
    // const isSignatureValid = generated_signature === signature

    // For now, accept all verifications (development only)
    const isSignatureValid = true

    if (!isSignatureValid) {
      console.error('[PAYMENT SIGNATURE INVALID]', { orderId, paymentId })
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid payment signature',
        success: false
      })
    }

    // ========== PAYMENT VERIFIED ==========
    console.log('\n[PAYMENT VERIFIED] ✓')
    console.log('  Order ID:', orderId)
    console.log('  Payment ID:', paymentId)
    console.log('  Amount:', order.amount, 'INR')
    
    // Update order status
    order.status = 'verified'
    order.paymentId = paymentId
    order.verifiedAt = new Date().toISOString()
    
    // ========== HANDLE OPTIONAL SMS AFTER PAYMENT ==========
    if (name && phone && reason && clinic) {
      console.log('\n[SMS AFTER PAYMENT]')
      console.log('  Patient details provided with payment verification')
      console.log('  PATIENT NAME:', name)
      console.log('  PHONE:', phone)
      console.log('  REASON:', reason)
      console.log('  CLINIC:', clinic)
      console.log('  CALLING sendAppointmentSMS()...')
      
      try {
        // Generate a temporary token number for the SMS
        const tempTokenNumber = `T-${orderId.substr(-6)}`
        const estimatedWait = '5-10 mins'
        
        const smsResult = await sendAppointmentSMS(
          phone,
          name,
          tempTokenNumber,
          estimatedWait,
          reason
        )
        
        if (smsResult.success) {
          console.log('[SMS SENT SUCCESSFULLY AFTER PAYMENT]')
          console.log('  MESSAGE ID:', smsResult.data?.messageSid)
          console.log('  STATUS:', smsResult.data?.status)
        } else {
          console.error('[SMS SEND ERROR AFTER PAYMENT]', smsResult.error)
        }
      } catch (smsErr) {
        console.error('[SMS EXCEPTION AFTER PAYMENT]', smsErr.message)
        // Don't fail payment if SMS fails
      }
    }

    console.log('='.repeat(70) + '\n')

    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      orderId,
      paymentId,
      amount: order.amount,
      transactionId: `TXN_${Date.now()}`,
      nextAction: name && phone ? 'SMS_SENT_REDIRECT_TO_CONFIRMATION' : 'REDIRECT_TO_QUEUE_BOOKING'
    })
  } catch (error) {
    console.error('[VERIFY PAYMENT EXCEPTION]', error.message)
    console.error('  STACK:', error.stack)
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message,
      success: false
    })
  }
}

/**
 * Initiate payment (Legacy function)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const initiatePayment = async (req, res) => {
  try {
    // TODO: Implement payment initiation logic
    res.status(201).json({ message: 'Payment initiated' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * Verify payment (Legacy function)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const verifyPayment = async (req, res) => {
  try {
    // TODO: Implement payment verification logic
    res.status(200).json({ message: 'Payment verified' })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * Get payment history for a patient
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getPaymentHistory = async (req, res) => {
  try {
    const { patientId } = req.params
    // TODO: Implement get payment history logic
    res.status(200).json({ message: 'Payment history retrieved', patientId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}

/**
 * Process refund for a payment
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const processRefund = async (req, res) => {
  try {
    const { paymentId } = req.params
    // TODO: Implement refund processing logic
    res.status(200).json({ message: 'Refund processed', paymentId })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
}
