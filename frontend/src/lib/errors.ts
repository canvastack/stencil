export class ApiError extends Error {
  public originalError?: any;

  constructor(message: string, originalError?: any) {
    super(message);
    this.name = 'ApiError';
    this.originalError = originalError;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ApiError);
    }
  }
}

export class AuthError extends ApiError {
  constructor(message: string, originalError?: any) {
    super(message, originalError);
    this.name = 'AuthError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError);
    }
  }
}

export class PermissionError extends ApiError {
  constructor(message: string, originalError?: any) {
    super(message, originalError);
    this.name = 'PermissionError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PermissionError);
    }
  }
}

export class TenantContextError extends ApiError {
  constructor(message: string, originalError?: any) {
    super(message, originalError);
    this.name = 'TenantContextError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TenantContextError);
    }
  }
}

export class NotFoundError extends ApiError {
  constructor(message: string, originalError?: any) {
    super(message, originalError);
    this.name = 'NotFoundError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotFoundError);
    }
  }
}

export class ValidationError extends ApiError {
  public errors: Record<string, string[]>;

  constructor(message: string, errors: Record<string, string[]> = {}, originalError?: any) {
    super(message, originalError);
    this.name = 'ValidationError';
    this.errors = errors;
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ValidationError);
    }
  }
}

export class NetworkError extends ApiError {
  constructor(message: string = 'Network request failed', originalError?: any) {
    super(message, originalError);
    this.name = 'NetworkError';
    
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }
  }
}
