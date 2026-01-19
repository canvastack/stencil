import { toast } from 'sonner';

export interface RetryOptions {
  maxRetries?: number;
  baseDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryCondition?: (error: any) => boolean;
}

export interface ErrorReportData {
  error: Error;
  context?: Record<string, any>;
  userId?: string;
  timestamp: number;
  url: string;
  userAgent: string;
  stackTrace?: string;
}

class ErrorHandlingService {
  private errorReportQueue: ErrorReportData[] = [];
  private isOnline = navigator.onLine;

  constructor() {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
  }

  /**
   * Enhanced retry logic with exponential backoff
   */
  async withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
  ): Promise<T> {
    const {
      maxRetries = 3,
      baseDelay = 1000,
      maxDelay = 30000,
      backoffFactor = 2,
      retryCondition = this.defaultRetryCondition
    } = options;

    let lastError: any;
    let delay = baseDelay;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;
        
        // Don't retry if condition fails or max retries reached
        if (!retryCondition(error) || attempt === maxRetries) {
          throw error;
        }

        // Show retry notification for network errors
        if (this.isNetworkError(error) && attempt > 0) {
          toast.warning(`Connection issue. Retrying... (${attempt}/${maxRetries})`);
        }

        // Wait with exponential backoff
        await this.sleep(Math.min(delay, maxDelay));
        delay *= backoffFactor;
      }
    }

    throw lastError;
  }

  /**
   * Default retry condition - retry on network errors and 5xx responses
   */
  private defaultRetryCondition(error: any): boolean {
    // Network errors
    if (!error.response) return true;
    
    // Server errors (5xx)
    if (error.response?.status >= 500) return true;
    
    // Rate limiting (429)
    if (error.response?.status === 429) return true;
    
    // Request timeout (408)
    if (error.response?.status === 408) return true;
    
    return false;
  }

  /**
   * Check if error is network-related
   */
  private isNetworkError(error: any): boolean {
    return !error.response || error.code === 'NETWORK_ERROR' || error.message?.includes('Network Error');
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: any, context?: string): string {
    // Network errors
    if (this.isNetworkError(error)) {
      return 'Connection problem. Please check your internet connection and try again.';
    }

    // HTTP status codes
    if (error.response?.status) {
      switch (error.response.status) {
        case 400:
          return 'Invalid request. Please check your input and try again.';
        case 401:
          return 'Session expired. Please log in again.';
        case 403:
          return 'Access denied. You don\'t have permission to perform this action.';
        case 404:
          return context 
            ? `${context} not found. It may have been deleted or moved.`
            : 'The requested resource was not found.';
        case 409:
          return 'This action conflicts with existing data. Please refresh and try again.';
        case 422:
          return 'Invalid data provided. Please check your input.';
        case 429:
          return 'Too many requests. Please wait a moment before trying again.';
        case 500:
          return 'Server error. Our team has been notified. Please try again later.';
        case 502:
        case 503:
        case 504:
          return 'Service temporarily unavailable. Please try again in a few minutes.';
        default:
          return 'An unexpected error occurred. Please try again.';
      }
    }

    // Generic fallback
    return 'Something went wrong. Please try again or contact support if the problem persists.';
  }

  /**
   * Report error to backend (with offline queueing)
   */
  async reportError(
    error: Error,
    context?: Record<string, any>,
    userId?: string
  ): Promise<void> {
    const errorData: ErrorReportData = {
      error,
      context,
      userId,
      timestamp: Date.now(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      stackTrace: error.stack,
    };

    if (this.isOnline) {
      try {
        await this.sendErrorReport(errorData);
      } catch (reportError) {
        // Queue for later if reporting fails
        this.errorReportQueue.push(errorData);
        console.warn('Failed to report error, queued for later:', reportError);
      }
    } else {
      // Queue for when online
      this.errorReportQueue.push(errorData);
    }
  }

  /**
   * Send error report to backend
   */
  private async sendErrorReport(errorData: ErrorReportData): Promise<void> {
    const payload = {
      message: errorData.error.message,
      stack: errorData.stackTrace,
      context: errorData.context,
      userId: errorData.userId,
      timestamp: errorData.timestamp,
      url: errorData.url,
      userAgent: errorData.userAgent,
    };

    // In a real app, this would send to your error reporting service
    await fetch('/api/errors', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  }

  /**
   * Flush queued error reports when online
   */
  private async flushErrorQueue(): Promise<void> {
    if (this.errorReportQueue.length === 0) return;

    const queuedErrors = [...this.errorReportQueue];
    this.errorReportQueue = [];

    for (const errorData of queuedErrors) {
      try {
        await this.sendErrorReport(errorData);
      } catch (error) {
        // Re-queue failed reports
        this.errorReportQueue.push(errorData);
        console.warn('Failed to flush error report:', error);
      }
    }
  }

  /**
   * Handle error with user notification and reporting
   */
  async handleError(
    error: any,
    options: {
      context?: string;
      showToast?: boolean;
      reportError?: boolean;
      userId?: string;
      customMessage?: string;
    } = {}
  ): Promise<void> {
    const {
      context,
      showToast = true,
      reportError = true,
      userId,
      customMessage
    } = options;

    // Get user-friendly message
    const message = customMessage || this.getUserFriendlyMessage(error, context);

    // Show toast notification
    if (showToast) {
      if (error.response?.status >= 500 || this.isNetworkError(error)) {
        toast.error(message);
      } else if (error.response?.status === 401) {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    }

    // Report error to backend
    if (reportError && error instanceof Error) {
      await this.reportError(error, { context, ...options }, userId);
    }

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('Error handled:', {
        error,
        context,
        message,
      });
    }
  }

  /**
   * Sleep utility for retry delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Create a circuit breaker for repeated failures
   */
  createCircuitBreaker<T>(
    fn: () => Promise<T>,
    options: {
      failureThreshold?: number;
      resetTimeout?: number;
      monitoringPeriod?: number;
    } = {}
  ) {
    const {
      failureThreshold = 5,
      resetTimeout = 60000, // 1 minute
      monitoringPeriod = 10000 // 10 seconds
    } = options;

    let state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED';
    let failures = 0;
    let lastFailureTime = 0;
    let successCount = 0;

    return async (): Promise<T> => {
      const now = Date.now();

      // Reset failure count after monitoring period
      if (now - lastFailureTime > monitoringPeriod) {
        failures = 0;
      }

      // Check if circuit should be half-open
      if (state === 'OPEN' && now - lastFailureTime > resetTimeout) {
        state = 'HALF_OPEN';
        successCount = 0;
      }

      // Reject if circuit is open
      if (state === 'OPEN') {
        throw new Error('Circuit breaker is OPEN - too many recent failures');
      }

      try {
        const result = await fn();
        
        // Success - reset or close circuit
        if (state === 'HALF_OPEN') {
          successCount++;
          if (successCount >= 3) {
            state = 'CLOSED';
            failures = 0;
          }
        } else {
          failures = 0;
        }
        
        return result;
      } catch (error) {
        failures++;
        lastFailureTime = now;
        
        // Open circuit if threshold exceeded
        if (failures >= failureThreshold) {
          state = 'OPEN';
          toast.error('Service temporarily unavailable. Please try again later.');
        }
        
        throw error;
      }
    };
  }
}

export const errorHandlingService = new ErrorHandlingService();
export default errorHandlingService;