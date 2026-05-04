import express from 'express'
import { 
  createOrder,
  verifyPaymentRazorpay,
  initiatePayment, 
  verifyPayment, 
  getPaymentHistory, 
  processRefund 
} from '../controllers/paymentController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

// Debug middleware for payment routes
router.use((req, res, next) => {
  console.log(`[PAYMENT ROUTE] ${req.method} ${req.originalUrl}`)
  next()
})

// Razorpay Payment APIs
router.post('/create-order', (req, res, next) => {
  console.log('[PAYMENT] POST /create-order called')
  createOrder(req, res, next)
})

router.post('/verify', (req, res, next) => {
  console.log('[PAYMENT] POST /verify called')
  verifyPaymentRazorpay(req, res, next)
})

// Additional payment routes
router.post('/initiate', authMiddleware, (req, res, next) => {
  console.log('[PAYMENT] POST /initiate called')
  initiatePayment(req, res, next)
})

router.get('/history/:patientId', authMiddleware, (req, res, next) => {
  console.log('[PAYMENT] GET /history/:patientId called')
  getPaymentHistory(req, res, next)
})

router.post('/refund/:paymentId', authMiddleware, (req, res, next) => {
  console.log('[PAYMENT] POST /refund/:paymentId called')
  processRefund(req, res, next)
})

// GET handler for /api/payment base path info
router.get('/', (req, res) => {
  console.log('[PAYMENT] GET / called')
  res.json({
    message: 'Payment API',
    endpoints: {
      createOrder: 'POST /create-order - Create Razorpay order',
      verify: 'POST /verify - Verify payment',
      initiate: 'POST /initiate - Initiate payment',
      history: 'GET /history/:patientId - Get payment history',
      refund: 'POST /refund/:paymentId - Process refund'
    }
  })
})

export default router
