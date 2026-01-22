/**
 * API ERROR HANDLER
 * 
 * Central error handling logic for API responses
 * Converts technical errors into user-friendly messages
 * 
 * Compliance:
 * - NO MOCK FALLBACKS: Never fall back to mock data on error
 * - USER-FRIENDLY MESSAGES: Avoid exposing technical details
 * - PROPER ERROR LOGGING: Log errors for debugging
 */

import type { AxiosError } from 'axios';

export interface ApiErrorResponse {
  message: string;
  errors?: Record<string, string[]>;
  code?: string;
  status?: number;
}

/**
 * Convert API error to user-friendly message
 */
export function handleApiError(error: unknown): string {
  if (isAxiosError(error) && error.response) {
    const status = error.response.status;
    const data = error.response.data as ApiErrorResponse | undefined;

    switch (status) {
      case 400:
        return data?.message || 'Permintaan tidak valid. Silakan periksa input Anda.';
      
      case 401:
        return 'Autentikasi diperlukan. Silakan login kembali.';
      
      case 403:
        return 'Anda tidak memiliki izin untuk melakukan tindakan ini.';
      
      case 404:
        return 'Resource tidak ditemukan. Mungkin sudah dihapus.';
      
      case 422:
        if (data?.errors) {
          const firstError = Object.values(data.errors)[0];
          return firstError?.[0] || 'Validasi gagal. Silakan periksa input Anda.';
        }
        return data?.message || 'Validasi gagal. Silakan periksa input Anda.';
      
      case 429:
        return 'Terlalu banyak permintaan. Silakan coba lagi nanti.';
      
      case 500:
      case 502:
      case 503:
        return 'Terjadi kesalahan server. Silakan coba lagi nanti.';
      
      default:
        return data?.message || 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
    }
  }

  if (isAxiosError(error) && error.request) {
    return 'Kesalahan jaringan. Silakan periksa koneksi internet Anda.';
  }

  if (isAxiosError(error) && error.code === 'ECONNABORTED') {
    return 'Permintaan timeout. Silakan coba lagi.';
  }

  if (error instanceof Error) {
    return error.message || 'Terjadi kesalahan tidak terduga.';
  }

  return 'Terjadi kesalahan tidak terduga. Silakan coba lagi.';
}

/**
 * Type guard for Axios errors
 */
function isAxiosError(error: unknown): error is AxiosError {
  return typeof error === 'object' && error !== null && 'isAxiosError' in error;
}

/**
 * Extract validation errors for form display
 */
export function extractValidationErrors(error: unknown): Record<string, string> | null {
  if (isAxiosError(error) && error.response?.status === 422) {
    const data = error.response.data as ApiErrorResponse | undefined;
    if (data?.errors) {
      return Object.entries(data.errors).reduce((acc, [key, messages]) => {
        acc[key] = messages[0];
        return acc;
      }, {} as Record<string, string>);
    }
  }
  return null;
}

/**
 * Check if error is a specific HTTP status
 */
export function isHttpStatus(error: unknown, status: number): boolean {
  if (isAxiosError(error) && error.response) {
    return error.response.status === status;
  }
  return false;
}

/**
 * Log error for debugging (only in development)
 */
export function logError(error: unknown, context?: string): void {
  if (import.meta.env.DEV) {
    console.error(`[Error${context ? ` - ${context}` : ''}]:`, error);
  }
}

/**
 * Get error message from various error types
 */
export function getErrorMessage(error: unknown): string {
  if (typeof error === 'string') {
    return error;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  if (isAxiosError(error)) {
    return handleApiError(error);
  }
  
  return 'Terjadi kesalahan tidak terduga';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return !error.response && !!error.request;
  }
  return false;
}

/**
 * Check if error is a timeout error
 */
export function isTimeoutError(error: unknown): boolean {
  if (isAxiosError(error)) {
    return error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT';
  }
  return false;
}

/**
 * Check if error is an authentication error
 */
export function isAuthError(error: unknown): boolean {
  return isHttpStatus(error, 401);
}

/**
 * Check if error is a permission error
 */
export function isPermissionError(error: unknown): boolean {
  return isHttpStatus(error, 403);
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  return isHttpStatus(error, 422);
}

/**
 * Format error for display in UI
 */
export function formatErrorForDisplay(error: unknown): {
  title: string;
  message: string;
  action?: string;
} {
  if (isNetworkError(error)) {
    return {
      title: 'Kesalahan Jaringan',
      message: 'Tidak dapat terhubung ke server. Silakan periksa koneksi internet Anda.',
      action: 'Coba Lagi',
    };
  }

  if (isTimeoutError(error)) {
    return {
      title: 'Timeout',
      message: 'Permintaan memakan waktu terlalu lama. Silakan coba lagi.',
      action: 'Coba Lagi',
    };
  }

  if (isAuthError(error)) {
    return {
      title: 'Autentikasi Diperlukan',
      message: 'Sesi Anda telah berakhir. Silakan login kembali.',
      action: 'Login',
    };
  }

  if (isPermissionError(error)) {
    return {
      title: 'Akses Ditolak',
      message: 'Anda tidak memiliki izin untuk melakukan tindakan ini.',
    };
  }

  if (isValidationError(error)) {
    return {
      title: 'Validasi Gagal',
      message: handleApiError(error),
    };
  }

  return {
    title: 'Kesalahan',
    message: handleApiError(error),
    action: 'Tutup',
  };
}
