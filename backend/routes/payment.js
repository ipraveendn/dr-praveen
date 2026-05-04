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
router.post('/create-order', createOrder)
router.post('/verify', verifyPaymentRazorpay)

// Additional payment routes
router.post('/initiate', authMiddleware, initiatePayment)
router.get('/history/:patientId', authMiddleware, getPaymentHistory)
router.post('/refund/:paymentId', authMiddleware, processRefund)

// GET handler for /api/payment base path info
router.get('/', (req, res) => {
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
