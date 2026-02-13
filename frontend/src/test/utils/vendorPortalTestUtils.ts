/**
 * Vendor Portal Test Utilities
 * 
 * Comprehensive test utilities for vendor portal testing including:
 * - Mock API responses
 * - Test data factories
 * - Common assertions
 * - Helper functions
 */

import { vi } from 'vitest';

// ============================================================================
// Type Definitions
// ============================================================================

export interface MockVendorUser {
  id: string;
  uuid: string;
  email: string;
  name: string;
  vendor_id: string;
  account_type: 'vendor';
  status: 'active' | 'inactive';
  portal_access_enabled: boolean;
  onboarding_status: 'pending' | 'in_progress' | 'completed';
  created_at: string;
  updated_at: string;
}

export interface MockVendor {
  id: string;
  uuid: string;
  tenant_id: string;
  company_name: string;
  email: string;
  phone: string;
  address: string;
  status: 'active' | 'inactive' | 'on_hold' | 'blacklisted';
  portal_access_enabled: boolean;
  onboarding_status: 'pending' | 'in_progress' | 'completed';
  onboarding_completed_at: string | null;
  portal_last_access_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface MockQuote {
  id: string;
  uuid: string;
  tenant_id: string;
  vendor_id: string;
  order_id: string;
  quote_number: string;
  status: 'draft' | 'sent' | 'pending_response' | 'accepted' | 'rejected' | 'countered' | 'expired';
  vendor_price: number | null;
  counter_offer_amount: number | null;
  estimated_delivery_days: number | null;
  rejection_reason: string | null;
  notes: string | null;
  sent_at: string | null;
  responded_at: string | null;
  expires_at: string | null;
  response_type: 'accept' | 'reject' | 'counter' | null;
  created_at: string;
  updated_at: string;
  order: {
    id: string;
    uuid: string;
    order_number: string;
    customer_name: string;
  };
  product: {
    id: string;
    uuid: string;
    name: string;
  };
}

export interface MockQuoteMessage {
  id: string;
  uuid: string;
  tenant_id: string;
  quote_id: string;
  sender_id: string;
  sender_type: 'admin' | 'vendor';
  message: string;
  attachments: Array<{
    filename: string;
    url: string;
    size: number;
    mime_type: string;
  }>;
  is_read: boolean;
  read_at: string | null;
  created_at: string;
  sender: {
    id: string;
    name: string;
    email: string;
  };
}

export interface MockVendorProfile {
  vendor: MockVendor;
  performance_metrics: {
    total_quotes: number;
    accepted_quotes: number;
    rejected_quotes: number;
    pending_quotes: number;
    acceptance_rate: number;
    average_response_time: number;
  };
}

// ============================================================================
// Test Data Factories
// ============================================================================

export class VendorTestDataFactory {
  /**
   * Generate a unique UUID
   */
  static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Generate a timestamp
   */
  static generateTimestamp(daysOffset: number = 0): string {
    const date = new Date();
    date.setDate(date.getDate() + daysOffset);
    return date.toISOString();
  }

  /**
   * Generate a quote number
   */
  static generateQuoteNumber(): string {
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 9999) + 1;
    return `Q-${year}-${num.toString().padStart(4, '0')}`;
  }

  /**
   * Generate an order number
   */
  static generateOrderNumber(): string {
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 9999) + 1;
    return `ORD-${year}-${num.toString().padStart(4, '0')}`;
  }

  /**
   * Create a mock vendor user
   */
  static createVendorUser(overrides: Partial<MockVendorUser> = {}): MockVendorUser {
    const id = this.generateUUID();
    return {
      id,
      uuid: id,
      email: `vendor-${Date.now()}@test.com`,
      name: 'Test Vendor User',
      vendor_id: this.generateUUID(),
      account_type: 'vendor',
      status: 'active',
      portal_access_enabled: true,
      onboarding_status: 'completed',
      created_at: this.generateTimestamp(-30),
      updated_at: this.generateTimestamp(),
      ...overrides,
    };
  }

  /**
   * Create a mock vendor
   */
  static createVendor(overrides: Partial<MockVendor> = {}): MockVendor {
    const id = this.generateUUID();
    return {
      id,
      uuid: id,
      tenant_id: this.generateUUID(),
      company_name: `Test Vendor Company ${Date.now()}`,
      email: `vendor-${Date.now()}@test.com`,
      phone: '+6281234567890',
      address: 'Jl. Test No. 123, Jakarta',
      status: 'active',
      portal_access_enabled: true,
      onboarding_status: 'completed',
      onboarding_completed_at: this.generateTimestamp(-7),
      portal_last_access_at: this.generateTimestamp(),
      created_at: this.generateTimestamp(-30),
      updated_at: this.generateTimestamp(),
      ...overrides,
    };
  }

  /**
   * Create a mock quote
   */
  static createQuote(overrides: Partial<MockQuote> = {}): MockQuote {
    const id = this.generateUUID();
    const orderId = this.generateUUID();
    const productId = this.generateUUID();
    
    return {
      id,
      uuid: id,
      tenant_id: this.generateUUID(),
      vendor_id: this.generateUUID(),
      order_id: orderId,
      quote_number: this.generateQuoteNumber(),
      status: 'sent',
      vendor_price: 150000,
      counter_offer_amount: null,
      estimated_delivery_days: null,
      rejection_reason: null,
      notes: null,
      sent_at: this.generateTimestamp(-2),
      responded_at: null,
      expires_at: this.generateTimestamp(7),
      response_type: null,
      created_at: this.generateTimestamp(-3),
      updated_at: this.generateTimestamp(-2),
      order: {
        id: orderId,
        uuid: orderId,
        order_number: this.generateOrderNumber(),
        customer_name: 'Test Customer',
      },
      product: {
        id: productId,
        uuid: productId,
        name: 'Custom Etching Plate',
      },
      ...overrides,
    };
  }

  /**
   * Create a mock quote message
   */
  static createQuoteMessage(overrides: Partial<MockQuoteMessage> = {}): MockQuoteMessage {
    const id = this.generateUUID();
    const senderId = this.generateUUID();
    
    return {
      id,
      uuid: id,
      tenant_id: this.generateUUID(),
      quote_id: this.generateUUID(),
      sender_id: senderId,
      sender_type: 'vendor',
      message: 'Test message content',
      attachments: [],
      is_read: false,
      read_at: null,
      created_at: this.generateTimestamp(),
      sender: {
        id: senderId,
        name: 'Test Sender',
        email: 'sender@test.com',
      },
      ...overrides,
    };
  }

  /**
   * Create a mock vendor profile
   */
  static createVendorProfile(overrides: Partial<MockVendorProfile> = {}): MockVendorProfile {
    return {
      vendor: this.createVendor(),
      performance_metrics: {
        total_quotes: 50,
        accepted_quotes: 35,
        rejected_quotes: 10,
        pending_quotes: 5,
        acceptance_rate: 70,
        average_response_time: 24,
      },
      ...overrides,
    };
  }

  /**
   * Create multiple quotes
   */
  static createQuotes(count: number, overrides: Partial<MockQuote> = {}): MockQuote[] {
    return Array.from({ length: count }, () => this.createQuote(overrides));
  }

  /**
   * Create multiple messages
   */
  static createMessages(count: number, overrides: Partial<MockQuoteMessage> = {}): MockQuoteMessage[] {
    return Array.from({ length: count }, () => this.createQuoteMessage(overrides));
  }
}

// ============================================================================
// Mock API Responses
// ============================================================================

export class VendorMockAPI {
  /**
   * Mock successful login response
   */
  static mockLoginSuccess(vendorUser?: Partial<MockVendorUser>) {
    const user = VendorTestDataFactory.createVendorUser(vendorUser);
    const vendor = VendorTestDataFactory.createVendor({ id: user.vendor_id });
    
    return {
      success: true,
      message: 'Login successful',
      data: {
        access_token: 'mock-vendor-token-' + Date.now(),
        token_type: 'Bearer',
        expires_in: 86400,
        user: {
          ...user,
          vendor,
        },
      },
    };
  }

  /**
   * Mock failed login response
   */
  static mockLoginFailure(message: string = 'Invalid credentials') {
    return {
      success: false,
      message,
      errors: {
        email: ['The provided credentials are incorrect.'],
      },
    };
  }

  /**
   * Mock logout response
   */
  static mockLogoutSuccess() {
    return {
      success: true,
      message: 'Logged out successfully',
      data: {
        tokens_revoked: 1,
      },
    };
  }

  /**
   * Mock password reset request response
   */
  static mockPasswordResetRequestSuccess() {
    return {
      success: true,
      message: 'Password reset link sent to your email',
      data: {},
    };
  }

  /**
   * Mock password reset response
   */
  static mockPasswordResetSuccess() {
    return {
      success: true,
      message: 'Password reset successfully',
      data: {},
    };
  }

  /**
   * Mock get quotes response
   */
  static mockGetQuotesSuccess(quotes?: MockQuote[], pagination?: any) {
    const defaultQuotes = quotes || VendorTestDataFactory.createQuotes(5);
    const defaultPagination = pagination || {
      current_page: 1,
      per_page: 20,
      total: defaultQuotes.length,
      last_page: 1,
      from: 1,
      to: defaultQuotes.length,
    };

    return {
      success: true,
      message: 'Quotes retrieved successfully',
      data: defaultQuotes,
      ...defaultPagination,
    };
  }

  /**
   * Mock get quote detail response
   */
  static mockGetQuoteDetailSuccess(quote?: Partial<MockQuote>) {
    const quoteData = VendorTestDataFactory.createQuote(quote);
    
    return {
      success: true,
      message: 'Quote retrieved successfully',
      data: quoteData,
    };
  }

  /**
   * Mock accept quote response
   */
  static mockAcceptQuoteSuccess(quote?: Partial<MockQuote>) {
    const quoteData = VendorTestDataFactory.createQuote({
      status: 'accepted',
      response_type: 'accept',
      responded_at: VendorTestDataFactory.generateTimestamp(),
      ...quote,
    });
    
    return {
      success: true,
      message: 'Quote accepted successfully',
      data: quoteData,
    };
  }

  /**
   * Mock reject quote response
   */
  static mockRejectQuoteSuccess(quote?: Partial<MockQuote>) {
    const quoteData = VendorTestDataFactory.createQuote({
      status: 'rejected',
      response_type: 'reject',
      responded_at: VendorTestDataFactory.generateTimestamp(),
      rejection_reason: 'Cannot meet the requirements',
      ...quote,
    });
    
    return {
      success: true,
      message: 'Quote rejected successfully',
      data: quoteData,
    };
  }

  /**
   * Mock counter offer response
   */
  static mockCounterOfferSuccess(quote?: Partial<MockQuote>) {
    const quoteData = VendorTestDataFactory.createQuote({
      status: 'countered',
      response_type: 'counter',
      responded_at: VendorTestDataFactory.generateTimestamp(),
      counter_offer_amount: 175000,
      ...quote,
    });
    
    return {
      success: true,
      message: 'Counter offer submitted successfully',
      data: quoteData,
    };
  }

  /**
   * Mock get messages response
   */
  static mockGetMessagesSuccess(messages?: MockQuoteMessage[], pagination?: any) {
    const defaultMessages = messages || VendorTestDataFactory.createMessages(3);
    const defaultPagination = pagination || {
      current_page: 1,
      per_page: 20,
      total: defaultMessages.length,
      last_page: 1,
      from: 1,
      to: defaultMessages.length,
    };

    return {
      success: true,
      message: 'Messages retrieved successfully',
      data: defaultMessages,
      ...defaultPagination,
    };
  }

  /**
   * Mock send message response
   */
  static mockSendMessageSuccess(message?: Partial<MockQuoteMessage>) {
    const messageData = VendorTestDataFactory.createQuoteMessage(message);
    
    return {
      success: true,
      message: 'Message sent successfully',
      data: messageData,
    };
  }

  /**
   * Mock get vendor profile response
   */
  static mockGetProfileSuccess(profile?: Partial<MockVendorProfile>) {
    const profileData = VendorTestDataFactory.createVendorProfile(profile);
    
    return {
      success: true,
      message: 'Profile retrieved successfully',
      data: profileData,
    };
  }

  /**
   * Mock update vendor profile response
   */
  static mockUpdateProfileSuccess(vendor?: Partial<MockVendor>) {
    const vendorData = VendorTestDataFactory.createVendor(vendor);
    
    return {
      success: true,
      message: 'Profile updated successfully',
      data: vendorData,
    };
  }

  /**
   * Mock validation error response
   */
  static mockValidationError(errors: Record<string, string[]>) {
    return {
      success: false,
      message: 'Validation failed',
      errors,
    };
  }

  /**
   * Mock unauthorized response
   */
  static mockUnauthorized() {
    return {
      success: false,
      message: 'Unauthorized',
      errors: {},
    };
  }

  /**
   * Mock forbidden response
   */
  static mockForbidden(message: string = 'Forbidden') {
    return {
      success: false,
      message,
      errors: {},
    };
  }

  /**
   * Mock not found response
   */
  static mockNotFound(resource: string = 'Resource') {
    return {
      success: false,
      message: `${resource} not found`,
      errors: {},
    };
  }

  /**
   * Mock server error response
   */
  static mockServerError(message: string = 'Internal server error') {
    return {
      success: false,
      message,
      errors: {},
    };
  }
}

// ============================================================================
// Common Assertions
// ============================================================================

export class VendorTestAssertions {
  /**
   * Assert UUID format
   */
  static isValidUUID(value: string): boolean {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
  }

  /**
   * Assert ISO timestamp format
   */
  static isValidISOTimestamp(value: string): boolean {
    const date = new Date(value);
    return !isNaN(date.getTime()) && date.toISOString() === value;
  }

  /**
   * Assert email format
   */
  static isValidEmail(value: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  }

  /**
   * Assert phone format (Indonesian)
   */
  static isValidPhone(value: string): boolean {
    const phoneRegex = /^\+62\d{9,13}$/;
    return phoneRegex.test(value);
  }

  /**
   * Assert quote number format
   */
  static isValidQuoteNumber(value: string): boolean {
    const quoteRegex = /^Q-\d{4}-\d{4}$/;
    return quoteRegex.test(value);
  }

  /**
   * Assert order number format
   */
  static isValidOrderNumber(value: string): boolean {
    const orderRegex = /^ORD-\d{4}-\d{4}$/;
    return orderRegex.test(value);
  }

  /**
   * Assert quote status is valid
   */
  static isValidQuoteStatus(status: string): boolean {
    const validStatuses = ['draft', 'sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'];
    return validStatuses.includes(status);
  }

  /**
   * Assert vendor status is valid
   */
  static isValidVendorStatus(status: string): boolean {
    const validStatuses = ['active', 'inactive', 'on_hold', 'blacklisted'];
    return validStatuses.includes(status);
  }

  /**
   * Assert onboarding status is valid
   */
  static isValidOnboardingStatus(status: string): boolean {
    const validStatuses = ['pending', 'in_progress', 'completed'];
    return validStatuses.includes(status);
  }

  /**
   * Assert response type is valid
   */
  static isValidResponseType(type: string | null): boolean {
    if (type === null) return true;
    const validTypes = ['accept', 'reject', 'counter'];
    return validTypes.includes(type);
  }

  /**
   * Assert sender type is valid
   */
  static isValidSenderType(type: string): boolean {
    const validTypes = ['admin', 'vendor'];
    return validTypes.includes(type);
  }

  /**
   * Assert quote can be responded to
   */
  static canRespondToQuote(quote: MockQuote): boolean {
    // Can respond if status is sent or pending_response, not expired, and not already responded
    const validStatuses = ['sent', 'pending_response'];
    const isValidStatus = validStatuses.includes(quote.status);
    const isNotExpired = !quote.expires_at || new Date(quote.expires_at) > new Date();
    const notResponded = !quote.responded_at;
    
    return isValidStatus && isNotExpired && notResponded;
  }

  /**
   * Assert quote is expired
   */
  static isQuoteExpired(quote: MockQuote): boolean {
    if (!quote.expires_at) return false;
    return new Date(quote.expires_at) < new Date();
  }

  /**
   * Assert attachment is valid
   */
  static isValidAttachment(attachment: any): boolean {
    const requiredFields = ['filename', 'url', 'size', 'mime_type'];
    const hasAllFields = requiredFields.every(field => field in attachment);
    
    if (!hasAllFields) return false;
    
    // Check file size (max 10MB)
    if (attachment.size > 10 * 1024 * 1024) return false;
    
    // Check mime type
    const validMimeTypes = [
      'application/pdf',
      'image/jpeg',
      'image/jpg',
      'image/png',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ];
    
    return validMimeTypes.includes(attachment.mime_type);
  }

  /**
   * Assert API response structure
   */
  static isValidAPIResponse(response: any): boolean {
    return (
      typeof response === 'object' &&
      'success' in response &&
      'message' in response &&
      typeof response.success === 'boolean' &&
      typeof response.message === 'string'
    );
  }

  /**
   * Assert paginated response structure
   */
  static isValidPaginatedResponse(response: any): boolean {
    return (
      this.isValidAPIResponse(response) &&
      'data' in response &&
      Array.isArray(response.data) &&
      'current_page' in response &&
      'per_page' in response &&
      'total' in response &&
      'last_page' in response
    );
  }

  /**
   * Assert vendor user has required fields
   */
  static hasRequiredVendorUserFields(user: any): boolean {
    const requiredFields = [
      'id',
      'uuid',
      'email',
      'name',
      'vendor_id',
      'account_type',
      'status',
      'portal_access_enabled',
      'onboarding_status',
    ];
    
    return requiredFields.every(field => field in user);
  }

  /**
   * Assert quote has required fields
   */
  static hasRequiredQuoteFields(quote: any): boolean {
    const requiredFields = [
      'id',
      'uuid',
      'quote_number',
      'status',
      'order',
      'product',
    ];
    
    return requiredFields.every(field => field in quote);
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Setup mock fetch for API calls
 */
export function setupMockFetch(responses: Record<string, any>) {
  global.fetch = vi.fn((url: string, options?: any) => {
    const method = options?.method || 'GET';
    const key = `${method} ${url}`;
    
    const response = responses[key] || responses[url];
    
    if (!response) {
      return Promise.resolve({
        ok: false,
        status: 404,
        json: () => Promise.resolve(VendorMockAPI.mockNotFound()),
      });
    }
    
    return Promise.resolve({
      ok: response.success !== false,
      status: response.success !== false ? 200 : 400,
      json: () => Promise.resolve(response),
    });
  }) as any;
}

/**
 * Clear mock fetch
 */
export function clearMockFetch() {
  if (global.fetch && 'mockClear' in global.fetch) {
    (global.fetch as any).mockClear();
  }
}

/**
 * Wait for async operations
 */
export async function waitForAsync(ms: number = 0): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Simulate API delay
 */
export async function simulateAPIDelay(ms: number = 100): Promise<void> {
  return waitForAsync(ms);
}

/**
 * Create mock file for upload testing
 */
export function createMockFile(
  name: string = 'test.pdf',
  size: number = 1024,
  type: string = 'application/pdf'
): File {
  const blob = new Blob(['test content'], { type });
  return new File([blob], name, { type });
}

/**
 * Create mock file list for upload testing
 */
export function createMockFileList(files: File[]): FileList {
  const fileList = {
    length: files.length,
    item: (index: number) => files[index] || null,
    [Symbol.iterator]: function* () {
      for (const file of files) {
        yield file;
      }
    },
  };
  
  // Add indexed properties
  files.forEach((file, index) => {
    (fileList as any)[index] = file;
  });
  
  return fileList as FileList;
}

/**
 * Mock localStorage for vendor authentication
 */
export function setupVendorLocalStorage(token?: string, user?: MockVendorUser) {
  const mockToken = token || 'mock-vendor-token-' + Date.now();
  const mockUser = user || VendorTestDataFactory.createVendorUser();
  
  localStorage.setItem('vendor_token', mockToken);
  localStorage.setItem('vendor_user', JSON.stringify(mockUser));
  
  return { token: mockToken, user: mockUser };
}

/**
 * Clear vendor localStorage
 */
export function clearVendorLocalStorage() {
  localStorage.removeItem('vendor_token');
  localStorage.removeItem('vendor_user');
}

/**
 * Get stored vendor token
 */
export function getStoredVendorToken(): string | null {
  return localStorage.getItem('vendor_token');
}

/**
 * Get stored vendor user
 */
export function getStoredVendorUser(): MockVendorUser | null {
  const userStr = localStorage.getItem('vendor_user');
  return userStr ? JSON.parse(userStr) : null;
}

// ============================================================================
// Export all utilities
// ============================================================================

export default {
  VendorTestDataFactory,
  VendorMockAPI,
  VendorTestAssertions,
  setupMockFetch,
  clearMockFetch,
  waitForAsync,
  simulateAPIDelay,
  createMockFile,
  createMockFileList,
  setupVendorLocalStorage,
  clearVendorLocalStorage,
  getStoredVendorToken,
  getStoredVendorUser,
};
