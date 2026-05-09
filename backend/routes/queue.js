import express from 'express'
import { 
  getQueueData,
  addToken,
  bookToken, 
  trackQueue, 
  getQueueStatus, 
  callNextPatient, 
  completeConsultation,
  completeConsultationByTokenNumber,
  moveQueueForward
} from '../controllers/queueController.js'
import authMiddleware from '../middleware/authMiddleware.js'

const router = express.Router()

// Basic Queue APIs (compatible with React frontend)
router.get('/', getQueueData)                    // Fetch queue data
router.post('/add', addToken)                    // Add new token
router.post('/next', moveQueueForward)           // Move queue forward (Admin Dashboard)

// Additional Queue routes
router.post('/book', bookToken)
router.get('/track/:id', trackQueue)  // Updated: now accepts tracking ID or phone (backward compatible)
router.get('/status/:clinicId', getQueueStatus)
router.patch('/call-next/:clinicId', authMiddleware, callNextPatient)
router.patch('/complete/:tokenNumber', completeConsultationByTokenNumber)
// Legacy body-based completion (kept for compatibility)
router.patch('/complete-body', authMiddleware, completeConsultation)

export default router
