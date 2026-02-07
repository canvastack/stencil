/**
 * Error Handling Utilities for Quote Workflow
 * 
 * Provides comprehensive error handling for API errors, network errors,
 * validation errors, and timeout errors with user-friendly messages.
 */

import { AxiosError } from 'axios';

export interface ApiError {
  message: string;
  errors?: Record<string, string[]>;
  status?: number;
  type: 'validation' | 'network' | 'server' | 'timeout' | 'authentication' | 'authorization' | 'not_found' | 'unknown';
  retryable: boolean;
}

export interface FormFieldError {
  field: string;
  message: string;
}

/**
 * Parse API error response into structured error object
 */
export function parseApiError(error: unknown): ApiError {
  // Network error (no response from server)
  if (error instanceof AxiosError && !error.response) {
    if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
      return {
        message: 'Request timed out. Please check your connection and try again.',
        type: 'timeout',
        retryable: true,
      };
    }
    
    return {
      message: 'Connection failed. Please check your internet connection and try again.',
      type: 'network',
      retryable: true,
    };
  }

  // HTTP error with response
  if (error instanceof AxiosError && error.response) {
    const status = error.response.status;
    const data = error.response.data;

    // 401 Unauthorized
    if (status === 401) {
      return {
        message: 'Authentication required. Please log in again.',
        status,
        type: 'authentication',
        retryable: false,
      };
    }

    // 403 Forbidden
    if (status === 403) {
      return {
        message: 'You do not have permission to perform this action.',
        status,
        type: 'authorization',
        retryable: false,
      };
    }

    // 404 Not Found
    if (status === 404) {
      return {
        message: 'The requested resource was not found.',
        status,
        type: 'not_found',
        retryable: false,
      };
    }

    // 422 Validation Error
    if (status === 422) {
      return {
        message: data?.message || 'Validation failed. Please check your input.',
        errors: data?.errors || {},
        status,
        type: 'validation',
        retryable: false,
      };
    }

    // 500+ Server Error
    if (status >= 500) {
      return {
        message: 'Server error occurred. Please try again later or contact support.',
        status,
        type: 'server',
        retryable: true,
      };
    }

    // Other HTTP errors
    return {
      message: data?.message || `Request failed with status ${status}`,
      status,
      type: 'server',
      retryable: false,
    };
  }

  // Generic error
  if (error instanceof Error) {
    return {
      message: error.message,
      type: 'unknown',
      retryable: false,
    };
  }

  // Unknown error type
  return {
    message: 'An unexpected error occurred. Please try again.',
    type: 'unknown',
    retryable: false,
  };
}

/**
 * Convert API validation errors to field-level errors
 */
export function extractFieldErrors(apiError: ApiError): FormFieldError[] {
  if (!apiError.errors) {
    return [];
  }

  const fieldErrors: FormFieldError[] = [];

  for (const [field, messages] of Object.entries(apiError.errors)) {
    // Laravel returns arrays of error messages per field
    const message = Array.isArray(messages) ? messages[0] : messages;
    fieldErrors.push({ field, message });
  }

  return fieldErrors;
}

/**
 * Get user-friendly error message for display
 */
export function getUserFriendlyErrorMessage(error: unknown): string {
  const apiError = parseApiError(error);
  return apiError.message;
}

/**
 * Check if error is a validation error
 */
export function isValidationError(error: unknown): boolean {
  const apiError = parseApiError(error);
  return apiError.type === 'validation';
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  const apiError = parseApiError(error);
  return apiError.type === 'network' || apiError.type === 'timeout';
}

/**
 * Get retry-able error message
 */
export function getRetryableErrorMessage(error: unknown): string | null {
  const apiError = parseApiError(error);
  
  if (apiError.type === 'network' || apiError.type === 'timeout') {
    return apiError.message;
  }
  
  if (apiError.type === 'server' && apiError.status && apiError.status >= 500) {
    return apiError.message;
  }
  
  return null;
}

/**
 * Format validation errors for display
 */
export function formatValidationErrors(errors: Record<string, string[]>): string {
  const messages: string[] = [];
  
  for (const [field, fieldErrors] of Object.entries(errors)) {
    const fieldName = field.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
    fieldErrors.forEach(error => {
      messages.push(`${fieldName}: ${error}`);
    });
  }
  
  return messages.join('\n');
}

/**
 * Log error with context for debugging
 */
export function logError(
  context: string,
  error: unknown,
  additionalData?: Record<string, any>
): void {
  const apiError = parseApiError(error);
  
  console.error(`[${context}] Error occurred:`, {
    message: apiError.message,
    type: apiError.type,
    status: apiError.status,
    errors: apiError.errors,
    additionalData,
    originalError: error,
  });
}
