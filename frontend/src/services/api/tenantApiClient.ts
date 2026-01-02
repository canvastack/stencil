import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';
import { authService } from '@/services/api/auth';

export interface ApiResponse<T = any> {
  data: T;
  message?: string;
  success: boolean;
  errors?: Record<string, string[]>;
}

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  code?: string;
}

class TenantApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    const apiBaseURL = import.meta.env.VITE_TENANT_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    this.baseURL = `${apiBaseURL}/tenant`;
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Context': 'tenant'
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add tenant context and auth token
    this.client.interceptors.request.use(
      (config) => {
        // Add tenant authentication token
        const token = authService.getToken();
        if (token && authService.getAccountType() === 'tenant') {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add tenant-specific headers
        const tenantData = authService.getCurrentTenantFromStorage();
        if (tenantData) {
          config.headers['X-Tenant-ID'] = tenantData.uuid;
          config.headers['X-Tenant-Slug'] = tenantData.slug;
        }
        
        config.headers['X-Tenant-Request'] = 'true';
        config.headers['X-Context'] = 'tenant';

        console.log(`TenantApiClient: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data
        });

        return config;
      },
      (error) => {
        console.error('TenantApiClient: Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle tenant-specific responses and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log(`TenantApiClient: Response ${response.status}:`, response.data);
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        console.warn('TenantApiClient: Response error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        // Handle tenant-specific authentication errors
        if (error.response?.status === 401) {
          console.log('TenantApiClient: Unauthorized - checking token type before clearing auth');
          
          // PROTECTION: Don't clear demo tokens on 401 errors as they're expected to fail API calls
          const token = authService.getAuthToken();
          if (token && authService.isDemoToken(token)) {
            console.log('TenantApiClient: Demo token detected, skipping auth clear on 401');
            // Demo tokens are expected to get 401 from real API endpoints
            // Don't clear auth or redirect - let the app continue with demo data
          } else {
            // Only clear auth and redirect for real tokens in admin context
            if (window.location.pathname.startsWith('/admin')) {
              authService.clearAuth(true); // Force clear for real 401 errors
              window.location.href = '/login';
            }
            // For public pages, just log the error but don't clear auth
            // Let ContentContext handle the fallback to anonymous content
          }
        }

        // Handle tenant-specific forbidden errors
        if (error.response?.status === 403) {
          console.log('TenantApiClient: Forbidden - insufficient tenant permissions');
          throw new Error('Insufficient tenant permissions');
        }

        // Handle tenant isolation violations
        if (error.response?.status === 422 && error.response?.data?.code === 'TENANT_ISOLATION_VIOLATION') {
          console.error('TenantApiClient: Tenant isolation violation detected');
          authService.clearAuth();
          window.location.href = '/admin/login';
          return;
        }

        // Handle tenant-specific server errors
        if (error.response?.status >= 500) {
          console.error('TenantApiClient: Server error:', error.response?.data);
          throw new Error('Tenant service temporarily unavailable');
        }

        return Promise.reject(error);
      }
    );
  }

  // GET request
  async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.get<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // POST request
  async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.post<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PUT request
  async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.put<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // PATCH request
  async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.patch<ApiResponse<T>>(url, data, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // DELETE request
  async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.client.delete<ApiResponse<T>>(url, config);
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // File upload
  async uploadFile<T = any>(url: string, file: File, additionalData?: Record<string, any>): Promise<ApiResponse<T>> {
    const formData = new FormData();
    formData.append('file', file);
    
    if (additionalData) {
      Object.keys(additionalData).forEach(key => {
        formData.append(key, additionalData[key]);
      });
    }

    try {
      const response = await this.client.post<ApiResponse<T>>(url, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      throw this.handleError(error);
    }
  }

  // Handle errors consistently
  private handleError(error: any): ApiError {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiError>;
      
      if (axiosError.response?.data) {
        return {
          message: axiosError.response.data.message || 'Tenant API request failed',
          errors: axiosError.response.data.errors,
          status: axiosError.response.status,
          code: axiosError.response.data.code
        };
      }
      
      if (axiosError.request) {
        return {
          message: 'Tenant service is unavailable. Please try again later.',
          status: 0
        };
      }
      
      return {
        message: axiosError.message || 'Tenant API request failed'
      };
    }
    
    return {
      message: error.message || 'Tenant API request failed'
    };
  }

  // Get current base URL
  getBaseURL(): string {
    return this.baseURL;
  }

  // Update base URL (useful for environment switching)
  setBaseURL(baseURL: string): void {
    this.baseURL = baseURL;
    this.client.defaults.baseURL = baseURL;
  }

  // Check if the client is properly configured for tenant requests
  isTenantContext(): boolean {
    return authService.getAccountType() === 'tenant' && authService.isAuthenticated();
  }

  // Get current tenant information
  getCurrentTenant(): { uuid: string; slug: string; name: string } | null {
    return authService.getCurrentTenantFromStorage();
  }

  // Validate tenant context before making requests
  validateTenantContext(): boolean {
    const tenant = this.getCurrentTenant();
    if (!tenant) {
      console.error('TenantApiClient: No tenant context available');
      return false;
    }
    
    if (!authService.isAuthenticated()) {
      console.error('TenantApiClient: Not authenticated');
      return false;
    }
    
    return true;
  }

  // Get raw axios instance (use sparingly)
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
export const tenantApiClient = new TenantApiClient();

// Export the class for testing purposes
export { TenantApiClient };