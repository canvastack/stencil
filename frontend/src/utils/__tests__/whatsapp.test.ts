import { describe, it, expect } from 'vitest';
import {
  sanitizeWhatsAppNumber,
  generateWhatsAppUrl,
  isValidIndonesianPhone,
  formatPhoneDisplay,
} from '../whatsapp';

describe('WhatsApp Utility Functions', () => {
  describe('sanitizeWhatsAppNumber', () => {
    it('should convert Indonesian local format to international', () => {
      expect(sanitizeWhatsAppNumber('081234567890')).toBe('6281234567890');
      expect(sanitizeWhatsAppNumber('08123456789')).toBe('628123456789');
    });

    it('should remove + prefix', () => {
      expect(sanitizeWhatsAppNumber('+6281234567890')).toBe('6281234567890');
    });

    it('should remove spaces and dashes', () => {
      expect(sanitizeWhatsAppNumber('+62 812 3456 7890')).toBe('6281234567890');
      expect(sanitizeWhatsAppNumber('62-812-345-6789')).toBe('628123456789');
      expect(sanitizeWhatsAppNumber('0812 3456 7890')).toBe('6281234567890');
    });

    it('should handle already formatted numbers', () => {
      expect(sanitizeWhatsAppNumber('6281234567890')).toBe('6281234567890');
    });

    it('should add country code if missing', () => {
      expect(sanitizeWhatsAppNumber('81234567890')).toBe('6281234567890');
    });

    it('should return empty string for empty input', () => {
      expect(sanitizeWhatsAppNumber('')).toBe('');
    });
  });

  describe('generateWhatsAppUrl', () => {
    it('should generate correct WhatsApp URL', () => {
      const url = generateWhatsAppUrl('081234567890', 'Hello World');
      expect(url).toBe('https://wa.me/6281234567890?text=Hello%20World');
    });

    it('should handle special characters in message', () => {
      const url = generateWhatsAppUrl('081234567890', 'Hello *World* & Test');
      expect(url).toContain('https://wa.me/6281234567890?text=');
      expect(url).toContain('Hello');
    });

    it('should sanitize phone number', () => {
      const url = generateWhatsAppUrl('+62 812 3456 7890', 'Test');
      expect(url).toBe('https://wa.me/6281234567890?text=Test');
    });
  });

  describe('isValidIndonesianPhone', () => {
    it('should validate correct Indonesian phone numbers', () => {
      expect(isValidIndonesianPhone('6281234567890')).toBe(true);
      expect(isValidIndonesianPhone('628123456789')).toBe(true);
      expect(isValidIndonesianPhone('62812345678901')).toBe(true);
    });

    it('should accept local format and validate after sanitization', () => {
      expect(isValidIndonesianPhone('081234567890')).toBe(true);
      expect(isValidIndonesianPhone('+6281234567890')).toBe(true);
    });

    it('should reject invalid formats', () => {
      expect(isValidIndonesianPhone('12345')).toBe(false);
      expect(isValidIndonesianPhone('1234567890')).toBe(false);
      expect(isValidIndonesianPhone('628')).toBe(false);
    });

    it('should reject too short or too long numbers', () => {
      expect(isValidIndonesianPhone('62812345')).toBe(false); // Too short
      expect(isValidIndonesianPhone('628123456789012345')).toBe(false); // Too long
    });
  });

  describe('formatPhoneDisplay', () => {
    it('should format Indonesian phone numbers for display', () => {
      const formatted = formatPhoneDisplay('6281234567890');
      expect(formatted).toBe('+62 812-3456-7890');
    });

    it('should handle local format', () => {
      const formatted = formatPhoneDisplay('081234567890');
      expect(formatted).toBe('+62 812-3456-7890');
    });

    it('should return original for non-Indonesian numbers', () => {
      const formatted = formatPhoneDisplay('1234567890');
      expect(formatted).toBe('1234567890');
    });
  });
});
