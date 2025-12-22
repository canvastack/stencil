import { ApiError } from './client';

export type ErrorSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export interface FormattedError {
  message: string;
  userMessage: string;
  severity: ErrorSeverity;
  code?: string;
  details?: Record<string, any>;
  timestamp: string;
}

const errorMessages: Record<number, string> = {
  400: 'Bad request. Please check your input.',
  401: 'You are not authenticated. Please log in.',
  403: 'You do not have permission to access this resource.',
  404: 'The requested resource was not found.',
  409: 'The resource already exists or there is a conflict.',
  422: 'Validation error. Please check your input.',
  429: 'Too many requests. Please try again later.',
  500: 'Server error. Please try again later.',
  503: 'Service is temporarily unavailable.',
};

const errorCodes: Record<string, { severity: ErrorSeverity; userMessage: string }> = {
  VALIDATION_ERROR: {
    severity: 'medium',
    userMessage: 'Please fix the validation errors and try again.',
  },
  AUTHENTICATION_ERROR: {
    severity: 'high',
    userMessage: 'Your session has expired. Please log in again.',
  },
  AUTHORIZATION_ERROR: {
    severity: 'high',
    userMessage: 'You do not have permission to perform this action.',
  },
  NOT_FOUND: {
    severity: 'medium',
    userMessage: 'The resource you are looking for was not found.',
  },
  CONFLICT_ERROR: {
    severity: 'medium',
    userMessage: 'This resource already exists or there is a conflict.',
  },
  NETWORK_ERROR: {
    severity: 'high',
    userMessage: 'Network connection error. Please check your internet connection.',
  },
  TIMEOUT_ERROR: {
    severity: 'medium',
    userMessage: 'The request took too long. Please try again.',
  },
  SERVER_ERROR: {
    severity: 'critical',
    userMessage: 'Server error. Please try again later or contact support.',
  },
};

export function formatError(error: ApiError | unknown): FormattedError {
  const timestamp = new Date().toISOString();

  if (!error) {
    return {
      message: 'Unknown error',
      userMessage: 'An unknown error occurred. Please try again.',
      severity: 'medium',
      timestamp,
    };
  }

  if (error instanceof Error && !(error as ApiError).status) {
    return {
      message: error.message,
      userMessage: 'An error occurred. Please try again.',
      severity: 'medium',
      timestamp,
    };
  }

  const apiError = error as ApiError;
  const status = apiError.status || 0;
  const code = extractErrorCode(apiError);

  let severity: ErrorSeverity = 'medium';
  let userMessage = errorMessages[status] || 'An error occurred.';

  if (code && errorCodes[code]) {
    const errorInfo = errorCodes[code];
    severity = errorInfo.severity;
    userMessage = errorInfo.userMessage;
  } else if (status >= 500) {
    severity = 'critical';
  } else if (status === 401 || status === 403) {
    severity = 'high';
  }

  return {
    message: apiError.message || `HTTP ${status}: ${userMessage}`,
    userMessage,
    severity,
    code,
    details: apiError.details,
    timestamp,
  };
}

function extractErrorCode(error: ApiError): string | undefined {
  if (error.details?.code) {
    return error.details.code;
  }

  if (error.message.includes('validation')) return 'VALIDATION_ERROR';
  if (error.message.includes('authentication') || error.message.includes('unauthorized'))
    return 'AUTHENTICATION_ERROR';
  if (error.message.includes('permission') || error.message.includes('forbidden'))
    return 'AUTHORIZATION_ERROR';
  if (error.message.includes('not found')) return 'NOT_FOUND';
  if (error.message.includes('conflict')) return 'CONFLICT_ERROR';
  if (error.message.includes('network')) return 'NETWORK_ERROR';
  if (error.message.includes('timeout')) return 'TIMEOUT_ERROR';

  return undefined;
}

export function handleApiError(error: unknown, context?: string): FormattedError {
  const formatted = formatError(error);

  if (import.meta.env.VITE_APP_LOG_LEVEL === 'debug') {
    const prefix = context ? `[${context}]` : '[API Error]';
    console.error(prefix, formatted);

    if ((error as ApiError).originalError) {
      console.error('Original Error:', (error as ApiError).originalError);
    }
  }

  return formatted;
}

export function getDisplayMessage(error: unknown): string {
  const formatted = formatError(error);
  return formatted.userMessage || formatted.message;
}

export function isNetworkError(error: unknown): boolean {
  if (!(error as ApiError).status) return true;
  const status = (error as ApiError).status;
  return status === 0 || (status >= 500 && status < 600);
}

export function isValidationError(error: unknown): boolean {
  const status = (error as ApiError)?.status;
  return status === 400 || status === 422;
}

export function getValidationDetails(error: unknown): Record<string, string[]> | undefined {
  const apiError = error as ApiError;
  if (!isValidationError(error)) return undefined;

  if (apiError.details && typeof apiError.details === 'object') {
    return apiError.details as Record<string, string[]>;
  }

  return undefined;
}
