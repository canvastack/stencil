import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { CustomerDashboard } from '../CustomerDashboard';
import * as useCustomerAuthModule from '@/contexts/CustomerAuthContext';
import * as customerPortalApiModule from '@/services/api/customerPortalApi';

// Mock the hooks and API
vi.mock('@/contexts/CustomerAuthContext');
vi.mock('@/services/api/customerPortalApi');

const mockUseCustomerAuth = vi.mocked(useCustomerAuthModule.useCustomerAuth);
const mockCustomerPortalApi = vi.mocked(customerPortalApiModule.customerPortalApi);

describe('CustomerDashboard', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
    vi.clearAllMocks();
  });

  const renderDashboard = () => {
    return render(
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <CustomerDashboard />
        </BrowserRouter>
      </QueryClientProvider>
    );
  };

  it('should show login prompt when not authenticated', () => {
    mockUseCustomerAuth.mockReturnValue({
      isAuthenticated: false,
      customer: null,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      isRegistering: false,
    });

    renderDashboard();

    expect(screen.getByText('Authentication Required')).toBeInTheDocument();
    expect(screen.getByText('Please login to access your dashboard')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /login to dashboard/i })).toBeInTheDocument();
  });

  it('should show loading state while fetching data', () => {
    mockUseCustomerAuth.mockReturnValue({
      isAuthenticated: true,
      customer: {
        uuid: 'customer-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        account_type: 'registered',
        email_verified: true,
      },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      isRegistering: false,
    });

    // Mock API to never resolve (simulating loading)
    mockCustomerPortalApi.getMyQuotes.mockReturnValue(
      new Promise(() => {}) as any
    );

    renderDashboard();

    // Check for loading spinner by class name instead of role
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display dashboard with customer data when authenticated', async () => {
    const mockCustomer = {
      uuid: 'customer-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      account_type: 'registered',
      email_verified: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    const mockQuotes = {
      data: [
        {
          uuid: 'quote-1',
          quote_number: 'CQ-2024-0001',
          title: 'Test Quote 1',
          status: 'sent',
          pricing: {
            grand_total: 100000,
            currency: 'IDR',
          },
          terms: {
            valid_until: '2024-12-31T23:59:59Z',
          },
          sent_at: '2024-01-15T10:00:00Z',
        },
        {
          uuid: 'quote-2',
          quote_number: 'CQ-2024-0002',
          title: 'Test Quote 2',
          status: 'accepted',
          pricing: {
            grand_total: 200000,
            currency: 'IDR',
          },
          terms: {
            valid_until: '2024-12-31T23:59:59Z',
          },
          sent_at: '2024-01-20T10:00:00Z',
        },
      ],
    };

    mockUseCustomerAuth.mockReturnValue({
      isAuthenticated: true,
      customer: mockCustomer,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      isRegistering: false,
    });

    mockCustomerPortalApi.getMyQuotes.mockResolvedValue(mockQuotes as any);

    renderDashboard();

    // Wait for data to load
    await waitFor(() => {
      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument();
    });

    // Check stats cards
    expect(screen.getByText('Pending Quotes')).toBeInTheDocument();
    expect(screen.getByText('Accepted')).toBeInTheDocument();
    expect(screen.getByText('Total Quotes')).toBeInTheDocument();
    expect(screen.getByText('Account Status')).toBeInTheDocument();

    // Check tabs are present
    expect(screen.getByRole('tab', { name: /pending quotes/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /accepted/i })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: /all quotes/i })).toBeInTheDocument();
  });

  it('should display empty state when no quotes exist', async () => {
    mockUseCustomerAuth.mockReturnValue({
      isAuthenticated: true,
      customer: {
        uuid: 'customer-123',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
        account_type: 'registered',
        email_verified: true,
      },
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      isRegistering: false,
    });

    mockCustomerPortalApi.getMyQuotes.mockResolvedValue({ data: [] } as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument();
    });

    // Should show empty state
    expect(screen.getByText('No pending quotes')).toBeInTheDocument();
  });

  it('should display profile information in profile tab', async () => {
    const mockCustomer = {
      uuid: 'customer-123',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      account_type: 'registered',
      email_verified: true,
      created_at: '2024-01-01T00:00:00Z',
    };

    mockUseCustomerAuth.mockReturnValue({
      isAuthenticated: true,
      customer: mockCustomer,
      login: vi.fn(),
      register: vi.fn(),
      logout: vi.fn(),
      isLoggingIn: false,
      isRegistering: false,
    });

    mockCustomerPortalApi.getMyQuotes.mockResolvedValue({ data: [] } as any);

    renderDashboard();

    await waitFor(() => {
      expect(screen.getByText(/Welcome back, John Doe!/i)).toBeInTheDocument();
    });

    // Check that profile tab exists
    const profileTab = screen.getByRole('tab', { name: /profile/i });
    expect(profileTab).toBeInTheDocument();

    // Check that customer name is visible in welcome message
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
    
    // Check that account status card shows registered
    expect(screen.getByText(/registered/i)).toBeInTheDocument();
  });
});
