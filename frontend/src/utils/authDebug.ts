/**
 * Authentication Debug Utility
 * 
 * This utility helps debug authentication issues by providing
 * detailed information about the current authentication state.
 */

export interface AuthDebugInfo {
  isAuthenticated: boolean;
  accountType: string | null;
  tenantId: string | null;
  userId: string | null;
  hasToken: boolean;
  tokenLength: number | null;
  localStorage: {
    auth_token: string | null;
    account_type: string | null;
    tenant_id: string | null;
    user_id: string | null;
    user: string | null;
    tenant: string | null;
  };
  issues: string[];
  recommendations: string[];
}

export function getAuthDebugInfo(): AuthDebugInfo {
  const token = localStorage.getItem('auth_token');
  const accountType = localStorage.getItem('account_type');
  const tenantId = localStorage.getItem('tenant_id');
  const userId = localStorage.getItem('user_id');
  const user = localStorage.getItem('user');
  const tenant = localStorage.getItem('tenant');

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Check for authentication issues
  if (!token) {
    issues.push('No authentication token found');
    recommendations.push('User needs to log in');
  }

  if (!accountType) {
    issues.push('No account type specified');
    recommendations.push('Account type should be set during login');
  } else if (accountType !== 'tenant') {
    issues.push(`Invalid account type for tenant operations: ${accountType}`);
    recommendations.push('User should log in with a tenant account');
  }

  if (!tenantId) {
    issues.push('No tenant ID found');
    recommendations.push('Tenant context is required for tenant API calls');
  }

  if (!userId) {
    issues.push('No user ID found');
    recommendations.push('User ID should be set during login');
  }

  // Check for token format issues
  if (token && !token.includes('|')) {
    issues.push('Token format appears invalid (missing pipe separator)');
    recommendations.push('Token should be refreshed or user should re-login');
  }

  return {
    isAuthenticated: !!(token && accountType === 'tenant' && tenantId),
    accountType,
    tenantId,
    userId,
    hasToken: !!token,
    tokenLength: token?.length || null,
    localStorage: {
      auth_token: token,
      account_type: accountType,
      tenant_id: tenantId,
      user_id: userId,
      user,
      tenant,
    },
    issues,
    recommendations,
  };
}

export function logAuthDebugInfo(): void {
  const debugInfo = getAuthDebugInfo();
  
  console.group('🔍 Authentication Debug Info');
  console.log('Is Authenticated:', debugInfo.isAuthenticated);
  console.log('Account Type:', debugInfo.accountType);
  console.log('Tenant ID:', debugInfo.tenantId);
  console.log('User ID:', debugInfo.userId);
  console.log('Has Token:', debugInfo.hasToken);
  console.log('Token Length:', debugInfo.tokenLength);
  
  if (debugInfo.issues.length > 0) {
    console.group('❌ Issues Found:');
    debugInfo.issues.forEach(issue => console.warn(issue));
    console.groupEnd();
  }
  
  if (debugInfo.recommendations.length > 0) {
    console.group('💡 Recommendations:');
    debugInfo.recommendations.forEach(rec => console.info(rec));
    console.groupEnd();
  }
  
  console.log('LocalStorage Data:', debugInfo.localStorage);
  console.groupEnd();
}

export function clearAuthData(): void {
  console.log('🧹 Clearing authentication data...');
  
  const keysToRemove = [
    'auth_token',
    'account_type', 
    'tenant_id',
    'user_id',
    'user',
    'tenant',
    'login_timestamp'
  ];
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('✅ Authentication data cleared');
}

export function validateTenantAuth(): { isValid: boolean; error?: string } {
  const debugInfo = getAuthDebugInfo();
  
  if (!debugInfo.hasToken) {
    return { isValid: false, error: 'No authentication token found' };
  }
  
  if (debugInfo.accountType !== 'tenant') {
    return { isValid: false, error: `Invalid account type: ${debugInfo.accountType}` };
  }
  
  if (!debugInfo.tenantId) {
    return { isValid: false, error: 'No tenant ID found' };
  }
  
  return { isValid: true };
}