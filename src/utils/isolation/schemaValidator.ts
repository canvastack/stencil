/**
 * Schema Validator for Multi-Tenant Data Isolation
 * Ensures that database schema access is properly isolated
 */

export interface SchemaValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export interface TenantContext {
  tenantId: string;
  tenantSlug: string;
  schemaName: string;
}

export interface PlatformContext {
  accountId: string;
  accountType: 'platform_owner';
}

/**
 * Validates that tenant operations only access tenant-scoped data
 */
export const validateTenantSchemaAccess = (
  operation: string,
  tenantContext: TenantContext,
  requestedData?: any
): SchemaValidationResult => {
  const result: SchemaValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validate tenant context completeness
  if (!tenantContext.tenantId || !tenantContext.tenantSlug) {
    result.isValid = false;
    result.errors.push('Incomplete tenant context: tenantId and tenantSlug are required');
  }

  // Validate schema name follows convention
  const expectedSchemaPattern = /^tenant_[a-f0-9\-]{36}$/;
  if (!expectedSchemaPattern.test(tenantContext.schemaName)) {
    result.isValid = false;
    result.errors.push(`Invalid schema name format: ${tenantContext.schemaName}`);
  }

  // Validate operation is allowed for tenant context
  const allowedTenantOperations = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE',
    'CREATE', 'ALTER', 'DROP', 'INDEX'
  ];

  if (!allowedTenantOperations.some(op => operation.toUpperCase().includes(op))) {
    result.isValid = false;
    result.errors.push(`Operation '${operation}' is not allowed in tenant context`);
  }

  // Check for cross-tenant data access attempts
  if (requestedData && typeof requestedData === 'object') {
    if (requestedData.tenant_id && requestedData.tenant_id !== tenantContext.tenantId) {
      result.isValid = false;
      result.errors.push('Cross-tenant data access attempt detected');
    }
  }

  return result;
};

/**
 * Validates that platform operations only access platform-scoped data
 */
export const validatePlatformSchemaAccess = (
  operation: string,
  platformContext: PlatformContext,
  requestedData?: any
): SchemaValidationResult => {
  const result: SchemaValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Validate platform context
  if (!platformContext.accountId || platformContext.accountType !== 'platform_owner') {
    result.isValid = false;
    result.errors.push('Invalid platform context: accountId and platform_owner type required');
  }

  // Platform operations should access landlord schema only
  const allowedPlatformOperations = [
    'SELECT', 'INSERT', 'UPDATE', 'DELETE',
    'CREATE', 'ALTER', 'DROP', 'INDEX',
    'GRANT', 'REVOKE'  // Platform can manage permissions
  ];

  if (!allowedPlatformOperations.some(op => operation.toUpperCase().includes(op))) {
    result.isValid = false;
    result.errors.push(`Operation '${operation}' is not allowed in platform context`);
  }

  // Check for tenant data access attempts
  if (requestedData && typeof requestedData === 'object') {
    if (requestedData.tenant_id && operation.includes('SELECT')) {
      // Platform can read tenant data for management purposes, but warn
      result.warnings.push('Platform accessing tenant-specific data for management');
    } else if (requestedData.tenant_id && !operation.includes('SELECT')) {
      // Platform should not modify tenant business data directly
      result.isValid = false;
      result.errors.push('Platform cannot directly modify tenant business data');
    }
  }

  return result;
};

/**
 * Validates schema isolation boundaries
 */
export const validateSchemaIsolation = (
  fromContext: 'platform' | 'tenant',
  toSchema: string,
  operation: string
): SchemaValidationResult => {
  const result: SchemaValidationResult = {
    isValid: true,
    errors: [],
    warnings: []
  };

  // Platform context validation
  if (fromContext === 'platform') {
    if (toSchema.startsWith('tenant_')) {
      result.warnings.push(`Platform accessing tenant schema: ${toSchema}`);
      
      // Only SELECT operations allowed for platform on tenant schemas
      if (!operation.toUpperCase().includes('SELECT')) {
        result.isValid = false;
        result.errors.push('Platform can only read from tenant schemas, not modify');
      }
    }
  }

  // Tenant context validation
  if (fromContext === 'tenant') {
    if (!toSchema.startsWith('tenant_')) {
      result.isValid = false;
      result.errors.push('Tenant context cannot access non-tenant schemas');
    }
    
    // Additional validation: tenant can only access their own schema
    // This would need tenant ID context to fully validate
  }

  return result;
};

/**
 * Comprehensive schema access validator
 */
export const validateSchemaAccess = (
  accountType: 'platform' | 'tenant',
  operation: string,
  targetSchema: string,
  context: PlatformContext | TenantContext,
  requestedData?: any
): SchemaValidationResult => {
  if (accountType === 'platform') {
    return validatePlatformSchemaAccess(
      operation,
      context as PlatformContext,
      requestedData
    );
  } else {
    return validateTenantSchemaAccess(
      operation,
      context as TenantContext,
      requestedData
    );
  }
};