// Queue Controller
// Handles queue management, token booking, and queue tracking

import { sendTokenNotificationSMS } from '../utils/smsService.js'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

/**
 * Get current queue data
 * Returns real queue status with sequential tokens
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getQueueData = async (req, res) => {
  try {
    const { clinic } = req.query

    const tokens = await prisma.token.findMany({
      where: {
        clinic: {
          name: clinic
        }
      },
      include: {
        patient: true
      }
    });

    const waitingTokens = tokens.filter(token => token.status === 'WAITING')
    const waitingCount = waitingTokens.length

    const estimatedTime = waitingCount * 5

    const serving = tokens.find(token => token.status === 'SERVING')
    const currentToken = serving
      ? serving.tokenNumber
      : (tokens.length > 0 ? tokens[0].tokenNumber : 0)

    const patients = tokens.map(token => ({
      tokenNumber: token.tokenNumber,
      name: token.patient.name,
      phone: token.patient.phone,
      clinic: token.clinic.name,
      status: token.status,
      reason: token.reasonForVisit
    }))

    const queueData = {
      currentToken,
      waiting: waitingCount,
      estimatedTime: `${estimatedTime} mins`,
      patients
    }

    res.status(200).json({
      success: true,
      data: queueData,
      message: 'Queue data retrieved'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Add new token to queue
 * Accepts patient details and generates SEQUENTIAL token number
 * @param {Object} req - Express request object with body {name, phone, reason, clinic, trackingUrl}
 * @param {Object} res - Express response object
 */
export const addToken = async (req, res) => {
  try {
    const {
  name,
  phone,
  email,
  place,
  reason,
  clinic,
  trackingUrl
} = req.body

    // Validate required fields
    if (!name || !phone || !reason || !clinic) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name, phone, reason, and clinic are required',
        required: ['name', 'phone', 'reason', 'clinic']
      })
    }

    const lastToken = await prisma.token.findFirst({
      orderBy: {
        tokenNumber: "desc"
      }
    });

    const nextTokenNumber = lastToken
      ? lastToken.tokenNumber + 1
      : 1;

try {

    let patient = await prisma.patient.findUnique({
      where: {
        phone: String(phone)
      }
    })

    const clinicRecord = await prisma.clinic.findUnique({
      where: {
        name: String(clinic)
      }
    })
    
    let clinic_id = null
    
    if (clinicRecord) {
      clinic_id = clinicRecord.id
    } else {
      const newClinic = await prisma.clinic.create({
        data: {
          name: String(clinic),
          address: 'Default Address'
        }
      })
      clinic_id = newClinic.id
    }

    if (!patient) {
      // Generate unique patientId
      const patientId = `PAT_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      const clinic = await prisma.clinic.findUnique({ where: { id: clinic_id } }) 
      patient = await prisma.patient.create({
        data: {
          patientId: patientId,
          name: String(name),
          phone: String(phone),
          email: email ? String(email) : null,
          place: place ? String(place) : null,
          age: 0,  // Default age since not provided
          gender: 'Not Specified',  // Default gender
          reason: String(reason),
          clinicId: clinic_id,
          clinicName: clinic?.name || "Unknown Clinic"
        }
      })
    }

    const tokenRecord = await prisma.token.create({
      data: {
        tokenNumber: nextTokenNumber,
        reasonForVisit: String(reason || "General Consultation"),
        status: 'WAITING',
        clinicId: clinic_id,
        patientId: patient.id
      }
    })

} catch (dbError) {

  return res.status(500).json({
    success: false,
    error: 'Database insert failed',
    details: dbError.message
  })
}
    // Calculate estimated wait time
    const waitingPatients = await prisma.token.count({ where: { status: 'WAITING' } })
    const estimatedTime = `${waitingPatients * 5} mins`

    // ========== SEND SMS NOTIFICATION ==========
    let smsResult = { success: false, error: 'SMS not sent' }

    // Validate phone number before sending SMS
    if (!phone || phone.toString().trim() === '') {
      console.error('[PHONE NUMBER MISSING] Cannot send SMS without patient phone number')
    } else {
      
      const smsPayload = {
        name,
        phone,
        tokenNumber: nextTokenNumber,
        clinic,
        reason,
        estimatedTime,
        trackingUrl
      }
      
      try {
        // Send SMS and wait for result
        smsResult = await sendTokenNotificationSMS(smsPayload)
        
      } catch (err) {
        smsResult = {
          success: false,
          error: err.message
        }
      }
    }

    res.status(201).json({
      success: true,
      data: {
        tokenNumber: nextTokenNumber,
        clinic,
        patient: name,
        phone,
        reason,
        estimatedTime,
        trackingUrl
      },
      sms: smsResult,
      message: 'Token created successfully'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message,
      code: error.code || 'UNKNOWN_ERROR'
    })
  }
}

/**
 * Book a queue token
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const bookToken = async (req, res) => {
  try {
    // For this project, "book token" is the same as creating a new token entry.
    // Keep a dedicated endpoint for frontend compatibility.
    const { name, phone, email, place, reason, clinic } = req.body

    if (!name || !phone || !reason || !clinic) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'name, phone, reason, and clinic are required',
        required: ['name', 'phone', 'reason', 'clinic']
      })
    }

    const lastToken = await prisma.token.findFirst({
      orderBy: {
        tokenNumber: "desc"
      }
    });

    const nextTokenNumber = lastToken
      ? lastToken.tokenNumber + 1
      : 1;

    res.status(201).json({
      success: true,
      data: {
        tokenNumber: nextTokenNumber,
        clinic,
        patient: name,
        phone,
        reason
      },
      message: 'Token booked successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Track queue by phone number
 * @param {Object} req - Express request object with params {phone}
 * @param {Object} res - Express response object
 */
export const trackQueue = async (req, res) => {
  try {
    const { phone } = req.query

    let token = null

    if (phone) {
      const searchPhone = phone
      token = await prisma.token.findFirst({
        where: {
          patient: {
            phone: searchPhone
          }
        },
        include: {
          patient: true,
          clinic: true
        }
      });
      
      if (!token) {
        return res.status(404).json({
          error: 'Not Found',
          message: 'Token not found for this phone number'
        })
      }
    }
    else {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'Phone number required'
      })
    }

    // Count how many tokens are ahead in the queue
    const tokensAhead = await prisma.token.count({
      where: {
        status: 'WAITING',
        tokenNumber: {
          lt: token.tokenNumber
        }
      }
    });

    const trackingData = {
      tokenNumber: token.tokenNumber,
      patient: token.patient.name,
      phone: token.patient.phone,
      clinic: token.clinic.name,
      reason: token.reasonForVisit,
      status: token.status,
      tokensAhead,
      estimatedWaitTime: `${tokensAhead * 5} mins`,
      bookedAt: token.createdAt,
      position: token.tokenNumber,
      totalInQueue: await prisma.token.count()
    }

    res.status(200).json({
      success: true,
      data: trackingData,
      message: 'Queue tracking data retrieved'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Get queue status for a clinic
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getQueueStatus = async (req, res) => {
  try {
    const { clinicId } = req.params

    // Get all tokens for this clinic
    const clinicTokens = await prisma.token.findMany({
      where: {
        clinic: {
          name: clinicId
        }
      }
    });
    const waitingCount = clinicTokens.filter(t => t.status === 'WAITING').length
    const servingToken = clinicTokens.find(t => t.status === 'SERVING')

    const statusData = {
      clinic: clinicId,
      currentToken: servingToken ? servingToken.tokenNumber : null,
      waitingCount,
      totalTokens: clinicTokens.length,
      estimatedTime: `${waitingCount * 5} mins`
    }

    res.status(200).json({
      success: true,
      data: statusData,
      message: 'Queue status retrieved'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Call next patient in queue
 * @param {Object} req - Express request object with body {clinic}
 * @param {Object} res - Express response object
 */
export const callNextPatient = async (req, res) => {
  try {
    const { clinic } = req.body

    if (!clinic) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'clinic is required'
      })
    }

    const currentServingToken = await prisma.token.findFirst({
      where: {
        clinic: {
          name: clinic
        },
        status: 'SERVING'
      }
    });

    if (currentServingToken) {
      await prisma.token.update({
        where: {
          id: currentServingToken.id
        },
        data: {
          status: 'COMPLETED'
        }
      });
    }

    // Get first waiting token for this clinic
    const nextToken = await prisma.token.findFirst({
      where: {
        clinic: {
          name: clinic
        },
        status: 'WAITING'
      },
      orderBy: {
        tokenNumber: 'asc'
      },
      include: {
        patient: true
      }
    });

    if (!nextToken) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'No waiting tokens in queue'
      })
    }

    // Update token status to serving
    const updatedToken = await prisma.token.update({
      where: {
        id: nextToken.id
      },
      data: {
        status: 'SERVING'
      },
      include: {
        patient: true
      }
    });

    res.status(200).json({
      success: true,
      data: {
        tokenNumber: updatedToken.tokenNumber,
        patient: updatedToken.patient.name,
        phone: updatedToken.patient.phone,
        reason: updatedToken.reasonForVisit,
        clinic
      },
      message: 'Next patient called'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Mark consultation as complete
 * @param {Object} req - Express request object with body {tokenNumber}
 * @param {Object} res - Express response object
 */
export const completeConsultation = async (req, res) => {
  try {
    const { tokenNumber } = req.body

    if (!tokenNumber) {
      return res.status(400).json({
        error: 'Bad Request',
        message: 'tokenNumber is required'
      })
    }

    // Find token by number
    const token = await prisma.token.findFirst({
      where: {
        tokenNumber: tokenNumber
      },
      include: {
        patient: true
      }
    });

    if (!token) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'Token not found'
      })
    }

    // Mark token as done
    await prisma.token.update({
      where: {
        id: token.id
      },
      data: {
        status: 'COMPLETED'
      }
    });

    res.status(200).json({
      success: true,
      data: {
        tokenNumber,
        patient: token.patient.name,
        status: 'COMPLETED'
      },
      message: 'Consultation marked as complete'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Complete consultation by token number (route param)
 * PATCH /api/queue/complete/:tokenNumber
 */
export const completeConsultationByTokenNumber = async (req, res) => {
  try {
    const tokenNumber = Number(req.params.tokenNumber)

    if (!tokenNumber || Number.isNaN(tokenNumber)) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'tokenNumber must be a number'
      })
    }

    const token = await prisma.token.update({
      where: {
        tokenNumber: tokenNumber
      },
      data: {
        status: 'COMPLETED'
      },
      include: {
        patient: true,
        clinic: true
      }
    });

    if (!token) {
      return res.status(404).json({
        success: false,
        error: 'Not Found',
        message: 'Token not found'
      })
    }

    const waitingCount = await prisma.token.count({ where: { status: 'WAITING' } })
    const estimatedTime = waitingCount * 5
    const serving = await prisma.token.findFirst({ where: { status: 'SERVING' } });
    const currentToken = serving ? serving.tokenNumber : 0

    const patients = await prisma.token.findMany({
      include: {
        patient: true,
        clinic: true
      }
    });

    const patientData = patients.map(p => ({
      tokenNumber: p.tokenNumber,
      name: p.patient.name,
      phone: p.patient.phone,
      clinic: p.clinic.name,
      status: p.status,
      reason: p.reasonForVisit
    }));

    return res.status(200).json({
      success: true,
      data: {
        currentToken,
        waiting: waitingCount,
        estimatedTime: `${estimatedTime} mins`,
        patients: patientData
      },
      message: 'Consultation marked as complete'
    })
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Get all tokens in queue (for admin/monitoring)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const getAllTokens = async (req, res) => {
  try {

    const tokens = await prisma.token.findMany({
      include: {
        patient: true,
        clinic: true
      }
    });

    const stats = {
      total: await prisma.token.count(),
      waiting: await prisma.token.count({ where: { status: 'WAITING' } }),
      serving: await prisma.token.count({ where: { status: 'SERVING' } }),
      done: await prisma.token.count({ where: { status: 'COMPLETED' } }),
      nextTokenNumber: (await prisma.token.findFirst({ orderBy: { tokenNumber: 'desc' } }))?.tokenNumber + 1 || 1
    }

    res.status(200).json({
      success: true,
      data: {
        stats,
        tokens: tokens.map(t => ({
          ...t,
          patient: t.patient.name,
          clinic: t.clinic.name
        }))
      },
      message: 'All tokens retrieved'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Reset queue for new day (admin only)
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const resetQueue = async (req, res) => {
  try {
    const oldTokenCount = await prisma.token.count()
    await prisma.token.deleteMany({});

    res.status(200).json({
      success: true,
      data: {
        previousTokenCount: oldTokenCount,
        newTokenNumber: 1
      },
      message: 'Queue reset successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}

/**
 * Move queue forward
 * Marks current serving patient as done and moves next waiting patient to serving
 * Used in Admin Dashboard for demo
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
export const moveQueueForward = async (req, res) => {
  try {

    const currentServing = await prisma.token.findFirst({ where: { status: 'SERVING' } });
    if(currentServing){
      await prisma.token.update({ where: { id: currentServing.id }, data: { status: 'COMPLETED' } });
    }

    // Find next waiting patient
    const nextWaitingToken = await prisma.token.findFirst({
      where: { status: 'WAITING' },
      orderBy: { tokenNumber: 'asc' },
      include: { patient: true, clinic: true }
    });

    if (!nextWaitingToken) {
      // Queue is empty or no more waiting patients
      
      const waitingCount = await prisma.token.count({ where: { status: 'WAITING' } });
      const estimatedTime = waitingCount * 5

      return res.status(200).json({
        success: true,
        data: {
          message: 'Queue is now empty',
          currentToken: null,
          waiting: waitingCount,
          estimatedTime: `${estimatedTime} mins`,
          lastUpdated: new Date().toISOString()
        },
        message: 'Queue moved forward - no more patients waiting'
      })
    }

    // Move next waiting patient to serving
    const updatedToken = await prisma.token.update({
      where: { id: nextWaitingToken.id },
      data: { status: 'SERVING' },
      include: { patient: true, clinic: true }
    });

    // Calculate queue metrics
    const waitingCount = await prisma.token.count({ where: { status: 'WAITING' } });
    const estimatedTime = waitingCount * 5

    res.status(200).json({
      success: true,
      data: {
        currentToken: updatedToken.tokenNumber,
        patient: updatedToken.patient.name,
        phone: updatedToken.patient.phone,
        reason: updatedToken.reasonForVisit,
        clinic: updatedToken.clinic.name,
        waiting: waitingCount,
        estimatedTime: `${estimatedTime} mins`,
        lastUpdated: new Date().toISOString()
      },
      message: 'Queue moved forward successfully'
    })
  } catch (error) {
    res.status(500).json({
      error: 'Internal Server Error',
      message: error.message
    })
  }
}
