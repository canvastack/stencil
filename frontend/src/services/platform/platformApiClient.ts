import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const LOG_LEVEL = import.meta.env.VITE_APP_LOG_LEVEL || 'error';

interface PlatformApiClientOptions {
  timeout?: number;
  withCredentials?: boolean;
  baseURL?: string;
}

class PlatformApiClientManager {
  private instance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing = false;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = LOG_LEVEL as any;

  constructor(options: PlatformApiClientOptions = {}) {
    this.instance = axios.create({
      baseURL: options.baseURL || API_BASE_URL,
      timeout: options.timeout || 10000,
      withCredentials: options.withCredentials !== false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Type': 'platform', // Identify this as platform client
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
      const prefix = `[${timestamp}] [Platform API] [${level.toUpperCase()}]`;

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
        const accountType = this.getAccountType();

        // Validate that this is a platform account
        if (accountType !== 'platform') {
          // In demo mode, allow missing account type
          if (!this.isDemoMode()) {
            throw new Error('Platform API client can only be used with platform accounts');
          }
        }

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Ensure all requests go through platform endpoints
        if (config.url && !config.url.startsWith('/platform/')) {
          // Prefix non-absolute URLs with /platform/ (but allow auth endpoints)
          if (!config.url.startsWith('http') && !config.url.startsWith('/auth/')) {
            config.url = `/platform${config.url.startsWith('/') ? config.url : '/' + config.url}`;
          }
        }

        this.log('debug', `${config.method?.toUpperCase()} ${config.url}`, {
          headers: { ...config.headers, Authorization: token ? '[REDACTED]' : undefined },
          data: config.data,
        });

        return config;
      },
      (error: AxiosError) => {
        this.log('error', 'Platform API request interceptor error', error.message);
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptor() {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.log('debug', `Platform API response received: ${response.status}`, {
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
          this.log('warn', 'Platform access forbidden (403)', {
            url: error.config?.url,
            data: error.response?.data,
          });
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private async handleUnauthorized(config: InternalAxiosRequestConfig, error: AxiosError) {
    // In development mode or with demo credentials, don't auto-logout for API failures
    const isDemoMode = this.isDemoMode();
    
    if (isDemoMode) {
      this.log('warn', 'Demo mode: Ignoring 401 error to prevent auto-logout', {
        url: config?.url,
        error: error.message
      });
      return Promise.reject(this.formatError(error));
    }

    if (!config || this.isRefreshing) {
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
      }

      return this.instance(config);
    } catch (refreshError) {
      this.refreshPromise = null;
      this.isRefreshing = false;
      
      // Only logout if not in demo mode
      if (!isDemoMode) {
        this.logout();
      }
      return Promise.reject(refreshError);
    }
  }

  private async refreshToken(): Promise<string> {
    try {
      // In demo mode, just return the existing token or generate a new demo token
      if (this.isDemoMode()) {
        const existingToken = this.getAuthToken();
        if (existingToken) {
          this.log('info', 'Demo mode: Using existing token instead of refreshing');
          return existingToken;
        }
        
        // Generate a new demo token
        const newDemoToken = 'demo_platform_token_' + Date.now();
        localStorage.setItem('auth_token', newDemoToken);
        this.log('info', 'Demo mode: Generated new demo platform token');
        return newDemoToken;
      }

      const response = await this.instance.post('/platform/auth/refresh', {});
      const newToken = response.token || response.access_token;

      if (newToken) {
        localStorage.setItem('auth_token', newToken);
        this.log('info', 'Platform token refreshed successfully');
        return newToken;
      }

      throw new Error('No token in refresh response');
    } catch (error) {
      this.log('error', 'Platform token refresh failed', error);
      throw error;
    }
  }

  private formatError(error: AxiosError): PlatformApiError {
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

    return {
      message,
      status,
      details,
      originalError: error,
      clientType: 'platform',
    };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getAccountType(): string | null {
    return localStorage.getItem('account_type');
  }

  private isDemoMode(): boolean {
    // Check if we're in development or using demo tokens
    const token = this.getAuthToken();
    const isDevelopment = import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
    const isDemoToken = token?.startsWith('demo_platform_token_');
    
    return isDemoToken;
  }

  private logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('account_type');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user');
    localStorage.removeItem('platform_account');

    this.log('info', 'Platform user logged out due to authentication error');

    if (window.location.pathname !== '/platform/login') {
      window.location.href = '/platform/login';
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

export interface PlatformApiError {
  message: string;
  status: number;
  details?: Record<string, any>;
  originalError?: AxiosError;
  clientType: 'platform';
}

const platformClientManager = new PlatformApiClientManager();
export const platformApiClient = platformClientManager.getClient();
export { platformClientManager };

export default platformApiClient;