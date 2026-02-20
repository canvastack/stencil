import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export interface CustomerRegistrationData {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface CustomerLoginData {
  email: string;
  password: string;
}

export interface CustomerProfile {
  uuid: string;
  name: string;
  email: string;
  phone: string;
  account_type: 'guest' | 'registered' | 'verified';
  email_verified: boolean;
  created_at: string;
}

export interface AuthResponse {
  message: string;
  customer: {
    uuid: string;
    name: string;
    email: string;
    phone: string;
    account_type: string;
    email_verified?: boolean;
  };
  token?: string;
}

/**
 * Register a new customer account
 */
export const registerCustomer = async (data: CustomerRegistrationData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/public/customers/register`, data);
  return response.data;
};

/**
 * Login customer
 */
export const loginCustomer = async (data: CustomerLoginData): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/public/customers/login`, data);
  
  // Store token in localStorage
  if (response.data.token) {
    localStorage.setItem('customer_token', response.data.token);
    // Set default authorization header for future requests
    axios.defaults.headers.common['Authorization'] = `Bearer ${response.data.token}`;
  }
  
  return response.data;
};

/**
 * Logout customer
 */
export const logoutCustomer = async (): Promise<void> => {
  const token = localStorage.getItem('customer_token');
  
  if (token) {
    try {
      await axios.post(
        `${API_BASE_URL}/public/customers/logout`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
  
  // Clear token and auth header
  localStorage.removeItem('customer_token');
  delete axios.defaults.headers.common['Authorization'];
};

/**
 * Get customer profile
 */
export const getCustomerProfile = async (): Promise<CustomerProfile> => {
  const token = localStorage.getItem('customer_token');
  
  if (!token) {
    throw new Error('No authentication token found');
  }
  
  const response = await axios.get(`${API_BASE_URL}/public/customers/profile`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  
  return response.data.customer;
};

/**
 * Verify email with token
 */
export const verifyEmail = async (token: string): Promise<AuthResponse> => {
  const response = await axios.get(`${API_BASE_URL}/public/customers/verify-email/${token}`);
  return response.data;
};

/**
 * Resend verification email
 */
export const resendVerificationEmail = async (email: string): Promise<{ message: string }> => {
  const response = await axios.post(`${API_BASE_URL}/public/customers/resend-verification`, {
    email,
  });
  return response.data;
};

/**
 * Upgrade guest account to registered
 */
export const upgradeGuestAccount = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await axios.post(`${API_BASE_URL}/public/customers/upgrade-guest`, {
    email,
    password,
  });
  return response.data;
};

/**
 * Check if customer is authenticated
 */
export const isCustomerAuthenticated = (): boolean => {
  return !!localStorage.getItem('customer_token');
};

/**
 * Get stored customer token
 */
export const getCustomerToken = (): string | null => {
  return localStorage.getItem('customer_token');
};

/**
 * Initialize axios with stored token
 */
export const initializeCustomerAuth = (): void => {
  const token = getCustomerToken();
  if (token) {
    axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }
};

// Default export object for convenience
const customerAuthApi = {
  register: registerCustomer,
  login: loginCustomer,
  logout: logoutCustomer,
  getProfile: getCustomerProfile,
  verifyEmail,
  resendVerificationEmail,
  upgradeGuestAccount,
  isAuthenticated: isCustomerAuthenticated,
  getToken: getCustomerToken,
  initialize: initializeCustomerAuth,
};

export default customerAuthApi;
