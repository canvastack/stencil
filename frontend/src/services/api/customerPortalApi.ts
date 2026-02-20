import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add auth token to requests (for authenticated customer routes)
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('customer_auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
    console.log('[CustomerPortalAPI] Token added to request:', config.url);
  } else {
    console.warn('[CustomerPortalAPI] No token found for request:', config.url);
  }
  return config;
});

export const customerPortalApi = {
  // Public quote access (no auth required)
  viewQuoteByToken: (token: string) => {
    return api.get(`/customer-portal/quotes/${token}`);
  },

  acceptQuote: (token: string) => {
    return api.post(`/customer-portal/quotes/${token}/accept`);
  },

  rejectQuote: (token: string, reason: string) => {
    return api.post(`/customer-portal/quotes/${token}/reject`, { reason });
  },

  counterOffer: (token: string, counter_amount: number, notes: string) => {
    return api.post(`/customer-portal/quotes/${token}/counter-offer`, {
      counter_amount,
      notes,
    });
  },

  // Authenticated customer routes (requires login)
  getMyQuotes: () => {
    return api.get('/public/customers/quotes');
  },

  getMyQuoteById: (id: string) => {
    return api.get(`/public/customers/quotes/${id}`);
  },

  acceptQuoteAuthenticated: (id: string) => {
    return api.post(`/public/customers/quotes/${id}/accept`, {
      terms_accepted: true,
    });
  },

  rejectQuoteAuthenticated: (id: string, reason: string) => {
    return api.post(`/public/customers/quotes/${id}/reject`, { reason });
  },

  counterOfferAuthenticated: (id: string, counter_amount: number, notes: string) => {
    return api.post(`/public/customers/quotes/${id}/counter-offer`, {
      counter_amount,
      notes,
    });
  },
};

export const customerAuthApi = {
  // Customer authentication
  register: (data: {
    name: string;
    email: string;
    phone: string;
    password: string;
    password_confirmation: string;
  }) => {
    return api.post('/public/customers/register', data);
  },

  login: (email: string, password: string) => {
    return api.post('/public/customers/login', { email, password });
  },

  logout: () => {
    return api.post('/public/customers/logout');
  },

  verifyEmail: (token: string) => {
    return api.get(`/public/customers/verify-email/${token}`);
  },

  resendVerificationEmail: (email: string) => {
    return api.post('/public/customers/resend-verification', { email });
  },

  forgotPassword: (email: string) => {
    return api.post('/public/customers/forgot-password', { email });
  },

  resetPassword: (token: string, password: string, password_confirmation: string) => {
    return api.post('/public/customers/reset-password', {
      token,
      password,
      password_confirmation,
    });
  },

  getProfile: () => {
    return api.get('/public/customers/profile');
  },

  updateProfile: (data: any) => {
    return api.put('/public/customers/profile', data);
  },
};
