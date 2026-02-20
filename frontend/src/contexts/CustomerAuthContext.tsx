import { createContext, useContext, useState, ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customerAuthApi } from '@/services/api/customerPortalApi';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  uuid: string;
  name: string;
  email: string;
  phone?: string;
  account_type?: string;
  email_verified?: boolean;
  avatar?: string;
}

interface CustomerAuthContextType {
  isAuthenticated: boolean;
  customer: Customer | null;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<any>;
  register: (data: any) => Promise<any>;
  logout: () => void;
  isLoggingIn: boolean;
  isRegistering: boolean;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    // Initialize from localStorage
    const token = localStorage.getItem('customer_auth_token');
    const hasToken = !!token;
    console.log('CustomerAuthContext: Initial auth state', { hasToken });
    return hasToken;
  });

  // Get customer profile
  const { data: customer, isLoading: isLoadingProfile } = useQuery({
    queryKey: ['customer-profile'],
    queryFn: async () => {
      console.log('CustomerAuthContext: Fetching customer profile');
      const response = await customerAuthApi.getProfile();
      console.log('CustomerAuthContext: Profile response', response.data);
      // Backend returns { customer: {...} }, so we need to extract the customer object
      return response.data.customer;
    },
    enabled: isAuthenticated,
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Only show loading on initial load, not on subsequent fetches
  const isLoading = isAuthenticated && isLoadingProfile && !customer;

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      customerAuthApi.login(email, password),
    onSuccess: (response) => {
      console.log('CustomerAuthContext: Login success', response.data);
      const token = response.data.token;
      localStorage.setItem('customer_auth_token', token);
      setIsAuthenticated(true);
      queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      toast({ title: 'Success', description: 'Logged in successfully' });
    },
    onError: (error: any) => {
      console.error('CustomerAuthContext: Login error', error);
      toast({
        title: 'Login Failed',
        description: error.response?.data?.message || 'Invalid credentials',
        variant: 'destructive',
      });
    },
  });

  // Register mutation
  const registerMutation = useMutation({
    mutationFn: (data: any) => customerAuthApi.register(data),
    onSuccess: (response) => {
      const token = response.data.token;
      if (token) {
        localStorage.setItem('customer_auth_token', token);
        setIsAuthenticated(true);
        queryClient.invalidateQueries({ queryKey: ['customer-profile'] });
      }
      toast({
        title: 'Success',
        description: 'Registration successful. Please check your email to verify your account.',
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Registration Failed',
        description: error.response?.data?.message || 'Failed to register',
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: () => customerAuthApi.logout(),
    onSuccess: () => {
      console.log('CustomerAuthContext: Logout success');
      localStorage.removeItem('customer_auth_token');
      setIsAuthenticated(false);
      queryClient.clear();
      toast({ title: 'Success', description: 'Logged out successfully' });
    },
  });

  const value: CustomerAuthContextType = {
    isAuthenticated,
    customer: customer || null,
    isLoading,
    login: loginMutation.mutateAsync,
    register: registerMutation.mutateAsync,
    logout: () => {
      logoutMutation.mutate();
    },
    isLoggingIn: loginMutation.isPending,
    isRegistering: registerMutation.isPending,
  };

  console.log('CustomerAuthContext: Rendering with state', {
    isAuthenticated,
    hasCustomer: !!customer,
    isLoading,
  });

  return (
    <CustomerAuthContext.Provider value={value}>
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const context = useContext(CustomerAuthContext);
  if (context === undefined) {
    throw new Error('useCustomerAuth must be used within a CustomerAuthProvider');
  }
  return context;
}
