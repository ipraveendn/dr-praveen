import { randomUUID } from 'crypto'
import { PrismaClient } from '@prisma/client'
import { getSupabaseClient } from '../utils/supabaseClient.js'

const prisma = new PrismaClient()
const BUCKET = 'prescriptions'

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/heic',
  'image/heif',
  'application/pdf',
])

function buildStoragePath(originalName) {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const safeName = (originalName || 'prescription')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 100)
  const shortUuid = randomUUID().replace(/-/g, '').slice(0, 8)

  return `${year}/${month}/${shortUuid}_${safeName}`
}

function isBucketMissingError(error) {
  const message = (error?.message || '').toLowerCase()
  return (
    message.includes('bucket not found') ||
    message.includes('does not exist') ||
    error?.statusCode === '404' ||
    error?.status === 404
  )
}

export const submitRequest = async (req, res) => {
  const customization = (req.body.customization || '').trim()
  const file = req.file

  if (!file && !customization) {
    return res.status(400).json({
      success: false,
      message: 'Please upload a prescription or provide a note for your request.',
    })
  }

  let prescriptionPath = null

  try {
    if (file) {
      const supabase = getSupabaseClient()
      if (!supabase) {
        return res.status(500).json({
          success: false,
          message: 'Pharmacy storage is not configured. Please contact support.',
        })
      }

      if (!ALLOWED_MIME_TYPES.has(file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: 'Please select a valid prescription image or PDF.',
        })
      }

      prescriptionPath = buildStoragePath(file.originalname)

      const { error: uploadError } = await supabase.storage
        .from(BUCKET)
        .upload(prescriptionPath, file.buffer, {
          contentType: file.mimetype,
          upsert: false,
        })

      if (uploadError) {
        console.error('[pharmacy] Storage upload failed:', uploadError)

        if (isBucketMissingError(uploadError)) {
          return res.status(500).json({
            success: false,
            message: 'Pharmacy storage bucket is not configured. Please contact support.',
          })
        }

        return res.status(500).json({
          success: false,
          message: 'Failed to upload prescription. Please try again.',
        })
      }
    }

    await prisma.pharmacyRequest.create({
      data: {
        prescriptionPath,
        customization: customization || null,
        status: 'Pending',
      },
    })

    return res.status(201).json({
      success: true,
      message: 'Request submitted successfully.',
    })
  } catch (error) {
    console.error('[pharmacy] Submit request failed:', error)

    return res.status(500).json({
      success: false,
      message: 'Failed to save your request. Please try again.',
    })
  }
}
