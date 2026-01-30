/**
 * Authentication Test Utility
 * 
 * This utility helps test the authentication flow and API access
 */

import { authService } from '@/services/api/auth';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';

export interface AuthTestResult {
  success: boolean;
  message: string;
  details?: any;
  error?: string;
}

export async function testTenantLogin(): Promise<AuthTestResult> {
  try {
    console.log('🧪 Testing tenant login with demo credentials...');
    
    const loginRequest = {
      email: 'admin@etchinx.com',
      password: 'DemoAdmin2024!',
      accountType: 'tenant' as const,
      tenant_slug: 'etchinx',
    };
    
    const response = await authService.login(loginRequest);
    
    if (response.user && response.tenant) {
      console.log('✅ Login successful:', {
        user: response.user.email,
        tenant: response.tenant.name,
        hasToken: !!response.access_token
      });
      
      return {
        success: true,
        message: 'Login successful',
        details: {
          user: response.user.email,
          tenant: response.tenant.name,
          tenantId: response.tenant.id,
          hasToken: !!response.access_token
        }
      };
    } else {
      return {
        success: false,
        message: 'Login failed - missing user or tenant data',
        error: 'Invalid response structure'
      };
    }
  } catch (error: any) {
    console.error('❌ Login failed:', error);
    return {
      success: false,
      message: 'Login failed',
      error: error.message || 'Unknown error'
    };
  }
}

export async function testOrdersAPI(): Promise<AuthTestResult> {
  try {
    console.log('🧪 Testing orders API access...');
    
    // Check authentication first
    const token = localStorage.getItem('auth_token');
    const tenantId = localStorage.getItem('tenant_id');
    const accountType = localStorage.getItem('account_type');
    
    if (!token || !tenantId || accountType !== 'tenant') {
      return {
        success: false,
        message: 'Not authenticated for tenant API access',
        error: `Missing: ${!token ? 'token' : ''} ${!tenantId ? 'tenantId' : ''} ${accountType !== 'tenant' ? 'valid account type' : ''}`
      };
    }
    
    // Test API call
    const response = await tenantApiClient.get('/orders?per_page=5');
    
    console.log('✅ Orders API successful:', {
      dataLength: response.data?.length,
      total: response.total,
      hasData: !!response.data
    });
    
    return {
      success: true,
      message: 'Orders API access successful',
      details: {
        dataLength: response.data?.length || 0,
        total: response.total || 0,
        hasData: !!response.data
      }
    };
  } catch (error: any) {
    console.error('❌ Orders API failed:', error);
    return {
      success: false,
      message: 'Orders API access failed',
      error: error.message || 'Unknown error'
    };
  }
}

export async function testFullAuthFlow(): Promise<AuthTestResult> {
  try {
    console.log('🧪 Testing full authentication flow...');
    
    // Step 1: Login
    const loginResult = await testTenantLogin();
    if (!loginResult.success) {
      return loginResult;
    }
    
    // Step 2: Wait a moment for auth to settle
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Test API access
    const apiResult = await testOrdersAPI();
    if (!apiResult.success) {
      return apiResult;
    }
    
    return {
      success: true,
      message: 'Full authentication flow successful',
      details: {
        login: loginResult.details,
        api: apiResult.details
      }
    };
  } catch (error: any) {
    console.error('❌ Full auth flow failed:', error);
    return {
      success: false,
      message: 'Full authentication flow failed',
      error: error.message || 'Unknown error'
    };
  }
}

export function logCurrentAuthState(): void {
  console.group('🔍 Current Authentication State');
  console.log('Token:', localStorage.getItem('auth_token') ? '[PRESENT]' : '[MISSING]');
  console.log('Account Type:', localStorage.getItem('account_type'));
  console.log('Tenant ID:', localStorage.getItem('tenant_id'));
  console.log('User ID:', localStorage.getItem('user_id'));
  console.log('User:', localStorage.getItem('user'));
  console.log('Tenant:', localStorage.getItem('tenant'));
  console.groupEnd();
}