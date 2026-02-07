import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { parseApiError, type ApiError } from '@/lib/errorHandling';
import { ErrorAlert } from '@/components/ui/error-alert';
import { AxiosError } from 'axios';

/**
 * Property-Based Test for Error Handling Logic
 * 
 * **Property 3: API Errors Display Validation Messages**
 * **Validates: Requirements 1.4**
 * 
 * For any failed API response with errors, the error handling logic should:
 * 1. Parse validation errors (422) into field-specific messages
 * 2. Parse network errors into connection error messages
 * 3. Parse server errors (500) into generic error messages
 * 4. Parse timeout errors into timeout messages
 * 5. Produce user-friendly and actionable error messages
 * 6. Identify retryable vs non-retryable errors
 * 
 * This test focuses on the error handling logic in isolation,
 * testing the parseApiError function and ErrorAlert component.
 * 
 * Feature: quote-workflow-fixes, Property 3: API Errors Display Validation Messages
 */

describe('Error Handling Logic Property Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  /**
   * Property: Validation errors are parsed into field-specific messages
   * 
   * For any 422 validation error response, parseApiError should extract
   * all field-level error messages.
   */
  it('Property 3: Parses validation errors with field-specific messages', () => {
    // Run 10 iterations with different validation error scenarios
    for (let i = 0; i < 10; i++) {
      const validationErrors: Record<string, string[]> = {};
      const errorFields = ['customer_id', 'vendor_id', 'title', 'items', 'valid_until'];
      const numErrors = Math.floor(Math.random() * errorFields.length) + 1;
      
      // Generate random validation errors
      for (let j = 0; j < numErrors; j++) {
        const field = errorFields[j];
        validationErrors[field] = [`${field.replace(/_/g, ' ')} is required`];
      }

      // Create proper AxiosError instance
      const axiosError = new AxiosError(
        'Validation failed',
        '422',
        undefined,
        undefined,
        {
          status: 422,
          statusText: 'Unprocessable Entity',
          data: {
            message: 'Validation failed',
            errors: validationErrors,
          },
          headers: {},
          config: {} as any,
        }
      );

      const apiError = parseApiError(axiosError);

      // Property: Error type should be 'validation'
      expect(apiError.type).toBe('validation');
      
      // Property: Should have user-friendly message
      expect(apiError.message).toBeTruthy();
      expect(apiError.message.length).toBeGreaterThan(0);
      
      // Property: Should contain all field errors
      expect(apiError.errors).toBeDefined();
      expect(Object.keys(apiError.errors!).length).toBe(numErrors);
      
      // Property: Each field should have its error message
      Object.keys(validationErrors).forEach(field => {
        expect(apiError.errors![field]).toBeDefined();
      });
      
      // Property: Should not be retryable
      expect(apiError.retryable).toBe(false);
    }
  });

  /**
   * Property: Network errors are parsed into connection error messages
   * 
   * For any network error (no response from server), parseApiError should
   * produce a connection error message with retry option.
   */
  it('Property 3: Parses network errors with retry option', () => {
    // Run 5 iterations with network error scenarios
    for (let i = 0; i < 5; i++) {
      // Create proper AxiosError instance without response
      const axiosError = new AxiosError(
        'Network Error',
        'ERR_NETWORK'
      );

      const apiError = parseApiError(axiosError);

      // Property: Error type should be 'network'
      expect(apiError.type).toBe('network');
      
      // Property: Should have user-friendly message about connection
      expect(apiError.message).toBeTruthy();
      expect(apiError.message.toLowerCase()).toMatch(/connection|network/);
      
      // Property: Should be retryable
      expect(apiError.retryable).toBe(true);
      
      // Property: Should not expose technical error codes
      expect(apiError.message).not.toContain('ERR_NETWORK');
    }
  });

  /**
   * Property: Server errors are parsed into generic error messages
   * 
   * For any 500 server error, parseApiError should produce a generic
   * error message without exposing technical details.
   */
  it('Property 3: Parses server errors with generic message', () => {
    // Run 5 iterations with server error scenarios
    for (let i = 0; i < 5; i++) {
      const statusCode = 500 + Math.floor(Math.random() * 10); // 500-509

      // Create proper AxiosError instance
      const axiosError = new AxiosError(
        'Internal Server Error',
        statusCode.toString(),
        undefined,
        undefined,
        {
          status: statusCode,
          statusText: 'Internal Server Error',
          data: {
            message: 'Internal Server Error',
          },
          headers: {},
          config: {} as any,
        }
      );

      const apiError = parseApiError(axiosError);

      // Property: Error type should be 'server'
      expect(apiError.type).toBe('server');
      
      // Property: Should have user-friendly message
      expect(apiError.message).toBeTruthy();
      expect(apiError.message.toLowerCase()).toMatch(/server|something went wrong/);
      
      // Property: Should be retryable for 5xx errors
      expect(apiError.retryable).toBe(true);
      
      // Property: Should not expose technical details
      expect(apiError.message).not.toContain('Internal Server Error');
      expect(apiError.message).not.toContain(statusCode.toString());
    }
  });

  /**
   * Property: Timeout errors are parsed into timeout messages
   * 
   * For any timeout error, parseApiError should produce a timeout
   * message with retry option.
   */
  it('Property 3: Parses timeout errors with retry option', () => {
    // Run 5 iterations with timeout scenarios
    for (let i = 0; i < 5; i++) {
      // Create proper AxiosError instance for timeout
      const axiosError = new AxiosError(
        'timeout of 30000ms exceeded',
        'ECONNABORTED'
      );

      const apiError = parseApiError(axiosError);

      // Property: Error type should be 'timeout'
      expect(apiError.type).toBe('timeout');
      
      // Property: Should have user-friendly message about timeout
      expect(apiError.message).toBeTruthy();
      expect(apiError.message.toLowerCase()).toMatch(/timed out|timeout|took too long/);
      
      // Property: Should be retryable
      expect(apiError.retryable).toBe(true);
      
      // Property: Should not expose technical error codes
      expect(apiError.message).not.toContain('ECONNABORTED');
      expect(apiError.message).not.toContain('30000ms');
    }
  });

  /**
   * Property: Error messages are user-friendly and don't expose technical details
   * 
   * For any error type, the parsed message should be user-friendly
   * and not expose technical details.
   */
  it('Property 3: Error messages are user-friendly and actionable', () => {
    // Run 8 iterations with different error types
    const errorScenarios = [
      {
        error: new AxiosError(
          'Validation failed',
          '422',
          undefined,
          undefined,
          {
            status: 422,
            statusText: 'Unprocessable Entity',
            data: { message: 'Validation failed', errors: { title: ['Title is required'] } },
            headers: {},
            config: {} as any,
          }
        ),
        expectedType: 'validation',
        shouldBeRetryable: false,
      },
      {
        error: new AxiosError('Network Error', 'ERR_NETWORK'),
        expectedType: 'network',
        shouldBeRetryable: true,
      },
      {
        error: new AxiosError(
          'Internal Server Error',
          '500',
          undefined,
          undefined,
          {
            status: 500,
            statusText: 'Internal Server Error',
            data: { message: 'Internal Server Error' },
            headers: {},
            config: {} as any,
          }
        ),
        expectedType: 'server',
        shouldBeRetryable: true,
      },
      {
        error: new AxiosError(
          'Forbidden',
          '403',
          undefined,
          undefined,
          {
            status: 403,
            statusText: 'Forbidden',
            data: { message: 'Forbidden' },
            headers: {},
            config: {} as any,
          }
        ),
        expectedType: 'authorization',
        shouldBeRetryable: false,
      },
      {
        error: new AxiosError(
          'Unauthorized',
          '401',
          undefined,
          undefined,
          {
            status: 401,
            statusText: 'Unauthorized',
            data: { message: 'Unauthorized' },
            headers: {},
            config: {} as any,
          }
        ),
        expectedType: 'authentication',
        shouldBeRetryable: false,
      },
      {
        error: new AxiosError(
          'Not Found',
          '404',
          undefined,
          undefined,
          {
            status: 404,
            statusText: 'Not Found',
            data: { message: 'Not Found' },
            headers: {},
            config: {} as any,
          }
        ),
        expectedType: 'not_found',
        shouldBeRetryable: false,
      },
      {
        error: new AxiosError('timeout exceeded', 'ECONNABORTED'),
        expectedType: 'timeout',
        shouldBeRetryable: true,
      },
      {
        error: new Error('Unknown error'),
        expectedType: 'unknown',
        shouldBeRetryable: false,
      },
    ];

    errorScenarios.forEach((scenario, index) => {
      const apiError = parseApiError(scenario.error);

      // Property: Error type should match expected
      expect(apiError.type).toBe(scenario.expectedType);
      
      // Property: Should have user-friendly message
      expect(apiError.message).toBeTruthy();
      expect(apiError.message.length).toBeGreaterThan(0);
      
      // Property: Retryable flag should match expected
      expect(apiError.retryable).toBe(scenario.shouldBeRetryable);
      
      // Property: Technical details should NOT be exposed
      expect(apiError.message).not.toMatch(/stack trace|ERR_NETWORK|ECONNABORTED|Internal Server Error/i);
    });
  });

  /**
   * Property: ErrorAlert component displays error information correctly
   * 
   * For any ApiError object, the ErrorAlert component should display
   * the error message and retry button (if retryable).
   */
  it('Property 3: ErrorAlert displays error information correctly', () => {
    // Run 6 iterations with different error types
    const errorScenarios: ApiError[] = [
      {
        type: 'validation',
        message: 'Please check the form fields',
        retryable: false,
        errors: { title: ['Title is required'] },
      },
      {
        type: 'network',
        message: 'Connection failed. Please check your internet.',
        retryable: true,
      },
      {
        type: 'server',
        message: 'Something went wrong on our end.',
        retryable: true,
      },
      {
        type: 'timeout',
        message: 'Request took too long.',
        retryable: true,
      },
      {
        type: 'authorization',
        message: 'You do not have permission.',
        retryable: false,
      },
      {
        type: 'unknown',
        message: 'An unexpected error occurred.',
        retryable: false,
      },
    ];

    errorScenarios.forEach((apiError) => {
      const mockOnRetry = vi.fn();
      const mockOnDismiss = vi.fn();

      const { unmount } = render(
        <ErrorAlert
          error={apiError}
          onRetry={mockOnRetry}
          onDismiss={mockOnDismiss}
        />
      );

      // Property: Error message should be displayed
      expect(screen.getByText(apiError.message)).toBeInTheDocument();
      
      // Property: Retry button should be present only if retryable
      const retryButton = screen.queryByRole('button', { name: /retry/i });
      if (apiError.retryable) {
        expect(retryButton).toBeInTheDocument();
      } else {
        expect(retryButton).not.toBeInTheDocument();
      }
      
      // Property: Dismiss button should always be present
      const dismissButton = screen.queryByRole('button', { name: /dismiss|close/i });
      expect(dismissButton).toBeInTheDocument();

      unmount();
    });
  });

  /**
   * Property: Retry functionality works correctly
   * 
   * For any retryable error, clicking the retry button should
   * call the onRetry callback.
   */
  it('Property 3: Retry button calls onRetry callback', () => {
    // Run 3 iterations with retryable errors
    const retryableErrors: ApiError[] = [
      {
        type: 'network',
        message: 'Connection failed',
        retryable: true,
      },
      {
        type: 'server',
        message: 'Server error',
        retryable: true,
      },
      {
        type: 'timeout',
        message: 'Request timeout',
        retryable: true,
      },
    ];

    retryableErrors.forEach((apiError) => {
      const mockOnRetry = vi.fn();
      const mockOnDismiss = vi.fn();

      const { unmount } = render(
        <ErrorAlert
          error={apiError}
          onRetry={mockOnRetry}
          onDismiss={mockOnDismiss}
        />
      );

      // Property: Retry button should be present
      const retryButton = screen.getByRole('button', { name: /retry/i });
      expect(retryButton).toBeInTheDocument();
      
      // Property: Clicking retry should call onRetry
      retryButton.click();
      expect(mockOnRetry).toHaveBeenCalledTimes(1);
      
      // Property: onDismiss should not be called
      expect(mockOnDismiss).not.toHaveBeenCalled();

      unmount();
      vi.clearAllMocks();
    });
  });

  /**
   * Property: Dismiss functionality works correctly
   * 
   * For any error, clicking the dismiss button should
   * call the onDismiss callback.
   */
  it('Property 3: Dismiss button calls onDismiss callback', () => {
    // Run 3 iterations with different error types
    const errors: ApiError[] = [
      {
        type: 'validation',
        message: 'Validation error',
        retryable: false,
      },
      {
        type: 'network',
        message: 'Network error',
        retryable: true,
      },
      {
        type: 'authorization',
        message: 'Permission denied',
        retryable: false,
      },
    ];

    errors.forEach((apiError) => {
      const mockOnRetry = vi.fn();
      const mockOnDismiss = vi.fn();

      const { unmount } = render(
        <ErrorAlert
          error={apiError}
          onRetry={mockOnRetry}
          onDismiss={mockOnDismiss}
        />
      );

      // Property: Dismiss button should be present
      const dismissButton = screen.getByRole('button', { name: /dismiss|close/i });
      expect(dismissButton).toBeInTheDocument();
      
      // Property: Clicking dismiss should call onDismiss
      dismissButton.click();
      expect(mockOnDismiss).toHaveBeenCalledTimes(1);
      
      // Property: onRetry should not be called
      expect(mockOnRetry).not.toHaveBeenCalled();

      unmount();
      vi.clearAllMocks();
    });
  });
});
