/**
 * Utility functions for date and time handling, specifically for Argentina's timezone.
 * Argentina is GMT-3 and does not observe Daylight Saving Time.
 */

export const ARGENTINA_TIMEZONE = 'America/Argentina/Buenos_Aires';
export const ARGENTINA_OFFSET = 3; // UTC-3

/**
 * Returns the start of the day in Argentina's timezone for a given date, as a UTC Date object.
 *
 * Example: If it's 2023-10-27 in Argentina, it returns a Date representing
 * 2023-10-27 00:00:00 GMT-3, which is 2023-10-27 03:00:00 UTC.
 */
export function getArgentinaStartOfDay(date: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: ARGENTINA_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });

  const dateString = formatter.format(date); // "YYYY-MM-DD"
  const [year, month, day] = dateString.split('-').map(Number);

  // Argentina is UTC-3, so 00:00 local is 03:00 UTC
  return new Date(Date.UTC(year, month - 1, day, ARGENTINA_OFFSET, 0, 0, 0));
}

/**
 * Returns the end of the day in Argentina's timezone for a given date, as a UTC Date object.
 */
export function getArgentinaEndOfDay(date: Date = new Date()): Date {
  const startOfDay = getArgentinaStartOfDay(date);
  const endOfDay = new Date(startOfDay);
  endOfDay.setUTCHours(endOfDay.getUTCHours() + 23, 59, 59, 999);
  return endOfDay;
}

/**
 * Returns the "now" date adjusted to be useful for comparisons in the server.
 * This is mostly a semantic wrapper.
 */
export function getArgentinaNow(): Date {
  return new Date();
}

/**
 * Returns the start of "yesterday" in Argentina's timezone.
 */
export function getArgentinaStartOfYesterday(): Date {
  const today = getArgentinaStartOfDay();
  const yesterday = new Date(today);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  return yesterday;
}

/**
 * Parses a YYYY-MM-DD string as an Argentina-local date.
 * Independent of server timezone. Returns start of that day in Argentina.
 */
export function parseArgentinaDateString(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  // Build a noon UTC Date so it unambiguously falls on the intended calendar day
  // in Argentina (noon UTC is morning in Argentina, always same day).
  const probeDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  return getArgentinaStartOfDay(probeDate);
}
