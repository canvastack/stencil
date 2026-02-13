/**
 * Vendor Portal API Client
 * 
 * Dedicated API client for vendor portal that doesn't use token refresh.
 * Vendor authentication uses Laravel Sanctum tokens with 24-hour session.
 * 
 * Key Differences from Standard API Client:
 * - No token refresh logic (Sanctum tokens are session-based)
 * - Separate token storage (vendor_token vs auth_token)
 * - Vendor-specific error handling
 * - Automatic logout on 401 errors
 * 
 * @module services/api/vendorClient
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

interface ApiError {
  message: string;
  status: number;
  details: any;
  originalError: AxiosError;
}

/**
 * Vendor API Client
 * 
 * Handles all HTTP requests for vendor portal with:
 * - Automatic token injection
 * - Error handling without token refresh
 * - Request/response logging
 * - Tenant scoping
 */
class VendorApiClient {
  private instance: AxiosInstance;
  private readonly baseURL: string;
  private readonly timeout: number = 30000; // 30 seconds

  constructor() {
    this.baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
    
    this.instance = axios.create({
      baseURL: this.baseURL,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
      },
      withCredentials: true, // Important for Sanctum
    });

    this.setupInterceptors();
    
    this.log('info', 'VendorApiClient initialized', { baseURL: this.baseURL });
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - add auth token and tenant context
    this.instance.interceptors.request.use(
      (config) => this.handleRequest(config),
      (error) => this.handleRequestError(error)
    );

    // Response interceptor - handle errors and unwrap data
    this.instance.interceptors.response.use(
      (response) => this.handleResponse(response),
      (error) => this.handleResponseError(error)
    );
  }

  /**
   * Handle outgoing requests
   * - Add authentication token
   * - Add tenant context
   * - Log request details
   */
  private handleRequest(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    // Add authentication token
    const token = this.getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add tenant ID if available
    const tenantId = this.getTenantId();
    if (tenantId && config.headers) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    // Log request (only in development)
    if (import.meta.env.DEV) {
      this.log('debug', 'Request', {
        method: config.method?.toUpperCase(),
        url: config.url,
        hasAuth: !!token,
        hasTenant: !!tenantId,
      });
    }

    return config;
  }

  /**
   * Handle request errors
   */
  private handleRequestError(error: AxiosError): Promise<never> {
    this.log('error', 'Request error', error);
    return Promise.reject(error);
  }

  /**
   * Handle successful responses
   * - Unwrap data from response
   * - Log response details
   */
  private handleResponse(response: AxiosResponse): any {
    // Log response (only in development)
    if (import.meta.env.DEV) {
      this.log('debug', 'Response', {
        status: response.status,
        url: response.config.url,
      });
    }

    // Unwrap data from response
    // API returns: { success: true, data: {...}, message: "..." }
    return response.data;
  }

  /**
   * Handle response errors
   * - Format error messages
   * - Handle 401 (logout)
   * - Handle 403 (access denied)
   * - Handle validation errors
   */
  private async handleResponseError(error: AxiosError): Promise<never> {
    const status = error.response?.status || 0;

    this.log('error', 'Response error', {
      status,
      url: error.config?.url,
      message: error.message,
    });

    // Handle 401 Unauthorized - Session expired
    if (status === 401) {
      this.log('warn', 'Vendor session expired (401), logging out');
      this.handleSessionExpired();
      return Promise.reject(this.formatError(error));
    }

    // Handle 403 Forbidden - Access denied
    if (status === 403) {
      this.log('warn', 'Vendor access denied (403)');
      // Don't logout, just show error
    }

    // Handle 422 Validation Error
    if (status === 422) {
      this.log('warn', 'Validation error (422)', error.response?.data);
    }

    return Promise.reject(this.formatError(error));
  }

  /**
   * Handle session expired
   * - Clear vendor auth data
   * - Redirect to vendor login
   */
  private handleSessionExpired(): void {
    // Clear vendor auth data
    localStorage.removeItem('vendor_token');
    localStorage.removeItem('vendor_user');
    localStorage.removeItem('vendor_profile');
    localStorage.removeItem('vendor_login_timestamp');

    this.log('info', 'Vendor auth data cleared');

    // Redirect to vendor login if on vendor route
    if (typeof window !== 'undefined' && window.location.pathname.startsWith('/vendor/')) {
      if (window.location.pathname !== '/vendor/login') {
        this.log('info', 'Redirecting to vendor login');
        window.location.href = '/vendor/login';
      }
    }
  }

  /**
   * Format error for consistent error handling
   */
  private formatError(error: AxiosError): ApiError {
    const status = error.response?.status || 0;
    const data = error.response?.data as any;

    let message = error.message;
    let details = null;

    // Extract message from various response formats
    if (data?.message) {
      message = data.message;
    } else if (data?.error?.message) {
      message = data.error.message;
    } else if (data?.errors) {
      // Validation errors
      message = 'Validation failed';
      details = data.errors;
    }

    // Extract details
    if (data?.details) {
      details = data.details;
    } else if (data?.error?.details) {
      details = data.error.details;
    }

    return {
      message,
      status,
      details,
      originalError: error,
    };
  }

  /**
   * Get authentication token from localStorage
   */
  private getAuthToken(): string | null {
    return localStorage.getItem('vendor_token');
  }

  /**
   * Get tenant ID from localStorage
   */
  private getTenantId(): string | null {
    // Try to get from vendor profile first
    const profileStr = localStorage.getItem('vendor_profile');
    if (profileStr) {
      try {
        const profile = JSON.parse(profileStr);
        return profile.tenant_id || null;
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Fallback to tenant_id in localStorage
    return localStorage.getItem('tenant_id');
  }

  /**
   * Logging utility
   */
  private log(level: 'info' | 'warn' | 'error' | 'debug', message: string, data?: any): void {
    const timestamp = new Date().toISOString();
    const prefix = '[VendorApiClient]';

    if (level === 'error') {
      console.error(`${timestamp} ${prefix} [ERROR]`, message, data);
    } else if (level === 'warn') {
      console.warn(`${timestamp} ${prefix} [WARN]`, message, data);
    } else if (level === 'debug' && import.meta.env.DEV) {
      console.log(`${timestamp} ${prefix} [DEBUG]`, message, data);
    } else if (level === 'info') {
      console.log(`${timestamp} ${prefix} [INFO]`, message, data);
    }
  }

  // ============================================================================
  // Public API Methods
  // ============================================================================

  /**
   * GET request
   */
  public async get<T = any>(url: string, config?: any): Promise<T> {
    return this.instance.get<T>(url, config);
  }

  /**
   * POST request
   */
  public async post<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.post<T>(url, data, config);
  }

  /**
   * PUT request
   */
  public async put<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.put<T>(url, data, config);
  }

  /**
   * PATCH request
   */
  public async patch<T = any>(url: string, data?: any, config?: any): Promise<T> {
    return this.instance.patch<T>(url, data, config);
  }

  /**
   * DELETE request
   */
  public async delete<T = any>(url: string, config?: any): Promise<T> {
    return this.instance.delete<T>(url, config);
  }

  /**
   * Get the underlying Axios instance
   * (for advanced use cases)
   */
  public getClient(): AxiosInstance {
    return this.instance;
  }

  /**
   * Check if vendor is authenticated
   */
  public isAuthenticated(): boolean {
    const token = this.getAuthToken();
    return !!token;
  }

  /**
   * Manually logout vendor
   * (clears auth data without API call)
   */
  public logout(): void {
    this.handleSessionExpired();
  }
}

// Export singleton instance
const vendorApiClient = new VendorApiClient();
export default vendorApiClient;
