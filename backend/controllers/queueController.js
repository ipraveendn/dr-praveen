// Queue Controller (Safe & Refactored)
// Handles queue management, token booking, and queue tracking with proper date and clinic scoping.

import { sendTokenNotificationSMS } from '../utils/smsService.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


//  HELPER FUNCTIONS

const getStartOfDay = () => {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now;
};

const getEndOfDay = () => {
  const now = new Date();
  now.setUTCHours(23, 59, 59, 999);
  return now;
};



// == CORE QUEUE LOGIC


export const addToken = async (req, res) => {
  console.log("REQ BODY:", req.body);
  const { name, phone, email, place, reason, clinic, trackingUrl, consultationMode } = req.body;
  console.log("consultationMode after destructuring:", consultationMode);

  if (!name || !phone || !reason || !clinic) {
    console.error("[addToken] FAIL: Missing required fields.");
    return res.status(400).json({ success: false, message: "name, phone, reason, and clinic are required fields." });
  }

  try {
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();

    const clinicRecord = await prisma.clinic.upsert({
      where: { name: clinic },
      update: {},
      create: { name: clinic, address: 'Address not specified' },
    });

    const generatedPatientId = `PAT_${Date.now()}`;
    const patient = await prisma.patient.upsert({
      where: { phone: String(phone) },
      update: { name, email, place, clinicName: clinic },
      create: {  patientId: generatedPatientId,name, phone: String(phone), email, place, age:0, gender: "Not Specified",
        reason: reason || "General Consultation",
        clinicId: clinicRecord.id, clinicName: clinic },
    });
    
    // SAFETY GUARD as requested
    if (!patient || !patient.id) {
        console.error("[addToken] FATAL: Patient object or patient.id is missing after upsert.");
        return res.status(500).json({ success: false, message: "Failed to create patient record. Cannot proceed." });
    }

    const lastToken = await prisma.token.findFirst({
      where: {
        clinicId: clinicRecord.id,
        appointmentDate: { gte: todayStart, lte: todayEnd },
      },
      orderBy: { tokenNumber: 'desc' },
    });

    const nextTokenNumber = lastToken ? lastToken.tokenNumber + 1 : 1;

    console.log("[addToken] STEP 6: Creating the new token in the database.");
    const tokenNumber = nextTokenNumber;
    const patientId = patient.id;
    const clinicId = clinicRecord.id;
    const reasonForVisit = reason;
    const status = 'WAITING';
    const appointmentDate = new Date();
    console.log("Prisma create data:", {
      tokenNumber,
      patientId,
      clinicId,
      reason,
      reasonForVisit,
      consultationMode,
      status,
      appointmentDate
    });
    const tokenRecord = await prisma.token.create({
      data: {
        tokenNumber: nextTokenNumber,
        patientId: patient.id, // Corrected based on standard Prisma return
        clinicId: clinicRecord.id,
        reason : reason,
        reasonForVisit: reason,
        consultationMode: consultationMode || null,
        status: 'WAITING',
        appointmentDate: new Date(),
      },
    });
    console.log("Created Token:", tokenRecord);
    
    const waitingCount = await prisma.token.count({ where: { status: 'WAITING', clinicId: clinicRecord.id, appointmentDate: { gte: todayStart, lte: todayEnd } } });
    const estimatedTime = (waitingCount - 1) * 5;
    sendTokenNotificationSMS({
        name, phone, tokenNumber: nextTokenNumber, clinic, reason, estimatedTime: `${estimatedTime} mins`, trackingUrl
    }).catch(smsError => console.error("[addToken] SMS sending failed:", smsError));
    
    // CRITICAL FIX: Return complete queue state instead of just the token
    const allTokens = await prisma.token.findMany({
      where: {
        clinicId: clinicRecord.id,
        appointmentDate: { gte: todayStart, lte: todayEnd }
      },
      orderBy: { tokenNumber: 'asc' },
      include: { patient: true }
    });

    const servingToken = allTokens.find(t => t.status === 'SERVING');
    const allWaiting = allTokens.filter(t => t.status === 'WAITING');

    return res.status(201).json({ 
      success: true, 
      data: { 
        tokenNumber: nextTokenNumber, 
        patient: name, 
        clinic,
        queueUpdated: true,
        currentServing: servingToken?.tokenNumber || null,
        waitingCount: allWaiting.length,
        patients: allTokens.map(t => ({
          tokenNumber: t.tokenNumber,
          name: t.patient.name,
          status: t.status,
          phone: t.patient.phone,
            reason: t.reasonForVisit,
            consultationMode: t.consultationMode || null
        }))
      }, 
      message: "Token created successfully." 
    });

  } catch (error) {
    console.error("[addToken] FATAL ERROR:", error);
    return res.status(500).json({ success: false, message: "An internal server error occurred during token creation.", error: error.message });
  }
};

export const getQueueData = async (req, res) => {
  const { clinic } = req.query;

  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    let whereClause = {};

    if (clinic) {
        const clinicRecord = await prisma.clinic.findUnique({ where: { name: clinic } });
        if (clinicRecord) {
            whereClause.clinicId = clinicRecord.id;
        } else {
             // If clinic is specified but not found, return empty set for that clinic
             console.warn(`[getQueueData] Clinic not found: ${clinic}`);
             return res.status(200).json({ success: true, data: { currentToken: null, waiting: 0, estimatedTime: '0 mins', patients: [] } });
        }
    }

    // OPTIMIZED: Use select to fetch only needed fields, avoid N+1
    const tokens = await prisma.token.findMany({
      where: {
        ...whereClause,
        appointmentDate: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      orderBy: { tokenNumber: 'asc' },
      select: {
        id: true,
        tokenNumber: true,
        status: true,
        reasonForVisit: true,
        consultationMode: true,
        patient: {
          select: {
            name: true,
            phone: true,
          }
        },
        clinic: {
          select: {
            name: true,
          }
        }
      }
    });

    // Process data
    const servingToken = tokens.find(t => t.status === 'SERVING');
    const waitingTokens = tokens.filter(t => t.status === 'WAITING');
    const completedTokens = tokens.filter(t => t.status === 'COMPLETED');
    
    const responseData = {
      currentToken: servingToken ? servingToken.tokenNumber : null,
      waiting: waitingTokens.length,
      estimatedTime: `${waitingTokens.length * 5} mins`,
      patients: tokens.map(t => ({
        id: t.patient.id,
        tokenNumber: t.tokenNumber,
        name: t.patient.name,
        status: t.status,
        clinic: t.clinic.name,
        phone: t.patient.phone,
        reason: t.reasonForVisit,
        consultationMode: t.consultationMode || null
      })),
    };


    return res.status(200).json({
      success: true,
      data: responseData
    });
  } catch (error) {
    console.error(`[getQueueData] Error for clinic ${clinic}:`, error);
    return res.status(500).json({ success: false, message: "Internal Server Error.", error: error.message });
  }
};

export const trackQueue = async (req, res) => {
  const { phone } = req.query;
  if (!phone) {
    return res.status(400).json({ success: false, message: "Phone query parameter is required." });
  }

  try {
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();
    
    const token = await prisma.token.findFirst({
      where: {
        patient: { phone: String(phone) },
        appointmentDate: { gte: todayStart, lte: todayEnd },
      },
      include: { patient: true, clinic: true },
      orderBy: { tokenNumber: 'desc' }
    });

    if (!token) {
      return res.status(404).json({ success: false, message: "No active token found for this phone number today." });
    }

    const tokensAhead = await prisma.token.count({
      where: {
        clinicId: token.clinicId,
        status: 'WAITING',
        tokenNumber: { lt: token.tokenNumber },
        appointmentDate: { gte: todayStart, lte: todayEnd },
      },
    });

    return res.status(200).json({ 
      success: true, 
      data: {
        tokenNumber: token.tokenNumber,
        patient: token.patient.name,
        clinic: token.clinic.name,
        status: token.status,
        consultationMode: token.consultationMode || null,
        tokensAhead,
        estimatedWaitTime: `${tokensAhead * 5} mins`,
      }
    });
  } catch (error) {
    console.error(`[trackQueue] Error for phone ${phone}:`, error);
    return res.status(500).json({ success: false, message: "Internal Server Error." });
  }
};

export const callNextPatient = async (req, res) => {
  const { clinic } = req.body;
  
  console.log('[callNextPatient] ============ START ============');
  console.log('[callNextPatient] Clinic:', clinic);
  console.log('[callNextPatient] User:', req.user?.username);
  
  if (!clinic) {
    console.error('[callNextPatient] Missing clinic parameter');
    return res.status(400).json({ success: false, message: "Clinic is required." });
  }

  try {
    const todayStart = getStartOfDay();
    const todayEnd = getEndOfDay();

    const clinicRecord = await prisma.clinic.findUnique({ where: { name: clinic } });
    if (!clinicRecord) {
      console.error(`[callNextPatient] Clinic not found: ${clinic}`);
      return res.status(404).json({ success: false, message: `Clinic "${clinic}" not found.` });
    }
    
    const result = await prisma.$transaction(async (tx) => {
      // Step 1: Find current SERVING token
      const currentServing = await tx.token.findFirst({
        where: {
          clinicId: clinicRecord.id,
          status: 'SERVING',
          appointmentDate: { gte: todayStart, lte: todayEnd }
        },
        include: { patient: true }
      });

      let previousTokenNumber = null;
      if (currentServing) {
        const updated = await tx.token.update({
          where: { id: currentServing.id },
          data: { status: 'COMPLETED' },
          include: { patient: true }
        });
        previousTokenNumber = updated.tokenNumber;
      }

      // Step 2: Find next WAITING token (in order)
      const nextPatientToken = await tx.token.findFirst({
        where: {
          clinicId: clinicRecord.id,
          status: 'WAITING',
          appointmentDate: { gte: todayStart, lte: todayEnd }
        },
        orderBy: { tokenNumber: 'asc' },
        include: { patient: true }
      });

      if (!nextPatientToken) {
        // Fetch all tokens to get complete state (in case only COMPLETED tokens remain)
        const allTokens = await tx.token.findMany({
          where: {
            clinicId: clinicRecord.id,
            appointmentDate: { gte: todayStart, lte: todayEnd }
          },
          orderBy: { tokenNumber: 'asc' },
          include: { patient: true }
        });
        
        return {
          success: true,
          message: "No more patients are waiting in the queue.",
          data: {
            previousCompleted: previousTokenNumber,
            nextServing: null,
            currentToken: null,
            queueUpdated: true,
            waiting: 0,
            estimatedTime: "0 mins",
            patients: allTokens.map(t => ({
              id: t.patient.id,
              tokenNumber: t.tokenNumber,
              name: t.patient.name,
              status: t.status,
              phone: t.patient.phone,
              consultationMode: t.consultationMode || null
            }))
          }
        };
      }

      // Step 3: Update next token to SERVING (atomic - within transaction)
      const updated = await tx.token.update({
        where: { id: nextPatientToken.id },
        data: { status: 'SERVING' },
        include: { patient: true }
      });

      // Step 4: Fetch COMPLETE updated queue state for response
      const allTokens = await tx.token.findMany({
        where: {
          clinicId: clinicRecord.id,
          appointmentDate: { gte: todayStart, lte: todayEnd }
        },
        orderBy: { tokenNumber: 'asc' },
        include: { patient: true }
      });

      // ⚠️ CRITICAL: Verify both updates happened correctly
      const verifyCompleted = allTokens.find(t => t.tokenNumber === previousTokenNumber);
      const verifyServing = allTokens.find(t => t.tokenNumber === updated.tokenNumber);
      
      if (verifyCompleted && verifyCompleted.status !== 'COMPLETED') {
        console.error(`[CRITICAL] Previous token #${previousTokenNumber} not COMPLETED, shows: ${verifyCompleted.status}`);
      }
      if (verifyServing && verifyServing.status !== 'SERVING') {
        console.error(`[CRITICAL] New token #${updated.tokenNumber} not SERVING, shows: ${verifyServing.status}`);
      }

      const waitingTokens = allTokens.filter(t => t.status === 'WAITING');
      
      return {
        success: true,
        message: `Calling next patient, Token #${updated.tokenNumber}.`,
        data: {
          previousCompleted: previousTokenNumber,
          nextServing: updated.tokenNumber,
          currentToken: updated.tokenNumber,
          queueUpdated: true,
          // Calculate stats from all tokens
          waiting: waitingTokens.length,
          estimatedTime: `${waitingTokens.length * 5} mins`,
          patients: allTokens.map(t => ({
            id: t.patient.id,
            tokenNumber: t.tokenNumber,
            name: t.patient.name,
            status: t.status,
            phone: t.patient.phone
          }))
        }
      };
    });

    return res.status(200).json(result);
  } catch (error) {
    console.error(`[callNextPatient] Error:`, error.message);
    return res.status(500).json({ success: false, message: "Internal Server Error.", error: error.message });
  }
};

export const completeConsultationByTokenNumber = async (req, res) => {
    const tokenNumber = Number(req.params.tokenNumber);
    const { clinic } = req.body;

    console.log('[completeConsultationByTokenNumber] ============ START ============');
    console.log('[completeConsultationByTokenNumber] Token number:', tokenNumber);
    console.log('[completeConsultationByTokenNumber] Clinic:', clinic);
    console.log('[completeConsultationByTokenNumber] User:', req.user?.username);

    if (!tokenNumber || isNaN(tokenNumber)) {
        console.error('[completeConsultationByTokenNumber] Invalid token number:', req.params.tokenNumber);
        return res.status(400).json({ success: false, message: "A valid token number is required." });
    }
    
    try {
        const todayStart = getStartOfDay();
        const todayEnd = getEndOfDay();

        let whereClause = {
            tokenNumber,
            appointmentDate: { gte: todayStart, lte: todayEnd }
        };

        if (clinic) {
            console.log('[completeConsultationByTokenNumber] Looking up clinic:', clinic);
            const clinicRecord = await prisma.clinic.findUnique({ where: { name: clinic } });
            if (!clinicRecord) {
                console.error(`[completeConsultationByTokenNumber] Clinic not found: ${clinic}`);
                return res.status(404).json({ success: false, message: `Clinic ${clinic} not found.` });
            }
            console.log('[completeConsultationByTokenNumber] Clinic ID:', clinicRecord.id);
            whereClause.clinicId = clinicRecord.id;
        }

        console.log('[completeConsultationByTokenNumber] Query clause:', whereClause);
        const token = await prisma.token.findFirst({ where: whereClause });

        if (!token) {
            console.error(`[completeConsultationByTokenNumber] Token #${tokenNumber} not found for today`);
            return res.status(404).json({ success: false, message: "Token not found for the current day." });
        }

        console.log('[completeConsultationByTokenNumber] Token found:', { id: token.id, status: token.status });

        // IMPORTANT: Only allow completing SERVING or WAITING tokens
        if (token.status !== 'SERVING' && token.status !== 'WAITING') {
            console.warn(`[completeConsultationByTokenNumber] Token #${tokenNumber} is already ${token.status}`);
            return res.status(400).json({
                success: false, 
                message: `Token #${tokenNumber} is already ${token.status.toLowerCase()}.`
            });
        }

        console.log('[completeConsultationByTokenNumber] TRANSACTION: Starting...');
        // USE TRANSACTION to ensure atomic update
        const result = await prisma.$transaction(async (tx) => {
            console.log(`[completeConsultationByTokenNumber] TRANSACTION: Marking token #${tokenNumber} as COMPLETED`);
            
            // Update the token
            const updated = await tx.token.update({
                where: { id: token.id },
                data: { status: 'COMPLETED' },
                include: { patient: true }
            });

            console.log(`[completeConsultationByTokenNumber] TRANSACTION: Updated token #${tokenNumber} to COMPLETED`);
            console.log('[completeConsultationByTokenNumber] TRANSACTION: Verifying update...');

            // CRITICAL: Re-query immediately within same transaction to verify
            const verification = await tx.token.findUnique({
                where: { id: token.id }
            });

            if (verification.status !== 'COMPLETED') {
                throw new Error(`Database transaction failed: Token status is ${verification.status}, expected COMPLETED`);
            }

            console.log(`[completeConsultationByTokenNumber] TRANSACTION: Verification PASSED - Token #${tokenNumber} is COMPLETED`);

            // Fetch ALL tokens for the clinic to return complete queue state
            console.log('[completeConsultationByTokenNumber] TRANSACTION: Fetching all tokens for clinic...');
            const allTokens = await tx.token.findMany({
                where: {
                    clinicId: token.clinicId,
                    appointmentDate: { gte: todayStart, lte: todayEnd }
                },
                orderBy: { tokenNumber: 'asc' },
                include: { patient: true, clinic: true }
            });

            console.log(`[completeConsultationByTokenNumber] TRANSACTION: Queue has ${allTokens.length} tokens`);
            console.log('[completeConsultationByTokenNumber] TRANSACTION: Queue state:', 
              allTokens.map(t => ({ num: t.tokenNumber, status: t.status })));

            const servingToken = allTokens.find(t => t.status === 'SERVING');
            const waitingTokens = allTokens.filter(t => t.status === 'WAITING');

            console.log('[completeConsultationByTokenNumber] TRANSACTION: Serving token:', servingToken?.tokenNumber || null);
            console.log('[completeConsultationByTokenNumber] TRANSACTION: Waiting count:', waitingTokens.length);

            return {
                updated,
                allTokens,
                servingToken,
                waitingTokens
            };
        });

        console.log(`[completeConsultationByTokenNumber] SUCCESS - Returning complete queue state`);
        
        const waitingTokens = result.waitingTokens;
        const estimatedTime = `${waitingTokens.length * 5} mins`;
        
        console.log('[completeConsultationByTokenNumber] Building response:', {
          currentToken: result.servingToken?.tokenNumber || null,
          waiting: waitingTokens.length,
          estimatedTime: estimatedTime
        });
        
        return res.status(200).json({
            success: true,
            message: `Token #${tokenNumber} marked as complete.`,
            data: {
                tokenUpdated: tokenNumber,
                completedStatus: 'COMPLETED',
                queueUpdated: true,
                // Standardized field names for frontend
                currentToken: result.servingToken?.tokenNumber || null,
                currentServing: result.servingToken?.tokenNumber || null,
                waiting: waitingTokens.length,
                waitingCount: waitingTokens.length,
                estimatedTime: estimatedTime,
                patients: result.allTokens.map(t => ({
                    id: t.patient.id,
                    tokenNumber: t.tokenNumber,
                    name: t.patient.name,
                    status: t.status,
                    clinic: t.clinic.name,
                    phone: t.patient.phone,
                  reason: t.reasonForVisit,
                  consultationMode: t.consultationMode || null
                }))
            }
        });

    } catch (error) {
        console.error(`[completeConsultationByTokenNumber] ============ FATAL ERROR ============`);
        console.error(`[completeConsultationByTokenNumber] Token: ${tokenNumber}`);
        console.error(`[completeConsultationByTokenNumber] Error message:`, error.message);
        console.error(`[completeConsultationByTokenNumber] Error stack:`, error.stack);
        return res.status(500).json({ success: false, message: "Internal Server Error.", error: error.message });
    }
};

export const getQueueStatus = async (req, res) => {
  try {
    const queue = await prisma.token.findMany({
      orderBy: {
        tokenNumber: "asc"
      }
    });

    return res.json({
      success: true,
      data: queue
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message
    });
  }
};


// =================================================================================================
// == DEPRECATED & UNSAFE FUNCTIONS
// =================================================================================================

/** @deprecated */
export const bookToken = async (req, res) => res.status(410).json({ success: false, message: "This endpoint is deprecated. Use POST /api/queue/add instead." });

/** @deprecated */
export const getAllTokens = async (req, res) => res.status(410).json({ success: false, message: "This endpoint is deprecated. Use GET /api/queue?clinic=<clinic_name> instead." });

/** @deprecated */
export const completeConsultation = async (req, res) => res.status(410).json({ success: false, message: "This endpoint is deprecated. Use PATCH /api/queue/complete/:tokenNumber instead." });

/** @deprecated */
export const moveQueueForward = async (req, res) => res.status(410).json({ success: false, message: "This endpoint is deprecated. Use POST /api/queue/next instead." });

/**
 * @deprecated This function is dangerous. It is disabled by default.
 */
export const resetQueue = async (req, res) => {
    const { confirm } = req.body;
    if (confirm !== "CONFIRM_RESET") {
        return res.status(403).json({ success: false, message: "This is a dangerous operation. Invalid confirmation." });
    }
    // The actual delete operation is commented out for safety.
    // await prisma.token.deleteMany({}); 
    return res.status(200).json({ success: true, message: "Queue reset is disabled for safety." });
};