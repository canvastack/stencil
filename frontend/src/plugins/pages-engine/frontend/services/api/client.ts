import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const LOG_LEVEL = import.meta.env.VITE_APP_LOG_LEVEL || 'error';

interface ApiClientOptions {
  timeout?: number;
  withCredentials?: boolean;
  baseURL?: string;
}

class ApiClientManager {
  private instance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing = false;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = LOG_LEVEL as any;

  constructor(options: ApiClientOptions = {}) {
    this.instance = axios.create({
      baseURL: options.baseURL || API_BASE_URL,
      timeout: options.timeout || 30000, // Increased from 10000 to 30000 to match other clients
      withCredentials: options.withCredentials !== false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupRequestInterceptor();
    this.setupResponseInterceptor();
  }

  private log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
    const levels = { debug: 0, info: 1, warn: 2, error: 3 };
    const currentLevel = levels[this.logLevel];
    const messageLevel = levels[level];

    if (messageLevel >= currentLevel) {
      const timestamp = new Date().toISOString();
      const prefix = `[${timestamp}] [API Client] [${level.toUpperCase()}]`;

      if (data) {
        console.log(`${prefix} ${message}`, data);
      } else {
        console.log(`${prefix} ${message}`);
      }
    }
  }

  private setupRequestInterceptor() {
    this.instance.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        const token = this.getAuthToken();
        const tenantId = this.getTenantId();

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (tenantId && config.headers) {
          config.headers['X-Tenant-ID'] = tenantId;
        }

        this.log('debug', `${config.method?.toUpperCase()} ${config.url}`, {
          headers: config.headers,
          data: config.data,
        });

        return config;
      },
      (error: AxiosError) => {
        this.log('error', 'Request interceptor error', error.message);
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptor() {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.log('debug', `Response received: ${response.status}`, {
          url: response.config.url,
          data: response.data,
        });
        return response.data;
      },
      async (error: AxiosError) => {
        const config = error.config as InternalAxiosRequestConfig;

        if (error.response?.status === 401) {
          return this.handleUnauthorized(config, error);
        }

        if (error.response?.status === 403) {
          this.log('warn', 'Access forbidden (403)', {
            url: error.config?.url,
            data: error.response?.data,
          });
        }

        if (error.response?.status === 400) {
          this.log('warn', 'Bad request (400)', error.response?.data);
        }

        if (error.response?.status === 500) {
          this.log('error', 'Server error (500)', error.response?.data);
        }

        if (error.code === 'ECONNABORTED' || error.code === 'ERR_NETWORK') {
          this.log('warn', 'Network error', error.message);
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private async handleUnauthorized(config: InternalAxiosRequestConfig, error: AxiosError) {
    // CRITICAL: Don't logout immediately after login - give 10 seconds grace period
    // This prevents race conditions where API calls happen before session fully propagates
    const loginTimestamp = localStorage.getItem('login_timestamp');
    if (loginTimestamp) {
      const timeSinceLogin = Date.now() - parseInt(loginTimestamp, 10);
      if (timeSinceLogin < 10000) { // 10 seconds
        this.log('warn', '401 error within 10s of login - not logging out (grace period)', {
          timeSinceLogin,
          url: config.url
        });
        return Promise.reject(error);
      }
    }

    // CRITICAL FIX: Prevent infinite retry loops
    const isRetryRequest = config.headers?.['X-Retry-Count'];
    const retryCount = parseInt(isRetryRequest as string || '0', 10);
    
    if (!config || this.isRefreshing || retryCount >= 1) {
      this.log('warn', 'Max retry attempts reached or already refreshing, logging out');
      this.logout();
      return Promise.reject(error);
    }

    this.isRefreshing = true;

    try {
      if (!this.refreshPromise) {
        this.refreshPromise = this.refreshToken();
      }

      const newToken = await this.refreshPromise;
      this.refreshPromise = null;
      this.isRefreshing = false;

      if (config.headers) {
        config.headers.Authorization = `Bearer ${newToken}`;
        config.headers['X-Retry-Count'] = '1'; // Mark as retry attempt
      }

      this.log('info', 'Token refreshed, retrying request', { url: config.url });
      return this.instance(config);
    } catch (refreshError) {
      this.refreshPromise = null;
      this.isRefreshing = false;
      this.log('error', 'Token refresh failed, logging out');
      this.logout();
      return Promise.reject(refreshError);
    }
  }

  private async refreshToken(): Promise<string> {
    try {


      const response = await this.instance.post('/auth/refresh', {});
      const newToken = response.token || response.access_token;

      if (newToken) {
        localStorage.setItem('auth_token', newToken);
        this.log('info', 'Token refreshed successfully');
        return newToken;
      }

      throw new Error('No token in refresh response');
    } catch (error) {
      this.log('error', 'Token refresh failed', error);
      throw error;
    }
  }

  private formatError(error: AxiosError): ApiError {
    const status = error.response?.status || 0;
    const data = error.response?.data as any;

    let message = error.message;
    let details = null;

    if (data?.message) {
      message = data.message;
    }

    if (data?.details) {
      details = data.details;
    }

    if (data?.error?.message) {
      message = data.error.message;
      details = data.error.details;
    }

    return {
      message,
      status,
      details,
      originalError: error,
    };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getTenantId(): string | null {
    return localStorage.getItem('tenant_id');
  }

  private logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('login_timestamp');

    this.log('info', 'User logged out due to authentication error');

    if (window.location.pathname !== '/login') {
      window.location.href = '/login';
    }
  }

  public getClient(): AxiosInstance {
    return this.instance;
  }

  public clearCache() {
    this.refreshPromise = null;
    this.isRefreshing = false;
  }
}

export interface ApiError {
  message: string;
  status: number;
  details?: Record<string, any>;
  originalError?: AxiosError;
}

const clientManager = new ApiClientManager();
export const apiClient = clientManager.getClient();
export { clientManager };

export default apiClient;
