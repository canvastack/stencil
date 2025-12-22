import { toast } from '@/lib/toast-config';
import { logger } from '@/lib/logger';
import { ApiError } from '@/types/api';
import axios, { AxiosError } from 'axios';

export class ApiException extends Error {
  constructor(
    public message: string,
    public status?: number,
    public errors?: Record<string, string[]>,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiException';
    Object.setPrototypeOf(this, ApiException.prototype);
  }
}

export const handleApiError = (error: unknown, context?: string): ApiException => {
  if (error instanceof ApiException) {
    logger.error('API Exception occurred', {
      context,
      message: error.message,
      status: error.status,
      code: error.code,
    });
    return error;
  }

  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError<ApiError>;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data;
    
    if (status === 422 && data?.errors) {
      logger.warn('Validation error', {
        context,
        status,
        errors: data.errors,
      });
      return new ApiException(
        data.message || 'Validation failed',
        422,
        data.errors,
        data.code
      );
    }
    
    if (status === 401) {
      logger.error('Authentication failed', {
        context,
        status,
        endpoint: axiosError.config?.url,
      });
      return new ApiException(
        'Session expired. Please login again.',
        401,
        undefined,
        'UNAUTHORIZED'
      );
    }
    
    if (status === 403) {
      logger.error('Permission denied', {
        context,
        status,
        endpoint: axiosError.config?.url,
      });
      return new ApiException(
        'You don\'t have permission to perform this action.',
        403,
        undefined,
        'FORBIDDEN'
      );
    }
    
    if (status === 404) {
      logger.warn('Resource not found', {
        context,
        status,
        endpoint: axiosError.config?.url,
      });
      return new ApiException(
        data?.message || 'Resource not found',
        404,
        undefined,
        'NOT_FOUND'
      );
    }
    
    if (status && status >= 500) {
      logger.error('Server error', {
        context,
        status,
        endpoint: axiosError.config?.url,
        message: data?.message,
      });
      return new ApiException(
        'Server error. Please try again later.',
        status,
        undefined,
        'SERVER_ERROR'
      );
    }
    
    if (axiosError.code === 'ECONNABORTED') {
      logger.error('Request timeout', {
        context,
        code: axiosError.code,
        endpoint: axiosError.config?.url,
      });
      return new ApiException(
        'Request timeout. Please check your connection.',
        0,
        undefined,
        'TIMEOUT'
      );
    }
    
    if (axiosError.code === 'ERR_NETWORK') {
      logger.error('Network error', {
        context,
        code: axiosError.code,
      });
      return new ApiException(
        'Network error. Please check your internet connection.',
        0,
        undefined,
        'NETWORK_ERROR'
      );
    }
    
    logger.error('API request failed', {
      context,
      status,
      message: data?.message || axiosError.message,
      endpoint: axiosError.config?.url,
    });
    
    return new ApiException(
      data?.message || axiosError.message || 'An unexpected error occurred',
      status,
      data?.errors,
      data?.code
    );
  }

  if (error instanceof Error) {
    logger.error('Error occurred', {
      context,
      message: error.message,
      stack: error.stack,
    });
    return new ApiException(error.message);
  }

  logger.error('Unknown error occurred', { context, error });
  return new ApiException('An unknown error occurred');
};

export const displayError = (error: ApiException, context?: string) => {
  const title = context ? `${context}: ${error.message}` : error.message;
  
  logger.debug('Displaying error to user', {
    context,
    message: error.message,
    status: error.status,
    hasValidationErrors: !!error.errors,
  });
  
  if (error.errors && Object.keys(error.errors).length > 0) {
    const errorList = Object.entries(error.errors)
      .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
      .join('\n');
    
    toast.error(title, {
      description: errorList,
      duration: 5000,
    });
  } else {
    toast.error(title, {
      duration: 4000,
    });
  }
};

export const getErrorMessage = (error: unknown, fallback = 'An error occurred'): string => {
  if (error instanceof ApiException) {
    return error.message;
  }
  
  if (axios.isAxiosError(error)) {
    return error.response?.data?.message || error.message || fallback;
  }
  
  if (error instanceof Error) {
    return error.message;
  }
  
  return fallback;
};

export const getValidationErrors = (error: unknown): Record<string, string[]> | undefined => {
  if (error instanceof ApiException) {
    return error.errors;
  }
  
  if (axios.isAxiosError(error)) {
    return error.response?.data?.errors;
  }
  
  return undefined;
};
