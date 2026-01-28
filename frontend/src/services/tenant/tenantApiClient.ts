import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
const LOG_LEVEL = import.meta.env.VITE_APP_LOG_LEVEL || 'error';

console.log('[TenantApiClient v2.0 - URL FIX APPLIED] Initializing with baseURL:', API_BASE_URL);

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
          console.log('[TenantApiClient] Setting X-Tenant-ID header:', tenantId);
        } else {
          console.log('[TenantApiClient] No tenant ID available for header');
        }

        // Ensure all requests go through tenant endpoints
        if (config.url && !config.url.startsWith('http')) {
          let url = config.url;
          
          // Remove /api/v1 prefix if present (baseURL already includes it)
          if (url.startsWith('/api/v1/')) {
            url = url.substring(7);
          }
          
          // Add /tenant/ prefix if not present and not auth endpoint
          if (!url.startsWith('/tenant/') && !url.startsWith('/auth/')) {
            url = `/tenant${url.startsWith('/') ? url : '/' + url}`;
          }
          
          config.url = url;
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
        console.log('[TenantApiClient] Response interceptor - RAW response:', {
          status: response.status,
          url: response.config.url,
          dataType: typeof response.data,
          isObject: response.data && typeof response.data === 'object',
          hasData: response.data && 'data' in response.data,
          hasCurrentPage: response.data && 'current_page' in response.data,
          dataKeys: response.data && typeof response.data === 'object' ? Object.keys(response.data) : [],
          data: response.data
        });
        
        // Unwrap nested data structure from Laravel pagination/responses
        if (response.data && typeof response.data === 'object') {
          // Handle paginated responses (Laravel standard)
          if ('data' in response.data && 'current_page' in response.data) {
            const result = {
              data: response.data.data,
              current_page: response.data.current_page,
              last_page: response.data.last_page,
              per_page: response.data.per_page,
              total: response.data.total,
              from: response.data.from,
              to: response.data.to,
              links: response.data.links,
            };
            console.log('[TenantApiClient] Returning paginated response:', {
              dataLength: Array.isArray(result.data) ? result.data.length : 'not array',
              currentPage: result.current_page,
              total: result.total,
              result: result
            });
            return result;
          }
          
          // Handle single resource responses wrapped in { data: {...} }
          if ('data' in response.data && !Array.isArray(response.data) && Object.keys(response.data).length === 1) {
            console.log('[TenantApiClient] Unwrapping single resource response');
            return response.data.data;
          }
        }
        
        console.log('[TenantApiClient] Returning response.data as-is:', response.data);
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

        if (error.response?.status === 422) {
          this.log('warn', 'Validation error (422)', {
            url: error.config?.url,
            errors: (error.response?.data as any)?.errors,
          });
        }

        return Promise.reject(this.formatError(error));
      }
    );
  }

  private async handleUnauthorized(config: InternalAxiosRequestConfig, error: AxiosError) {
    // CRITICAL: Only handle 401 errors for tenant accounts
    const currentAccountType = this.getAccountType();
    
    if (currentAccountType !== 'tenant') {
      this.log('warn', '401 error but account is not tenant, skipping logout', { 
        currentAccountType,
        url: config.url 
      });
      return Promise.reject(error);
    }

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

    if (!config || this.isRefreshing) {
      this.log('warn', '401 error - max retries or already refreshing, logging out');
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

      this.log('info', 'Token refreshed, retrying request', { url: config.url });
      return this.instance(config);
    } catch (refreshError) {
      this.refreshPromise = null;
      this.isRefreshing = false;
      
      this.log('error', 'Token refresh failed, logging out', refreshError);
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
    let errors: Record<string, string[]> | undefined;

    if (data?.message) {
      message = data.message;
    }

    if (data?.details) {
      details = data.details;
    }

    // Handle validation errors (422)
    if (status === 422 && data?.errors) {
      errors = data.errors;
    }

    return {
      message,
      status,
      details,
      errors,
      originalError: error,
      clientType: 'tenant',
    };
  }

  private getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  private getTenantId(): string | null {
    const tenantId = localStorage.getItem('tenant_id');
    console.log('[TenantApiClient] getTenantId called:', { 
      tenantId, 
      type: typeof tenantId,
      localStorage_keys: Object.keys(localStorage)
    });
    return tenantId;
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
    localStorage.removeItem('login_timestamp');

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
  errors?: Record<string, string[]>;
  originalError?: AxiosError;
  clientType: 'tenant';
}

const tenantClientManager = new TenantApiClientManager();
export const tenantApiClient = tenantClientManager.getClient();
export { tenantClientManager };

export default tenantApiClient;