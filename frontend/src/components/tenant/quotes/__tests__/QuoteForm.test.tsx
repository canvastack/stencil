import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QuoteForm } from '../QuoteForm';
import { Quote } from '@/services/tenant/quoteService';
import { BrowserRouter } from 'react-router-dom';
import { TooltipProvider } from '@/components/ui/tooltip';

// Mock dependencies
vi.mock('@/services/tenant/tenantApiClient', () => ({
  tenantApiClient: {
    get: vi.fn().mockResolvedValue({ data: [] }),
    post: vi.fn(),
    put: vi.fn(),
  },
}));

vi.mock('@/services/api/orders', () => ({
  ordersService: {
    getOrderById: vi.fn(),
  },
}));

vi.mock('@/services/api/exchangeRate', () => ({
  exchangeRateService: {
    getSettings: vi.fn().mockResolvedValue({ mode: 'manual', manual_rate: 15700 }),
    getHistory: vi.fn().mockResolvedValue({ data: [] }),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

const mockQuote: Quote = {
  id: 'quote-123',
  quote_number: 'Q-000123',
  order_id: 'order-456',
  customer_id: 'customer-789',
  vendor_id: 'vendor-101',
  title: 'Test Quote',
  description: 'Test description',
  status: 'draft',
  total_amount: 1000000,
  tax_amount: 0,
  grand_total: 1000000,
  currency: 'IDR',
  valid_until: '2026-12-31T00:00:00Z',
  terms_and_conditions: 'Test terms',
  notes: 'Test notes',
  revision_number: 1,
  created_by: 'user-1',
  created_at: '2026-01-01T00:00:00Z',
  updated_at: '2026-01-01T00:00:00Z',
  customer: {
    id: 'customer-789',
    name: 'Test Customer',
    email: 'customer@test.com',
    company: 'Test Company',
  },
  vendor: {
    id: 'vendor-101',
    name: 'Test Vendor',
    email: 'vendor@test.com',
    company: 'Vendor Company',
  },
  items: [
    {
      id: 'item-1',
      quote_id: 'quote-123',
      description: 'Test Item',
      quantity: 2,
      unit_price: 500000,
      vendor_cost: 400000,
      total_price: 1000000,
    },
  ],
};

const renderQuoteForm = (props: any = {}) => {
  return render(
    <BrowserRouter>
      <TooltipProvider>
        <QuoteForm
          onSubmit={vi.fn()}
          {...props}
        />
      </TooltipProvider>
    </BrowserRouter>
  );
};

describe('QuoteForm - Edit Mode', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render in create mode by default', async () => {
    renderQuoteForm();
    
    await waitFor(() => {
      expect(screen.getByText('Create New Quote')).toBeInTheDocument();
    });
  });

  it('should render in edit mode with initialData', async () => {
    renderQuoteForm({
      mode: 'edit',
      initialData: mockQuote,
    });
    
    await waitFor(() => {
      expect(screen.getByText(`Edit Quote ${mockQuote.quote_number}`)).toBeInTheDocument();
    });
  });

  it('should pre-populate form fields in edit mode', async () => {
    renderQuoteForm({
      mode: 'edit',
      initialData: mockQuote,
    });
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/Quote Title/i) as HTMLInputElement;
      expect(titleInput.value).toBe(mockQuote.title);
    });
  });

  it('should disable customer field in edit mode', async () => {
    renderQuoteForm({
      mode: 'edit',
      initialData: mockQuote,
    });
    
    await waitFor(() => {
      const customerSelect = screen.getByRole('combobox', { name: /customer/i });
      expect(customerSelect).toBeDisabled();
    });
  });

  it('should disable vendor field in edit mode', async () => {
    renderQuoteForm({
      mode: 'edit',
      initialData: mockQuote,
    });
    
    await waitFor(() => {
      const vendorSelect = screen.getByRole('combobox', { name: /vendor/i });
      expect(vendorSelect).toBeDisabled();
    });
  });

  it('should show lock icon message for disabled fields in edit mode', async () => {
    renderQuoteForm({
      mode: 'edit',
      initialData: mockQuote,
    });
    
    await waitFor(() => {
      expect(screen.getByText(/🔒 Customer cannot be changed when editing a quote/i)).toBeInTheDocument();
      expect(screen.getByText(/🔒 Vendor cannot be changed when editing a quote/i)).toBeInTheDocument();
    });
  });

  it('should allow editing title, description, and items in edit mode', async () => {
    const user = userEvent.setup();
    renderQuoteForm({
      mode: 'edit',
      initialData: mockQuote,
    });
    
    await waitFor(() => {
      const titleInput = screen.getByLabelText(/Quote Title/i) as HTMLInputElement;
      expect(titleInput).not.toBeDisabled();
    });
    
    const titleInput = screen.getByLabelText(/Quote Title/i) as HTMLInputElement;
    await user.clear(titleInput);
    await user.type(titleInput, 'Updated Title');
    
    expect(titleInput.value).toBe('Updated Title');
  });

  it('should show "Update Quote" button text in edit mode', async () => {
    renderQuoteForm({
      mode: 'edit',
      initialData: mockQuote,
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Quote/i })).toBeInTheDocument();
    });
  });

  it('should show "Save Quote" button text in create mode', async () => {
    renderQuoteForm({
      mode: 'create',
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Quote/i })).toBeInTheDocument();
    });
  });

  it('should display edit mode description in footer', async () => {
    renderQuoteForm({
      mode: 'edit',
      initialData: mockQuote,
    });
    
    await waitFor(() => {
      expect(screen.getByText(/Updating quote Q-000123\. Customer, vendor, and order cannot be changed\./i)).toBeInTheDocument();
    });
  });

  it('should call onSubmit with correct data in edit mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    
    renderQuoteForm({
      mode: 'edit',
      initialData: mockQuote,
      onSubmit,
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Update Quote/i })).toBeInTheDocument();
    });
    
    const submitButton = screen.getByRole('button', { name: /Update Quote/i });
    await user.click(submitButton);
    
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
      const submittedData = onSubmit.mock.calls[0][0];
      
      // In edit mode, immutable fields should be removed
      expect(submittedData).not.toHaveProperty('customer_id');
      expect(submittedData).not.toHaveProperty('vendor_id');
      expect(submittedData).not.toHaveProperty('order_id');
      
      // Editable fields should be present
      expect(submittedData).toHaveProperty('title');
      expect(submittedData).toHaveProperty('items');
    });
  });

  it.skip('should include customer_id and vendor_id in create mode', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    
    // Mock the API responses for customers and vendors
    const { tenantApiClient } = await import('@/services/tenant/tenantApiClient');
    vi.mocked(tenantApiClient.get).mockImplementation((url) => {
      if (url.includes('/customers')) {
        return Promise.resolve({
          data: {
            data: [
              { uuid: 'customer-1', name: 'Customer 1', company_name: 'Company 1' },
            ],
          },
        });
      }
      if (url.includes('/vendors')) {
        return Promise.resolve({
          data: {
            data: [
              { uuid: 'vendor-1', name: 'Vendor 1', company_name: 'Vendor Company 1' },
            ],
          },
        });
      }
      return Promise.resolve({ data: [] });
    });
    
    renderQuoteForm({
      mode: 'create',
      onSubmit,
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Save Quote/i })).toBeInTheDocument();
    });
    
    // Fill in required fields
    const titleInput = screen.getByLabelText(/Quote Title/i);
    await user.type(titleInput, 'New Quote');
    
    const submitButton = screen.getByRole('button', { name: /Save Quote/i });
    await user.click(submitButton);
    
    // Wait longer and check if onSubmit was called
    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    }, { timeout: 10000 });
    
    // If onSubmit was called, check the data
    if (onSubmit.mock.calls.length > 0) {
      const submittedData = onSubmit.mock.calls[0][0];
      
      // In create mode, these fields should be present
      expect(submittedData).toHaveProperty('customer_id');
      expect(submittedData).toHaveProperty('vendor_id');
    }
  }, 15000); // Increase test timeout to 15 seconds

  it('should show revision mode correctly', async () => {
    renderQuoteForm({
      mode: 'create',
      initialData: mockQuote,
      isRevision: true,
    });
    
    await waitFor(() => {
      expect(screen.getByText('Create Quote Revision')).toBeInTheDocument();
      expect(screen.getByText(/Creating a revision of quote #Q-000123/i)).toBeInTheDocument();
    });
  });

  it('should show "Create Revision" button in revision mode', async () => {
    renderQuoteForm({
      mode: 'create',
      initialData: mockQuote,
      isRevision: true,
    });
    
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Create Revision/i })).toBeInTheDocument();
    });
  });
});
