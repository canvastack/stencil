/**
 * Vendor Portal Test Utilities
 * 
 * Provides helper functions and utilities for testing vendor portal components
 */

import { ReactElement } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VendorAuthProvider } from '@/contexts/VendorAuthContext';

/**
 * Mock vendor user data
 */
export const mockVendorUser = {
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'vendor@test.com',
  name: 'Test Vendor',
  vendor_id: '123e4567-e89b-12d3-a456-426614174001',
  account_type: 'vendor' as const,
  vendor: {
    id: '123e4567-e89b-12d3-a456-426614174001',
    uuid: '123e4567-e89b-12d3-a456-426614174001',
    company_name: 'Test Vendor Company',
    email: 'vendor@test.com',
    phone: '+1234567890',
    status: 'active' as const,
    portal_access_enabled: true,
    onboarding_status: 'completed' as const,
  },
};

/**
 * Mock vendor authentication token
 */
export const mockVendorToken = 'mock-vendor-token-12345';

/**
 * Mock quote data
 */
export const mockQuote = {
  id: '223e4567-e89b-12d3-a456-426614174000',
  uuid: '223e4567-e89b-12d3-a456-426614174000',
  quote_number: 'Q-2024-001',
  status: 'sent' as const,
  vendor_price: 150000,
  estimated_delivery_days: 7,
  notes: 'Test quote notes',
  sent_at: '2024-02-01T10:00:00Z',
  expires_at: '2024-02-15T10:00:00Z',
  order: {
    id: '323e4567-e89b-12d3-a456-426614174000',
    uuid: '323e4567-e89b-12d3-a456-426614174000',
    order_number: 'ORD-2024-001',
    customer_name: 'Test Customer',
  },
  product: {
    id: '423e4567-e89b-12d3-a456-426614174000',
    uuid: '423e4567-e89b-12d3-a456-426614174000',
    name: 'Custom Etching Plate',
  },
};

/**
 * Mock vendor statistics
 */
export const mockVendorStats = {
  total_quotes: 50,
  pending_quotes: 10,
  accepted_quotes: 30,
  rejected_quotes: 5,
  acceptance_rate: 75,
  average_response_time: 24,
};

/**
 * Mock quote message
 */
export const mockQuoteMessage = {
  id: '523e4567-e89b-12d3-a456-426614174000',
  uuid: '523e4567-e89b-12d3-a456-426614174000',
  quote_id: mockQuote.id,
  sender_id: mockVendorUser.id,
  sender_type: 'vendor' as const,
  message: 'Test message content',
  attachments: [],
  is_read: false,
  created_at: '2024-02-01T10:00:00Z',
  sender: {
    id: mockVendorUser.id,
    name: mockVendorUser.name,
    email: mockVendorUser.email,
  },
};

/**
 * Create a test query client with default options
 */
export const createTestQueryClient = () => {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: 0,
        staleTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {}, // Suppress error logs in tests
    },
  });
};

/**
 * Custom render function with all required providers
 */
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  initialRoute?: string;
  queryClient?: QueryClient;
  vendorAuthValue?: any;
}

export function renderWithProviders(
  ui: ReactElement,
  {
    initialRoute = '/',
    queryClient = createTestQueryClient(),
    vendorAuthValue,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  // Set initial route
  if (initialRoute !== '/') {
    window.history.pushState({}, 'Test page', initialRoute);
  }

  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <VendorAuthProvider value={vendorAuthValue}>
            {children}
          </VendorAuthProvider>
        </QueryClientProvider>
      </BrowserRouter>
    );
  }

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    queryClient,
  };
}

/**
 * Wait for loading states to complete
 */
export const waitForLoadingToFinish = async () => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(
    () => {
      const loadingElements = document.querySelectorAll('[data-testid*="loading"]');
      expect(loadingElements.length).toBe(0);
    },
    { timeout: 5000 }
  );
};

/**
 * Mock localStorage for vendor authentication
 */
export const mockVendorLocalStorage = () => {
  const storage: Record<string, string> = {
    vendor_token: mockVendorToken,
    vendor_user: JSON.stringify(mockVendorUser),
  };

  return {
    getItem: (key: string) => storage[key] || null,
    setItem: (key: string, value: string) => {
      storage[key] = value;
    },
    removeItem: (key: string) => {
      delete storage[key];
    },
    clear: () => {
      Object.keys(storage).forEach(key => delete storage[key]);
    },
  };
};

/**
 * Setup vendor authentication mock
 */
export const setupVendorAuthMock = () => {
  const mockStorage = mockVendorLocalStorage();
  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true,
  });
};

/**
 * Clear vendor authentication mock
 */
export const clearVendorAuthMock = () => {
  window.localStorage.clear();
};

/**
 * Mock API response helper
 */
export const mockApiResponse = <T,>(data: T, delay = 0) => {
  return new Promise<T>((resolve) => {
    setTimeout(() => resolve(data), delay);
  });
};

/**
 * Mock API error helper
 */
export const mockApiError = (message: string, status = 400, delay = 0) => {
  return new Promise((_, reject) => {
    setTimeout(() => {
      reject({
        response: {
          status,
          data: {
            message,
            errors: {},
          },
        },
      });
    }, delay);
  });
};

/**
 * Create mock quote with custom properties
 */
export const createMockQuote = (overrides: Partial<typeof mockQuote> = {}) => {
  return {
    ...mockQuote,
    ...overrides,
  };
};

/**
 * Create mock vendor user with custom properties
 */
export const createMockVendorUser = (overrides: Partial<typeof mockVendorUser> = {}) => {
  return {
    ...mockVendorUser,
    ...overrides,
  };
};

/**
 * Create mock quote message with custom properties
 */
export const createMockQuoteMessage = (overrides: Partial<typeof mockQuoteMessage> = {}) => {
  return {
    ...mockQuoteMessage,
    ...overrides,
  };
};

/**
 * Simulate form input change
 */
export const changeInput = async (input: HTMLElement, value: string) => {
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.change(input, { target: { value } });
};

/**
 * Simulate form submission
 */
export const submitForm = async (form: HTMLElement) => {
  const { fireEvent } = await import('@testing-library/react');
  fireEvent.submit(form);
};

/**
 * Wait for element to appear
 */
export const waitForElement = async (selector: string, timeout = 5000) => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(
    () => {
      const element = document.querySelector(selector);
      expect(element).toBeInTheDocument();
      return element;
    },
    { timeout }
  );
};

/**
 * Wait for element to disappear
 */
export const waitForElementToDisappear = async (selector: string, timeout = 5000) => {
  const { waitFor } = await import('@testing-library/react');
  await waitFor(
    () => {
      const element = document.querySelector(selector);
      expect(element).not.toBeInTheDocument();
    },
    { timeout }
  );
};

/**
 * Get all form errors
 */
export const getFormErrors = () => {
  return Array.from(document.querySelectorAll('[role="alert"]')).map(
    (el) => el.textContent
  );
};

/**
 * Check if form has errors
 */
export const hasFormErrors = () => {
  return document.querySelectorAll('[role="alert"]').length > 0;
};

/**
 * Mock window.matchMedia for responsive tests
 */
export const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => true,
    }),
  });
};

/**
 * Restore window.matchMedia
 */
export const restoreMatchMedia = () => {
  delete (window as any).matchMedia;
};

/**
 * Test data generators
 */
export const generators = {
  /**
   * Generate random UUID
   */
  uuid: () => {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  },

  /**
   * Generate random quote number
   */
  quoteNumber: () => {
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 9999) + 1;
    return `Q-${year}-${num.toString().padStart(4, '0')}`;
  },

  /**
   * Generate random order number
   */
  orderNumber: () => {
    const year = new Date().getFullYear();
    const num = Math.floor(Math.random() * 9999) + 1;
    return `ORD-${year}-${num.toString().padStart(4, '0')}`;
  },

  /**
   * Generate random email
   */
  email: () => {
    const random = Math.random().toString(36).substring(7);
    return `test-${random}@example.com`;
  },

  /**
   * Generate random phone number
   */
  phone: () => {
    const num = Math.floor(Math.random() * 9000000000) + 1000000000;
    return `+${num}`;
  },

  /**
   * Generate random company name
   */
  companyName: () => {
    const adjectives = ['Global', 'Premium', 'Elite', 'Advanced', 'Professional'];
    const nouns = ['Solutions', 'Industries', 'Manufacturing', 'Services', 'Group'];
    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    return `${adj} ${noun}`;
  },
};

/**
 * Export all utilities
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
