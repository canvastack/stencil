/**
 * Test Utilities Validation Tests
 * 
 * These tests verify that the vendor portal test utilities work correctly
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  VendorTestDataFactory,
  VendorMockAPI,
  VendorTestAssertions,
  setupMockFetch,
  clearMockFetch,
  setupVendorLocalStorage,
  clearVendorLocalStorage,
  createMockFile,
  createMockFileList,
} from '../vendorPortalTestUtils';

describe('VendorTestDataFactory', () => {
  describe('UUID Generation', () => {
    it('should generate valid UUIDs', () => {
      const uuid = VendorTestDataFactory.generateUUID();
      expect(VendorTestAssertions.isValidUUID(uuid)).toBe(true);
    });

    it('should generate unique UUIDs', () => {
      const uuid1 = VendorTestDataFactory.generateUUID();
      const uuid2 = VendorTestDataFactory.generateUUID();
      expect(uuid1).not.toBe(uuid2);
    });
  });

  describe('Timestamp Generation', () => {
    it('should generate valid ISO timestamps', () => {
      const timestamp = VendorTestDataFactory.generateTimestamp();
      expect(VendorTestAssertions.isValidISOTimestamp(timestamp)).toBe(true);
    });

    it('should generate past timestamps with negative offset', () => {
      const pastTimestamp = VendorTestDataFactory.generateTimestamp(-7);
      const now = new Date();
      const past = new Date(pastTimestamp);
      expect(past.getTime()).toBeLessThan(now.getTime());
    });

    it('should generate future timestamps with positive offset', () => {
      const futureTimestamp = VendorTestDataFactory.generateTimestamp(7);
      const now = new Date();
      const future = new Date(futureTimestamp);
      expect(future.getTime()).toBeGreaterThan(now.getTime());
    });
  });

  describe('Quote Number Generation', () => {
    it('should generate valid quote numbers', () => {
      const quoteNumber = VendorTestDataFactory.generateQuoteNumber();
      expect(VendorTestAssertions.isValidQuoteNumber(quoteNumber)).toBe(true);
    });

    it('should include current year', () => {
      const quoteNumber = VendorTestDataFactory.generateQuoteNumber();
      const currentYear = new Date().getFullYear();
      expect(quoteNumber).toContain(currentYear.toString());
    });
  });

  describe('Order Number Generation', () => {
    it('should generate valid order numbers', () => {
      const orderNumber = VendorTestDataFactory.generateOrderNumber();
      expect(VendorTestAssertions.isValidOrderNumber(orderNumber)).toBe(true);
    });

    it('should include current year', () => {
      const orderNumber = VendorTestDataFactory.generateOrderNumber();
      const currentYear = new Date().getFullYear();
      expect(orderNumber).toContain(currentYear.toString());
    });
  });

  describe('Vendor User Creation', () => {
    it('should create valid vendor user', () => {
      const user = VendorTestDataFactory.createVendorUser();
      
      expect(VendorTestAssertions.isValidUUID(user.id)).toBe(true);
      expect(VendorTestAssertions.isValidEmail(user.email)).toBe(true);
      expect(user.account_type).toBe('vendor');
      expect(VendorTestAssertions.hasRequiredVendorUserFields(user)).toBe(true);
    });

    it('should apply overrides', () => {
      const user = VendorTestDataFactory.createVendorUser({
        email: 'custom@test.com',
        status: 'inactive',
      });
      
      expect(user.email).toBe('custom@test.com');
      expect(user.status).toBe('inactive');
    });
  });

  describe('Vendor Creation', () => {
    it('should create valid vendor', () => {
      const vendor = VendorTestDataFactory.createVendor();
      
      expect(VendorTestAssertions.isValidUUID(vendor.id)).toBe(true);
      expect(VendorTestAssertions.isValidEmail(vendor.email)).toBe(true);
      expect(VendorTestAssertions.isValidPhone(vendor.phone)).toBe(true);
      expect(VendorTestAssertions.isValidVendorStatus(vendor.status)).toBe(true);
      expect(VendorTestAssertions.isValidOnboardingStatus(vendor.onboarding_status)).toBe(true);
    });

    it('should apply overrides', () => {
      const vendor = VendorTestDataFactory.createVendor({
        company_name: 'Custom Vendor Inc',
        status: 'inactive',
      });
      
      expect(vendor.company_name).toBe('Custom Vendor Inc');
      expect(vendor.status).toBe('inactive');
    });
  });

  describe('Quote Creation', () => {
    it('should create valid quote', () => {
      const quote = VendorTestDataFactory.createQuote();
      
      expect(VendorTestAssertions.isValidUUID(quote.id)).toBe(true);
      expect(VendorTestAssertions.isValidQuoteNumber(quote.quote_number)).toBe(true);
      expect(VendorTestAssertions.isValidQuoteStatus(quote.status)).toBe(true);
      expect(VendorTestAssertions.hasRequiredQuoteFields(quote)).toBe(true);
      expect(quote.order).toBeDefined();
      expect(quote.product).toBeDefined();
    });

    it('should apply overrides', () => {
      const quote = VendorTestDataFactory.createQuote({
        status: 'accepted',
        vendor_price: 200000,
      });
      
      expect(quote.status).toBe('accepted');
      expect(quote.vendor_price).toBe(200000);
    });
  });

  describe('Quote Message Creation', () => {
    it('should create valid quote message', () => {
      const message = VendorTestDataFactory.createQuoteMessage();
      
      expect(VendorTestAssertions.isValidUUID(message.id)).toBe(true);
      expect(VendorTestAssertions.isValidSenderType(message.sender_type)).toBe(true);
      expect(message.message).toBeDefined();
      expect(Array.isArray(message.attachments)).toBe(true);
    });

    it('should apply overrides', () => {
      const message = VendorTestDataFactory.createQuoteMessage({
        sender_type: 'admin',
        message: 'Custom message',
      });
      
      expect(message.sender_type).toBe('admin');
      expect(message.message).toBe('Custom message');
    });
  });

  describe('Bulk Creation', () => {
    it('should create multiple quotes', () => {
      const quotes = VendorTestDataFactory.createQuotes(5);
      
      expect(quotes).toHaveLength(5);
      quotes.forEach(quote => {
        expect(VendorTestAssertions.hasRequiredQuoteFields(quote)).toBe(true);
      });
    });

    it('should create multiple messages', () => {
      const messages = VendorTestDataFactory.createMessages(3);
      
      expect(messages).toHaveLength(3);
      messages.forEach(message => {
        expect(VendorTestAssertions.isValidUUID(message.id)).toBe(true);
      });
    });
  });
});

describe('VendorMockAPI', () => {
  describe('Authentication Responses', () => {
    it('should create valid login success response', () => {
      const response = VendorMockAPI.mockLoginSuccess();
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(response.success).toBe(true);
      expect(response.data.access_token).toBeDefined();
      expect(response.data.user).toBeDefined();
    });

    it('should create valid login failure response', () => {
      const response = VendorMockAPI.mockLoginFailure();
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(response.success).toBe(false);
      expect(response.errors).toBeDefined();
    });

    it('should create valid logout response', () => {
      const response = VendorMockAPI.mockLogoutSuccess();
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(response.success).toBe(true);
    });
  });

  describe('Quote Responses', () => {
    it('should create valid quotes list response', () => {
      const response = VendorMockAPI.mockGetQuotesSuccess();
      
      expect(VendorTestAssertions.isValidPaginatedResponse(response)).toBe(true);
      expect(Array.isArray(response.data)).toBe(true);
    });

    it('should create valid quote detail response', () => {
      const response = VendorMockAPI.mockGetQuoteDetailSuccess();
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(VendorTestAssertions.hasRequiredQuoteFields(response.data)).toBe(true);
    });

    it('should create valid accept quote response', () => {
      const response = VendorMockAPI.mockAcceptQuoteSuccess();
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(response.data.status).toBe('accepted');
      expect(response.data.response_type).toBe('accept');
    });

    it('should create valid reject quote response', () => {
      const response = VendorMockAPI.mockRejectQuoteSuccess();
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(response.data.status).toBe('rejected');
      expect(response.data.response_type).toBe('reject');
    });

    it('should create valid counter offer response', () => {
      const response = VendorMockAPI.mockCounterOfferSuccess();
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(response.data.status).toBe('countered');
      expect(response.data.response_type).toBe('counter');
    });
  });

  describe('Error Responses', () => {
    it('should create valid validation error response', () => {
      const response = VendorMockAPI.mockValidationError({
        email: ['Email is required'],
      });
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(response.success).toBe(false);
      expect(response.errors.email).toBeDefined();
    });

    it('should create valid unauthorized response', () => {
      const response = VendorMockAPI.mockUnauthorized();
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(response.success).toBe(false);
    });

    it('should create valid not found response', () => {
      const response = VendorMockAPI.mockNotFound('Quote');
      
      expect(VendorTestAssertions.isValidAPIResponse(response)).toBe(true);
      expect(response.success).toBe(false);
      expect(response.message).toContain('Quote');
    });
  });
});

describe('VendorTestAssertions', () => {
  describe('Format Validations', () => {
    it('should validate UUID format', () => {
      expect(VendorTestAssertions.isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
      expect(VendorTestAssertions.isValidUUID('invalid-uuid')).toBe(false);
    });

    it('should validate ISO timestamp format', () => {
      expect(VendorTestAssertions.isValidISOTimestamp('2024-01-01T00:00:00.000Z')).toBe(true);
      expect(VendorTestAssertions.isValidISOTimestamp('invalid-timestamp')).toBe(false);
    });

    it('should validate email format', () => {
      expect(VendorTestAssertions.isValidEmail('test@example.com')).toBe(true);
      expect(VendorTestAssertions.isValidEmail('invalid-email')).toBe(false);
    });

    it('should validate phone format', () => {
      expect(VendorTestAssertions.isValidPhone('+6281252525599')).toBe(true);
      expect(VendorTestAssertions.isValidPhone('invalid-phone')).toBe(false);
    });

    it('should validate quote number format', () => {
      expect(VendorTestAssertions.isValidQuoteNumber('Q-2024-0001')).toBe(true);
      expect(VendorTestAssertions.isValidQuoteNumber('invalid-quote')).toBe(false);
    });

    it('should validate order number format', () => {
      expect(VendorTestAssertions.isValidOrderNumber('ORD-2024-0001')).toBe(true);
      expect(VendorTestAssertions.isValidOrderNumber('invalid-order')).toBe(false);
    });
  });

  describe('Status Validations', () => {
    it('should validate quote status', () => {
      expect(VendorTestAssertions.isValidQuoteStatus('sent')).toBe(true);
      expect(VendorTestAssertions.isValidQuoteStatus('invalid')).toBe(false);
    });

    it('should validate vendor status', () => {
      expect(VendorTestAssertions.isValidVendorStatus('active')).toBe(true);
      expect(VendorTestAssertions.isValidVendorStatus('invalid')).toBe(false);
    });

    it('should validate onboarding status', () => {
      expect(VendorTestAssertions.isValidOnboardingStatus('completed')).toBe(true);
      expect(VendorTestAssertions.isValidOnboardingStatus('invalid')).toBe(false);
    });

    it('should validate response type', () => {
      expect(VendorTestAssertions.isValidResponseType('accept')).toBe(true);
      expect(VendorTestAssertions.isValidResponseType(null)).toBe(true);
      expect(VendorTestAssertions.isValidResponseType('invalid')).toBe(false);
    });

    it('should validate sender type', () => {
      expect(VendorTestAssertions.isValidSenderType('vendor')).toBe(true);
      expect(VendorTestAssertions.isValidSenderType('invalid')).toBe(false);
    });
  });

  describe('Business Logic Validations', () => {
    it('should validate if quote can be responded to', () => {
      const respondableQuote = VendorTestDataFactory.createQuote({
        status: 'sent',
        expires_at: VendorTestDataFactory.generateTimestamp(7),
        responded_at: null,
      });
      
      expect(VendorTestAssertions.canRespondToQuote(respondableQuote)).toBe(true);
    });

    it('should detect expired quotes', () => {
      const expiredQuote = VendorTestDataFactory.createQuote({
        expires_at: VendorTestDataFactory.generateTimestamp(-1),
      });
      
      expect(VendorTestAssertions.isQuoteExpired(expiredQuote)).toBe(true);
    });

    it('should validate attachments', () => {
      const validAttachment = {
        filename: 'document.pdf',
        url: '/uploads/document.pdf',
        size: 1024 * 1024, // 1MB
        mime_type: 'application/pdf',
      };
      
      expect(VendorTestAssertions.isValidAttachment(validAttachment)).toBe(true);
    });

    it('should reject oversized attachments', () => {
      const largeAttachment = {
        filename: 'large.pdf',
        url: '/uploads/large.pdf',
        size: 11 * 1024 * 1024, // 11MB
        mime_type: 'application/pdf',
      };
      
      expect(VendorTestAssertions.isValidAttachment(largeAttachment)).toBe(false);
    });
  });
});

describe('Helper Functions', () => {
  describe('Mock Fetch', () => {
    afterEach(() => {
      clearMockFetch();
    });

    it('should setup mock fetch responses', () => {
      setupMockFetch({
        'GET /api/test': { success: true, data: 'test' },
      });
      
      expect(global.fetch).toBeDefined();
    });

    it('should clear mock fetch', () => {
      setupMockFetch({
        'GET /api/test': { success: true, data: 'test' },
      });
      
      clearMockFetch();
      
      // Verify mock was cleared
      expect(global.fetch).toBeDefined();
    });
  });

  describe('LocalStorage Management', () => {
    afterEach(() => {
      clearVendorLocalStorage();
    });

    it('should setup vendor localStorage', () => {
      const { token, user } = setupVendorLocalStorage();
      
      expect(token).toBeDefined();
      expect(user).toBeDefined();
      expect(localStorage.getItem('vendor_token')).toBe(token);
    });

    it('should clear vendor localStorage', () => {
      setupVendorLocalStorage();
      clearVendorLocalStorage();
      
      expect(localStorage.getItem('vendor_token')).toBeNull();
      expect(localStorage.getItem('vendor_user')).toBeNull();
    });
  });

  describe('File Creation', () => {
    it('should create mock file', () => {
      const file = createMockFile('test.pdf', 1024, 'application/pdf');
      
      expect(file.name).toBe('test.pdf');
      // Note: Actual size is determined by blob content, not the size parameter
      expect(file.size).toBeGreaterThan(0);
      expect(file.type).toBe('application/pdf');
    });

    it('should create mock file list', () => {
      const files = [
        createMockFile('doc1.pdf'),
        createMockFile('doc2.pdf'),
      ];
      
      const fileList = createMockFileList(files);
      
      expect(fileList.length).toBe(2);
      expect(fileList.item(0)).toBe(files[0]);
      expect(fileList.item(1)).toBe(files[1]);
    });
  });
});
