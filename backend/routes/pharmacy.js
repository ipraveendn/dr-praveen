import express from 'express'
import multer from 'multer'
import { submitRequest } from '../controllers/pharmacyController.js'

const router = express.Router()

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const isImage = file.mimetype.startsWith('image/')
    const isPdf = file.mimetype === 'application/pdf'

    if (isImage || isPdf) {
      cb(null, true)
      return
    }

    cb(new Error('Please select a valid prescription image or PDF.'))
  },
})

router.post('/request', (req, res, next) => {
  upload.single('prescription')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'Prescription file is too large. Please upload a file under 10 MB.',
        })
      }

      return res.status(400).json({
        success: false,
        message: 'Failed to process prescription file. Please try again.',
      })
    }

    if (err) {
      return res.status(400).json({
        success: false,
        message: err.message || 'Please select a valid prescription image or PDF.',
      })
    }

    return submitRequest(req, res, next)
  })
})

export default router
