/**
 * WhatsApp Utility Functions
 * 
 * Handles WhatsApp number formatting and URL generation
 */

/**
 * Sanitize and normalize WhatsApp number to international format
 * 
 * Converts various formats to clean international format without + prefix
 * Examples:
 * - "081234567890" → "6281234567890"
 * - "+62 812 3456 7890" → "6281234567890"
 * - "62-812-345-6789" → "628123456789"
 * 
 * @param phone - Phone number in any format
 * @returns Sanitized phone number for wa.me URL
 */
export function sanitizeWhatsAppNumber(phone: string): string {
  if (!phone) {
    return '';
  }

  // Remove all non-numeric characters except +
  let cleaned = phone.replace(/[^0-9+]/g, '');

  // Remove + prefix if exists
  if (cleaned.startsWith('+')) {
    cleaned = cleaned.substring(1);
  }

  // Convert Indonesian local format (08xxx) to international (628xxx)
  if (cleaned.startsWith('08')) {
    cleaned = '62' + cleaned.substring(1);
  }

  // Ensure it starts with country code (62 for Indonesia)
  if (!cleaned.startsWith('62')) {
    // If no country code, assume Indonesian
    cleaned = '62' + cleaned;
  }

  return cleaned;
}

/**
 * Generate WhatsApp URL with message
 * 
 * @param phone - Phone number (will be sanitized)
 * @param message - Message text (will be URL encoded)
 * @returns Complete WhatsApp URL
 */
export function generateWhatsAppUrl(phone: string, message: string): string {
  const sanitizedPhone = sanitizeWhatsAppNumber(phone);
  const encodedMessage = encodeURIComponent(message);
  
  return `https://wa.me/${sanitizedPhone}?text=${encodedMessage}`;
}

/**
 * Open WhatsApp chat in new window
 * 
 * @param phone - Phone number
 * @param message - Message text
 */
export function openWhatsAppChat(phone: string, message: string): void {
  const url = generateWhatsAppUrl(phone, message);
  window.open(url, '_blank', 'noopener,noreferrer');
}

/**
 * Validate Indonesian phone number format
 * 
 * @param phone - Phone number to validate
 * @returns true if valid Indonesian phone number
 */
export function isValidIndonesianPhone(phone: string): boolean {
  const sanitized = sanitizeWhatsAppNumber(phone);
  
  // Indonesian phone numbers: 62 + 9-12 digits
  // Examples: 628123456789, 6281234567890
  return /^62[0-9]{9,12}$/.test(sanitized);
}

/**
 * Format phone number for display
 * 
 * @param phone - Phone number
 * @returns Formatted phone number (e.g., "+62 812-3456-7890")
 */
export function formatPhoneDisplay(phone: string): string {
  const sanitized = sanitizeWhatsAppNumber(phone);
  
  if (!sanitized.startsWith('62')) {
    return phone; // Return original if not Indonesian
  }

  // Format: +62 8XX-XXXX-XXXX
  const countryCode = sanitized.substring(0, 2);
  const areaCode = sanitized.substring(2, 5);
  const part1 = sanitized.substring(5, 9);
  const part2 = sanitized.substring(9);

  return `+${countryCode} ${areaCode}-${part1}-${part2}`;
}
