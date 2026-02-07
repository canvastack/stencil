/**
 * Business Days Utility
 * 
 * Handles calculation of business days (excluding weekends and holidays)
 * for quote valid_until dates and other business logic.
 */

/**
 * Indonesian public holidays for 2026
 * Format: 'YYYY-MM-DD'
 * 
 * TODO: Move to database or API for dynamic management
 */
const INDONESIAN_HOLIDAYS_2026: string[] = [
  '2026-01-01', // New Year's Day
  '2026-02-17', // Isra Mi'raj
  '2026-03-11', // Nyepi (Balinese New Year)
  '2026-03-22', // Chinese New Year
  '2026-04-03', // Eid al-Fitr (estimated)
  '2026-04-04', // Eid al-Fitr (estimated)
  '2026-05-01', // Labor Day
  '2026-05-21', // Ascension of Jesus Christ
  '2026-06-01', // Pancasila Day
  '2026-06-09', // Eid al-Adha (estimated)
  '2026-06-30', // Islamic New Year (estimated)
  '2026-08-17', // Independence Day
  '2026-09-09', // Prophet Muhammad's Birthday (estimated)
  '2026-12-25', // Christmas Day
];

/**
 * Check if a date is a weekend (Saturday or Sunday)
 */
export function isWeekend(date: Date): boolean {
  const day = date.getDay();
  return day === 0 || day === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Check if a date is an Indonesian public holiday
 */
export function isHoliday(date: Date): boolean {
  const dateStr = date.toISOString().split('T')[0]; // Format: YYYY-MM-DD
  return INDONESIAN_HOLIDAYS_2026.includes(dateStr);
}

/**
 * Check if a date is a business day (not weekend and not holiday)
 */
export function isBusinessDay(date: Date): boolean {
  return !isWeekend(date) && !isHoliday(date);
}

/**
 * Add business hours to a date, skipping weekends and holidays
 * 
 * @param startDate - Starting date
 * @param hours - Number of business hours to add (default: 24)
 * @returns Date after adding business hours
 * 
 * @example
 * // Add 24 business hours (1 business day)
 * const validUntil = addBusinessHours(new Date(), 24);
 * 
 * // Add 48 business hours (2 business days)
 * const validUntil = addBusinessHours(new Date(), 48);
 */
export function addBusinessHours(startDate: Date, hours: number = 24): Date {
  const result = new Date(startDate);
  let remainingHours = hours;
  
  // Add hours in 24-hour increments (full days)
  while (remainingHours >= 24) {
    result.setDate(result.getDate() + 1);
    
    // Skip weekends and holidays
    while (!isBusinessDay(result)) {
      result.setDate(result.getDate() + 1);
    }
    
    remainingHours -= 24;
  }
  
  // Add remaining hours
  if (remainingHours > 0) {
    result.setHours(result.getHours() + remainingHours);
  }
  
  return result;
}

/**
 * Add business days to a date, skipping weekends and holidays
 * 
 * @param startDate - Starting date
 * @param days - Number of business days to add
 * @returns Date after adding business days
 * 
 * @example
 * // Add 1 business day
 * const tomorrow = addBusinessDays(new Date(), 1);
 * 
 * // Add 7 business days (1 business week)
 * const nextWeek = addBusinessDays(new Date(), 7);
 */
export function addBusinessDays(startDate: Date, days: number): Date {
  return addBusinessHours(startDate, days * 24);
}

/**
 * Get the default valid_until date for quotes
 * Default: Now + 24 business hours (1 business day)
 * 
 * @returns Date for quote valid_until field
 */
export function getDefaultQuoteValidUntil(): Date {
  return addBusinessHours(new Date(), 24);
}

/**
 * Calculate business days between two dates
 * 
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of business days between dates
 */
export function getBusinessDaysBetween(startDate: Date, endDate: Date): number {
  let count = 0;
  const current = new Date(startDate);
  
  while (current < endDate) {
    if (isBusinessDay(current)) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }
  
  return count;
}
