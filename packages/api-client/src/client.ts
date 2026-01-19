import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
  headers?: Record<string, string>;
  withCredentials?: boolean;
}

export interface ApiClient {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T>;
  setAuthToken(token: string): void;
  clearAuthToken(): void;
}

export function createApiClient(config: ApiClientConfig): ApiClient {
  const instance: AxiosInstance = axios.create({
    baseURL: config.baseURL,
    timeout: config.timeout || 30000,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      ...config.headers,
    },
    withCredentials: config.withCredentials ?? true,
  });

  instance.interceptors.request.use(
    (config) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        const token = localStorage.getItem('auth_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  instance.interceptors.response.use(
    (response) => response.data,
    (error) => {
      if (error.response?.status === 401 && typeof window !== 'undefined') {
        if (window.localStorage) {
          localStorage.removeItem('auth_token');
        }
        if (window.location) {
          window.location.href = '/login';
        }
      }
      return Promise.reject(error);
    }
  );

  const client: ApiClient = {
    get: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => instance.get<T>(url, config) as any,
    post: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => instance.post<T>(url, data, config) as any,
    put: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => instance.put<T>(url, data, config) as any,
    patch: <T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => instance.patch<T>(url, data, config) as any,
    delete: <T>(url: string, config?: AxiosRequestConfig): Promise<T> => instance.delete<T>(url, config) as any,
    setAuthToken: (token: string) => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('auth_token', token);
      }
      instance.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    },
    clearAuthToken: () => {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.removeItem('auth_token');
      }
      delete instance.defaults.headers.common['Authorization'];
    },
  };
  
  return client;
}

export const apiClient = createApiClient({
  baseURL: typeof window !== 'undefined' ? (window as any).API_BASE_URL || '/api' : '/api',
});
