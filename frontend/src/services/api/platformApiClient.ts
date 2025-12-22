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

class PlatformApiClient {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_PLATFORM_API_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
    
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Context': 'platform'
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - add platform context and auth token
    this.client.interceptors.request.use(
      (config) => {
        // Add platform authentication token
        const token = authService.getToken();
        if (token && authService.getAccountType() === 'platform') {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add platform-specific headers
        config.headers['X-Platform-Request'] = 'true';
        config.headers['X-Context'] = 'platform';

        console.log(`PlatformApiClient: ${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data
        });

        return config;
      },
      (error) => {
        console.error('PlatformApiClient: Request interceptor error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor - handle platform-specific responses and errors
    this.client.interceptors.response.use(
      (response: AxiosResponse<ApiResponse>) => {
        console.log(`PlatformApiClient: Response ${response.status}:`, response.data);
        return response;
      },
      async (error: AxiosError<ApiError>) => {
        console.error('PlatformApiClient: Response error:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });

        // Handle platform-specific authentication errors
        if (error.response?.status === 401) {
          console.log('PlatformApiClient: Unauthorized - clearing platform auth');
          authService.clearAuth();
          
          // Redirect to platform login if we're in platform context
          if (window.location.pathname.startsWith('/platform')) {
            window.location.href = '/platform/login';
          }
        }

        // Handle platform-specific forbidden errors
        if (error.response?.status === 403) {
          console.log('PlatformApiClient: Forbidden - insufficient platform permissions');
          throw new Error('Insufficient platform permissions');
        }

        // Handle platform-specific server errors
        if (error.response?.status >= 500) {
          console.error('PlatformApiClient: Server error:', error.response?.data);
          throw new Error('Platform service temporarily unavailable');
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
          message: axiosError.response.data.message || 'Platform API request failed',
          errors: axiosError.response.data.errors,
          status: axiosError.response.status,
          code: axiosError.response.data.code
        };
      }
      
      if (axiosError.request) {
        return {
          message: 'Platform service is unavailable. Please try again later.',
          status: 0
        };
      }
      
      return {
        message: axiosError.message || 'Platform API request failed'
      };
    }
    
    return {
      message: error.message || 'Platform API request failed'
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

  // Check if the client is properly configured for platform requests
  isPlatformContext(): boolean {
    return authService.getAccountType() === 'platform' && authService.isAuthenticated();
  }

  // Get raw axios instance (use sparingly)
  getAxiosInstance(): AxiosInstance {
    return this.client;
  }
}

// Create singleton instance
export const platformApiClient = new PlatformApiClient();

// Export the class for testing purposes
export { PlatformApiClient };