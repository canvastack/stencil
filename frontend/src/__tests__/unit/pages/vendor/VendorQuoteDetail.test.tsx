/**
 * VendorQuoteDetail Page Tests
 * 
 * Tests for the vendor quote detail page.
 * 
 * Task 6.5.1.3: Create QuoteDetail.test.tsx
 * - Test displays quote information
 * - Test shows accept/reject/counter buttons
 * - Test disables buttons for expired quotes
 * - Test displays message thread
 * - Test handles response actions
 * - Test shows loading states
 * 
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9, 5.10, 10.7
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VendorQuoteDetail from '@/pages/vendor/VendorQuoteDetail';
import vendorApi from '@/services/api/vendorApi';
import type { VendorQuoteDetailResponse, QuoteMessageListResponse } from '@/types/vendor/portal';

// Mock the vendorApi
vi.mock('@/services/api/vendorApi', () => ({
  default: {
    getQuoteDetail: vi.fn(),
    getMessages: vi.fn(),
    acceptQuote: vi.fn(),
    rejectQuote: vi.fn(),
    counterOffer: vi.fn(),
    sendMessage: vi.fn(),
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

describe('VendorQuoteDetail', () => {
  const mockQuoteResponse: VendorQuoteDetailResponse = {
    success: true,
    data: {
      id: '1',
      uuid: 'quote-123',
      tenant_id: 'tenant-1',
      order_id: 'order-1',
      vendor_id: 'vendor-1',
      quote_number: 'Q-2024-001',
      status: 'sent',
      created_at: '2024-01-15T10:00:00Z',
      updated_at: '2024-01-15T10:00:00Z',
      sent_at: '2024-01-15T10:00:00Z',
      expires_at: '2030-02-15T10:00:00Z', // Future date to ensure not expired
      order: {
        id: 'order-1',
        uuid: 'order-uuid-1',
        order_number: 'ORD-2024-001',
        customer_name: 'John Doe',
        customer_email: 'john@example.com',
        total_amount: 100000,
        status: 'pending',
        created_at: '2024-01-14T10:00:00Z',
      },
      customer: {
        id: 'customer-1',
        uuid: 'customer-uuid-1',
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890',
        company: 'ABC Company',
      },
      product: {
        id: 'product-1',
        uuid: 'product-uuid-1',
        name: 'Custom Etching Plate',
        sku: 'CEP-001',
        description: 'High quality etching plate',
      },
      quote_details: {
        product_specifications: {
          material: 'stainless_steel',
          dimensions: '10x15cm',
        },
        admin_notes: 'Please provide your best quote',
        history: [],
      },
    },
  };

  const mockMessagesResponse: QuoteMessageListResponse = {
    success: true,
    data: {
      messages: [
        {
          id: '1',
          uuid: 'msg-1',
          tenant_id: 'tenant-1',
          quote_id: 'quote-123',
          sender_id: 'admin-1',
          message: 'Hello, can you provide a quote?',
          attachments: [],
          sender_type: 'admin',
          is_read: true,
          created_at: '2024-01-15T11:00:00Z',
          updated_at: '2024-01-15T11:00:00Z',
          sender: {
            id: 'admin-1',
            name: 'Admin User',
          },
        },
      ],
      pagination: {
        total: 1,
        per_page: 20,
        current_page: 1,
        last_page: 1,
      },
      unread_count: 0,
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(vendorApi.getQuoteDetail).mockResolvedValue(mockQuoteResponse);
    vi.mocked(vendorApi.getMessages).mockResolvedValue(mockMessagesResponse);
  });

  const renderWithRouter = (uuid: string = 'quote-123') => {
    return render(
      <MemoryRouter initialEntries={[`/vendor/quotes/${uuid}`]}>
        <Routes>
          <Route path="/vendor/quotes/:uuid" element={<VendorQuoteDetail />} />
        </Routes>
      </MemoryRouter>
    );
  };

  /**
   * Test 1: Test shows loading states
   * Verifies that loading skeletons are displayed while data is being fetched
   */
  it('should show loading states', () => {
    render(
      <MemoryRouter initialEntries={['/vendor/quotes/quote-123']}>
        <Routes>
          <Route path="/vendor/quotes/:uuid" element={<VendorQuoteDetail />} />
        </Routes>
      </MemoryRouter>
    );

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  /**
   * Test 2: Test displays quote information
   * Verifies that all quote details are properly displayed including customer, order, and product info
   */
  it('should display quote information', async () => {
    renderWithRouter();

    await waitFor(() => {
      // Quote number and status
      expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
      
      // Customer information
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByText('ABC Company')).toBeInTheDocument();
      
      // Order information
      expect(screen.getByText('ORD-2024-001')).toBeInTheDocument();
      expect(screen.getByText('Total Amount')).toBeInTheDocument();
      
      // Product information
      expect(screen.getByText('Custom Etching Plate')).toBeInTheDocument();
      expect(screen.getByText('CEP-001')).toBeInTheDocument();
      expect(screen.getByText('High quality etching plate')).toBeInTheDocument();
      
      // Admin notes
      expect(screen.getByText('Please provide your best quote')).toBeInTheDocument();
    });
  });

  /**
   * Test 3: Test shows accept/reject/counter buttons
   * Verifies that response action buttons are displayed for active quotes
   */
  it('should show accept/reject/counter buttons', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Accept Quote')).toBeInTheDocument();
      expect(screen.getByText('Counter Offer')).toBeInTheDocument();
      expect(screen.getByText('Reject Quote')).toBeInTheDocument();
    });
  });

  /**
   * Test 4: Test disables buttons for expired quotes
   * Verifies that response buttons are not shown for expired quotes
   */
  it('should disable buttons for expired quotes', async () => {
    const expiredQuote = {
      ...mockQuoteResponse,
      data: {
        ...mockQuoteResponse.data,
        expires_at: '2020-01-01T10:00:00Z', // Past date
      },
    };
    vi.mocked(vendorApi.getQuoteDetail).mockResolvedValue(expiredQuote);

    renderWithRouter();

    await waitFor(() => {
      // Should show expired warning
      expect(screen.getByText(/This quote expired/i)).toBeInTheDocument();
    });

    // Response buttons should not be present
    expect(screen.queryByText('Accept Quote')).not.toBeInTheDocument();
    expect(screen.queryByText('Counter Offer')).not.toBeInTheDocument();
    expect(screen.queryByText('Reject Quote')).not.toBeInTheDocument();
  });

  /**
   * Test 5: Test displays message thread
   * Verifies that the message thread component is rendered with messages
   */
  it('should display message thread', async () => {
    renderWithRouter();

    await waitFor(() => {
      expect(screen.getByText('Message Thread')).toBeInTheDocument();
      expect(screen.getByText('Hello, can you provide a quote?')).toBeInTheDocument();
    });
  });

  /**
   * Test 6: Test handles response actions
   * Verifies that clicking response buttons shows the appropriate forms
   */
  it('should handle response actions', async () => {
    renderWithRouter();

    // Test accept action
    await waitFor(() => {
      const acceptButton = screen.getByText('Accept Quote');
      fireEvent.click(acceptButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Estimated Delivery Days/i)).toBeInTheDocument();
    });

    // Re-render for reject action
    vi.clearAllMocks();
    vi.mocked(vendorApi.getQuoteDetail).mockResolvedValue(mockQuoteResponse);
    vi.mocked(vendorApi.getMessages).mockResolvedValue(mockMessagesResponse);
    
    const { unmount } = renderWithRouter();
    unmount();
    renderWithRouter();

    // Test reject action
    await waitFor(() => {
      const rejectButton = screen.getByText('Reject Quote');
      fireEvent.click(rejectButton);
    });

    await waitFor(() => {
      expect(screen.getByLabelText(/Rejection Reason/i)).toBeInTheDocument();
    });
  });
});
