import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@/contexts/ApiServiceContext';
import { AccountType, AuthUser, AuthTenant, PlatformAccount, LoginRequest, RegisterRequest, ForgotPasswordRequest, ResetPasswordRequest, VerifyEmailRequest, ResendVerificationRequest, ChangePasswordRequest, UpdateProfileRequest } from '@/services/api/auth';
import { handleApiError, getDisplayMessage } from '@/services/api/errorHandler';

export interface UseAuthStateReturn {
  accountType: AccountType | null;
  user: AuthUser | null;
  account: PlatformAccount | null;
  tenant: AuthTenant | null;
  permissions: string[];
  roles: string[];
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (data: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  forgotPassword: (data: ForgotPasswordRequest) => Promise<void>;
  resetPassword: (data: ResetPasswordRequest) => Promise<void>;
  verifyEmail: (data: VerifyEmailRequest) => Promise<void>;
  resendVerification: (data: ResendVerificationRequest) => Promise<void>;
  updateProfile: (data: UpdateProfileRequest) => Promise<void>;
  changePassword: (data: ChangePasswordRequest) => Promise<void>;
  getCurrentUser: () => Promise<void>;
  clearError: () => void;
}

export const useAuthState = (): UseAuthStateReturn => {
  const authService = useAuth();
  
  // Initialize authentication state from localStorage immediately
  const initializeAuthState = () => {
    if (authService.isAuthenticated()) {
      const storedAccountType = authService.getAccountType();
      const storedPermissions = authService.getPermissionsFromStorage();
      const storedRoles = authService.getRolesFromStorage();
      const storedTenant = authService.getCurrentTenantFromStorage();
      
      if (storedAccountType === 'platform') {
        const storedAccount = authService.getPlatformAccountFromStorage();
        return {
          accountType: storedAccountType,
          user: null,
          account: storedAccount,
          tenant: storedTenant,
          permissions: storedPermissions,
          roles: storedRoles
        };
      } else if (storedAccountType === 'tenant') {
        const storedUser = authService.getCurrentUserFromStorage();
        return {
          accountType: storedAccountType,
          user: storedUser,
          account: null,
          tenant: storedTenant,
          permissions: storedPermissions,
          roles: storedRoles
        };
      }
    }
    
    return {
      accountType: null,
      user: null,
      account: null,
      tenant: null,
      permissions: [],
      roles: []
    };
  };

  const initialState = initializeAuthState();
  
  const [accountType, setAccountType] = useState<AccountType | null>(initialState.accountType);
  const [user, setUser] = useState<AuthUser | null>(initialState.user);
  const [account, setAccount] = useState<PlatformAccount | null>(initialState.account);
  const [tenant, setTenant] = useState<AuthTenant | null>(initialState.tenant);
  const [permissions, setPermissions] = useState<string[]>(initialState.permissions);
  const [roles, setRoles] = useState<string[]>(initialState.roles);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleError = useCallback((err: unknown) => {
    const formatted = handleApiError(err, 'Auth');
    setError(formatted.userMessage);
  }, []);

  const login = useCallback(
    async (data: LoginRequest) => {
      try {
        setIsLoading(true);
        clearError();
        const response = await authService.login(data);
        const accountTypeValue = authService.getAccountType();
        setAccountType(accountTypeValue);
        
        if (accountTypeValue === 'platform' && response.account) {
          setAccount(response.account);
          setUser(null);
          setTenant(null);
        } else if (accountTypeValue === 'tenant') {
          if (response.user) {
            setUser(response.user);
          }
          if (response.tenant) {
            setTenant(response.tenant);
          }
          setAccount(null);
        }
        
        if (response.permissions) {
          setPermissions(response.permissions);
        }
        if (response.roles) {
          setRoles(response.roles);
        }
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, clearError, handleError]
  );

  const logout = useCallback(async () => {
    try {
      setIsLoading(true);
      await authService.logout();
      setAccountType(null);
      setUser(null);
      setAccount(null);
      setTenant(null);
      setPermissions([]);
      setRoles([]);
      clearError();
    } catch (err) {
      handleError(err);
      setAccountType(null);
      setUser(null);
      setAccount(null);
      setTenant(null);
      setPermissions([]);
      setRoles([]);
    } finally {
      setIsLoading(false);
    }
  }, [authService, clearError, handleError]);

  const register = useCallback(
    async (data: RegisterRequest) => {
      try {
        setIsLoading(true);
        clearError();
        await authService.register(data);
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, clearError, handleError]
  );

  const forgotPassword = useCallback(
    async (data: ForgotPasswordRequest) => {
      try {
        setIsLoading(true);
        clearError();
        await authService.forgotPassword(data);
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, clearError, handleError]
  );

  const resetPassword = useCallback(
    async (data: ResetPasswordRequest) => {
      try {
        setIsLoading(true);
        clearError();
        await authService.resetPassword(data);
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, clearError, handleError]
  );

  const verifyEmail = useCallback(
    async (data: VerifyEmailRequest) => {
      try {
        setIsLoading(true);
        clearError();
        await authService.verifyEmail(data);
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, clearError, handleError]
  );

  const resendVerification = useCallback(
    async (data: ResendVerificationRequest) => {
      try {
        setIsLoading(true);
        clearError();
        await authService.resendVerification(data);
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, clearError, handleError]
  );

  const updateProfile = useCallback(
    async (data: UpdateProfileRequest) => {
      try {
        setIsLoading(true);
        clearError();
        const response = await authService.updateProfile(data);
        setUser(response.user);
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, clearError, handleError]
  );

  const changePassword = useCallback(
    async (data: ChangePasswordRequest) => {
      try {
        setIsLoading(true);
        clearError();
        await authService.changePassword(data);
      } catch (err) {
        handleError(err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authService, clearError, handleError]
  );

  const getCurrentUser = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await authService.getCurrentUser();
      const accountTypeValue = authService.getAccountType();
      
      if (accountTypeValue === 'platform' && response.account) {
        setAccount(response.account);
        setUser(null);
      } else if (accountTypeValue === 'tenant' && response.user) {
        setUser(response.user);
        setAccount(null);
      }
      
      if (response.tenant) {
        setTenant(response.tenant);
      }
    } catch (err) {
      handleError(err);
    } finally {
      setIsLoading(false);
    }
  }, [authService, handleError]);



  return {
    accountType,
    user,
    account,
    tenant,
    permissions,
    roles,
    isAuthenticated: !!user || !!account,
    isLoading,
    error,
    login,
    logout,
    register,
    forgotPassword,
    resetPassword,
    verifyEmail,
    resendVerification,
    updateProfile,
    changePassword,
    getCurrentUser,
    clearError,
  };
};
