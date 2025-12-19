import { describe, test, expect, vi, beforeEach } from 'vitest';
import axios, { AxiosError } from 'axios';
import { 
  ApiException, 
  handleApiError, 
  displayError, 
  getErrorMessage, 
  getValidationErrors 
} from '@/lib/api/error-handler';
import { toast } from 'sonner';

vi.mock('sonner', () => ({
  toast: {
    error: vi.fn(),
    success: vi.fn(),
  },
}));

describe('Vendor API Response Handling Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('ApiException Class', () => {
    test('should create ApiException with all properties', () => {
      const exception = new ApiException(
        'Validation failed',
        422,
        { email: ['Invalid email format'] },
        'VALIDATION_ERROR'
      );

      expect(exception).toBeInstanceOf(ApiException);
      expect(exception).toBeInstanceOf(Error);
      expect(exception.message).toBe('Validation failed');
      expect(exception.status).toBe(422);
      expect(exception.errors).toEqual({ email: ['Invalid email format'] });
      expect(exception.code).toBe('VALIDATION_ERROR');
      expect(exception.name).toBe('ApiException');
    });

    test('should create ApiException with minimal properties', () => {
      const exception = new ApiException('Something went wrong');

      expect(exception.message).toBe('Something went wrong');
      expect(exception.status).toBeUndefined();
      expect(exception.errors).toBeUndefined();
      expect(exception.code).toBeUndefined();
    });
  });

  describe('handleApiError Function', () => {
    test('should return existing ApiException unchanged', () => {
      const originalException = new ApiException('Original error', 500);
      const result = handleApiError(originalException);

      expect(result).toBe(originalException);
      expect(result.message).toBe('Original error');
      expect(result.status).toBe(500);
    });

    test('should handle 422 validation error with field errors', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'The given data was invalid',
            errors: {
              name: ['The name field is required'],
              email: ['Invalid email format', 'Email already exists'],
            },
            code: 'VALIDATION_ERROR',
          },
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed with status code 422',
      };

      const result = handleApiError(axiosError);

      expect(result).toBeInstanceOf(ApiException);
      expect(result.message).toBe('The given data was invalid');
      expect(result.status).toBe(422);
      expect(result.errors).toEqual({
        name: ['The name field is required'],
        email: ['Invalid email format', 'Email already exists'],
      });
      expect(result.code).toBe('VALIDATION_ERROR');
    });

    test('should handle 401 unauthorized error', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 401,
          data: { message: 'Unauthorized' },
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed with status code 401',
      };

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Session expired. Please login again.');
      expect(result.status).toBe(401);
      expect(result.code).toBe('UNAUTHORIZED');
    });

    test('should handle 403 forbidden error', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 403,
          data: { message: 'Forbidden' },
          statusText: 'Forbidden',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed with status code 403',
      };

      const result = handleApiError(axiosError);

      expect(result.message).toBe("You don't have permission to perform this action.");
      expect(result.status).toBe(403);
      expect(result.code).toBe('FORBIDDEN');
    });

    test('should handle 404 not found error', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 404,
          data: { message: 'Vendor not found' },
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed with status code 404',
      };

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Vendor not found');
      expect(result.status).toBe(404);
      expect(result.code).toBe('NOT_FOUND');
    });

    test('should handle 404 error with default message', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 404,
          data: {},
          statusText: 'Not Found',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed with status code 404',
      };

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Resource not found');
      expect(result.status).toBe(404);
      expect(result.code).toBe('NOT_FOUND');
    });

    test('should handle 500 server error', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: { message: 'Internal server error' },
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed with status code 500',
      };

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Server error. Please try again later.');
      expect(result.status).toBe(500);
      expect(result.code).toBe('SERVER_ERROR');
    });

    test('should handle 503 service unavailable', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 503,
          data: {},
          statusText: 'Service Unavailable',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed with status code 503',
      };

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Server error. Please try again later.');
      expect(result.status).toBe(503);
      expect(result.code).toBe('SERVER_ERROR');
    });

    test('should handle network timeout error', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        code: 'ECONNABORTED',
        message: 'timeout of 5000ms exceeded',
        name: 'AxiosError',
        config: {} as any,
      };

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Request timeout. Please check your connection.');
      expect(result.status).toBe(0);
      expect(result.code).toBe('TIMEOUT');
    });

    test('should handle network error', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        code: 'ERR_NETWORK',
        message: 'Network Error',
        name: 'AxiosError',
        config: {} as any,
      };

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Network error. Please check your internet connection.');
      expect(result.status).toBe(0);
      expect(result.code).toBe('NETWORK_ERROR');
    });

    test('should handle generic Axios error', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Bad request' },
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed with status code 400',
      };

      const result = handleApiError(axiosError);

      expect(result.message).toBe('Bad request');
      expect(result.status).toBe(400);
    });

    test('should handle generic Error instance', () => {
      const error = new Error('Something went wrong');
      const result = handleApiError(error);

      expect(result).toBeInstanceOf(ApiException);
      expect(result.message).toBe('Something went wrong');
      expect(result.status).toBeUndefined();
    });

    test('should handle unknown error type', () => {
      const result = handleApiError('Some string error');

      expect(result).toBeInstanceOf(ApiException);
      expect(result.message).toBe('An unknown error occurred');
    });

    test('should handle error with context label', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed with status code 500',
      };

      const result = handleApiError(axiosError, 'Create Vendor');

      expect(result.message).toBe('Server error. Please try again later.');
      expect(result.status).toBe(500);
    });
  });

  describe('displayError Function', () => {
    test('should display simple error without validation errors', () => {
      const exception = new ApiException('Something went wrong', 500);
      
      displayError(exception);

      expect(toast.error).toHaveBeenCalledWith('Something went wrong', {
        icon: '❌',
        duration: 4000,
      });
    });

    test('should display error with context', () => {
      const exception = new ApiException('Server error', 500);
      
      displayError(exception, 'Create Vendor');

      expect(toast.error).toHaveBeenCalledWith('Create Vendor: Server error', {
        icon: '❌',
        duration: 4000,
      });
    });

    test('should display validation errors with field details', () => {
      const exception = new ApiException(
        'Validation failed',
        422,
        {
          name: ['The name field is required'],
          email: ['Invalid email format', 'Email already exists'],
        }
      );
      
      displayError(exception);

      expect(toast.error).toHaveBeenCalledWith('Validation failed', {
        icon: '❌',
        description: 'name: The name field is required\nemail: Invalid email format, Email already exists',
        duration: 5000,
      });
    });

    test('should display validation errors with context', () => {
      const exception = new ApiException(
        'Validation failed',
        422,
        {
          phone: ['Invalid phone number format'],
        }
      );
      
      displayError(exception, 'Update Vendor');

      expect(toast.error).toHaveBeenCalledWith('Update Vendor: Validation failed', {
        icon: '❌',
        description: 'phone: Invalid phone number format',
        duration: 5000,
      });
    });

    test('should not display description for empty validation errors', () => {
      const exception = new ApiException('Validation failed', 422, {});
      
      displayError(exception);

      expect(toast.error).toHaveBeenCalledWith('Validation failed', {
        icon: '❌',
        duration: 4000,
      });
    });
  });

  describe('getErrorMessage Function', () => {
    test('should extract message from ApiException', () => {
      const exception = new ApiException('Custom error message', 500);
      const message = getErrorMessage(exception);

      expect(message).toBe('Custom error message');
    });

    test('should extract message from AxiosError response', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 400,
          data: { message: 'Bad request message' },
          statusText: 'Bad Request',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
      };

      const message = getErrorMessage(axiosError);

      expect(message).toBe('Bad request message');
    });

    test('should use AxiosError message if no response data', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        message: 'Network error occurred',
        name: 'AxiosError',
        config: {} as any,
      };

      const message = getErrorMessage(axiosError);

      expect(message).toBe('Network error occurred');
    });

    test('should extract message from generic Error', () => {
      const error = new Error('Generic error message');
      const message = getErrorMessage(error);

      expect(message).toBe('Generic error message');
    });

    test('should return fallback for unknown error', () => {
      const message = getErrorMessage('Unknown error');

      expect(message).toBe('An error occurred');
    });

    test('should use custom fallback message', () => {
      const message = getErrorMessage(null, 'Custom fallback');

      expect(message).toBe('Custom fallback');
    });
  });

  describe('getValidationErrors Function', () => {
    test('should extract validation errors from ApiException', () => {
      const exception = new ApiException(
        'Validation failed',
        422,
        {
          name: ['Required field'],
          email: ['Invalid format'],
        }
      );

      const errors = getValidationErrors(exception);

      expect(errors).toEqual({
        name: ['Required field'],
        email: ['Invalid format'],
      });
    });

    test('should extract validation errors from AxiosError', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            errors: {
              phone: ['Invalid phone number'],
            },
          },
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Validation error',
      };

      const errors = getValidationErrors(axiosError);

      expect(errors).toEqual({
        phone: ['Invalid phone number'],
      });
    });

    test('should return undefined for ApiException without validation errors', () => {
      const exception = new ApiException('Server error', 500);
      const errors = getValidationErrors(exception);

      expect(errors).toBeUndefined();
    });

    test('should return undefined for non-validation errors', () => {
      const error = new Error('Generic error');
      const errors = getValidationErrors(error);

      expect(errors).toBeUndefined();
    });

    test('should return undefined for unknown error types', () => {
      const errors = getValidationErrors('String error');

      expect(errors).toBeUndefined();
    });
  });

  describe('Error Handler Integration with Context', () => {
    test('should handle complete error flow with context', () => {
      const axiosError: Partial<AxiosError> = {
        isAxiosError: true,
        response: {
          status: 422,
          data: {
            message: 'Validation failed',
            errors: {
              name: ['The name field is required'],
            },
            code: 'VALIDATION_ERROR',
          },
          statusText: 'Unprocessable Entity',
          headers: {},
          config: {} as any,
        },
        config: {} as any,
        name: 'AxiosError',
        message: 'Request failed',
      };

      const apiError = handleApiError(axiosError, 'Create Vendor');
      displayError(apiError, 'Create Vendor');

      expect(apiError.message).toBe('Validation failed');
      expect(apiError.status).toBe(422);
      expect(apiError.errors).toEqual({ name: ['The name field is required'] });
      expect(toast.error).toHaveBeenCalledWith('Create Vendor: Validation failed', {
        icon: '❌',
        description: 'name: The name field is required',
        duration: 5000,
      });
    });

    test('should handle multiple error contexts consistently', () => {
      const contexts = ['Create Vendor', 'Update Vendor', 'Delete Vendor', 'Fetch Vendors'];
      
      contexts.forEach(context => {
        vi.clearAllMocks();
        
        const axiosError: Partial<AxiosError> = {
          isAxiosError: true,
          response: {
            status: 500,
            data: { message: 'Server error' },
            statusText: 'Internal Server Error',
            headers: {},
            config: {} as any,
          },
          config: {} as any,
          name: 'AxiosError',
          message: 'Request failed',
        };

        const apiError = handleApiError(axiosError, context);
        displayError(apiError, context);

        expect(toast.error).toHaveBeenCalledWith(`${context}: Server error. Please try again later.`, {
          icon: '❌',
          duration: 4000,
        });
      });
    });
  });
});
