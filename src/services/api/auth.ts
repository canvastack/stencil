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
  async loginTenant(email: string, password: string, tenant_slug: string): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/tenant/login', {
      email,
      password,
      tenant_slug
    });

    if (response.data?.success && response.data?.data) {
      const { token, user, tenant } = response.data.data;
      
      this.setAuthToken(token);
      this.setAccountType('tenant');
      
      if (user) {
        this.setCurrentUser(user);
        this.setPermissions(user.permissions || []);
        this.setRoles(user.roles || []);
      }
      
      if (tenant) {
        this.setCurrentTenant(tenant);
      }
      
      return {
        token,
        token_type: 'Bearer',
        expires_in: 3600,
        user,
        tenant,
        permissions: user?.permissions || [],
        roles: user?.roles || []
      };
    }
    
    throw new Error('Invalid response format from server');
  }

  async loginPlatform(email: string, password: string): Promise<LoginResponse> {
    const response = await apiClient.post('/auth/platform/login', {
      email,
      password
    });

    if (response.data?.success && response.data?.data) {
      const { token, account } = response.data.data;
      
      this.setAuthToken(token);
      this.setAccountType('platform');
      
      if (account) {
        this.setPlatformAccount(account);
        this.setPermissions(account.permissions || []);
      }
      
      return {
        token,
        token_type: 'Bearer',
        expires_in: 3600,
        account,
        permissions: account?.permissions || []
      };
    }
    
    throw new Error('Invalid response format from server');
  }

  async login(data: LoginRequest): Promise<LoginResponse> {
    console.log('AuthService.login called with:', { email: data.email, tenant_slug: data.tenant_slug, accountType: data.accountType });
    
    const accountType = data.accountType || 'tenant';
    
    try {
      if (accountType === 'tenant' && data.tenant_slug) {
        return this.loginTenant(data.email, data.password, data.tenant_slug);
      } else if (accountType === 'platform') {
        return this.loginPlatform(data.email, data.password);
      } else {
        throw new Error('Missing tenant_slug for tenant login');
      }
    } catch (error: any) {
      // Development fallback for demo credentials
      if (this.isDemoCredentials(data)) {
        console.log('Backend unavailable, using demo login fallback');
        const demoResponse = this.createDemoLoginResponse(data);
        return this.processLoginResponse(demoResponse, accountType);
      }
      
      // Handle API error response
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error(error.message || 'Login failed');
    }
  }

  private isDemoCredentials(data: LoginRequest): boolean {
    const demoCredentials = [
      { email: 'admin@canvastencil.com', password: 'SuperAdmin2024!' },
      { email: 'admin@demo-etching.com', password: 'DemoAdmin2024!' },
      { email: 'manager@demo-etching.com', password: 'DemoManager2024!' }
    ];
    
    return demoCredentials.some(cred => 
      cred.email === data.email && cred.password === data.password
    );
  }

  private createDemoLoginResponse(data: LoginRequest): LoginResponse {
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
      await apiClient.post('/auth/logout', {});
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

  clearAuth() {
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

  getAuthToken(): string | null {
    return localStorage.getItem('auth_token');
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


}

export const authService = new AuthService();
export default authService;
