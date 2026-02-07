import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { QuoteDashboard } from '../QuoteDashboard';
import { quoteService } from '@/services/tenant/quoteService';

// Mock the quote service
vi.mock('@/services/tenant/quoteService', () => ({
  quoteService: {
    getQuotes: vi.fn(),
    getAvailableVendors: vi.fn(),
    sendQuote: vi.fn(),
    deleteQuote: vi.fn(),
    generatePDF: vi.fn(),
  },
}));

// Mock the toast hook
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockQuotes = [
  {
    id: '1',
    quote_number: 'Q-2024-001',
    order_id: 'order-1',
    customer_id: 'customer-1',
    vendor_id: 'vendor-1',
    title: 'Custom Etching Quote',
    description: 'Test quote',
    status: 'draft' as const,
    total_amount: 100000,
    tax_amount: 10000,
    grand_total: 110000,
    currency: 'IDR',
    valid_until: '2024-12-31',
    revision_number: 1,
    created_by: 'user-1',
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
    customer: {
      id: 'customer-1',
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
    },
    vendor: {
      id: 'vendor-1',
      name: 'Vendor One',
      email: 'vendor@example.com',
      company: 'Vendor Company',
    },
    items: [],
  },
  {
    id: '2',
    quote_number: 'Q-2024-002',
    order_id: 'order-2',
    customer_id: 'customer-2',
    vendor_id: 'vendor-2',
    title: 'Another Quote',
    description: 'Test quote 2',
    status: 'sent' as const,
    total_amount: 200000,
    tax_amount: 20000,
    grand_total: 220000,
    currency: 'IDR',
    valid_until: '2024-12-31',
    revision_number: 1,
    created_by: 'user-1',
    created_at: '2024-01-02T00:00:00Z',
    updated_at: '2024-01-02T00:00:00Z',
    customer: {
      id: 'customer-2',
      name: 'Jane Smith',
      email: 'jane@example.com',
      company: 'Tech Inc',
    },
    vendor: {
      id: 'vendor-2',
      name: 'Vendor Two',
      email: 'vendor2@example.com',
      company: 'Vendor Company 2',
    },
    items: [],
  },
];

const mockVendors = [
  { id: 'vendor-1', name: 'Vendor One', email: 'vendor@example.com', company: 'Vendor Company' },
  { id: 'vendor-2', name: 'Vendor Two', email: 'vendor2@example.com', company: 'Vendor Company 2' },
];

const renderWithProviders = (component: React.ReactElement) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('QuoteDashboard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock responses
    vi.mocked(quoteService.getQuotes).mockResolvedValue({
      data: mockQuotes,
      meta: {
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 2,
      },
    });

    vi.mocked(quoteService.getAvailableVendors).mockResolvedValue(mockVendors);
  });

  describe('Rendering', () => {
    it('should render the dashboard with header', async () => {
      renderWithProviders(<QuoteDashboard />);

      expect(screen.getByText('Quote Management')).toBeInTheDocument();
      expect(screen.getByText('Manage vendor quotes and pricing negotiations')).toBeInTheDocument();
    });

    it('should render without header when showHeader is false', async () => {
      renderWithProviders(<QuoteDashboard showHeader={false} />);

      expect(screen.queryByText('Quote Management')).not.toBeInTheDocument();
    });

    it('should render create button when showCreateButton is true', async () => {
      renderWithProviders(<QuoteDashboard showCreateButton={true} />);

      expect(screen.getByRole('link', { name: /new quote/i })).toBeInTheDocument();
    });

    it('should not render create button when showCreateButton is false', async () => {
      renderWithProviders(<QuoteDashboard showCreateButton={false} />);

      expect(screen.queryByRole('link', { name: /new quote/i })).not.toBeInTheDocument();
    });
  });

  describe('Data Loading', () => {
    it('should display loading state initially', () => {
      renderWithProviders(<QuoteDashboard />);

      // Check for loading skeleton
      const table = screen.getByRole('table');
      expect(table).toBeInTheDocument();
    });

    it('should display quotes after loading', async () => {
      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
        expect(screen.getByText('Q-2024-002')).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should display error message when loading fails', async () => {
      vi.mocked(quoteService.getQuotes).mockRejectedValue(new Error('Failed to load quotes'));

      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/failed to load quotes/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    it('should render filter components', async () => {
      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by quote/i)).toBeInTheDocument();
      });

      expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: /filter by vendor/i })).toBeInTheDocument();
    });

    it('should call API with search filter when user types', async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByPlaceholderText(/search by quote/i)).toBeInTheDocument();
      });

      const searchInput = screen.getByPlaceholderText(/search by quote/i);
      await user.type(searchInput, 'Q-2024-001');

      // Wait for debounce
      await waitFor(() => {
        expect(quoteService.getQuotes).toHaveBeenCalledWith(
          expect.objectContaining({
            search: 'Q-2024-001',
          })
        );
      }, { timeout: 1000 });
    });

    it('should call API with status filter when changed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByRole('combobox', { name: /filter by status/i })).toBeInTheDocument();
      });

      const statusSelect = screen.getByRole('combobox', { name: /filter by status/i });
      await user.click(statusSelect);

      const draftOption = await screen.findByRole('option', { name: /draft/i });
      await user.click(draftOption);

      await waitFor(() => {
        expect(quoteService.getQuotes).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'draft',
          })
        );
      });
    });
  });

  describe('Sorting', () => {
    it('should sort by quote number when header is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
      });

      const quoteNumberHeader = screen.getByText(/quote #/i).closest('th');
      expect(quoteNumberHeader).toBeInTheDocument();

      await user.click(quoteNumberHeader!);

      await waitFor(() => {
        expect(quoteService.getQuotes).toHaveBeenCalledWith(
          expect.objectContaining({
            sort_by: 'quote_number',
            sort_order: 'asc',
          })
        );
      });
    });

    it('should toggle sort order when clicking same header twice', async () => {
      const user = userEvent.setup();
      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
      });

      const createdHeader = screen.getByText(/created/i).closest('th');
      expect(createdHeader).toBeInTheDocument();

      // First click - should sort ascending
      await user.click(createdHeader!);

      await waitFor(() => {
        expect(quoteService.getQuotes).toHaveBeenCalledWith(
          expect.objectContaining({
            sort_by: 'created_at',
            sort_order: 'asc',
          })
        );
      });

      // Second click - should sort descending
      await user.click(createdHeader!);

      await waitFor(() => {
        expect(quoteService.getQuotes).toHaveBeenCalledWith(
          expect.objectContaining({
            sort_by: 'created_at',
            sort_order: 'desc',
          })
        );
      });
    });
  });

  describe('Pagination', () => {
    it('should not show pagination when only one page', async () => {
      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
      });

      expect(screen.queryByText(/previous/i)).not.toBeInTheDocument();
      expect(screen.queryByText(/next/i)).not.toBeInTheDocument();
    });

    it('should show pagination when multiple pages exist', async () => {
      vi.mocked(quoteService.getQuotes).mockResolvedValue({
        data: mockQuotes,
        meta: {
          current_page: 1,
          last_page: 3,
          per_page: 20,
          total: 60,
        },
      });

      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/showing 1 to 2 of 60 quotes/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/previous/i)).toBeInTheDocument();
      expect(screen.getByText(/next/i)).toBeInTheDocument();
    });

    it('should navigate to next page when next button is clicked', async () => {
      const user = userEvent.setup();
      
      vi.mocked(quoteService.getQuotes).mockResolvedValue({
        data: mockQuotes,
        meta: {
          current_page: 1,
          last_page: 3,
          per_page: 20,
          total: 60,
        },
      });

      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/next/i)).toBeInTheDocument();
      });

      const nextButton = screen.getByText(/next/i).closest('a');
      await user.click(nextButton!);

      await waitFor(() => {
        expect(quoteService.getQuotes).toHaveBeenCalledWith(
          expect.objectContaining({
            page: 2,
          })
        );
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no quotes exist', async () => {
      vi.mocked(quoteService.getQuotes).mockResolvedValue({
        data: [],
        meta: {
          current_page: 1,
          last_page: 1,
          per_page: 20,
          total: 0,
        },
      });

      renderWithProviders(<QuoteDashboard />);

      await waitFor(() => {
        expect(screen.getByText(/no quotes found/i)).toBeInTheDocument();
      });

      expect(screen.getByText(/try adjusting your filters or create a new quote/i)).toBeInTheDocument();
    });
  });
});
