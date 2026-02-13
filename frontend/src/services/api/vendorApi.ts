/**
 * Vendor Portal API Service
 * 
 * API client for vendor portal endpoints.
 * Handles authentication, quotes, messages, and profile management for vendors.
 * 
 * @module services/api/vendorApi
 */

import vendorApiClient from './vendorClient';
import type {
  VendorAuthResponse,
  VendorLoginRequest,
  VendorPasswordResetRequest,
  VendorPasswordResetConfirmation,
  VendorQuoteListResponse,
  VendorQuoteDetailResponse,
  VendorQuoteFilters,
  AcceptQuoteRequest,
  RejectQuoteRequest,
  CounterOfferRequest,
  QuoteMessageListResponse,
  SendMessageRequest,
  VendorProfileResponse,
  UpdateVendorProfileRequest,
  ApiResponse,
  VendorUser,
  VendorProfile,
} from '@/types/vendor/portal';

const VENDOR_API_BASE = '/vendor';

// Storage keys for vendor portal
const STORAGE_KEYS = {
  TOKEN: 'vendor_token',
  USER: 'vendor_user',
  PROFILE: 'vendor_profile',
  LOGIN_TIMESTAMP: 'vendor_login_timestamp',
} as const;

/**
 * Vendor API Service
 * 
 * Provides methods for interacting with the vendor portal API.
 * All methods use the shared apiClient which handles:
 * - Token management
 * - Error handling
 * - Request/response interceptors
 * - Tenant scoping
 */
class VendorApiService {
  // ============================================================================
  // Authentication Methods
  // ============================================================================

  /**
   * Login vendor user
   * 
   * @param credentials - Email and password
   * @returns Authentication response with token and user data
   * @throws {Error} If login fails
   * 
   * @example
   * ```typescript
   * const response = await vendorApi.login({
   *   email: 'vendor@example.com',
   *   password: 'password123'
   * });
   * 
   * // Store token
   * localStorage.setItem('vendor_token', response.data.token);
   * ```
   */
  async login(credentials: VendorLoginRequest): Promise<VendorAuthResponse> {
    try {
      const response = await vendorApiClient.post<VendorAuthResponse>(
        `${VENDOR_API_BASE}/auth/login`,
        credentials
      ) as unknown as VendorAuthResponse;

      // Store token if login successful
      if (response.success && response.data.token) {
        this.setAuthToken(response.data.token);
        this.setVendorUser(response.data.user);
        this.setVendorProfile(response.data.vendor);
        localStorage.setItem(STORAGE_KEYS.LOGIN_TIMESTAMP, Date.now().toString());
      }

      return response;
    } catch (error: any) {
      console.error('Vendor login error:', error);
      throw new Error(error.message || 'Login failed. Please check your credentials.');
    }
  }

  /**
   * Logout vendor user
   * 
   * Revokes the current authentication token and clears local storage.
   * 
   * @param allDevices - If true, logout from all devices
   * @returns Success response
   * @throws {Error} If logout fails
   * 
   * @example
   * ```typescript
   * // Logout from current device only
   * await vendorApi.logout();
   * 
   * // Logout from all devices
   * await vendorApi.logout(true);
   * ```
   */
  async logout(allDevices: boolean = false): Promise<ApiResponse<{ message: string }>> {
    try {
      // @ts-expect-error - vendorApiClient response interceptor unwraps the response
      const response = await vendorApiClient.post<ApiResponse<{ message: string }>>(
        `${VENDOR_API_BASE}/auth/logout`,
        { all_devices: allDevices }
      ) as ApiResponse<{ message: string }>;

      // Clear local storage
      this.clearAuth();

      return response;
    } catch (error: any) {
      // Clear auth even if API call fails
      this.clearAuth();
      console.warn('Logout API call failed, cleared local auth data anyway');
      throw new Error(error.message || 'Logout failed');
    }
  }

  /**
   * Request password reset
   * 
   * Sends a password reset email to the vendor
   * 
   * @param data - Email address
   * @returns Success response
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * await vendorApi.requestPasswordReset({
   *   email: 'vendor@example.com'
   * });
   * ```
   */
  async requestPasswordReset(data: VendorPasswordResetRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.post<ApiResponse<{ message: string }>>(
        `${VENDOR_API_BASE}/auth/password/email`,
        data
      ) as ApiResponse<{ message: string }>;

      return response;
    } catch (error: any) {
      console.error('Password reset request error:', error);
      throw new Error(error.message || 'Failed to send password reset email.');
    }
  }

  /**
   * Reset password
   * 
   * Resets the vendor's password using a reset token
   * 
   * @param data - Reset token, email, new password, and confirmation
   * @returns Success response
   * @throws {Error} If reset fails
   * 
   * @example
   * ```typescript
   * await vendorApi.resetPassword({
   *   token: 'reset-token',
   *   email: 'vendor@example.com',
   *   password: 'newpassword123',
   *   password_confirmation: 'newpassword123'
   * });
   * ```
   */
  async resetPassword(data: VendorPasswordResetConfirmation): Promise<ApiResponse<{ message: string }>> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.post<ApiResponse<{ message: string }>>(
        `${VENDOR_API_BASE}/auth/password/reset`,
        data
      ) as ApiResponse<{ message: string }>;

      return response;
    } catch (error: any) {
      console.error('Password reset error:', error);
      throw new Error(error.message || 'Failed to reset password.');
    }
  }

  // ============================================================================
  // Quote Methods
  // ============================================================================

  /**
   * Get vendor quotes
   * 
   * Retrieves a paginated list of quotes assigned to the vendor
   * 
   * @param filters - Optional filters for status, search, pagination
   * @returns Quote list with pagination and statistics
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const response = await vendorApi.getQuotes({
   *   status: 'pending_response',
   *   page: 1,
   *   per_page: 20
   * });
   * ```
   */
  async getQuotes(filters?: VendorQuoteFilters): Promise<VendorQuoteListResponse> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.get<VendorQuoteListResponse>(
        `${VENDOR_API_BASE}/quotes`,
        { params: filters }
      ) as VendorQuoteListResponse;

      return response;
    } catch (error: any) {
      console.error('Get quotes error:', error);
      throw new Error(error.message || 'Failed to load quotes.');
    }
  }

  /**
   * Get quote detail
   * 
   * Retrieves complete details for a specific quote
   * 
   * @param quoteUuid - Quote UUID
   * @returns Quote detail with all related data
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const response = await vendorApi.getQuoteDetail('quote-uuid');
   * ```
   */
  async getQuoteDetail(quoteUuid: string): Promise<VendorQuoteDetailResponse> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.get<VendorQuoteDetailResponse>(
        `${VENDOR_API_BASE}/quotes/${quoteUuid}`
      ) as VendorQuoteDetailResponse;

      return response;
    } catch (error: any) {
      console.error('Get quote detail error:', error);
      throw new Error(error.message || 'Failed to load quote details.');
    }
  }

  /**
   * Accept quote
   * 
   * Accepts a quote with estimated delivery days.
   * This endpoint works for:
   * - Accepting original quote (status: sent, pending_response)
   * - Accepting admin counter offer (status: admin_countered)
   * 
   * @param quoteUuid - Quote UUID
   * @param data - Estimated delivery days and optional notes
   * @returns Success response
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * // Accept original quote
   * await vendorApi.acceptQuote('quote-uuid', {
   *   estimated_delivery_days: 14,
   *   notes: 'Can deliver within 2 weeks'
   * });
   * 
   * // Accept admin counter offer (same endpoint)
   * await vendorApi.acceptQuote('quote-uuid', {
   *   estimated_delivery_days: 14,
   *   notes: 'Accepting admin counter offer'
   * });
   * ```
   */
  async acceptQuote(quoteUuid: string, data: AcceptQuoteRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.post<ApiResponse<{ message: string }>>(
        `${VENDOR_API_BASE}/quotes/${quoteUuid}/accept`,
        data
      ) as ApiResponse<{ message: string }>;

      return response;
    } catch (error: any) {
      console.error('Accept quote error:', error);
      throw new Error(error.message || 'Failed to accept quote.');
    }
  }

  /**
   * Reject quote
   * 
   * Rejects a quote with a reason
   * 
   * @param quoteUuid - Quote UUID
   * @param data - Rejection reason
   * @returns Success response
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * await vendorApi.rejectQuote('quote-uuid', {
   *   rejection_reason: 'Cannot meet the specifications'
   * });
   * ```
   */
  async rejectQuote(quoteUuid: string, data: RejectQuoteRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.post<ApiResponse<{ message: string }>>(
        `${VENDOR_API_BASE}/quotes/${quoteUuid}/reject`,
        data
      ) as ApiResponse<{ message: string }>;

      return response;
    } catch (error: any) {
      console.error('Reject quote error:', error);
      throw new Error(error.message || 'Failed to reject quote.');
    }
  }

  /**
   * Counter offer quote
   * 
   * Submits a counter offer for a quote
   * 
   * @param quoteUuid - Quote UUID
   * @param data - Counter offer amount and optional notes
   * @returns Success response
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * await vendorApi.counterOffer('quote-uuid', {
   *   counter_offer_amount: 15000,
   *   notes: 'Best price we can offer'
   * });
   * ```
   */
  async counterOffer(quoteUuid: string, data: CounterOfferRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.post<ApiResponse<{ message: string }>>(
        `${VENDOR_API_BASE}/quotes/${quoteUuid}/counter-offer`,
        data
      ) as ApiResponse<{ message: string }>;

      return response;
    } catch (error: any) {
      console.error('Counter offer error:', error);
      throw new Error(error.message || 'Failed to submit counter offer.');
    }
  }

  // ============================================================================
  // Message Methods
  // ============================================================================

  /**
   * Get quote messages
   * 
   * Retrieves messages for a specific quote
   * 
   * @param quoteUuid - Quote UUID
   * @param page - Page number for pagination
   * @param perPage - Items per page
   * @returns Message list with pagination
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const response = await vendorApi.getMessages('quote-uuid', 1, 20);
   * ```
   */
  async getMessages(quoteUuid: string, page: number = 1, perPage: number = 20): Promise<QuoteMessageListResponse> {
    try {
      // vendorApiClient response interceptor unwraps response.data
      // So we get { message, data: [...], pagination } directly
      const response = await vendorApiClient.get<QuoteMessageListResponse>(
        `${VENDOR_API_BASE}/quotes/${quoteUuid}/messages`,
        { params: { page, per_page: perPage } }
      );

      return response;
    } catch (error: any) {
      console.error('Get messages error:', error);
      throw new Error(error.message || 'Failed to load messages.');
    }
  }

  /**
   * Send message
   * 
   * Sends a message on a quote thread
   * 
   * @param quoteUuid - Quote UUID
   * @param data - Message content and optional attachments
   * @returns Success response
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * await vendorApi.sendMessage('quote-uuid', {
   *   message: 'Question about specifications',
   *   attachments: [file1, file2]
   * });
   * ```
   */
  async sendMessage(quoteUuid: string, data: SendMessageRequest): Promise<ApiResponse<{ message: string }>> {
    try {
      // If attachments are present, use FormData
      if (data.attachments && data.attachments.length > 0) {
        const formData = new FormData();
        formData.append('message', data.message);
        
        data.attachments.forEach((file, index) => {
          formData.append(`attachments[${index}]`, file);
        });

        // @ts-expect-error - apiClient response interceptor unwraps the response
        const response = await vendorApiClient.post<ApiResponse<{ message: string }>>(
          `${VENDOR_API_BASE}/quotes/${quoteUuid}/messages`,
          formData,
          {
            headers: {
              'Content-Type': 'multipart/form-data',
            },
          }
        ) as ApiResponse<{ message: string }>;

        return response;
      } else {
        // No attachments, send as JSON
        // @ts-expect-error - apiClient response interceptor unwraps the response
        const response = await vendorApiClient.post<ApiResponse<{ message: string }>>(
          `${VENDOR_API_BASE}/quotes/${quoteUuid}/messages`,
          { message: data.message }
        ) as ApiResponse<{ message: string }>;

        return response;
      }
    } catch (error: any) {
      console.error('Send message error:', error);
      throw new Error(error.message || 'Failed to send message.');
    }
  }

  // ============================================================================
  // Profile Methods
  // ============================================================================

  /**
   * Get vendor profile
   * 
   * Retrieves the vendor's profile and performance metrics
   * 
   * @returns Profile data with metrics
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * const response = await vendorApi.getProfile();
   * ```
   */
  async getProfile(): Promise<VendorProfileResponse> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.get<VendorProfileResponse>(
        `${VENDOR_API_BASE}/profile`
      ) as VendorProfileResponse;

      // Update cached profile
      if (response.success && response.data.vendor) {
        this.setVendorProfile(response.data.vendor);
      }

      return response;
    } catch (error: any) {
      console.error('Get profile error:', error);
      throw new Error(error.message || 'Failed to load profile.');
    }
  }

  /**
   * Update vendor profile
   * 
   * Updates the vendor's profile information
   * 
   * @param data - Profile fields to update
   * @returns Success response
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * await vendorApi.updateProfile({
   *   email: 'newemail@example.com',
   *   phone: '+1234567890',
   *   contact_person: 'John Doe'
   * });
   * ```
   */
  async updateProfile(data: UpdateVendorProfileRequest): Promise<ApiResponse<{ message: string; vendor: VendorProfile }>> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.put<ApiResponse<{ message: string; vendor: VendorProfile }>>(
        `${VENDOR_API_BASE}/profile`,
        data
      ) as ApiResponse<{ message: string; vendor: VendorProfile }>;

      // Update cached profile
      if (response.success && response.data?.vendor) {
        this.setVendorProfile(response.data.vendor);
      }

      return response;
    } catch (error: any) {
      console.error('Update profile error:', error);
      throw new Error(error.message || 'Failed to update profile.');
    }
  }

  /**
   * Change password
   * 
   * Changes the vendor user's password
   * 
   * @param data - Current password, new password, and confirmation
   * @returns Success response
   * @throws {Error} If request fails
   * 
   * @example
   * ```typescript
   * await vendorApi.changePassword({
   *   current_password: 'oldpassword',
   *   new_password: 'newpassword123',
   *   new_password_confirmation: 'newpassword123'
   * });
   * ```
   */
  async changePassword(data: {
    current_password: string;
    new_password: string;
    new_password_confirmation: string;
  }): Promise<ApiResponse<{ message: string }>> {
    try {
      // @ts-expect-error - apiClient response interceptor unwraps the response
      const response = await vendorApiClient.post<ApiResponse<{ message: string }>>(
        `${VENDOR_API_BASE}/auth/password/change`,
        data
      ) as ApiResponse<{ message: string }>;

      return response;
    } catch (error: any) {
      console.error('Change password error:', error);
      throw new Error(error.message || 'Failed to change password.');
    }
  }

  // ============================================================================
  // Token Management Methods
  // ============================================================================

  /**
   * Set authentication token
   * 
   * Stores the authentication token in localStorage
   * 
   * @param token - JWT token
   */
  private setAuthToken(token: string): void {
    localStorage.setItem(STORAGE_KEYS.TOKEN, token);
    // Also set in the main auth_token for apiClient
    localStorage.setItem('auth_token', token);
  }

  /**
   * Get authentication token
   * 
   * Retrieves the authentication token from localStorage
   * 
   * @returns JWT token or null
   */
  getAuthToken(): string | null {
    return localStorage.getItem(STORAGE_KEYS.TOKEN);
  }

  /**
   * Set vendor user
   * 
   * Stores the vendor user data in localStorage
   * 
   * @param user - Vendor user object
   */
  private setVendorUser(user: VendorUser): void {
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(user));
  }

  /**
   * Get vendor user
   * 
   * Retrieves the vendor user data from localStorage
   * 
   * @returns Vendor user object or null
   */
  getVendorUser(): VendorUser | null {
    const user = localStorage.getItem(STORAGE_KEYS.USER);
    return user ? JSON.parse(user) : null;
  }

  /**
   * Set vendor profile
   * 
   * Stores the vendor profile data in localStorage
   * 
   * @param profile - Vendor profile object
   */
  private setVendorProfile(profile: VendorProfile): void {
    localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(profile));
  }

  /**
   * Get vendor profile
   * 
   * Retrieves the vendor profile data from localStorage
   * 
   * @returns Vendor profile object or null
   */
  getVendorProfile(): VendorProfile | null {
    const profile = localStorage.getItem(STORAGE_KEYS.PROFILE);
    return profile ? JSON.parse(profile) : null;
  }

  /**
   * Clear authentication
   * 
   * Removes all vendor authentication data from localStorage
   */
  private clearAuth(): void {
    localStorage.removeItem(STORAGE_KEYS.TOKEN);
    localStorage.removeItem(STORAGE_KEYS.USER);
    localStorage.removeItem(STORAGE_KEYS.PROFILE);
    localStorage.removeItem(STORAGE_KEYS.LOGIN_TIMESTAMP);
    // Also clear main auth_token
    localStorage.removeItem('auth_token');
  }

  /**
   * Check if vendor is authenticated
   * 
   * Checks if a valid authentication token exists
   * 
   * @returns True if authenticated, false otherwise
   */
  isAuthenticated(): boolean {
    const token = this.getAuthToken();
    const user = this.getVendorUser();
    return !!(token && user);
  }

  /**
   * Check if vendor has portal access
   * 
   * Checks if the vendor has portal access enabled
   * 
   * @returns True if portal access is enabled, false otherwise
   */
  hasPortalAccess(): boolean {
    const profile = this.getVendorProfile();
    return !!(profile && profile.portal_access_enabled);
  }

  /**
   * Check if vendor onboarding is completed
   * 
   * Checks if the vendor has completed onboarding
   * 
   * @returns True if onboarding is completed, false otherwise
   */
  isOnboardingCompleted(): boolean {
    const profile = this.getVendorProfile();
    return !!(profile && profile.onboarding_status === 'completed');
  }
}

// Export singleton instance
const vendorApi = new VendorApiService();
export default vendorApi;

