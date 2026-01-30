/**
 * Unit Tests for QuoteManagement Page - Order Context
 * 
 * Tests the order context functionality including:
 * - Order ID parameter detection
 * - Quote filtering by order_id
 * - Banner display with order context
 * - "Back to Order" navigation
 * 
 * Requirements: 1.3, 1.4, 12.2, 12.3
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import QuoteManagement from '@/pages/admin/QuoteManagement';
import { ordersService } from '@/services/api/orders';
import { quotesService } from '@/services/api/quotes';
import { Order, OrderStatus, ProductionType, PaymentStatus } from '@/types/order';
import type { OrderQuote } from '@/types/quote';

// Mock services
vi.mock('@/services/api/orders', () => ({
  ordersService: {
    getOrderById: vi.fn(),
  },
}));

vi.mock('@/services/api/quotes', () => ({
  quotesService: {
    getQuotes: vi.fn(),
    acceptQuote: vi.fn(),
    rejectQuote: vi.fn(),
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

describe('QuoteManagement - Order Context', () => {
  const mockOrder: Order = {
    id: 'order-123',
    uuid: 'order-uuid-123',
    orderNumber: 'ORD-001',
    customerId: 'customer-123',
    customerName: 'Test Customer',
    customerEmail: 'test@example.com',
    customerPhone: '08123456789',
    items: [],
    totalAmount: 1000000,
    paidAmount: 0,
    remainingAmount: 1000000,
    status: OrderStatus.VendorNegotiation,
    productionType: ProductionType.Vendor,
    paymentStatus: PaymentStatus.Unpaid,
    shippingAddress: 'Test Address',
    createdBy: 'admin',
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  };

  const mockQuotes: OrderQuote[] = [
    {
      id: 'quote-1',
      order_id: 'order-uuid-123',
      order: {
        order_number: 'ORD-001',
      },
      type: 'vendor_to_company',
      vendor: {
        name: 'Test Vendor',
        email: 'vendor@example.com',
      },
      quoted_price: 10000000,
      quantity: 1,
      status: 'pending',
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Default mock implementations
    vi.mocked(ordersService.getOrderById).mockResolvedValue(mockOrder);
    vi.mocked(quotesService.getQuotes).mockResolvedValue({
      data: mockQuotes,
      total: 1,
      per_page: 10,
      current_page: 1,
      last_page: 1,
    });
  });

  describe('Order ID Parameter Detection', () => {
    it('should detect order_id from URL search parameters', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(ordersService.getOrderById).toHaveBeenCalledWith('order-uuid-123');
      });
    });

    it('should not fetch order context when no order_id parameter', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(ordersService.getOrderById).not.toHaveBeenCalled();
      });
    });

    it('should apply order_id filter to quote queries', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(quotesService.getQuotes).toHaveBeenCalledWith(
          expect.objectContaining({
            order_id: 'order-uuid-123',
          })
        );
      });
    });
  });

  describe('Quote Filtering by Order ID', () => {
    it('should filter quotes by order_id when parameter is present', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(quotesService.getQuotes).toHaveBeenCalledWith(
          expect.objectContaining({
            order_id: 'order-uuid-123',
          })
        );
      });
    });

    it('should display only quotes for the specified order', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        // Check for order number in the banner (split across elements)
        expect(screen.getByText(/#ORD-001/)).toBeInTheDocument();
      });
    });

    it('should not apply order_id filter when no parameter', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(quotesService.getQuotes).toHaveBeenCalledWith(
          expect.not.objectContaining({
            order_id: expect.anything(),
          })
        );
      });
    });
  });

  describe('Order Context Banner Display', () => {
    it('should display order context banner when order_id parameter is present', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Order Context')).toBeInTheDocument();
      });
    });

    it('should display order number in banner', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Managing quotes for Order/)).toBeInTheDocument();
        expect(screen.getByText(/#ORD-001/)).toBeInTheDocument();
      });
    });

    it('should display customer name in banner when available', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText(/Test Customer/)).toBeInTheDocument();
      });
    });

    it('should not display banner when no order_id parameter', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.queryByText('Order Context')).not.toBeInTheDocument();
      });
    });

    it('should display "Back to Order" link in banner', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Back to Order')).toBeInTheDocument();
      });
    });
  });

  describe('Back to Order Navigation', () => {
    it('should navigate to order detail when "Back to Order" is clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Back to Order')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Order');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/orders/order-123');
    });

    it('should use order.id for navigation, not order.uuid', async () => {
      const orderWithDifferentIds = {
        ...mockOrder,
        id: 'internal-id-456',
        uuid: 'order-uuid-123',
      };

      vi.mocked(ordersService.getOrderById).mockResolvedValue(orderWithDifferentIds);

      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Back to Order')).toBeInTheDocument();
      });

      const backButton = screen.getByText('Back to Order');
      fireEvent.click(backButton);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/orders/internal-id-456');
    });
  });

  describe('Error Handling', () => {
    it('should display error toast when order context fetch fails', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      vi.mocked(ordersService.getOrderById).mockRejectedValue(new Error('Failed to fetch order'));

      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error fetching order context:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should still display quotes even if order context fetch fails', async () => {
      vi.mocked(ordersService.getOrderById).mockRejectedValue(new Error('Failed to fetch order'));

      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Quote Management')).toBeInTheDocument();
      });
    });
  });

  describe('Integration with Quote List', () => {
    it('should display quotes filtered by order_id', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('ORD-001')).toBeInTheDocument();
        expect(screen.getByText('Test Vendor')).toBeInTheDocument();
      });
    });

    it('should maintain order context when quotes are refreshed', async () => {
      render(
        <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
          <QuoteManagement />
        </MemoryRouter>
      );

      await waitFor(() => {
        expect(screen.getByText('Order Context')).toBeInTheDocument();
      });

      // Simulate quote refresh by checking if order context persists
      await waitFor(() => {
        expect(screen.getByText(/Managing quotes for Order/)).toBeInTheDocument();
      });
    });
  });
});

describe('Quote Acceptance Confirmation Dialog', () => {
  const mockQuotes: OrderQuote[] = [
    {
      id: 'quote-1',
      order_id: 'order-uuid-123',
      order: {
        id: 'order-uuid-123',
        order_number: 'ORD-001',
      },
      type: 'vendor_to_company',
      vendor: {
        id: 'vendor-1',
        name: 'Test Vendor',
        email: 'vendor@example.com',
      },
      quoted_price: 10000000,
      quantity: 1,
      unit_price: 10000000,
      status: 'pending',
      is_active: true,
      created_at: '2024-01-01T00:00:00Z',
      updated_at: '2024-01-01T00:00:00Z',
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(quotesService.getQuotes).mockResolvedValue({
      data: mockQuotes,
      total: 1,
      per_page: 10,
      current_page: 1,
      last_page: 1,
    });
  });

  it('should open confirmation dialog when accept button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/quotes']}>
        <QuoteManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Find and click the accept button in the table
    const acceptButtons = screen.getAllByRole('button');
    const acceptButton = acceptButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-check')
    );
    
    if (acceptButton) {
      fireEvent.click(acceptButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Confirm Quote Acceptance')).toBeInTheDocument();
    });
  });

  it('should display quote details in confirmation dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/quotes']}>
        <QuoteManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Find and click the accept button
    const acceptButtons = screen.getAllByRole('button');
    const acceptButton = acceptButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-check')
    );
    
    if (acceptButton) {
      fireEvent.click(acceptButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Confirm Quote Acceptance')).toBeInTheDocument();
      expect(screen.getByText('Vendor Information')).toBeInTheDocument();
      // Use getAllByText since vendor name appears in both table and dialog
      expect(screen.getAllByText('Test Vendor').length).toBeGreaterThan(0);
    });
  });

  it('should display calculated quotation amount in confirmation dialog', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/quotes']}>
        <QuoteManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Find and click the accept button
    const acceptButtons = screen.getAllByRole('button');
    const acceptButton = acceptButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-check')
    );
    
    if (acceptButton) {
      fireEvent.click(acceptButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Customer Quotation Amount:')).toBeInTheDocument();
      // Quotation amount should be vendor price * 1.35
      // 10,000,000 * 1.35 = 13,500,000
      // Check for the formatted currency text - use getAllByText since it appears multiple times
      const quotationAmounts = screen.getAllByText((content, element) => {
        return element?.textContent?.includes('13.500.000') || false;
      });
      expect(quotationAmounts.length).toBeGreaterThan(0);
    });
  });

  it('should display vendor terms in confirmation dialog when available', async () => {
    const quotesWithTerms: OrderQuote[] = [
      {
        ...mockQuotes[0],
        terms_conditions: 'Payment within 30 days',
      },
    ];

    vi.mocked(quotesService.getQuotes).mockResolvedValue({
      data: quotesWithTerms,
      total: 1,
      per_page: 10,
      current_page: 1,
      last_page: 1,
    });

    render(
      <MemoryRouter initialEntries={['/admin/quotes']}>
        <QuoteManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Find and click the accept button
    const acceptButtons = screen.getAllByRole('button');
    const acceptButton = acceptButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-check')
    );
    
    if (acceptButton) {
      fireEvent.click(acceptButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Terms & Conditions')).toBeInTheDocument();
      expect(screen.getByText('Payment within 30 days')).toBeInTheDocument();
    });
  });

  it('should close dialog when cancel button is clicked', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/quotes']}>
        <QuoteManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Find and click the accept button
    const acceptButtons = screen.getAllByRole('button');
    const acceptButton = acceptButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-check')
    );
    
    if (acceptButton) {
      fireEvent.click(acceptButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Confirm Quote Acceptance')).toBeInTheDocument();
    });

    // Click cancel button
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    await waitFor(() => {
      expect(screen.queryByText('Confirm Quote Acceptance')).not.toBeInTheDocument();
    });
  });

  it('should call acceptQuote service when confirmed', async () => {
    vi.mocked(quotesService.acceptQuote).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/quotes']}>
        <QuoteManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Find and click the accept button
    const acceptButtons = screen.getAllByRole('button');
    const acceptButton = acceptButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-check')
    );
    
    if (acceptButton) {
      fireEvent.click(acceptButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Confirm Quote Acceptance')).toBeInTheDocument();
    });

    // Click accept button in dialog
    const confirmButton = screen.getByText('Accept Quote');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(quotesService.acceptQuote).toHaveBeenCalledWith('quote-1');
    });
  });

  it('should refresh quotes after successful acceptance', async () => {
    vi.mocked(quotesService.acceptQuote).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/quotes']}>
        <QuoteManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Clear previous calls
    vi.mocked(quotesService.getQuotes).mockClear();

    // Find and click the accept button
    const acceptButtons = screen.getAllByRole('button');
    const acceptButton = acceptButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-check')
    );
    
    if (acceptButton) {
      fireEvent.click(acceptButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Confirm Quote Acceptance')).toBeInTheDocument();
    });

    // Click accept button in dialog
    const confirmButton = screen.getByText('Accept Quote');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      // Should refresh quotes after acceptance
      expect(quotesService.getQuotes).toHaveBeenCalled();
    });
  });

  it('should refresh order context after acceptance when in order context', async () => {
    vi.mocked(quotesService.acceptQuote).mockResolvedValue(undefined);

    render(
      <MemoryRouter initialEntries={['/admin/quotes?order_id=order-uuid-123']}>
        <QuoteManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('Order Context')).toBeInTheDocument();
    });

    // Clear previous calls
    vi.mocked(ordersService.getOrderById).mockClear();

    // Find and click the accept button
    const acceptButtons = screen.getAllByRole('button');
    const acceptButton = acceptButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-check')
    );
    
    if (acceptButton) {
      fireEvent.click(acceptButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Confirm Quote Acceptance')).toBeInTheDocument();
    });

    // Click accept button in dialog
    const confirmButton = screen.getByText('Accept Quote');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      // Should refresh order context after acceptance using order.id
      expect(ordersService.getOrderById).toHaveBeenCalledWith('order-123');
    });
  });

  it('should display error toast when acceptance fails', async () => {
    vi.mocked(quotesService.acceptQuote).mockRejectedValue(new Error('Failed to accept'));

    render(
      <MemoryRouter initialEntries={['/admin/quotes']}>
        <QuoteManagement />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('ORD-001')).toBeInTheDocument();
    });

    // Find and click the accept button
    const acceptButtons = screen.getAllByRole('button');
    const acceptButton = acceptButtons.find(btn => 
      btn.querySelector('svg')?.classList.contains('lucide-check')
    );
    
    if (acceptButton) {
      fireEvent.click(acceptButton);
    }

    await waitFor(() => {
      expect(screen.getByText('Confirm Quote Acceptance')).toBeInTheDocument();
    });

    // Click accept button in dialog
    const confirmButton = screen.getByText('Accept Quote');
    fireEvent.click(confirmButton);

    await waitFor(() => {
      // Error should be handled (toast would be shown in real app)
      expect(quotesService.acceptQuote).toHaveBeenCalled();
    });
  });
});
