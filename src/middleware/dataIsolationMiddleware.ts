/**
 * Data Isolation Middleware
 * Ensures strict separation between Platform and Tenant data access
 */

export interface DataIsolationConfig {
  accountType: 'platform' | 'tenant';
  tenantId?: string;
  allowedEndpoints: string[];
  blockedEndpoints: string[];
}

export class DataIsolationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'DataIsolationError';
  }
}

/**
 * Validates that API endpoints comply with data isolation rules
 */
export const validateEndpointAccess = (
  url: string,
  accountType: 'platform' | 'tenant',
  tenantId?: string
): void => {
  // Platform account validation
  if (accountType === 'platform') {
    // Platform accounts can only access platform endpoints
    if (!url.includes('/platform/') && !url.includes('/auth/')) {
      throw new DataIsolationError(
        'Platform accounts cannot access tenant-specific endpoints',
        'PLATFORM_TENANT_ACCESS_DENIED'
      );
    }

    // Platform accounts cannot have tenant context
    if (tenantId) {
      throw new DataIsolationError(
        'Platform accounts cannot have tenant context',
        'PLATFORM_TENANT_CONTEXT_INVALID'
      );
    }
  }

  // Tenant account validation
  if (accountType === 'tenant') {
    // Tenant accounts cannot access platform endpoints
    if (url.includes('/platform/')) {
      throw new DataIsolationError(
        'Tenant accounts cannot access platform endpoints',
        'TENANT_PLATFORM_ACCESS_DENIED'
      );
    }

    // Tenant accounts must have tenant context (except for auth endpoints)
    if (!tenantId && !url.includes('/auth/')) {
      throw new DataIsolationError(
        'Tenant accounts must have tenant context for data operations',
        'TENANT_CONTEXT_MISSING'
      );
    }
  }
};

/**
 * Validates that query parameters don't contain cross-contamination attempts
 */
export const validateQueryParameters = (
  params: Record<string, any>,
  accountType: 'platform' | 'tenant',
  allowedTenantId?: string
): void => {
  if (accountType === 'platform') {
    // Platform accounts should not send tenant-specific parameters
    if (params.tenant_id || params.tenantId) {
      throw new DataIsolationError(
        'Platform accounts cannot specify tenant parameters',
        'PLATFORM_TENANT_PARAM_INVALID'
      );
    }
  }

  if (accountType === 'tenant') {
    // Tenant accounts can only access their own tenant data
    if (params.tenant_id && params.tenant_id !== allowedTenantId) {
      throw new DataIsolationError(
        'Tenant accounts can only access their own tenant data',
        'TENANT_CROSS_ACCESS_DENIED'
      );
    }
  }
};

/**
 * Validates that request body doesn't contain isolation violations
 */
export const validateRequestBody = (
  body: any,
  accountType: 'platform' | 'tenant',
  allowedTenantId?: string
): void => {
  if (!body || typeof body !== 'object') return;

  if (accountType === 'platform') {
    // Platform accounts should not send tenant-specific data
    if (body.tenant_id && body.tenant_id !== 'create') {
      throw new DataIsolationError(
        'Platform accounts cannot specify existing tenant IDs in request body',
        'PLATFORM_TENANT_BODY_INVALID'
      );
    }
  }

  if (accountType === 'tenant') {
    // Tenant accounts can only send their own tenant data
    if (body.tenant_id && body.tenant_id !== allowedTenantId) {
      throw new DataIsolationError(
        'Tenant accounts can only send their own tenant data',
        'TENANT_CROSS_BODY_DENIED'
      );
    }
  }
};

/**
 * Main data isolation middleware function
 */
export const enforceDataIsolation = {
  beforeRequest: (
    url: string,
    params: Record<string, any> = {},
    body: any = null,
    accountType: 'platform' | 'tenant',
    tenantId?: string
  ) => {
    try {
      validateEndpointAccess(url, accountType, tenantId);
      validateQueryParameters(params, accountType, tenantId);
      validateRequestBody(body, accountType, tenantId);
    } catch (error) {
      console.error('[Data Isolation] Validation failed:', error);
      throw error;
    }
  },

  afterResponse: (
    response: any,
    accountType: 'platform' | 'tenant',
    tenantId?: string
  ) => {
    // Additional response validation can be added here
    // For example, ensuring response data doesn't leak across tenants
    if (accountType === 'tenant' && response?.data?.tenant_id && response.data.tenant_id !== tenantId) {
      console.warn('[Data Isolation] Response contains data from different tenant');
      throw new DataIsolationError(
        'Response contains data from unauthorized tenant',
        'RESPONSE_TENANT_LEAK'
      );
    }

    return response;
  }
};