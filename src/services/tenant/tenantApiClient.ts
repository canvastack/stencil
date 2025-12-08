import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
const LOG_LEVEL = import.meta.env.VITE_APP_LOG_LEVEL || 'error';

interface TenantApiClientOptions {
  timeout?: number;
  withCredentials?: boolean;
  baseURL?: string;
}

class TenantApiClientManager {
  private instance: AxiosInstance;
  private refreshPromise: Promise<string> | null = null;
  private isRefreshing = false;
  private logLevel: 'debug' | 'info' | 'warn' | 'error' = LOG_LEVEL as any;

  constructor(options: TenantApiClientOptions = {}) {
    this.instance = axios.create({
      baseURL: options.baseURL || API_BASE_URL,
      timeout: options.timeout || 10000,
      withCredentials: options.withCredentials !== false,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Type': 'tenant', // Identify this as tenant client
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
      const prefix = `[${timestamp}] [Tenant API] [${level.toUpperCase()}]`;

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
        const accountType = this.getAccountType();

        // Validate that this is a tenant account
        if (accountType !== 'tenant') {
          throw new Error('Tenant API client can only be used with tenant accounts');
        }

        // Validate tenant context
        if (!tenantId) {
          throw new Error('Tenant context is required for tenant API calls');
        }

        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        if (tenantId && config.headers) {
          config.headers['X-Tenant-ID'] = tenantId;
        }

        // Ensure all requests go through tenant endpoints
        if (config.url && !config.url.startsWith('/tenant/')) {
          // Prefix non-absolute URLs with /tenant/ (but allow auth endpoints)
          if (!config.url.startsWith('http') && !config.url.startsWith('/auth/')) {
            config.url = `/tenant${config.url.startsWith('/') ? config.url : '/' + config.url}`;
          }
        }

        this.log('debug', `${config.method?.toUpperCase()} ${config.url}`, {
          headers: { ...config.headers, Authorization: token ? '[REDACTED]' : undefined },
          data: config.data,
        });

        return config;
      },
      (error: AxiosError) => {
        this.log('error', 'Tenant API request interceptor error', error.message);
        return Promise.reject(error);
      }
    );
  }

  private setupResponseInterceptor() {
    this.instance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.log('debug', `Tenant API response received: ${response.status}`, {
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
          this.log('warn', 'Tenant access forbidden (403)', {
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
      
      this.logout();
      return Promise.reject(refreshError);
    }
  }

  private async refreshToken(): Promise<string> {
    try {
      const response = await this.instance.post('/tenant/auth/refresh', {});
      const newToken = response.token || response.access_token;

      if (newToken) {
        localStorage.setItem('auth_token', newToken);
        this.log('info', 'Tenant token refreshed successfully');
        return newToken;
      }

      throw new Error('No token in refresh response');
    } catch (error) {
      this.log('error', 'Tenant token refresh failed', error);
      throw error;
    }
  }

  private formatError(error: AxiosError): TenantApiError {
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
      clientType: 'tenant',
    };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getTenantId(): string | null {
    return localStorage.getItem('tenant_id');
  }

  private getAccountType(): string | null {
    return localStorage.getItem('account_type');
  }

  private logout() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('account_type');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant');

    this.log('info', 'Tenant user logged out due to authentication error');

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

export interface TenantApiError {
  message: string;
  status: number;
  details?: Record<string, any>;
  originalError?: AxiosError;
  clientType: 'tenant';
}

const tenantClientManager = new TenantApiClientManager();
export const tenantApiClient = tenantClientManager.getClient();
export { tenantClientManager };

export default tenantApiClient;