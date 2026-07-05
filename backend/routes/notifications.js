import express from 'express'
import { sendWhatsAppConfirmation } from '../controllers/notificationController.js'

const router = express.Router()

router.post('/whatsapp', sendWhatsAppConfirmation)

export default router
