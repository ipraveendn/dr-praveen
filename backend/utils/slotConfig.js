/**
 * Clinic Slot & Schedule Configuration (IST / Asia/Kolkata)
 * 
 * Working hours:
 * - DiaPlus:
 *   - Afternoon: 1:00 PM – 4:30 PM (13:00 - 16:30)
 *   - Evening: 8:30 PM – 10:30 PM (20:30 - 22:30)
 * - ThyroPlus:
 *   - Evening: 6:30 PM – 8:00 PM (18:30 - 20:00)
 * 
 * Slot duration: 15 minutes.
 * A slot is valid only if its full 15-minute duration ends at or before closing time.
 */

import { getISTDateString, IST_TIMEZONE } from './dateUtils.js';

export const SLOT_DURATION_MINUTES = 15;
export const BOOKING_WINDOW_DAYS = 7; // Today through today + 6 days

export const CLINIC_SCHEDULES = {
  diaplus: {
    id: 'diaplus',
    name: 'DiaPlus Endocrinology Clinic',
    dbNames: ['DiaPlus Endocrinology Clinic', 'diaplus', 'DiaPlus', 'diaplus clinic'],
    windows: [
      { start: '13:00', end: '16:30', period: 'Afternoon' },
      { start: '20:30', end: '22:30', period: 'Evening' },
    ]
  },
  thyroplus: {
    id: 'thyroplus',
    name: 'ThyroPlus Endocrinology Clinic',
    dbNames: ['ThyroPlus Endocrinology Clinic', 'thyroplus', 'ThyroPlus', 'thyroplus clinic'],
    windows: [
      { start: '18:30', end: '20:00', period: 'Evening' },
    ]
  }
};

/**
 * Converts "HH:mm" (24hr) string to minutes from midnight
 * @param {string} timeStr - "13:15"
 * @returns {number}
 */
export function timeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return -1;
  const match = timeStr.trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return -1;
  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return -1;
  return hours * 60 + minutes;
}

/**
 * Converts minutes from midnight to "HH:mm" (24hr) string
 * @param {number} minutes
 * @returns {string}
 */
export function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

/**
 * Formats "HH:mm" to 12-hour display string (e.g. "13:15" -> "1:15 PM")
 * @param {string} timeStr
 * @returns {string}
 */
export function formatTime12Hour(timeStr) {
  const totalMins = timeToMinutes(timeStr);
  if (totalMins === -1) return timeStr;
  const hours = Math.floor(totalMins / 60);
  const minutes = totalMins % 60;
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 === 0 ? 12 : hours % 12;
  return `${displayHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
}

/**
 * Generates all valid 15-minute slot times for a specific window
 * A slot is included only if slotStart + 15 <= windowEnd
 * @param {string} startStr - "13:00"
 * @param {string} endStr - "16:30"
 * @returns {Array<{ time24: string, time12: string, period?: string }>}
 */
export function generateSlotsForWindow(startStr, endStr, period = '') {
  const startMins = timeToMinutes(startStr);
  const endMins = timeToMinutes(endStr);
  if (startMins === -1 || endMins === -1 || startMins >= endMins) return [];

  const slots = [];
  for (let current = startMins; current + SLOT_DURATION_MINUTES <= endMins; current += SLOT_DURATION_MINUTES) {
    const time24 = minutesToTime(current);
    slots.push({
      time24,
      time12: formatTime12Hour(time24),
      period
    });
  }
  return slots;
}

/**
 * Resolves a clinic identifier (name, slug, or ID) to schedule config
 * @param {string} clinicIdentifier
 * @returns {typeof CLINIC_SCHEDULES['diaplus'] | null}
 */
export function getClinicConfig(clinicIdentifier) {
  if (!clinicIdentifier) return null;
  const normalized = String(clinicIdentifier).trim().toLowerCase();

  for (const key of Object.keys(CLINIC_SCHEDULES)) {
    const config = CLINIC_SCHEDULES[key];
    if (config.id.toLowerCase() === normalized) return config;
    if (config.name.toLowerCase() === normalized) return config;
    if (config.dbNames.some(n => n.toLowerCase() === normalized)) return config;
  }
  return null;
}

/**
 * Gets all generated 15-minute slots for a clinic
 * @param {string} clinicIdentifier
 * @returns {Array<{ time24: string, time12: string, period: string }>}
 */
export function getClinicSlots(clinicIdentifier) {
  const config = getClinicConfig(clinicIdentifier);
  if (!config) return [];

  const allSlots = [];
  for (const win of config.windows) {
    const windowSlots = generateSlotsForWindow(win.start, win.end, win.period);
    allSlots.push(...windowSlots);
  }
  return allSlots;
}

/**
 * Validates if a specific time is a valid slot for the clinic
 * @param {string} clinicIdentifier
 * @param {string} time24 - e.g. "13:00"
 * @returns {boolean}
 */
export function isValidSlotForClinic(clinicIdentifier, time24) {
  if (!time24) return false;
  const normalizedTime = time24.trim();
  const validSlots = getClinicSlots(clinicIdentifier);
  return validSlots.some(s => s.time24 === normalizedTime);
}

/**
 * Generates the dynamic 7-day calendar booking window in Asia/Kolkata timezone
 * @param {Date} [referenceDate=new Date()]
 * @returns {Array<{ dateStr: string, displayDay: string, displayDate: string, isToday: boolean }>}
 */
export function getBookingDateWindow(referenceDate = new Date()) {
  const dates = [];
  const todayStr = getISTDateString(referenceDate);

  // Use Intl to format in IST
  for (let i = 0; i < BOOKING_WINDOW_DAYS; i++) {
    // Add i days (in milliseconds) from reference
    const d = new Date(referenceDate.getTime() + i * 24 * 60 * 60 * 1000);
    const dateStr = getISTDateString(d);

    const dayFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      weekday: 'short'
    });
    const dateFormatter = new Intl.DateTimeFormat('en-IN', {
      timeZone: IST_TIMEZONE,
      day: 'numeric',
      month: 'short'
    });

    dates.push({
      dateStr,
      displayDay: i === 0 ? 'Today' : dayFormatter.format(d),
      displayDate: dateFormatter.format(d),
      isToday: i === 0
    });
  }
  return dates;
}

/**
 * Validates if an appointment date string is within the allowed 7-day IST booking window
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {Date} [referenceDate=new Date()]
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateBookingDate(dateStr, referenceDate = new Date()) {
  if (!dateStr || typeof dateStr !== 'string') {
    return { valid: false, error: 'Appointment date is required.' };
  }

  const match = dateStr.trim().match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return { valid: false, error: 'Invalid date format. Expected YYYY-MM-DD.' };
  }

  const todayStr = getISTDateString(referenceDate);
  const allowedDates = getBookingDateWindow(referenceDate).map(d => d.dateStr);

  if (dateStr < todayStr) {
    return { valid: false, error: 'Cannot book an appointment for a past date.' };
  }

  if (!allowedDates.includes(dateStr)) {
    return { valid: false, error: 'Date is outside the 7-day booking window.' };
  }

  return { valid: true };
}

/**
 * Checks if a slot time has already passed on the given date (in IST)
 * @param {string} dateStr - "YYYY-MM-DD"
 * @param {string} time24 - "13:00"
 * @param {Date} [referenceDate=new Date()]
 * @returns {boolean}
 */
export function isSlotInPast(dateStr, time24, referenceDate = new Date()) {
  const todayStr = getISTDateString(referenceDate);
  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  // If date is today, compare current IST time to slot time
  const currentISTFormatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: IST_TIMEZONE,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
  const currentISTTime = currentISTFormatter.format(referenceDate);
  const currentMins = timeToMinutes(currentISTTime);
  const slotMins = timeToMinutes(time24);

  return slotMins <= currentMins;
}
