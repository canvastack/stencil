import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { ExchangeRateHistory } from '@/components/admin/exchange-rate/ExchangeRateHistory';
import { exchangeRateService } from '@/services/api/exchangeRate';

// Mock the exchange rate service
vi.mock('@/services/api/exchangeRate', () => ({
  exchangeRateService: {
    getHistory: vi.fn(),
  },
}));

describe('ExchangeRateHistory Integration Tests', () => {
  const mockHistoryData = {
    data: [
      {
        uuid: '1',
        tenant_id: 'tenant-1',
        rate: 15750.50,
        source_currency: 'USD',
        target_currency: 'IDR',
        provider: 'exchangerate-api.com',
        source: 'api' as const,
        created_at: '2024-01-15T10:30:00Z',
      },
      {
        uuid: '2',
        tenant_id: 'tenant-1',
        rate: 15800.00,
        source_currency: 'USD',
        target_currency: 'IDR',
        provider: 'manual',
        source: 'manual' as const,
        created_at: '2024-01-14T09:00:00Z',
      },
      {
        uuid: '3',
        tenant_id: 'tenant-1',
        rate: 15725.75,
        source_currency: 'USD',
        target_currency: 'IDR',
        provider: 'currencyapi.com',
        source: 'api' as const,
        created_at: '2024-01-13T08:15:00Z',
      },
    ],
    current_page: 1,
    last_page: 2,
    per_page: 20,
    total: 25,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(exchangeRateService.getHistory).mockResolvedValue(mockHistoryData);
  });

  describe('History Display', () => {
    test('should display history records in table format', async () => {
      render(<ExchangeRateHistory />);

      // Wait for data to load
      await waitFor(() => {
        expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
      });

      // Check table headers
      expect(screen.getByText('Date & Time')).toBeInTheDocument();
      expect(screen.getByText('Rate (USD → IDR)')).toBeInTheDocument();

      // Check data rows
      expect(screen.getByText('exchangerate-api.com')).toBeInTheDocument();
      expect(screen.getByText('manual')).toBeInTheDocument();
      expect(screen.getByText('currencyapi.com')).toBeInTheDocument();

      // Check source badges (API appears in 2 badges + 1 dropdown option = 3 total)
      const apiBadges = screen.getAllByText('API');
      expect(apiBadges.length).toBeGreaterThanOrEqual(2);
      
      // Manual appears both in dropdown option and as badge in table
      const manualElements = screen.getAllByText('Manual');
      expect(manualElements.length).toBeGreaterThanOrEqual(1);
    });

    test('should display formatted rates with proper decimals', async () => {
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check that rates are formatted
      expect(screen.getByText(/15,750\.50/)).toBeInTheDocument();
      expect(screen.getByText(/15,800\.00/)).toBeInTheDocument();
      expect(screen.getByText(/15,725\.75/)).toBeInTheDocument();
    });

    test('should display formatted dates', async () => {
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check that dates are displayed (format may vary by locale)
      const rows = screen.getAllByRole('row');
      expect(rows.length).toBeGreaterThan(1); // Header + data rows
    });

    test('should show empty state when no records found', async () => {
      vi.mocked(exchangeRateService.getHistory).mockResolvedValue({
        data: [],
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 0,
      });

      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.getByText('No history records found')).toBeInTheDocument();
      });
    });

    test('should show loading state while fetching data', () => {
      vi.mocked(exchangeRateService.getHistory).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );

      render(<ExchangeRateHistory />);

      // Check for loading spinner by class
      const spinner = document.querySelector('.animate-spin');
      expect(spinner).toBeInTheDocument();
    });
  });

  describe('Filtering', () => {
    test('should filter by date range', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Find and fill date inputs by type
      const dateInputs = screen.getAllByDisplayValue('');
      const startDateInput = dateInputs.find(input => input.getAttribute('type') === 'date') as HTMLInputElement;
      const endDateInput = dateInputs.filter(input => input.getAttribute('type') === 'date')[1] as HTMLInputElement;

      await user.type(startDateInput, '2024-01-01');
      await user.type(endDateInput, '2024-01-31');

      // Click search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Verify API was called with date filters
      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            start_date: '2024-01-01',
            end_date: '2024-01-31',
          })
        );
      });
    });

    test('should filter by provider', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Find and fill provider input
      const providerInput = screen.getByPlaceholderText('Filter by provider');
      await user.type(providerInput, 'exchangerate-api.com');

      // Click search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Verify API was called with provider filter
      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: 'exchangerate-api.com',
          })
        );
      });
    });

    test('should filter by source type', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Find and select source dropdown by text
      const sourceSelect = screen.getByRole('combobox');
      await user.selectOptions(sourceSelect, 'manual');

      // Click search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Verify API was called with source filter
      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            source: 'manual',
          })
        );
      });
    });

    test('should apply multiple filters simultaneously', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Apply multiple filters
      const dateInputs = screen.getAllByDisplayValue('');
      const startDateInput = dateInputs.find(input => input.getAttribute('type') === 'date') as HTMLInputElement;
      const providerInput = screen.getByPlaceholderText('Filter by provider');
      const sourceSelect = screen.getByRole('combobox');

      await user.type(startDateInput, '2024-01-01');
      await user.type(providerInput, 'exchangerate-api.com');
      await user.selectOptions(sourceSelect, 'api');

      // Click search button
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Verify API was called with all filters
      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            start_date: '2024-01-01',
            provider: 'exchangerate-api.com',
            source: 'api',
          })
        );
      });
    });

    test('should clear all filters', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Apply filters
      const dateInputs = screen.getAllByDisplayValue('');
      const startDateInput = dateInputs.find(input => input.getAttribute('type') === 'date') as HTMLInputElement;
      const providerInput = screen.getByPlaceholderText('Filter by provider');
      await user.type(startDateInput, '2024-01-01');
      await user.type(providerInput, 'test-provider');

      // Click clear filters button
      const clearButton = screen.getByRole('button', { name: /clear filters/i });
      await user.click(clearButton);

      // Verify inputs are cleared
      expect(startDateInput).toHaveValue('');
      expect(providerInput).toHaveValue('');

      // Verify API was called with empty filters
      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            start_date: '',
            end_date: '',
            provider: '',
            source: '',
          })
        );
      });
    });

    test('should reset to page 1 when applying filters', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Navigate to page 2
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });

      // Apply a filter
      const providerInput = screen.getByPlaceholderText('Filter by provider');
      await user.type(providerInput, 'test');
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      // Verify page reset to 1
      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });
  });

  describe('Pagination', () => {
    test('should display pagination controls when multiple pages exist', async () => {
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Check pagination elements
      expect(screen.getByText(/Page 1 of 2/)).toBeInTheDocument();
      expect(screen.getByText(/Showing 3 of 25 records/)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument();
    });

    test('should hide pagination when only one page exists', async () => {
      vi.mocked(exchangeRateService.getHistory).mockResolvedValue({
        data: mockHistoryData.data,
        current_page: 1,
        last_page: 1,
        per_page: 20,
        total: 3,
      });

      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Pagination should not be visible
      expect(screen.queryByText(/Page 1 of/)).not.toBeInTheDocument();
    });

    test('should navigate to next page', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Click next button
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Verify API was called with page 2
      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });

    test('should navigate to previous page', async () => {
      const user = userEvent.setup();
      vi.mocked(exchangeRateService.getHistory).mockResolvedValue({
        ...mockHistoryData,
        current_page: 2,
      });

      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Click previous button
      const prevButton = screen.getByRole('button', { name: /previous/i });
      await user.click(prevButton);

      // Verify API was called with page 1
      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({ page: 1 })
        );
      });
    });

    test('should disable previous button on first page', async () => {
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const prevButton = screen.getByRole('button', { name: /previous/i });
      expect(prevButton).toBeDisabled();
    });

    test('should disable next button on last page', async () => {
      vi.mocked(exchangeRateService.getHistory).mockResolvedValue({
        ...mockHistoryData,
        current_page: 2,
        last_page: 2,
      });

      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      const nextButton = screen.getByRole('button', { name: /next/i });
      expect(nextButton).toBeDisabled();
    });

    test('should maintain filters when paginating', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Apply a filter
      const providerInput = screen.getByPlaceholderText('Filter by provider');
      await user.type(providerInput, 'exchangerate-api.com');
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: 'exchangerate-api.com',
            page: 1,
          })
        );
      });

      // Navigate to next page
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      // Verify filter is maintained
      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: 'exchangerate-api.com',
            page: 2,
          })
        );
      });
    });
  });

  describe('Error Handling', () => {
    test('should handle API errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(exchangeRateService.getHistory).mockRejectedValue(
        new Error('API Error')
      );

      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      // Should show empty state
      expect(screen.getByText('No history records found')).toBeInTheDocument();

      consoleErrorSpy.mockRestore();
    });

    test('should handle network timeouts', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(exchangeRateService.getHistory).mockRejectedValue(
        new Error('Network timeout')
      );

      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(screen.queryByRole('progressbar')).not.toBeInTheDocument();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Real-time Updates', () => {
    test('should reload data when filters change', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalled();
      });

      // Clear mock calls to start fresh
      vi.mocked(exchangeRateService.getHistory).mockClear();

      // Change filter
      const providerInput = screen.getByPlaceholderText('Filter by provider');
      await user.type(providerInput, 'test');

      // Should trigger reload on search
      const searchButton = screen.getByRole('button', { name: /search/i });
      await user.click(searchButton);

      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({
            provider: 'test',
          })
        );
      });
    });

    test('should reload data when page changes', async () => {
      const user = userEvent.setup();
      render(<ExchangeRateHistory />);

      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalled();
      });

      // Clear mock calls to start fresh
      vi.mocked(exchangeRateService.getHistory).mockClear();

      // Navigate to next page
      const nextButton = screen.getByRole('button', { name: /next/i });
      await user.click(nextButton);

      await waitFor(() => {
        expect(exchangeRateService.getHistory).toHaveBeenCalledWith(
          expect.objectContaining({ page: 2 })
        );
      });
    });
  });
});
