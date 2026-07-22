/**
 * Utility functions for handling IST (Asia/Kolkata, UTC+5:30) date and time calculations.
 * Ensures consistent timezone handling across all queue APIs, background operations, and server logs.
 */

export const IST_TIMEZONE = 'Asia/Kolkata';
const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000; // +05:30 in milliseconds

/**
 * Returns YYYY-MM-DD date string in IST timezone (Asia/Kolkata)
 * @param {Date|string|number} [date=new Date()]
 * @returns {string} e.g. "2026-07-22"
 */
export const getISTDateString = (date = new Date()) => {
  const d = new Date(date);
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: IST_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(d);
};

/**
 * Returns a Date object representing 00:00:00.000 (Start of Day) in IST timezone.
 * @param {Date|string|number} [date=new Date()]
 * @returns {Date}
 */
export const getISTStartOfDay = (date = new Date()) => {
  const dateStr = getISTDateString(date);
  return new Date(`${dateStr}T00:00:00.000+05:30`);
};

/**
 * Returns a Date object representing 23:59:59.999 (End of Day) in IST timezone.
 * @param {Date|string|number} [date=new Date()]
 * @returns {Date}
 */
export const getISTEndOfDay = (date = new Date()) => {
  const dateStr = getISTDateString(date);
  return new Date(`${dateStr}T23:59:59.999+05:30`);
};

/**
 * Returns current timestamp in IST ISO format (+05:30 offset).
 * @param {Date|string|number} [date=new Date()]
 * @returns {string} e.g. "2026-07-22T11:41:41.000+05:30"
 */
export const getISTISOString = (date = new Date()) => {
  const d = new Date(date);
  const istDate = new Date(d.getTime() + IST_OFFSET_MS);
  return istDate.toISOString().replace('Z', '+05:30');
};

/**
 * Formats a date using en-IN locale and Asia/Kolkata timezone.
 * @param {Date|string|number} [date=new Date()]
 * @param {Intl.DateTimeFormatOptions} [options={}]
 * @returns {string}
 */
export const formatISTDateTime = (date = new Date(), options = {}) => {
  const d = new Date(date);
  return new Intl.DateTimeFormat('en-IN', {
    timeZone: IST_TIMEZONE,
    ...options,
  }).format(d);
};
