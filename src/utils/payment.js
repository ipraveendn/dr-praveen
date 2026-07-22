/**
 * Payment Integration Utility
 * Handles Razorpay payment flow for token booking
 */

import { apiRequest } from './api'

/**
 * Create payment order
 * @param {number} amount - Amount in INR
 * @returns {Promise<Object>} - Order details {orderId, amount, currency}
 */
export async function createPaymentOrder(amount = 750) {
  try {
    return await apiRequest('/payment/create-order', {
      method: 'POST',
      body: JSON.stringify({ amount })
    })
  } catch (error) {
    console.error('[CREATE ORDER ERROR]', error)
    throw error
  }
}

/**
 * Verify payment with backend
 * @param {Object} paymentDetails - {orderId, paymentId, signature}
 * @returns {Promise<Object>} - Verification result
 */
export async function verifyPayment(paymentDetails) {
  try {
    return await apiRequest('/payment/verify', {
      method: 'POST',
      body: JSON.stringify(paymentDetails)
    })
  } catch (error) {
    console.error('[VERIFY PAYMENT ERROR]', error)
    throw error
  }
}

/**
 * Simulate Razorpay payment
 * For development/testing purposes
 * Simulates realistic payment processing with optional 10% failure rate
 * @param {string} orderId - Order ID from backend
 * @param {number} failureRate - Percentage chance of failure (0-100, default 10)
 * @returns {Promise<Object>} - Mock payment details {paymentId, signature} or throws error on failure
 */
export function simulateRazorpayPayment(orderId, failureRate = 10) {
  return new Promise((resolve, reject) => {
    // Simulate realistic payment processing delay (1-2 seconds)
    const delay = 1000 + Math.random() * 1000
    
    setTimeout(() => {
      // Simulate occasional payment failures (10% by default)
      const randomValue = Math.random() * 100
      if (randomValue < failureRate) {
        // Simulate payment failure
        const failureReasons = [
          'Insufficient balance',
          'Card declined by bank',
          'Transaction timeout',
          'Invalid card details',
          'Daily transaction limit exceeded'
        ]
        const reason = failureReasons[Math.floor(Math.random() * failureReasons.length)]
        
        console.error('[SIMULATED PAYMENT FAILURE]', {
          orderId,
          reason
        })
        
        reject(new Error(`Payment failed: ${reason}`))
        return
      }

      // Generate mock payment ID and signature (realistic format)
      const paymentId = `pay_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const signature = `sig_${Math.random().toString(36).substr(2, 20)}`

      console.log('[SIMULATED PAYMENT SUCCESS]', {
        orderId,
        paymentId
      })

      resolve({
        paymentId,
        signature,
        orderId
      })
    }, delay)
  })
}

export default {
  createPaymentOrder,
  verifyPayment,
  simulateRazorpayPayment
}
