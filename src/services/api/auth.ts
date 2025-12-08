import apiClient, { clientManager } from './client';
import { RefreshTokenResponse } from '@/types/api';

export type AccountType = 'platform' | 'tenant';

export interface LoginRequest {
  email: string;
  password: string;
  accountType?: AccountType;
  tenant_slug?: string;
}

export interface PlatformAccount {
  id: string;
  uuid: string;
  name: string;
  email: string;
  account_type: 'platform_owner';
  status: 'active';
  avatar?: string;
  permissions?: string[];
}

export interface LoginResponse {
  token?: string;
  access_token?: string;
  token_type: string;
  expires_in: number;
  user?: AuthUser;
  account?: PlatformAccount;
  tenant?: AuthTenant;
  permissions?: string[];
  roles?: string[];
}

export interface AuthUser {
  id: string;
  uuid: string;
  email: string;
  name: string;
  avatar?: string;
  email_verified_at?: string;
  created_at: string;
  updated_at: string;
  roles?: string[];
  permissions?: string[];
}

export interface AuthTenant {
  id: string;
  uuid: string;
  name: string;
  slug: string;
  domain?: string;
  status?: string;
  subscription_status?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  password_confirmation: string;
  accountType?: AccountType;
  tenant_id?: string;
  role?: string;
}

export interface RegisterResponse {
  message: string;
  user?: AuthUser;
  account?: PlatformAccount;
  tenant?: AuthTenant;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ForgotPasswordResponse {
  message: string;
}

export interface ResetPasswordRequest {
  token: string;
  email: string;
  password: string;
  password_confirmation: string;
}

export interface ResetPasswordResponse {
  message: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface VerifyEmailResponse {
  message: string;
}

export interface ResendVerificationRequest {
  email: string;
}

export interface ResendVerificationResponse {
  message: string;
}

export interface ChangePasswordRequest {
  current_password: string;
  password: string;
  password_confirmation: string;
}

export interface ChangePasswordResponse {
  message: string;
}

export interface UpdateProfileRequest {
  name: string;
  email: string;
  phone?: string;
  avatar?: string;
}

export interface UpdateProfileResponse {
  message: string;
  user: AuthUser;
}

export interface CurrentUserResponse {
  user?: AuthUser;
  account?: PlatformAccount;
  tenant?: AuthTenant;
}

class AuthService {
  async login(data: LoginRequest): Promise<LoginResponse> {
    console.log('AuthService.login called with:', { email: data.email, tenant_slug: data.tenant_slug, accountType: data.accountType });
    
    const accountType = data.accountType || 'tenant';
    // Use separated endpoints for platform and tenant as per OpenAPI spec
    const endpoint = accountType === 'platform' 
      ? '/platform/login' 
      : '/tenant/login';
    
    const payload = {
      email: data.email,
      password: data.password,
      ...(accountType === 'tenant' && data.tenant_slug && { tenant_slug: data.tenant_slug }),
      remember_me: false
    };
    
    console.log('Making login request to:', endpoint, 'with payload:', { ...payload, password: '[REDACTED]' });
    
    try {
      const response = await apiClient.post<LoginResponse>(endpoint, payload);
      console.log('Login response received:', response);
      
      // CRITICAL FIX: The axios interceptor returns response.data directly
      // So 'response' is actually the data, not the full response object
      let loginData;
      
      if (response?.success && response?.data) {
        // Wrapped response format
        loginData = response.data;
      } else {
        // Direct response format (axios interceptor already extracted response.data)
        loginData = response;
      }
      
      // Safety check for loginData
      if (!loginData || typeof loginData !== 'object') {
        console.error('Invalid loginData:', { loginData, apiResponse, responseData: response.data });
        throw new Error(`Invalid login response format: ${typeof loginData}`);
      }
      
      // Debug the token extraction
      const extractedToken = loginData.access_token || loginData.token;
      console.log('Token extraction debug:', {
        hasAccessToken: !!loginData.access_token,
        hasToken: !!loginData.token,
        extractedToken: extractedToken?.substring(0, 20) + '...',
        loginDataKeys: Object.keys(loginData || {}),
        loginDataValues: loginData
      });
      
      if (!extractedToken) {
        throw new Error('No access token found in login response - check backend response format');
      }
      
      // Handle both backend response formats: platform returns 'access_token', tenant returns 'token'
      const loginResponse: LoginResponse = {
        access_token: extractedToken,
        token_type: loginData.token_type || 'Bearer',
        expires_in: loginData.expires_in || 3600,
        ...(loginData.user && { user: loginData.user }),
        ...(loginData.tenant && { tenant: loginData.tenant }),
        ...(loginData.account && { account: loginData.account }),
        ...(loginData.permissions && { permissions: loginData.permissions }),
        ...(loginData.roles && { roles: loginData.roles })
      };
      
      return this.processLoginResponse(loginResponse, accountType);
    } catch (error: any) {
      console.error('AuthService.login error:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url,
        hasResponse: !!error.response,
        errorType: error.constructor.name
      });
      
      // Only use demo fallback for network/connection errors, not parsing errors
      // If we got a response from the server, don't fallback to demo
      const hasHttpResponse = error.response?.status;
      
      console.log('Error analysis:', {
        hasHttpResponse,
        httpStatus: error.response?.status,
        isDemoCredentials: this.isDemoCredentials(data),
        willUseDemoFallback: !hasHttpResponse && this.isDemoCredentials(data)
      });
      
      if (!hasHttpResponse && this.isDemoCredentials(data)) {
        console.log('Backend unavailable (network error), using demo login fallback for demo credentials');
        const demoResponse = this.createDemoLoginResponse(data);
        return this.processLoginResponse(demoResponse, accountType);
      }
      
      // If it's a parsing error but we got a successful HTTP response, re-throw
      if (hasHttpResponse && hasHttpResponse >= 200 && hasHttpResponse < 300) {
        console.error('Login parsing error with successful HTTP response - this should not happen');
        throw error;
      }
      
      // SECURITY FIX: Better error handling for invalid credentials
      if (error.response?.status === 422 || error.response?.status === 401) {
        throw new Error('Invalid credentials or unauthorized access to this account type');
      }
      
      // Handle API error response
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message || 'Login failed');
      }
      
      throw new Error(error.message || 'Network error during login');
    }
  }

  private isDemoCredentials(data: LoginRequest): boolean {
    const platformCredentials = [
      { email: 'admin@canvastencil.com', password: 'SuperAdmin2024!' }
    ];
    
    const tenantCredentials = [
      { email: 'admin@demo-etching.com', password: 'DemoAdmin2024!' },
      { email: 'manager@demo-etching.com', password: 'DemoManager2024!' }
    ];
    
    // SECURITY FIX: Validate email matches the expected account type context
    if (data.accountType === 'platform') {
      return platformCredentials.some(cred => 
        cred.email === data.email && cred.password === data.password
      );
    } else {
      return tenantCredentials.some(cred => 
        cred.email === data.email && cred.password === data.password
      );
    }
  }

  private createDemoLoginResponse(data: LoginRequest): LoginResponse {
    // SECURITY VALIDATION: Double-check credentials match account type
    if (data.accountType === 'platform' && !data.email.includes('@canvastencil.com')) {
      throw new Error('Platform login requires @canvastencil.com email address');
    }
    
    if (data.accountType === 'tenant' && data.email.includes('@canvastencil.com')) {
      throw new Error('Tenant login cannot use platform email address');
    }

    const baseResponse = {
      access_token: 'demo_token_' + Date.now(),
      token_type: 'Bearer',
      expires_in: 3600,
    };

    if (data.accountType === 'platform') {
      return {
        ...baseResponse,
        account: {
          id: '1',
          uuid: '00000000-0000-0000-0000-000000000001',
          name: 'Platform Admin',
          email: data.email,
          account_type: 'platform_owner',
          status: 'active',
          permissions: ['platform.all']
        },
        permissions: ['platform.all'],
        roles: ['super_admin']
      };
    } else {
      return {
        ...baseResponse,
        user: {
          id: '1',
          uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c9',
          name: data.email === 'admin@demo-etching.com' ? 'Demo Admin' : 'Demo Manager',
          email: data.email,
          email_verified_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          roles: [data.email === 'admin@demo-etching.com' ? 'admin' : 'manager'],
          permissions: data.email === 'admin@demo-etching.com' ? 
            ['tenant.all'] : 
            ['orders.read', 'customers.read', 'products.read']
        },
        tenant: {
          id: '1',
          uuid: '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
          name: 'Demo Etching Company',
          slug: 'demo-etching',
          domain: 'demo-etching.com',
          status: 'active',
          subscription_status: 'active'
        },
        permissions: data.email === 'admin@demo-etching.com' ? 
          ['tenant.all'] : 
          ['orders.read', 'customers.read', 'products.read'],
        roles: [data.email === 'admin@demo-etching.com' ? 'admin' : 'manager']
      };
    }
  }

  private processLoginResponse(loginResponse: LoginResponse, accountType: AccountType): LoginResponse {
    const token = loginResponse.access_token || loginResponse.token;
    
    console.log('AuthService: Processing login response', {
      hasToken: !!token,
      tokenType: token?.substring(0, 20) + '...',
      isDemoToken: token?.startsWith('demo_token_'),
      accountType,
      hasUser: !!loginResponse.user,
      hasTenant: !!loginResponse.tenant,
      hasAccount: !!loginResponse.account
    });
    
    if (token) {
      this.setAuthToken(token);
      this.setAccountType(accountType);
      
      if (accountType === 'platform' && loginResponse.account) {
        this.setPlatformAccount(loginResponse.account);
      } else if (accountType === 'tenant') {
        if (loginResponse.user) {
          this.setCurrentUser(loginResponse.user);
        }
        if (loginResponse.tenant) {
          this.setCurrentTenant(loginResponse.tenant);
        }
      }
      
      if (loginResponse.permissions) {
        this.setPermissions(loginResponse.permissions);
      }
      if (loginResponse.roles) {
        this.setRoles(loginResponse.roles);
      }
    }
    
    return loginResponse;
  }

  async register(data: RegisterRequest): Promise<RegisterResponse> {
    const accountType = data.accountType || 'tenant';
    
    let endpoint: string;
    let payload: any = {
      name: data.name,
      email: data.email,
      password: data.password,
      password_confirmation: data.password_confirmation,
    };

    if (accountType === 'platform') {
      endpoint = '/platform/register';
    } else {
      // For tenant registration, we need tenant ID
      const tenantId = data.tenant_id || '6ba7b810-9dad-11d1-80b4-00c04fd430c8'; // Default demo tenant
      endpoint = `/tenant/${tenantId}/register`;
      
      if (data.role) {
        payload.role = data.role;
      }
    }

    try {
      const response = await apiClient.post<any>(endpoint, payload);
      
      // Handle API response structure
      const apiResponse = response.data;
      if (apiResponse?.success && apiResponse?.data) {
        return apiResponse.data;
      }
      
      return response.data;
    } catch (error: any) {
      if (error.response?.data?.error) {
        throw new Error(error.response.data.error.message || 'Registration failed');
      }
      
      throw new Error(error.message || 'Network error during registration');
    }
  }

  async forgotPassword(data: ForgotPasswordRequest): Promise<ForgotPasswordResponse> {
    const response = await apiClient.post<ForgotPasswordResponse>('/auth/forgot-password', data);
    return response.data;
  }

  async resetPassword(data: ResetPasswordRequest): Promise<ResetPasswordResponse> {
    const response = await apiClient.post<ResetPasswordResponse>('/auth/reset-password', data);
    return response.data;
  }

  async verifyEmail(data: VerifyEmailRequest): Promise<VerifyEmailResponse> {
    const response = await apiClient.post<VerifyEmailResponse>('/auth/verify-email', data);
    return response.data;
  }

  async resendVerification(data: ResendVerificationRequest): Promise<ResendVerificationResponse> {
    const response = await apiClient.post<ResendVerificationResponse>('/auth/resend-verification', data);
    return response.data;
  }

  async logout(): Promise<void> {
    try {
      const accountType = this.getAccountType();
      const endpoint = accountType === 'platform' 
        ? '/platform/logout' 
        : '/tenant/logout';
      
      await apiClient.post(endpoint, {});
    } catch (error) {
      // Continue with logout even if API call fails
      console.warn('Logout API call failed, clearing local auth data anyway');
    } finally {
      this.clearAuth();
    }
  }

  async refreshToken(refreshToken: string): Promise<RefreshTokenResponse> {
    try {
      const response = await apiClient.post<RefreshTokenResponse>('/auth/refresh', {
        refresh_token: refreshToken,
      });

      // Handle API response structure
      const apiResponse = response.data;
      if (apiResponse?.success && apiResponse?.data) {
        const refreshData = apiResponse.data;
        if (refreshData.access_token) {
          this.setAuthToken(refreshData.access_token);
        }
        return refreshData;
      }

      return response.data;
    } catch (error: any) {
      // Clear auth on refresh failure
      this.clearAuth();
      throw new Error(error.response?.data?.error?.message || 'Token refresh failed');
    }
  }

  async getCurrentUser(): Promise<CurrentUserResponse> {
    try {
      const response = await apiClient.get<CurrentUserResponse>('/auth/me');
      
      // Handle API response structure
      const apiResponse = response.data;
      if (apiResponse?.success && apiResponse?.data) {
        const userData = apiResponse.data;
        if (userData.user) {
          this.setCurrentUser(userData.user);
        }
        if (userData.account) {
          this.setPlatformAccount(userData.account);
        }
        if (userData.tenant) {
          this.setCurrentTenant(userData.tenant);
        }
        
        return userData;
      }
      
      return response.data;
    } catch (error: any) {
      // Don't clear auth on network errors, only on 401
      if (error.response?.status === 401) {
        this.clearAuth();
      }
      throw new Error(error.response?.data?.error?.message || 'Failed to get user data');
    }
  }

  async updateProfile(data: UpdateProfileRequest): Promise<UpdateProfileResponse> {
    const response = await apiClient.put<UpdateProfileResponse>('/auth/profile', data);
    
    const updateResponse = response.data;
    if (updateResponse.user) {
      this.setCurrentUser(updateResponse.user);
    }
    
    return response.data;
  }

  async changePassword(data: ChangePasswordRequest): Promise<ChangePasswordResponse> {
    const response = await apiClient.post<ChangePasswordResponse>('/auth/change-password', data);
    return response.data;
  }

  private setAuthToken(token: string) {
    console.log('AuthService: Setting auth token', { tokenSnippet: token.substring(0, 20) + '...' });
    localStorage.setItem('auth_token', token);
  }

  private setAccountType(accountType: AccountType) {
    localStorage.setItem('account_type', accountType);
  }

  private setCurrentUser(user: AuthUser) {
    localStorage.setItem('user_id', user.id);
    localStorage.setItem('user', JSON.stringify(user));
  }

  private setPlatformAccount(account: PlatformAccount) {
    localStorage.setItem('account_id', account.id);
    localStorage.setItem('account', JSON.stringify(account));
  }

  private setCurrentTenant(tenant: AuthTenant) {
    localStorage.setItem('tenant_id', tenant.id);
    localStorage.setItem('tenant', JSON.stringify(tenant));
  }

  private setPermissions(permissions: string[]) {
    localStorage.setItem('permissions', JSON.stringify(permissions));
  }

  private setRoles(roles: string[]) {
    localStorage.setItem('roles', JSON.stringify(roles));
  }

  clearAuth(forceClear: boolean = false) {
    const currentToken = this.getAuthToken();
    console.log('AuthService: Clearing all authentication data', { 
      hadToken: !!currentToken,
      tokenSnippet: currentToken?.substring(0, 20) + '...',
      forceClear,
      stackTrace: new Error().stack
    });

    // PROTECTION: Don't clear demo tokens unless explicitly forced
    if (!forceClear && this.shouldPreserveToken()) {
      console.log('AuthService: Skipping clearAuth for preserved token (demo mode)');
      return;
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('account_type');
    localStorage.removeItem('user_id');
    localStorage.removeItem('user');
    localStorage.removeItem('account_id');
    localStorage.removeItem('account');
    localStorage.removeItem('tenant_id');
    localStorage.removeItem('tenant');
    localStorage.removeItem('permissions');
    localStorage.removeItem('roles');
    clientManager.clearCache();
  }

  /**
   * Force complete authentication reset - clears everything and reloads page
   */
  forceAuthReset() {
    console.log('AuthService: Force resetting all authentication data');
    this.clearAuth(true); // Force clear even demo tokens
    // Also clear any potential demo data
    localStorage.clear();
    window.location.reload();
  }

  /**
   * Debug method to check current auth state
   */
  debugAuthState() {
    const token = this.getToken();
    return {
      hasToken: !!token,
      tokenType: token?.substring(0, 20) + '...',
      isDemoToken: this.isDemoToken(token),
      isAuthenticated: this.isAuthenticated(),
      accountType: this.getAccountType(),
      user: this.getCurrentUserFromStorage(),
      tenant: this.getCurrentTenantFromStorage()
    };
  }

  /**
   * Force logout and redirect to login page
   */
  forceLogout() {
    console.log('AuthService: Force logout initiated');
    this.clearAuth(true); // Force clear even demo tokens
    window.location.href = '/login';
  }

  /**
   * Check if the current token should be preserved (e.g., demo tokens during development)
   */
  shouldPreserveToken(): boolean {
    const token = this.getAuthToken();
    
    // Preserve demo tokens during development/demo mode
    if (token && this.isDemoToken(token)) {
      console.log('AuthService: Preserving demo token from auto-clear');
      return true;
    }
    
    return false;
  }

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
  }

  isDemoToken(token: string | null): boolean {
    return token?.startsWith('demo_token_') || false;
  }

  getAccountType(): AccountType | null {
    return localStorage.getItem('account_type') as AccountType | null;
  }

  getCurrentUserFromStorage(): AuthUser | null {
    const user = localStorage.getItem('user');
    if (!user) return null;
    try {
      return JSON.parse(user);
    } catch {
      return null;
    }
  }

  getPlatformAccountFromStorage(): PlatformAccount | null {
    const account = localStorage.getItem('account');
    if (!account) return null;
    try {
      return JSON.parse(account);
    } catch {
      return null;
    }
  }

  getCurrentTenantFromStorage(): AuthTenant | null {
    const tenant = localStorage.getItem('tenant');
    if (!tenant) return null;
    try {
      return JSON.parse(tenant);
    } catch {
      return null;
    }
  }

  getPermissionsFromStorage(): string[] {
    const permissions = localStorage.getItem('permissions');
    if (!permissions) return [];
    try {
      return JSON.parse(permissions);
    } catch {
      return [];
    }
  }

  getRolesFromStorage(): string[] {
    const roles = localStorage.getItem('roles');
    if (!roles) return [];
    try {
      return JSON.parse(roles);
    } catch {
      return [];
    }
  }

  isAuthenticated(): boolean {
    return !!this.getAuthToken();
  }

  getToken(): string | null {
    return this.getAuthToken();
  }
}

export const authService = new AuthService();

// Make auth service available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).authService = authService;
}
export default authService;
