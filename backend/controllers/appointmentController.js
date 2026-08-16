/**
 * Appointment Controller
 * Handles slot availability, race-condition safe bookings, cancellations, and schedule listings.
 * Enforces Asia/Kolkata (IST) source-of-truth validation and PostgreSQL partial unique active-slot safety.
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import {
  getClinicConfig,
  getClinicSlots,
  isValidSlotForClinic,
  getBookingDateWindow,
  validateBookingDate,
  isClinicHoliday,
  isSlotInPast,
  formatTime12Hour,
  CLINIC_SCHEDULES
} from '../utils/slotConfig.js';
import { getISTDateString, getISTStartOfDay, getISTEndOfDay } from '../utils/dateUtils.js';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key_here_change_this_in_production';

/**
 * GET /api/appointments/dates
 * Returns the current dynamic 7-day calendar booking window in IST
 */
export const getBookingDates = async (req, res) => {
  try {
    const dates = getBookingDateWindow();
    return res.status(200).json({
      success: true,
      data: {
        bookingWindow: dates,
        timezone: 'Asia/Kolkata'
      }
    });
  } catch (error) {
    console.error('[getBookingDates] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve booking dates.',
      error: error.message
    });
  }
};

/**
 * GET /api/appointments/availability
 * Returns all generated 15-minute slots for a clinic + date, with live availability status.
 * Query params: clinic, date (YYYY-MM-DD)
 */
export const getAvailability = async (req, res) => {
  const { clinic, date } = req.query;

  if (!clinic || !date) {
    return res.status(400).json({
      success: false,
      message: 'Both "clinic" and "date" query parameters are required (e.g. ?clinic=diaplus&date=2026-08-15).'
    });
  }

  try {
    const clinicConfig = getClinicConfig(clinic);
    if (!clinicConfig) {
      return res.status(400).json({
        success: false,
        message: `Invalid clinic "${clinic}". Supported clinics: ${Object.keys(CLINIC_SCHEDULES).join(', ')}.`
      });
    }

    // Check if the requested date is a clinic holiday (Sundays)
    if (isClinicHoliday(date)) {
      return res.status(200).json({
        success: true,
        data: {
          clinic: clinicConfig.name,
          clinicId: clinicConfig.id,
          date,
          timezone: 'Asia/Kolkata',
          isSunday: true,
          isHoliday: true,
          isClosed: true,
          totalSlots: 0,
          availableCount: 0,
          bookedCount: 0,
          slots: [],
          message: 'The clinic is closed on Sundays (Holiday). Please select an alternate day.'
        }
      });
    }

    const dateValidation = validateBookingDate(date);
    if (!dateValidation.valid) {
      return res.status(400).json({
        success: false,
        code: dateValidation.code || 'INVALID_DATE',
        message: dateValidation.error
      });
    }

    // Resolve clinic record in DB (or create if missing)
    const clinicRecord = await prisma.clinic.upsert({
      where: { name: clinicConfig.name },
      update: {},
      create: { name: clinicConfig.name, address: 'Address not specified' }
    });

    // Get all valid 15-minute slots for clinic
    const allSlots = getClinicSlots(clinic);

    // Fetch active (non-cancelled) appointments for this clinic and date
    // Note: appointmentDate is stored as Date (@db.Date)
    const targetDate = new Date(`${date}T00:00:00.000Z`);
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        clinicId: clinicRecord.id,
        appointmentDate: targetDate,
        status: { not: 'CANCELLED' }
      },
      select: {
        id: true,
        appointmentTime: true,
        status: true,
        consultationMode: true
      }
    });

    const bookedMap = new Map();
    for (const appt of activeAppointments) {
      bookedMap.set(appt.appointmentTime, appt);
    }

    // Map slots with availability calculation
    const slots = allSlots.map((slot) => {
      const isPast = isSlotInPast(date, slot.time24);
      const isBooked = bookedMap.has(slot.time24);
      const available = !isPast && !isBooked;

      let status = 'AVAILABLE';
      if (isBooked) status = 'BOOKED';
      else if (isPast) status = 'PAST';

      return {
        time24: slot.time24,
        time12: slot.time12,
        period: slot.period,
        available,
        isBooked,
        isPast,
        status
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        clinic: clinicRecord.name,
        clinicId: clinicConfig.id,
        date,
        totalSlots: slots.length,
        availableCount: slots.filter(s => s.available).length,
        bookedCount: slots.filter(s => s.isBooked).length,
        slots
      }
    });
  } catch (error) {
    console.error('[getAvailability] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch slot availability.',
      error: error.message
    });
  }
};

/**
 * POST /api/appointments/book
 * Validates request, verifies slot validity and booking window, and executes safe booking with DB unique constraint enforcement.
 */
export const bookAppointment = async (req, res) => {
  const {
    clinic,
    consultationMode,
    appointmentDate,
    appointmentTime,
    name,
    phone,
    email,
    place,
    reason,
    paymentMethod
  } = req.body;

  console.log('[APPOINTMENT BOOKING] Request received:', {
    clinic,
    consultationMode,
    appointmentDate,
    appointmentTime,
    name,
    phone,
    paymentMethod
  });

  // 1. Validate required fields
  if (!clinic || !consultationMode || !appointmentDate || !appointmentTime || !name || !phone) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields. Clinic, consultationMode, appointmentDate, appointmentTime, name, and phone are required.'
    });
  }

  // 2. Validate clinic
  const clinicConfig = getClinicConfig(clinic);
  if (!clinicConfig) {
    return res.status(400).json({
      success: false,
      message: `Invalid clinic "${clinic}". Supported clinics: ${Object.keys(CLINIC_SCHEDULES).join(', ')}.`
    });
  }

  // 3. Validate consultation mode
  const normalizedMode = String(consultationMode).trim().toUpperCase();
  if (normalizedMode !== 'IN_PERSON' && normalizedMode !== 'ONLINE') {
    return res.status(400).json({
      success: false,
      message: 'Invalid consultation mode. Must be "IN_PERSON" or "ONLINE".'
    });
  }

  // 4. Validate appointment date (7-day IST window)
  const dateValidation = validateBookingDate(appointmentDate);
  if (!dateValidation.valid) {
    return res.status(400).json({
      success: false,
      message: dateValidation.error
    });
  }

  // 5. Validate appointment time slot against clinic hours
  const normalizedTime = String(appointmentTime).trim();
  if (!isValidSlotForClinic(clinic, normalizedTime)) {
    return res.status(400).json({
      success: false,
      message: `Invalid time slot "${appointmentTime}" for ${clinicConfig.name}. Please select a valid 15-minute slot during clinic hours.`
    });
  }

  // 6. Check if slot has already passed for today
  if (isSlotInPast(appointmentDate, normalizedTime)) {
    return res.status(400).json({
      success: false,
      message: 'The selected appointment time slot has already passed.'
    });
  }

  // 7. Validate phone number format (must be 10 digits)
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.length < 10) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid 10-digit phone number.'
    });
  }

  try {
    // Resolve Clinic
    const clinicRecord = await prisma.clinic.upsert({
      where: { name: clinicConfig.name },
      update: {},
      create: { name: clinicConfig.name, address: 'Address not specified' }
    });

    // Upsert Patient record (preserving existing patient schema structure)
    const generatedPatientId = `PAT_${Date.now()}`;
    const patient = await prisma.patient.upsert({
      where: { phone: cleanPhone },
      update: {
        name: name.trim(),
        email: email ? email.trim() : undefined,
        place: place ? place.trim() : undefined,
        clinicName: clinicConfig.name
      },
      create: {
        patientId: generatedPatientId,
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        place: place ? place.trim() : null,
        age: 0,
        gender: 'Not Specified',
        reason: reason || 'General Consultation',
        clinicId: clinicRecord.id,
        clinicName: clinicConfig.name
      }
    });

    if (!patient || !patient.id) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create or retrieve patient record.'
      });
    }

    const targetDate = new Date(`${appointmentDate}T00:00:00.000Z`);

    // Check availability first as a quick pre-check
    const existingActive = await prisma.appointment.findFirst({
      where: {
        clinicId: clinicRecord.id,
        appointmentDate: targetDate,
        appointmentTime: normalizedTime,
        status: { not: 'CANCELLED' }
      }
    });

    if (existingActive) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_ALREADY_BOOKED',
        message: 'This slot is already booked. Please choose another time slot.'
      });
    }

    // Database-safe atomic insert with partial unique index enforcement
    const newAppointment = await prisma.appointment.create({
      data: {
        clinicId: clinicRecord.id,
        patientId: patient.id,
        appointmentDate: targetDate,
        appointmentTime: normalizedTime,
        consultationMode: normalizedMode,
        status: 'CONFIRMED',
        paymentMethod: paymentMethod === 'online' || paymentMethod === 'ONLINE' ? 'ONLINE' : 'CASH',
        reason: reason ? reason.trim() : 'General Consultation',
        notes: null
      },
      include: {
        clinic: true,
        patient: true
      }
    });

    console.log('[APPOINTMENT BOOKED SUCCESS]', {
      id: newAppointment.id,
      clinic: newAppointment.clinic.name,
      patient: newAppointment.patient.name,
      date: appointmentDate,
      time: normalizedTime,
      mode: normalizedMode
    });

    return res.status(201).json({
      success: true,
      message: 'Appointment booked successfully.',
      data: {
        appointmentId: newAppointment.id,
        clinic: newAppointment.clinic.name,
        clinicId: clinicConfig.id,
        patientName: newAppointment.patient.name,
        phone: newAppointment.patient.phone,
        email: newAppointment.patient.email,
        place: newAppointment.patient.place,
        appointmentDate,
        appointmentTime: normalizedTime,
        appointmentTime12: formatTime12Hour(normalizedTime),
        consultationMode: newAppointment.consultationMode,
        paymentMethod: newAppointment.paymentMethod,
        status: newAppointment.status,
        reason: newAppointment.reason,
        createdAt: newAppointment.createdAt
      }
    });
  } catch (error) {
    console.error('[APPOINTMENT BOOKING ERROR]', error);

    // Catch PostgreSQL Unique Constraint Violation (P2002 or Postgres 23505)
    if (
      error.code === 'P2002' ||
      error.message?.includes('unique_active_clinic_appointment_slot') ||
      error.message?.includes('Unique constraint')
    ) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_ALREADY_BOOKED',
        message: 'This appointment slot was just booked by another patient. Please select an alternate slot.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred while booking the appointment. Please try again.',
      error: error.message
    });
  }
};

/**
 * PATCH /api/appointments/:id/cancel
 * Cancels an appointment without deleting the record, freeing the slot for other bookings.
 */
export const cancelAppointment = async (req, res) => {
  const { id } = req.params;
  const { phone } = req.body || {}; // Optional verification for patient self-cancel

  if (!id) {
    return res.status(400).json({
      success: false,
      message: 'Appointment ID is required.'
    });
  }

  // Extract/decode user from Authorization header if available
  if (req.headers?.authorization && !req.user) {
    try {
      const token = req.headers.authorization.split(' ')[1];
      if (token) {
        req.user = jwt.verify(token, JWT_SECRET);
      }
    } catch {
      // Non-critical token parse fallback
    }
  }

  try {
    const appointment = await prisma.appointment.findUnique({
      where: { id },
      include: {
        patient: true,
        clinic: true
      }
    });

    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: 'Appointment not found.'
      });
    }

    if (appointment.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        message: 'This appointment has already been cancelled.'
      });
    }

    // If caller is a patient (not authenticated staff) and provides a phone number, verify phone
    if (!req.user && phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      if (cleanPhone && cleanPhone !== appointment.patient.phone) {
        return res.status(403).json({
          success: false,
          message: 'Phone number does not match appointment record.'
        });
      }
    }

    // Mark as CANCELLED and record timestamp
    const updated = await prisma.appointment.update({
      where: { id },
      data: {
        status: 'CANCELLED',
        cancelledAt: new Date()
      },
      include: {
        patient: true,
        clinic: true
      }
    });

    const dateStr = getISTDateString(updated.appointmentDate);

    console.log('[APPOINTMENT CANCELLED]', {
      id: updated.id,
      clinic: updated.clinic.name,
      date: dateStr,
      time: updated.appointmentTime,
      patient: updated.patient.name
    });

    return res.status(200).json({
      success: true,
      message: 'Appointment cancelled successfully. The slot is now available for booking.',
      data: {
        appointmentId: updated.id,
        status: updated.status,
        cancelledAt: updated.cancelledAt,
        clinic: updated.clinic.name,
        appointmentDate: dateStr,
        appointmentTime: updated.appointmentTime,
        appointmentTime12: formatTime12Hour(updated.appointmentTime)
      }
    });
  } catch (error) {
    console.error('[cancelAppointment] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to cancel appointment.',
      error: error.message
    });
  }
};

/**
 * GET /api/appointments/today-slots
 * GET /api/appointments/admin/today-slots
 * Returns all valid 15-minute slots for TODAY only in Asia/Kolkata (IST), with live availability status.
 * Query param: clinic (e.g. diaplus or thyroplus)
 */
export const getTodaySlots = async (req, res) => {
  const { clinic } = req.query;
  const targetClinic = clinic || 'diaplus';

  try {
    const clinicConfig = getClinicConfig(targetClinic);
    if (!clinicConfig) {
      return res.status(400).json({
        success: false,
        message: `Invalid clinic "${targetClinic}". Supported clinics: ${Object.keys(CLINIC_SCHEDULES).join(', ')}.`
      });
    }

    const todayStr = getISTDateString(new Date());

    // Check if today is a clinic holiday (Sundays)
    if (isClinicHoliday(todayStr)) {
      return res.status(200).json({
        success: true,
        data: {
          clinic: clinicConfig.name,
          clinicId: clinicConfig.id,
          date: todayStr,
          timezone: 'Asia/Kolkata',
          isSunday: true,
          isHoliday: true,
          isClosed: true,
          totalSlots: 0,
          availableCount: 0,
          bookedCount: 0,
          slots: [],
          message: 'The clinic is closed today (Sunday Holiday). No appointment slots are available.'
        }
      });
    }

    // Resolve clinic record in DB
    const clinicRecord = await prisma.clinic.upsert({
      where: { name: clinicConfig.name },
      update: {},
      create: { name: clinicConfig.name, address: 'Address not specified' }
    });

    // Get all valid 15-minute slots for clinic
    const allSlots = getClinicSlots(targetClinic);

    // Fetch active (non-cancelled) appointments for this clinic on today's date
    const targetDate = new Date(`${todayStr}T00:00:00.000Z`);
    const activeAppointments = await prisma.appointment.findMany({
      where: {
        clinicId: clinicRecord.id,
        appointmentDate: targetDate,
        status: { not: 'CANCELLED' }
      },
      select: {
        id: true,
        appointmentTime: true,
        status: true,
        consultationMode: true
      }
    });

    const bookedMap = new Map();
    for (const appt of activeAppointments) {
      bookedMap.set(appt.appointmentTime, appt);
    }

    // Map slots with availability calculation
    const slots = allSlots.map((slot) => {
      const isPast = isSlotInPast(todayStr, slot.time24);
      const isBooked = bookedMap.has(slot.time24);
      const available = !isPast && !isBooked;

      let status = 'AVAILABLE';
      if (isBooked) status = 'BOOKED';
      else if (isPast) status = 'PAST';

      return {
        time24: slot.time24,
        time12: slot.time12,
        period: slot.period,
        available,
        isBooked,
        isPast,
        status
      };
    });

    return res.status(200).json({
      success: true,
      data: {
        clinic: clinicRecord.name,
        clinicId: clinicConfig.id,
        date: todayStr,
        timezone: 'Asia/Kolkata',
        isSunday: false,
        isHoliday: false,
        isClosed: false,
        totalSlots: slots.length,
        availableCount: slots.filter(s => s.available).length,
        bookedCount: slots.filter(s => s.isBooked).length,
        slots
      }
    });
  } catch (error) {
    console.error('[getTodaySlots] Error:', error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch today's slot availability.",
      error: error.message
    });
  }
};

/**
 * POST /api/appointments/admin/book-today
 * POST /api/appointments/book-today
 * Admin same-day manual appointment creation (TODAY ONLY in Asia/Kolkata).
 * Validates slot within clinic hours, not in past, and database partial unique constraint safety.
 */
export const adminBookTodayAppointment = async (req, res) => {
  const {
    clinic,
    consultationMode,
    appointmentDate,
    appointmentTime,
    name,
    phone,
    email,
    place,
    reason,
    paymentMethod
  } = req.body || {};

  console.log('[ADMIN TODAY APPOINTMENT BOOKING] Request received:', {
    clinic,
    consultationMode,
    appointmentDate,
    appointmentTime,
    name,
    phone,
    paymentMethod
  });

  const todayStr = getISTDateString(new Date());

  // 1. Enforce strict Sunday / holiday rejection
  if (isClinicHoliday(todayStr)) {
    return res.status(400).json({
      success: false,
      code: 'CLINIC_CLOSED_SUNDAY',
      message: 'Cannot create appointment: Clinic is closed on Sundays (Holiday).'
    });
  }

  // 2. Enforce strict same-day rule (Asia/Kolkata)
  if (!appointmentDate || appointmentDate !== todayStr) {
    return res.status(400).json({
      success: false,
      message: `Admin manual booking is strictly restricted to TODAY (${todayStr}) in Asia/Kolkata timezone.`
    });
  }

  // 2. Validate required fields
  if (!clinic || !consultationMode || !appointmentTime || !name || !phone || !reason) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields. Clinic, consultationMode, appointmentTime, name, phone, and reason are required.'
    });
  }

  // 3. Validate clinic
  const clinicConfig = getClinicConfig(clinic);
  if (!clinicConfig) {
    return res.status(400).json({
      success: false,
      message: `Invalid clinic "${clinic}". Supported clinics: ${Object.keys(CLINIC_SCHEDULES).join(', ')}.`
    });
  }

  // 4. Validate consultation mode
  const normalizedMode = String(consultationMode).trim().toUpperCase();
  if (normalizedMode !== 'IN_PERSON' && normalizedMode !== 'ONLINE') {
    return res.status(400).json({
      success: false,
      message: 'Invalid consultation mode. Must be "IN_PERSON" or "ONLINE".'
    });
  }

  // 5. Validate appointment time slot against clinic hours
  const normalizedTime = String(appointmentTime).trim();
  if (!isValidSlotForClinic(clinic, normalizedTime)) {
    return res.status(400).json({
      success: false,
      message: `Invalid time slot "${appointmentTime}" for ${clinicConfig.name}. Please select a valid 15-minute slot during clinic hours.`
    });
  }

  // 6. Check if slot has already passed for today
  if (isSlotInPast(todayStr, normalizedTime)) {
    return res.status(400).json({
      success: false,
      message: 'The selected appointment time slot has already passed today.'
    });
  }

  // 7. Validate phone number format (must be 10 digits)
  const cleanPhone = String(phone).replace(/\D/g, '');
  if (cleanPhone.length !== 10) {
    return res.status(400).json({
      success: false,
      message: 'Please provide a valid 10-digit phone number.'
    });
  }

  // 8. Normalize payment method
  const normalizedPayment = (paymentMethod === 'ONLINE_UPI' || paymentMethod === 'ONLINE' || paymentMethod === 'online') ? 'ONLINE' : 'CASH';

  try {
    // Resolve Clinic
    const clinicRecord = await prisma.clinic.upsert({
      where: { name: clinicConfig.name },
      update: {},
      create: { name: clinicConfig.name, address: 'Address not specified' }
    });

    // Upsert Patient record
    const generatedPatientId = `PAT_${Date.now()}`;
    const patient = await prisma.patient.upsert({
      where: { phone: cleanPhone },
      update: {
        name: name.trim(),
        email: email ? email.trim() : undefined,
        place: place ? place.trim() : undefined,
        clinicName: clinicConfig.name
      },
      create: {
        patientId: generatedPatientId,
        name: name.trim(),
        phone: cleanPhone,
        email: email ? email.trim() : null,
        place: place ? place.trim() : null,
        age: 0,
        gender: 'Not Specified',
        reason: reason.trim(),
        clinicId: clinicRecord.id,
        clinicName: clinicConfig.name
      }
    });

    if (!patient || !patient.id) {
      return res.status(500).json({
        success: false,
        message: 'Failed to create or retrieve patient record.'
      });
    }

    const targetDate = new Date(`${todayStr}T00:00:00.000Z`);

    // Check availability first as a pre-check
    const existingActive = await prisma.appointment.findFirst({
      where: {
        clinicId: clinicRecord.id,
        appointmentDate: targetDate,
        appointmentTime: normalizedTime,
        status: { not: 'CANCELLED' }
      }
    });

    if (existingActive) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_ALREADY_BOOKED',
        message: 'This appointment slot was just booked. Please select another available slot.'
      });
    }

    // Database-safe atomic insert with partial unique index enforcement
    const newAppointment = await prisma.appointment.create({
      data: {
        clinicId: clinicRecord.id,
        patientId: patient.id,
        appointmentDate: targetDate,
        appointmentTime: normalizedTime,
        consultationMode: normalizedMode,
        status: 'CONFIRMED',
        paymentMethod: normalizedPayment,
        reason: reason.trim(),
        notes: 'Booked manually by Admin for today'
      },
      include: {
        clinic: true,
        patient: true
      }
    });

    console.log('[ADMIN APPOINTMENT BOOKED SUCCESS]', {
      id: newAppointment.id,
      clinic: newAppointment.clinic.name,
      patient: newAppointment.patient.name,
      date: todayStr,
      time: normalizedTime,
      mode: normalizedMode
    });

    return res.status(201).json({
      success: true,
      message: "Today's appointment booked successfully.",
      data: {
        appointmentId: newAppointment.id,
        referenceId: newAppointment.id.slice(0, 8).toUpperCase(),
        clinic: newAppointment.clinic.name,
        clinicId: clinicConfig.id,
        patientName: newAppointment.patient.name,
        phone: newAppointment.patient.phone,
        email: newAppointment.patient.email,
        place: newAppointment.patient.place,
        appointmentDate: todayStr,
        appointmentTime: normalizedTime,
        appointmentTime12: formatTime12Hour(normalizedTime),
        consultationMode: newAppointment.consultationMode,
        paymentMethod: newAppointment.paymentMethod,
        status: newAppointment.status,
        reason: newAppointment.reason,
        createdAt: newAppointment.createdAt
      }
    });
  } catch (error) {
    console.error('[ADMIN APPOINTMENT BOOKING ERROR]', error);

    // Catch PostgreSQL Unique Constraint Violation (P2002 or Postgres 23505)
    if (
      error.code === 'P2002' ||
      error.message?.includes('unique_active_clinic_appointment_slot') ||
      error.message?.includes('Unique constraint')
    ) {
      return res.status(409).json({
        success: false,
        code: 'SLOT_ALREADY_BOOKED',
        message: 'This appointment slot was just booked. Please select another available slot.'
      });
    }

    return res.status(500).json({
      success: false,
      message: 'An error occurred while creating the appointment. Please try again.',
      error: error.message
    });
  }
};

/**
 * GET /api/appointments
 * Lists appointments with filters (clinic, date, phone, status).
 * Accessible by staff or for specific patient lookups.
 */
export const getAppointments = async (req, res) => {
  const { clinic, date, phone, status, limit } = req.query;

  try {
    let whereClause = {};

    if (clinic) {
      const clinicConfig = getClinicConfig(clinic);
      if (clinicConfig) {
        const clinicRecord = await prisma.clinic.findUnique({ where: { name: clinicConfig.name } });
        if (clinicRecord) whereClause.clinicId = clinicRecord.id;
      }
    }

    if (date) {
      const targetDate = new Date(`${date}T00:00:00.000Z`);
      whereClause.appointmentDate = targetDate;
    }

    if (status) {
      whereClause.status = status.toUpperCase();
    }

    if (phone) {
      const cleanPhone = String(phone).replace(/\D/g, '');
      whereClause.patient = { phone: cleanPhone };
    }

    const appointments = await prisma.appointment.findMany({
      where: whereClause,
      orderBy: [
        { appointmentDate: 'asc' },
        { appointmentTime: 'asc' }
      ],
      take: limit ? parseInt(limit, 10) : 100,
      include: {
        clinic: {
          select: { id: true, name: true, address: true }
        },
        patient: {
          select: { id: true, name: true, phone: true, email: true, place: true }
        }
      }
    });

    return res.status(200).json({
      success: true,
      count: appointments.length,
      data: appointments.map(a => ({
        id: a.id,
        clinic: a.clinic.name,
        clinicId: a.clinicId,
        patientName: a.patient.name,
        phone: a.patient.phone,
        email: a.patient.email,
        place: a.patient.place,
        appointmentDate: getISTDateString(a.appointmentDate),
        appointmentTime: a.appointmentTime,
        appointmentTime12: formatTime12Hour(a.appointmentTime),
        consultationMode: a.consultationMode,
        paymentMethod: a.paymentMethod,
        status: a.status,
        reason: a.reason,
        createdAt: a.createdAt,
        cancelledAt: a.cancelledAt
      }))
    });
  } catch (error) {
    console.error('[getAppointments] Error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve appointments.',
      error: error.message
    });
  }
};
