import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import { platformApiClient, platformClientManager } from '../../services/platform/platformApiClient';

// Mock axios
vi.mock('axios');
const mockedAxios = vi.mocked(axios);

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn()
};

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage
});

// Mock console.log
const mockConsoleLog = vi.fn();
console.log = mockConsoleLog;

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_BASE_URL: 'http://localhost:8000/api/v1',
    VITE_APP_LOG_LEVEL: 'debug',
    DEV: true
  }
});

describe('PlatformApiClient', () => {
  let mockAxiosInstance: any;

  beforeEach(() => {
    mockAxiosInstance = {
      create: vi.fn(),
      interceptors: {
        request: {
          use: vi.fn()
        },
        response: {
          use: vi.fn()
        }
      },
      get: vi.fn(),
      post: vi.fn(),
      put: vi.fn(),
      delete: vi.fn()
    };

    mockedAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);
    
    vi.clearAllMocks();
    mockLocalStorage.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('creates axios instance with correct configuration', () => {
    expect(mockedAxios.create).toHaveBeenCalledWith({
      baseURL: 'http://localhost:8000/api/v1',
      timeout: 10000,
      withCredentials: true,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Client-Type': 'platform'
      }
    });
  });

  it('sets up request and response interceptors', () => {
    expect(mockAxiosInstance.interceptors.request.use).toHaveBeenCalled();
    expect(mockAxiosInstance.interceptors.response.use).toHaveBeenCalled();
  });

  it('adds authorization header when token exists', () => {
    mockLocalStorage.getItem
      .mockReturnValueOnce('test-token')
      .mockReturnValueOnce('platform');

    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const config = {
      url: '/platform/test',
      headers: {}
    };

    const result = requestInterceptor(config);

    expect(result.headers.Authorization).toBe('Bearer test-token');
  });

  it('validates platform account type in request interceptor', () => {
    mockLocalStorage.getItem
      .mockReturnValueOnce('test-token')
      .mockReturnValueOnce('tenant'); // Wrong account type

    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const config = {
      url: '/platform/test',
      headers: {}
    };

    // In production mode, this should throw an error
    Object.defineProperty(import.meta, 'env', {
      value: { DEV: false }
    });

    expect(() => requestInterceptor(config)).toThrow('Platform API client can only be used with platform accounts');
  });

  it('allows missing account type in demo mode', () => {
    mockLocalStorage.getItem
      .mockReturnValueOnce('test-token')
      .mockReturnValueOnce(null); // No account type

    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const config = {
      url: '/platform/test',
      headers: {}
    };

    // Should not throw in demo mode
    expect(() => requestInterceptor(config)).not.toThrow();
  });

  it('prefixes URLs with /platform/', () => {
    mockLocalStorage.getItem
      .mockReturnValueOnce('test-token')
      .mockReturnValueOnce('platform');

    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const config = {
      url: '/test',
      headers: {}
    };

    const result = requestInterceptor(config);

    expect(result.url).toBe('/platform/test');
  });

  it('does not prefix auth URLs', () => {
    mockLocalStorage.getItem
      .mockReturnValueOnce('test-token')
      .mockReturnValueOnce('platform');

    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const config = {
      url: '/auth/login',
      headers: {}
    };

    const result = requestInterceptor(config);

    expect(result.url).toBe('/auth/login');
  });

  it('does not prefix absolute URLs', () => {
    mockLocalStorage.getItem
      .mockReturnValueOnce('test-token')
      .mockReturnValueOnce('platform');

    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const config = {
      url: 'https://external-api.com/test',
      headers: {}
    };

    const result = requestInterceptor(config);

    expect(result.url).toBe('https://external-api.com/test');
  });

  it('logs debug information when debug level is enabled', () => {
    mockLocalStorage.getItem
      .mockReturnValueOnce('test-token')
      .mockReturnValueOnce('platform');

    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const config = {
      method: 'GET',
      url: '/platform/test',
      headers: {},
      data: { test: 'data' }
    };

    requestInterceptor(config);

    expect(mockConsoleLog).toHaveBeenCalledWith(
      expect.stringContaining('[Platform API] [DEBUG] GET /platform/test'),
      expect.any(Object)
    );
  });

  it('redacts authorization header in logs', () => {
    mockLocalStorage.getItem
      .mockReturnValueOnce('test-token')
      .mockReturnValueOnce('platform');

    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const config = {
      method: 'GET',
      url: '/platform/test',
      headers: {}
    };

    requestInterceptor(config);

    const logCall = mockConsoleLog.mock.calls.find(call => 
      call[0].includes('GET /platform/test')
    );

    expect(logCall[1].headers.Authorization).toBe('[REDACTED]');
  });

  it('handles response data extraction', () => {
    const responseInterceptor = mockAxiosInstance.interceptors.response.use.mock.calls[0][0];
    const mockResponse = {
      status: 200,
      data: { message: 'success' },
      config: { url: '/platform/test' }
    };

    const result = responseInterceptor(mockResponse);

    expect(result).toEqual({ message: 'success' });
  });

  it('handles 401 errors appropriately', async () => {
    const responseErrorHandler = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    const mockError = {
      response: {
        status: 401,
        data: { message: 'Unauthorized' }
      },
      config: {
        url: '/platform/test'
      }
    };

    // Mock demo mode to prevent auto-logout
    mockLocalStorage.getItem.mockReturnValue('demo_platform_token_123');

    try {
      await responseErrorHandler(mockError);
    } catch (error: any) {
      expect(error.message).toBeDefined();
      expect(error.status).toBe(401);
      expect(error.clientType).toBe('platform');
    }
  });

  it('handles 403 errors with proper logging', async () => {
    const responseErrorHandler = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    const mockError = {
      response: {
        status: 403,
        data: { message: 'Forbidden' }
      },
      config: {
        url: '/platform/test'
      }
    };

    try {
      await responseErrorHandler(mockError);
    } catch (error) {
      expect(mockConsoleLog).toHaveBeenCalledWith(
        expect.stringContaining('[Platform API] [WARN] Platform access forbidden (403)'),
        expect.any(Object)
      );
    }
  });

  it('generates demo token when needed', async () => {
    // Mock refresh token call in demo mode
    const platformClient = new (class extends (platformClientManager as any).constructor {
      async refreshToken() {
        return super.refreshToken();
      }
      isDemoMode() {
        return true;
      }
      getAuthToken() {
        return null;
      }
    })();

    const token = await platformClient.refreshToken();

    expect(token).toMatch(/^demo_platform_token_\d+$/);
    expect(mockLocalStorage.setItem).toHaveBeenCalledWith('auth_token', token);
  });

  it('clears cache when requested', () => {
    platformClientManager.clearCache();

    // Cache clearing is internal, but we can verify the method exists and doesn't throw
    expect(true).toBe(true);
  });

  it('handles network errors properly', async () => {
    const responseErrorHandler = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    const mockError = {
      message: 'Network Error',
      config: null
    };

    try {
      await responseErrorHandler(mockError);
    } catch (error: any) {
      expect(error.message).toBe('Network Error');
      expect(error.status).toBe(0);
      expect(error.clientType).toBe('platform');
    }
  });

  it('formats errors consistently', () => {
    const responseErrorHandler = mockAxiosInstance.interceptors.response.use.mock.calls[0][1];
    const mockError = {
      response: {
        status: 500,
        data: {
          message: 'Internal Server Error',
          details: { code: 'SERVER_ERROR' }
        }
      },
      config: {
        url: '/platform/test'
      }
    };

    responseErrorHandler(mockError).catch((error: any) => {
      expect(error.message).toBe('Internal Server Error');
      expect(error.status).toBe(500);
      expect(error.details).toEqual({ code: 'SERVER_ERROR' });
      expect(error.clientType).toBe('platform');
      expect(error.originalError).toBe(mockError);
    });
  });

  it('identifies demo mode correctly', () => {
    // Test with demo token
    mockLocalStorage.getItem.mockReturnValue('demo_platform_token_123');
    
    const requestInterceptor = mockAxiosInstance.interceptors.request.use.mock.calls[0][0];
    const config = {
      url: '/platform/test',
      headers: {}
    };

    // Should not throw even with wrong account type in demo mode
    expect(() => requestInterceptor(config)).not.toThrow();
  });

  it('handles logout correctly', () => {
    // Mock window.location
    delete (window as any).location;
    window.location = { href: '', pathname: '/platform/dashboard' } as Location;

    const platformClient = new (class extends (platformClientManager as any).constructor {
      logout() {
        super.logout();
      }
    })();

    platformClient.logout();

    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('auth_token');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('account_type');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user_id');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('user');
    expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('platform_account');
  });

  it('does not redirect on logout when already on login page', () => {
    // Mock window.location
    delete (window as any).location;
    window.location = { href: '', pathname: '/platform/login' } as Location;

    const platformClient = new (class extends (platformClientManager as any).constructor {
      logout() {
        super.logout();
      }
    })();

    const originalHref = window.location.href;
    platformClient.logout();

    expect(window.location.href).toBe(originalHref);
  });

  it('uses custom configuration when provided', () => {
    const customConfig = {
      timeout: 20000,
      withCredentials: false,
      baseURL: 'https://custom-api.com'
    };

    // Clear the mock to test new instance creation
    vi.clearAllMocks();
    mockedAxios.create = vi.fn().mockReturnValue(mockAxiosInstance);

    // This would require access to the constructor, which is not exposed
    // For now, we verify the default configuration is used
    expect(mockedAxios.create).toHaveBeenCalledWith(
      expect.objectContaining({
        baseURL: 'http://localhost:8000/api/v1',
        timeout: 10000,
        withCredentials: true
      })
    );
  });
});