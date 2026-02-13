/**
 * VendorQuoteList Page Tests
 * 
 * Tests for the vendor quote list page.
 * 
 * Requirements: 4.3, 4.4, 4.5, 4.6, 4.7, 4.8, 4.9, 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7, 9.8
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import VendorQuoteList from '@/pages/vendor/VendorQuoteList';
import vendorApi from '@/services/api/vendorApi';
import type { VendorQuoteListResponse } from '@/types/vendor/portal';

// Mock the vendorApi
vi.mock('@/services/api/vendorApi', () => ({
  default: {
    getQuotes: vi.fn(),
  },
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('VendorQuoteList', () => {
  const mockQuotesResponse: VendorQuoteListResponse = {
    success: true,
    data: {
      quotes: [
        {
          id: '1',
          uuid: 'quote-1',
          tenant_id: 'tenant-1',
          order_id: 'order-1',
          vendor_id: 'vendor-1',
          quote_number: 'Q-2024-001',
          status: 'pending_response',
          created_at: '2024-01-15T10:00:00Z',
          updated_at: '2024-01-15T10:00:00Z',
          expires_at: '2024-02-15T10:00:00Z',
          unread_message_count: 2,
          order: {
            id: 'order-1',
            uuid: 'order-uuid-1',
            order_number: 'ORD-2024-001',
            customer_name: 'John Doe',
            total_amount: 100000,
            status: 'pending',
          },
        },
        {
          id: '2',
          uuid: 'quote-2',
          tenant_id: 'tenant-1',
          order_id: 'order-2',
          vendor_id: 'vendor-1',
          quote_number: 'Q-2024-002',
          status: 'accepted',
          created_at: '2024-01-14T10:00:00Z',
          updated_at: '2024-01-14T10:00:00Z',
          expires_at: '2024-02-14T10:00:00Z',
          unread_message_count: 0,
          order: {
            id: 'order-2',
            uuid: 'order-uuid-2',
            order_number: 'ORD-2024-002',
            customer_name: 'Jane Smith',
            total_amount: 150000,
            status: 'processing',
          },
        },
      ],
      pagination: {
        total: 2,
        per_page: 20,
        current_page: 1,
        last_page: 1,
        from: 1,
        to: 2,
      },
      statistics: {
        total_quotes: 2,
        pending_quotes: 1,
        accepted_quotes: 1,
        rejected_quotes: 0,
        countered_quotes: 0,
        expired_quotes: 0,
        draft_quotes: 0,
        acceptance_rate: 50,
        rejection_rate: 0,
        counter_rate: 0,
        average_response_time_hours: 24,
        median_response_time_hours: 24,
        fastest_response_time_hours: 12,
        slowest_response_time_hours: 36,
        quotes_this_week: 2,
        quotes_this_month: 2,
        quotes_expiring_soon: 0,
        total_quote_value: 250000,
        accepted_quote_value: 150000,
        average_quote_value: 125000,
      },
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vendorApi.getQuotes).mockResolvedValue(mockQuotesResponse);
  });

  it('should render page title and description', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Quotes')).toBeInTheDocument();
      expect(screen.getByText('Manage and respond to quote requests')).toBeInTheDocument();
    });
  });

  it('should fetch and display quotes on mount', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(vendorApi.getQuotes).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Q-2024-002')).toBeInTheDocument();
    });
  });

  it('should display loading skeletons initially', () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    // Should show skeleton loaders
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('should display search input', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search by quote number/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should display status filter dropdown', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should have Select components for filters
      const selects = document.querySelectorAll('[role="combobox"]');
      expect(selects.length).toBeGreaterThan(0);
    });
  });

  it('should display refresh button', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Refresh')).toBeInTheDocument();
    });
  });

  it('should display result count', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText(/Showing 2 of 2 quotes/i)).toBeInTheDocument();
    });
  });

  it('should navigate to quote detail when quote card is clicked', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      const quoteCard = screen.getByText('Q-2024-001');
      fireEvent.click(quoteCard.closest('.cursor-pointer')!);
    });

    expect(mockNavigate).toHaveBeenCalledWith('/vendor/quotes/quote-1');
  });

  it('should handle API error', async () => {
    vi.mocked(vendorApi.getQuotes).mockRejectedValue(new Error('Failed to load quotes'));

    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Error Loading Quotes')).toBeInTheDocument();
      expect(screen.getByText('Failed to load quotes')).toBeInTheDocument();
    });
  });

  it('should show empty state when no quotes', async () => {
    vi.mocked(vendorApi.getQuotes).mockResolvedValue({
      ...mockQuotesResponse,
      data: {
        ...mockQuotesResponse.data,
        quotes: [],
        pagination: {
          ...mockQuotesResponse.data.pagination,
          total: 0,
          from: 0,
          to: 0,
        },
      },
    });

    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('No quotes found')).toBeInTheDocument();
    });
  });

  it('should display pagination when multiple pages', async () => {
    vi.mocked(vendorApi.getQuotes).mockResolvedValue({
      ...mockQuotesResponse,
      data: {
        ...mockQuotesResponse.data,
        pagination: {
          ...mockQuotesResponse.data.pagination,
          total: 50,
          last_page: 3,
        },
      },
    });

    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      const previousButton = buttons.find(btn => btn.textContent === 'Previous');
      const nextButton = buttons.find(btn => btn.textContent === 'Next');
      
      expect(previousButton).toBeInTheDocument();
      expect(nextButton).toBeInTheDocument();
      
      // Check for pagination text using getAllByText
      const pageTexts = screen.getAllByText(/Page 1 of 3/i);
      expect(pageTexts.length).toBeGreaterThan(0);
    });
  });

  it('should not show pagination on single page', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      // With only 1 page (last_page: 1), pagination should not be rendered
      const buttons = screen.getAllByRole('button');
      const previousButton = buttons.find(btn => btn.textContent === 'Previous');
      
      // Pagination buttons should not exist when totalPages = 1
      expect(previousButton).toBeUndefined();
    });
  });

  it('should handle search input change', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/Search by quote number/i);
      fireEvent.change(searchInput, { target: { value: 'Q-2024-001' } });
    });

    // Should trigger new API call with search filter
    await waitFor(() => {
      expect(vendorApi.getQuotes).toHaveBeenCalledWith(
        expect.objectContaining({
          search: 'Q-2024-001',
        })
      );
    });
  });

  it('should display quote cards with correct information', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Check first quote
      expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
      expect(screen.getByText(/ORD-2024-001/)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/)).toBeInTheDocument();
      
      // Check second quote
      expect(screen.getByText('Q-2024-002')).toBeInTheDocument();
      expect(screen.getByText(/ORD-2024-002/)).toBeInTheDocument();
      expect(screen.getByText(/Jane Smith/)).toBeInTheDocument();
      
      // Check that quote cards are rendered
      const quoteCards = document.querySelectorAll('.cursor-pointer');
      expect(quoteCards.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('should display unread message count', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('2 new')).toBeInTheDocument();
    });
  });

  it('should call getQuotes with correct filters', async () => {
    render(
      <MemoryRouter>
        <VendorQuoteList />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(vendorApi.getQuotes).toHaveBeenCalledWith({
        page: 1,
        per_page: 20,
        sort: 'created_at',
        order: 'desc',
      });
    });
  });
});
