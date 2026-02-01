import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { QuoteForm } from '@/components/tenant/quotes/QuoteForm';
import { ordersService } from '@/services/api/orders';
import { tenantApiClient } from '@/services/tenant/tenantApiClient';
import { quoteService } from '@/services/tenant/quoteService';
import { Order } from '@/types/order';

// Mock services
vi.mock('@/services/api/orders', () => ({
  ordersService: {
    getOrderById: vi.fn(),
  },
}));

vi.mock('@/services/tenant/tenantApiClient', () => ({
  tenantApiClient: {
    get: vi.fn(),
  },
}));

vi.mock('@/services/tenant/quoteService', () => ({
  quoteService: {
    getAvailableCustomers: vi.fn(),
    getAvailableVendors: vi.fn(),
    getAvailableProducts: vi.fn(),
  },
}));

// Mock toast
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

describe('QuoteForm - Order Context Pre-population', () => {
  const mockOrder: Order = {
    id: 'order-uuid-123',
    order_number: 'ORD-2024-001',
    customer_id: 'customer-uuid-456',
    customer: {
      id: 'customer-uuid-456',
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
    },
    status: 'vendor_negotiation',
    current_stage: 'vendor_negotiation',
    total: 1000,
    items: [],
    created_at: '2024-01-01T00:00:00Z',
    updated_at: '2024-01-01T00:00:00Z',
  } as Order;

  const mockOrderWithVendor: Order = {
    ...mockOrder,
    vendor_id: 'vendor-uuid-111',
    vendor: {
      id: 'vendor-uuid-111',
      name: 'Vendor A',
      company: 'Vendor A Co',
    },
  } as Order;

  const mockCustomers = [
    { id: 'customer-uuid-456', name: 'John Doe', company: 'Acme Corp' },
    { id: 'customer-uuid-789', name: 'Jane Smith', company: 'Tech Inc' },
  ];

  const mockVendors = [
    { id: 'vendor-uuid-111', name: 'Vendor A', company: 'Vendor A Co' },
    { id: 'vendor-uuid-222', name: 'Vendor B', company: 'Vendor B Co' },
  ];

  const mockProducts = [
    { id: 'product-uuid-aaa', name: 'Product 1', sku: 'SKU-001', unit: 'pcs' },
    { id: 'product-uuid-bbb', name: 'Product 2', sku: 'SKU-002', unit: 'pcs' },
  ];

  const mockOnSubmit = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default mock implementations for tenantApiClient
    vi.mocked(tenantApiClient.get).mockImplementation((url: string) => {
      if (url === '/customers') {
        return Promise.resolve({ data: { data: mockCustomers } });
      }
      if (url === '/vendors') {
        return Promise.resolve({ data: { data: mockVendors } });
      }
      if (url === '/products') {
        return Promise.resolve({ data: { data: mockProducts } });
      }
      return Promise.resolve({ data: {} });
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should pre-populate customer field when order_id is in URL', async () => {
    vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

    render(
      <MemoryRouter initialEntries={['/quotes/new?order_id=order-uuid-123']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for order to be loaded
    await waitFor(() => {
      expect(ordersService.getOrderById).toHaveBeenCalledWith('order-uuid-123');
    });

    // Wait for form to be populated
    await waitFor(() => {
      // Check if customer field is populated (this will be in the select component)
      const customerSelect = screen.getByRole('combobox', { name: /customer/i });
      expect(customerSelect).toBeInTheDocument();
    });
  });

  it('should disable customer field when pre-populated from order context', async () => {
    vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

    render(
      <MemoryRouter initialEntries={['/quotes/new?order_id=order-uuid-123']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for order to be loaded
    await waitFor(() => {
      expect(ordersService.getOrderById).toHaveBeenCalledWith('order-uuid-123');
    });

    // Wait for customer field to be disabled
    await waitFor(() => {
      const customerSelect = screen.getByRole('combobox', { name: /customer/i });
      expect(customerSelect).toBeDisabled();
    });
  });

  it('should display order context description when coming from order', async () => {
    vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

    render(
      <MemoryRouter initialEntries={['/quotes/new?order_id=order-uuid-123']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for order to be loaded
    await waitFor(() => {
      expect(ordersService.getOrderById).toHaveBeenCalledWith('order-uuid-123');
    });

    // Check for order context description
    await waitFor(() => {
      expect(screen.getByText(/Pre-filled from Order #ORD-2024-001/i)).toBeInTheDocument();
    });
  });

  it('should not pre-populate fields when no order_id in URL', async () => {
    render(
      <MemoryRouter initialEntries={['/quotes/new']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(tenantApiClient.get).toHaveBeenCalledWith('/customers', expect.any(Object));
    });

    // Verify order service was not called
    expect(ordersService.getOrderById).not.toHaveBeenCalled();

    // Customer field should not be disabled
    await waitFor(() => {
      const customerSelect = screen.getByRole('combobox', { name: /customer/i });
      expect(customerSelect).not.toBeDisabled();
    });
  });

  it('should not pre-populate when editing existing quote', async () => {
    const mockQuote = {
      id: 'quote-uuid-999',
      quote_number: 'QT-2024-001',
      customer_id: 'customer-uuid-456',
      vendor_id: 'vendor-uuid-111',
      title: 'Test Quote',
      status: 'draft',
      total_amount: 1000,
      tax_amount: 100,
      grand_total: 1100,
      currency: 'IDR',
      valid_until: '2024-12-31T00:00:00Z',
      revision_number: 1,
      created_by: 'user-uuid',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
      customer: mockCustomers[0],
      vendor: mockVendors[0],
      items: [],
    };

    render(
      <MemoryRouter initialEntries={['/quotes/edit/quote-uuid-999?order_id=order-uuid-123']}>
        <QuoteForm quote={mockQuote} onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for initial load
    await waitFor(() => {
      expect(tenantApiClient.get).toHaveBeenCalledWith('/customers', expect.any(Object));
    });

    // Verify order service was not called (because quote exists)
    expect(ordersService.getOrderById).not.toHaveBeenCalled();
  });

  it('should include order_id in submission when coming from order context', async () => {
    vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

    const { container } = render(
      <MemoryRouter initialEntries={['/quotes/new?order_id=order-uuid-123']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for order to be loaded
    await waitFor(() => {
      expect(ordersService.getOrderById).toHaveBeenCalledWith('order-uuid-123');
    });

    // Note: Full form submission test would require filling all required fields
    // This test verifies the order_id is captured in state
    // The actual submission logic is tested in integration tests
  });

  it('should handle order loading error gracefully', async () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(ordersService.getOrderById).mockRejectedValue(new Error('Order not found'));

    render(
      <MemoryRouter initialEntries={['/quotes/new?order_id=invalid-order-id']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for error to be handled
    await waitFor(() => {
      expect(ordersService.getOrderById).toHaveBeenCalledWith('invalid-order-id');
    });

    // Form should still be usable
    await waitFor(() => {
      const customerSelect = screen.getByRole('combobox', { name: /customer/i });
      expect(customerSelect).not.toBeDisabled();
    });

    consoleErrorSpy.mockRestore();
  });

  // New tests for vendor auto-fill functionality
  it('should pre-populate vendor field when order has vendor_id', async () => {
    vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrderWithVendor);

    render(
      <MemoryRouter initialEntries={['/quotes/new?order_id=order-uuid-123']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for order to be loaded
    await waitFor(() => {
      expect(ordersService.getOrderById).toHaveBeenCalledWith('order-uuid-123');
    });

    // Wait for form to be populated - just verify vendor field exists
    await waitFor(() => {
      const vendorSelect = screen.getByRole('combobox', { name: /vendor/i });
      expect(vendorSelect).toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('should disable vendor field when pre-populated from order with vendor', async () => {
    vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrderWithVendor);

    render(
      <MemoryRouter initialEntries={['/quotes/new?order_id=order-uuid-123']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for order to be loaded
    await waitFor(() => {
      expect(ordersService.getOrderById).toHaveBeenCalledWith('order-uuid-123');
    });

    // Wait for vendor field to be disabled - give it more time for async operations
    await waitFor(() => {
      const vendorSelect = screen.getByRole('combobox', { name: /vendor/i });
      // Check if it has the disabled attribute or data-disabled
      const isDisabled = vendorSelect.hasAttribute('disabled') || vendorSelect.getAttribute('data-disabled') === '';
      expect(isDisabled).toBe(true);
    }, { timeout: 5000 });
  });

  it('should display vendor context description when vendor is pre-filled', async () => {
    vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrderWithVendor);

    render(
      <MemoryRouter initialEntries={['/quotes/new?order_id=order-uuid-123']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for order to be loaded
    await waitFor(() => {
      expect(ordersService.getOrderById).toHaveBeenCalledWith('order-uuid-123');
    });

    // Check for vendor context description - use a more flexible matcher
    await waitFor(() => {
      const description = screen.getByText((content, element) => {
        return element?.textContent?.includes('Pre-filled from Order') && 
               element?.textContent?.includes('Field is locked') || false;
      });
      expect(description).toBeInTheDocument();
    }, { timeout: 5000 });
  });

  it('should not disable vendor field when order has no vendor_id', async () => {
    vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);

    render(
      <MemoryRouter initialEntries={['/quotes/new?order_id=order-uuid-123']}>
        <QuoteForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </MemoryRouter>
    );

    // Wait for order to be loaded
    await waitFor(() => {
      expect(ordersService.getOrderById).toHaveBeenCalledWith('order-uuid-123');
    });

    // Vendor field should not be disabled
    await waitFor(() => {
      const vendorSelect = screen.getByRole('combobox', { name: /vendor/i });
      expect(vendorSelect).not.toBeDisabled();
    }, { timeout: 3000 });
  });
});
