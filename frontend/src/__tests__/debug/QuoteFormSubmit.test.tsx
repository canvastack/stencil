import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuoteForm } from '@/components/tenant/quotes/QuoteForm';
import { TooltipProvider } from '@/components/ui/tooltip';
import * as tenantApiClient from '@/services/tenant/tenantApiClient';

// Mock the API client
vi.mock('@/services/tenant/tenantApiClient', () => ({
  tenantApiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}));

// Mock the orders service
vi.mock('@/services/api/orders', () => ({
  ordersService: {
    getOrderById: vi.fn(),
  },
}));

// Mock the exchange rate service
vi.mock('@/services/api/exchangeRate', () => ({
  exchangeRateService: {
    getSettings: vi.fn().mockResolvedValue({
      mode: 'manual',
      manual_rate: 15000,
    }),
    getHistory: vi.fn().mockResolvedValue({
      data: [{ rate: 15000 }],
    }),
  },
}));

describe('QuoteForm Submit Handler Debug', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock API responses for initial data loading
    (tenantApiClient.tenantApiClient.get as any).mockImplementation((url: string) => {
      if (url.includes('/customers')) {
        return Promise.resolve({
          data: [
            { uuid: 'customer-1', name: 'Test Customer', company_name: 'Test Co' }
          ]
        });
      }
      if (url.includes('/vendors')) {
        return Promise.resolve({
          data: [
            { uuid: 'vendor-1', name: 'Test Vendor', company_name: 'Vendor Co' }
          ]
        });
      }
      if (url.includes('/products')) {
        return Promise.resolve({
          data: [
            { uuid: 'product-1', name: 'Test Product', sku: 'TEST-001', unit: 'pcs' }
          ]
        });
      }
      return Promise.resolve({ data: [] });
    });
  });

  it('should trigger handleSubmit when submit button is clicked', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    
    render(
      <BrowserRouter>
        <TooltipProvider>
          <QuoteForm
            mode="create"
            onSubmit={mockOnSubmit}
            loading={false}
          />
        </TooltipProvider>
      </BrowserRouter>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Fill in required fields
    const titleInput = screen.getByLabelText(/title/i);
    fireEvent.change(titleInput, { target: { value: 'Test Quote' } });

    // Find and click the submit button
    const submitButton = screen.getByRole('button', { name: /save quote/i });
    
    console.log('Submit button found:', submitButton);
    console.log('Submit button disabled:', submitButton.hasAttribute('disabled'));
    console.log('Submit button type:', submitButton.getAttribute('type'));
    
    // Click the submit button
    fireEvent.click(submitButton);

    // Wait for submission
    await waitFor(() => {
      console.log('mockOnSubmit called:', mockOnSubmit.mock.calls.length);
      expect(mockOnSubmit).toHaveBeenCalled();
    }, { timeout: 5000 });
  });

  it('should log form state when submit is attempted', async () => {
    const mockOnSubmit = vi.fn().mockResolvedValue(undefined);
    const consoleSpy = vi.spyOn(console, 'log');
    
    render(
      <BrowserRouter>
        <TooltipProvider>
          <QuoteForm
            mode="create"
            onSubmit={mockOnSubmit}
            loading={false}
          />
        </TooltipProvider>
      </BrowserRouter>
    );

    // Wait for initial data to load
    await waitFor(() => {
      expect(screen.queryByText(/loading/i)).not.toBeInTheDocument();
    }, { timeout: 3000 });

    // Find the submit button
    const submitButton = screen.getByRole('button', { name: /save quote/i });
    
    // Click the submit button
    fireEvent.click(submitButton);

    // Check if handleSubmit was called (should see console.log from the component)
    await waitFor(() => {
      const handleSubmitLogs = consoleSpy.mock.calls.filter(call => 
        call[0]?.includes?.('handleSubmit called')
      );
      console.log('handleSubmit logs found:', handleSubmitLogs.length);
      expect(handleSubmitLogs.length).toBeGreaterThan(0);
    }, { timeout: 5000 });
  });
});
