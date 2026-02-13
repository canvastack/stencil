/**
 * VendorDashboard Component Tests
 * 
 * Tests for the vendor dashboard page component.
 * 
 * Requirements: 4.1, 4.2, 4.3, 4.10
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import userEvent from '@testing-library/user-event';
import VendorDashboard from '@/pages/vendor/VendorDashboard';
import * as vendorAuthContext from '@/contexts/VendorAuthContext';
import type { VendorQuoteListResponse, VendorProfile, VendorUser } from '@/types/vendor/portal';

// Mock vendor API
vi.mock('@/services/api/vendorApi', () => ({
  default: {
    getQuotes: vi.fn(),
  },
}));

// Import after mocking
import vendorApi from '@/services/api/vendorApi';

// Mock date-fns
vi.mock('date-fns', () => ({
  formatDistanceToNow: vi.fn(() => '2 hours ago'),
}));

// Mock vendor profile
const mockVendorProfile: VendorProfile = {
  id: 'vendor-1',
  uuid: 'vendor-uuid-1',
  tenant_id: 'tenant-1',
  company_name: 'Test Vendor Company',
  email: 'vendor@test.com',
  phone: '+1234567890',
  contact_person: 'John Doe',
  status: 'active',
  onboarding_status: 'completed',
  portal_access_enabled: true,
  is_verified: true,
  total_orders: 50,
  completed_orders: 45,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock vendor user
const mockVendorUser: VendorUser = {
  id: 'user-1',
  uuid: 'user-uuid-1',
  email: 'vendor@test.com',
  name: 'John Doe',
  account_type: 'vendor',
  vendor_id: 'vendor-1',
  status: 'active',
  is_email_verified: true,
  two_factor_enabled: false,
  failed_login_attempts: 0,
  created_at: '2024-01-01T00:00:00Z',
  updated_at: '2024-01-01T00:00:00Z',
};

// Mock quotes response
const mockQuotesResponse: VendorQuoteListResponse = {
  success: true,
  data: {
    quotes: [
      {
        id: 'quote-1',
        uuid: 'quote-uuid-1',
        tenant_id: 'tenant-1',
        order_id: 'order-1',
        vendor_id: 'vendor-1',
        quote_number: 'Q-2024-001',
        status: 'pending_response',
        created_at: '2024-01-15T10:00:00Z',
        updated_at: '2024-01-15T10:00:00Z',
        sent_at: '2024-01-15T10:00:00Z',
        expires_at: '2024-01-20T10:00:00Z',
        order: {
          id: 'order-1',
          uuid: 'order-uuid-1',
          order_number: 'ORD-2024-001',
          customer_name: 'Customer A',
          total_amount: 10000,
          status: 'pending',
        },
      },
      {
        id: 'quote-2',
        uuid: 'quote-uuid-2',
        tenant_id: 'tenant-1',
        order_id: 'order-2',
        vendor_id: 'vendor-1',
        quote_number: 'Q-2024-002',
        status: 'accepted',
        created_at: '2024-01-14T10:00:00Z',
        updated_at: '2024-01-14T12:00:00Z',
        sent_at: '2024-01-14T10:00:00Z',
        responded_at: '2024-01-14T12:00:00Z',
        order: {
          id: 'order-2',
          uuid: 'order-uuid-2',
          order_number: 'ORD-2024-002',
          customer_name: 'Customer B',
          total_amount: 15000,
          status: 'processing',
        },
      },
      {
        id: 'quote-3',
        uuid: 'quote-uuid-3',
        tenant_id: 'tenant-1',
        order_id: 'order-3',
        vendor_id: 'vendor-1',
        quote_number: 'Q-2024-003',
        status: 'rejected',
        created_at: '2024-01-13T10:00:00Z',
        updated_at: '2024-01-13T11:00:00Z',
        sent_at: '2024-01-13T10:00:00Z',
        responded_at: '2024-01-13T11:00:00Z',
        rejection_reason: 'Cannot meet specifications',
        order: {
          id: 'order-3',
          uuid: 'order-uuid-3',
          order_number: 'ORD-2024-003',
          customer_name: 'Customer C',
          total_amount: 8000,
          status: 'cancelled',
        },
      },
    ],
    pagination: {
      total: 3,
      per_page: 5,
      current_page: 1,
      last_page: 1,
      from: 1,
      to: 3,
    },
    statistics: {
      total_quotes: 25,
      pending_quotes: 5,
      accepted_quotes: 15,
      rejected_quotes: 3,
      countered_quotes: 1,
      expired_quotes: 1,
      draft_quotes: 0,
      acceptance_rate: 60.0,
      rejection_rate: 12.0,
      counter_rate: 4.0,
      average_response_time_hours: 4.5,
      median_response_time_hours: 3.0,
      fastest_response_time_hours: 1.0,
      slowest_response_time_hours: 24.0,
      quotes_this_week: 3,
      quotes_this_month: 12,
      quotes_expiring_soon: 2,
      total_quote_value: 250000,
      accepted_quote_value: 150000,
      average_quote_value: 10000,
    },
  },
};

// Helper to render component with providers
const renderComponent = (authOverrides = {}) => {
  const defaultAuthContext = {
    vendor: mockVendorProfile,
    user: mockVendorUser,
    isAuthenticated: true,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    requestPasswordReset: vi.fn(),
    resetPassword: vi.fn(),
    refreshProfile: vi.fn(),
    clearError: vi.fn(),
  };

  vi.spyOn(vendorAuthContext, 'useVendorAuth').mockReturnValue({
    ...defaultAuthContext,
    ...authOverrides,
  });

  return render(
    <MemoryRouter initialEntries={['/vendor/dashboard']}>
      <VendorDashboard />
    </MemoryRouter>
  );
};

describe('VendorDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses - resolve immediately
    vi.mocked(vendorApi.getQuotes).mockResolvedValue(mockQuotesResponse);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Requirement 4.1: Display welcome message with vendor name', () => {
    it('should display welcome message with vendor company name', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Welcome back, Test Vendor Company!/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display overview description', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Here's an overview of your quotes and performance/i)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Requirement 4.2: Show statistics cards', () => {
    it('should display total quotes statistic', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Total Quotes')).toBeInTheDocument();
        expect(screen.getByText('25')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display pending quotes statistic', async () => {
      renderComponent();

      await waitFor(() => {
        // Use getAllByText since "Pending Response" appears in both card and badge
        const pendingTexts = screen.getAllByText('Pending Response');
        expect(pendingTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('5')).toBeInTheDocument();
        expect(screen.getByText('Awaiting your response')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display accepted quotes statistic', async () => {
      renderComponent();

      await waitFor(() => {
        // Use getAllByText since "Accepted" appears in both card and badge
        const acceptedTexts = screen.getAllByText('Accepted');
        expect(acceptedTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('15')).toBeInTheDocument();
        expect(screen.getByText('60.0% acceptance rate')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display rejected quotes statistic', async () => {
      renderComponent();

      await waitFor(() => {
        // Use getAllByText since "Rejected" appears in both card and badge
        const rejectedTexts = screen.getAllByText('Rejected');
        expect(rejectedTexts.length).toBeGreaterThan(0);
        expect(screen.getByText('3')).toBeInTheDocument();
        expect(screen.getByText('12.0% rejection rate')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display performance metrics', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Performance Metrics')).toBeInTheDocument();
        expect(screen.getByText('Average Response Time')).toBeInTheDocument();
        expect(screen.getByText('4.5h')).toBeInTheDocument();
        expect(screen.getByText('Acceptance Rate')).toBeInTheDocument();
        expect(screen.getByText('60.0%')).toBeInTheDocument();
        expect(screen.getByText('Quotes This Month')).toBeInTheDocument();
        expect(screen.getByText('12')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Requirement 4.3: Display recent quotes list', () => {
    it('should display recent quotes section', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Recent Quotes')).toBeInTheDocument();
        expect(screen.getByText('Your most recent quote requests')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display quote numbers', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
        expect(screen.getByText('Q-2024-002')).toBeInTheDocument();
        expect(screen.getByText('Q-2024-003')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display quote statuses with badges', async () => {
      renderComponent();

      await waitFor(() => {
        // Use getAllByText since statuses appear multiple times
        const pendingBadges = screen.getAllByText('Pending Response');
        const acceptedBadges = screen.getAllByText('Accepted');
        const rejectedBadges = screen.getAllByText('Rejected');
        
        expect(pendingBadges.length).toBeGreaterThan(0);
        expect(acceptedBadges.length).toBeGreaterThan(0);
        expect(rejectedBadges.length).toBeGreaterThan(0);
      }, { timeout: 3000 });
    });

    it('should display order numbers and customer names', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Order: ORD-2024-001/)).toBeInTheDocument();
        expect(screen.getByText(/Customer: Customer A/)).toBeInTheDocument();
        expect(screen.getByText(/Order: ORD-2024-002/)).toBeInTheDocument();
        expect(screen.getByText(/Customer: Customer B/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should display empty state when no quotes', async () => {
      vi.mocked(vendorApi.getQuotes).mockResolvedValue({
        success: true,
        data: {
          quotes: [],
          pagination: {
            total: 0,
            per_page: 5,
            current_page: 1,
            last_page: 1,
            from: 0,
            to: 0,
          },
          statistics: {
            ...mockQuotesResponse.data.statistics,
            total_quotes: 0,
          },
        },
      });

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('No quotes yet')).toBeInTheDocument();
        expect(screen.getByText('New quotes will appear here')).toBeInTheDocument();
      }, { timeout: 3000 });
    });

    it('should have View All button that navigates to quotes page', async () => {
      renderComponent();

      await waitFor(() => {
        const viewAllButton = screen.getByRole('button', { name: /View All/i });
        expect(viewAllButton).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Requirement 4.10: Auto-refresh every 30 seconds', () => {
    it('should fetch data on initial load', async () => {
      renderComponent();

      await waitFor(() => {
        expect(vendorApi.getQuotes).toHaveBeenCalledTimes(1);
        expect(vendorApi.getQuotes).toHaveBeenCalledWith({
          page: 1,
          per_page: 5,
          sort: 'created_at',
          order: 'desc',
        });
      }, { timeout: 3000 });
    });

    it('should have manual refresh button', async () => {
      const user = userEvent.setup({ delay: null });
      renderComponent();

      await waitFor(() => {
        expect(vendorApi.getQuotes).toHaveBeenCalledTimes(1);
      }, { timeout: 3000 });

      const refreshButton = screen.getByRole('button', { name: /Refresh/i });
      expect(refreshButton).toBeInTheDocument();

      await user.click(refreshButton);

      await waitFor(() => {
        expect(vendorApi.getQuotes).toHaveBeenCalledTimes(2);
      }, { timeout: 3000 });
    });

    it('should display last refresh timestamp', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/Last updated:/)).toBeInTheDocument();
        expect(screen.getByText(/Auto-refreshes every 30 seconds/)).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Error Handling', () => {
    it('should display error message when API fails', async () => {
      vi.mocked(vendorApi.getQuotes).mockRejectedValue(new Error('Network error'));

      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Error Loading Dashboard')).toBeInTheDocument();
        expect(screen.getByText('Network error')).toBeInTheDocument();
      }, { timeout: 3000 });
    });
  });

  describe('Loading State', () => {
    it('should display loading skeletons initially', () => {
      renderComponent();

      // Should show skeleton loaders
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBeGreaterThan(0);
    });

    it('should hide loading state after data loads', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText('Welcome back, Test Vendor Company!')).toBeInTheDocument();
      }, { timeout: 3000 });

      // Skeletons should be gone
      const skeletons = document.querySelectorAll('[class*="animate-pulse"]');
      expect(skeletons.length).toBe(0);
    });
  });
});
