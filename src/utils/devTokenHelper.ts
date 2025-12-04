/**
 * Development Token Helper
 * 
 * Provides utilities to set up demo authentication tokens for development and testing
 */

export const DEV_TOKENS = {
  DEMO_ADMIN: '110|Bhi93TDJ5URkOkWcSIj2IFr2T6gU40nar8zoTIKCg91uatxGbrxoJz6MtQUaYJxA2k8k90IwP82pnReD',
} as const;

export const DEV_USERS = {
  DEMO_ADMIN: {
    email: 'admin@demo-etching.com',
    name: 'Demo Admin',
    password: 'DemoAdmin2024!',
    tenant: 'demo-etching',
    abilities: [
      'tenant:read', 'tenant:write', 'dashboard:view', 'profile:update',
      'cms:manage', 'cms:create', 'cms:update', 'cms:delete',
      'users:manage', 'customers:manage', 'products:manage', 
      'orders:manage', 'vendors:manage', 'analytics:view', 'settings:manage'
    ]
  }
} as const;

/**
 * Set up demo authentication token for development
 */
export function setupDemoAuth(): void {
  if (!isDevelopment()) {
    console.warn('setupDemoAuth() called in non-development environment');
    return;
  }

  const currentToken = localStorage.getItem('auth_token');
  
  if (!currentToken) {
    console.log('🔑 Setting up demo authentication token...');
    localStorage.setItem('auth_token', DEV_TOKENS.DEMO_ADMIN);
    
    // Also set up demo user data for authentication context
    const demoUser = DEV_USERS.DEMO_ADMIN;
    localStorage.setItem('auth_account_type', 'tenant');
    localStorage.setItem('auth_user', JSON.stringify({
      id: '1',
      uuid: 'demo-admin-uuid',
      email: demoUser.email,
      name: demoUser.name,
      avatar: null,
      roles: ['admin'],
      permissions: demoUser.abilities
    }));
    localStorage.setItem('auth_tenant', JSON.stringify({
      id: '1',
      uuid: 'demo-tenant-uuid', 
      name: 'Demo Custom Etching Business',
      slug: 'demo-etching',
      domain: 'demo-etching.local'
    }));
    localStorage.setItem('auth_permissions', JSON.stringify(demoUser.abilities));
    localStorage.setItem('auth_roles', JSON.stringify(['admin']));
    
    console.log('✅ Demo authentication token set up successfully');
    console.log('   User:', demoUser.email);
    console.log('   Tenant: demo-etching');
    console.log('   Refresh the page to use the new token');
  } else {
    console.log('🔑 Authentication token already exists in localStorage');
  }
}

/**
 * Clear all authentication data from localStorage
 */
export function clearAuth(): void {
  const authKeys = [
    'auth_token',
    'auth_account_type', 
    'auth_user',
    'auth_tenant',
    'auth_permissions',
    'auth_roles'
  ];
  
  authKeys.forEach(key => {
    localStorage.removeItem(key);
  });
  
  console.log('🧹 All authentication data cleared from localStorage');
}

/**
 * Display current authentication status
 */
export function showAuthStatus(): void {
  const token = localStorage.getItem('auth_token');
  const accountType = localStorage.getItem('auth_account_type');
  const user = localStorage.getItem('auth_user');
  const tenant = localStorage.getItem('auth_tenant');
  
  console.group('🔍 Current Authentication Status');
  console.log('Token:', token ? `${token.substring(0, 20)}...` : 'None');
  console.log('Account Type:', accountType || 'None');
  console.log('User:', user ? JSON.parse(user) : 'None');
  console.log('Tenant:', tenant ? JSON.parse(tenant) : 'None');
  console.groupEnd();
}

/**
 * Check if we're in development environment
 */
function isDevelopment(): boolean {
  return import.meta.env.DEV || import.meta.env.NODE_ENV === 'development';
}

// Auto-setup in development environment
if (isDevelopment() && typeof window !== 'undefined') {
  // Make functions available in browser console for debugging
  (window as any).devAuth = {
    setup: setupDemoAuth,
    clear: clearAuth,
    status: showAuthStatus,
    tokens: DEV_TOKENS
  };
  
  console.log('🔧 Development authentication helper loaded');
  console.log('   Available commands:');
  console.log('   - devAuth.setup() - Set up demo authentication');
  console.log('   - devAuth.clear() - Clear all auth data');
  console.log('   - devAuth.status() - Show current auth status');
}