import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QuoteNotificationItem } from '../QuoteNotificationItem';
import type { Notification } from '@/services/notificationService';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate
  };
});

const createQuoteNotification = (
  type: string,
  data: Partial<Notification['data']>,
  isRead = false
): Notification => ({
  id: '1',
  type,
  data: {
    message: 'Test notification',
    ...data
  },
  read_at: isRead ? new Date().toISOString() : null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
});

describe('QuoteNotificationItem', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  describe('quote_received notifications', () => {
    it('renders quote received notification', () => {
      const notification = createQuoteNotification('quote_received', {
        quote_number: 'QT-001',
        quote_uuid: 'uuid-1',
        customer_name: 'John Doe',
        product_name: 'Custom Plate',
        quantity: 10
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      expect(screen.getByText(/new quote request/i)).toBeInTheDocument();
      expect(screen.getByText(/QT-001/i)).toBeInTheDocument();
      expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
      expect(screen.getByText(/Custom Plate/i)).toBeInTheDocument();
      expect(screen.getByText(/10/i)).toBeInTheDocument();
    });

    it('displays "New" badge for quote_received', () => {
      const notification = createQuoteNotification('quote_received', {
        quote_number: 'QT-001'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      expect(screen.getByText('New')).toBeInTheDocument();
    });
  });

  describe('quote_response notifications', () => {
    it('renders accepted quote response', () => {
      const notification = createQuoteNotification('quote_response', {
        quote_number: 'QT-001',
        response_type: 'accept',
        vendor_name: 'Vendor ABC'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      expect(screen.getByText(/quote accepted/i)).toBeInTheDocument();
      expect(screen.getByText('Accepted')).toBeInTheDocument();
      expect(screen.getByText(/Vendor ABC/i)).toBeInTheDocument();
    });

    it('renders rejected quote response', () => {
      const notification = createQuoteNotification('quote_response', {
        quote_number: 'QT-001',
        response_type: 'reject',
        vendor_name: 'Vendor ABC',
        response_notes: 'Price too low'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      expect(screen.getByText(/quote rejected/i)).toBeInTheDocument();
      expect(screen.getByText('Rejected')).toBeInTheDocument();
      expect(screen.getByText(/Price too low/i)).toBeInTheDocument();
    });

    it('renders counter offer response', () => {
      const notification = createQuoteNotification('quote_response', {
        quote_number: 'QT-001',
        response_type: 'counter',
        vendor_name: 'Vendor ABC'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      expect(screen.getByText(/counter offer received/i)).toBeInTheDocument();
      expect(screen.getByText('Counter')).toBeInTheDocument();
    });
  });

  describe('quote_expired notifications', () => {
    it('renders expired quote notification', () => {
      const notification = createQuoteNotification('quote_expired', {
        quote_number: 'QT-001',
        vendor_name: 'Vendor ABC'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      expect(screen.getByText(/quote expired/i)).toBeInTheDocument();
      expect(screen.getByText('Expired')).toBeInTheDocument();
    });
  });

  describe('quote_extended notifications', () => {
    it('renders extended quote notification', () => {
      const notification = createQuoteNotification('quote_extended', {
        quote_number: 'QT-001',
        new_expires_at: '2024-12-31'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      expect(screen.getByText(/quote extended/i)).toBeInTheDocument();
      expect(screen.getByText('Extended')).toBeInTheDocument();
    });
  });

  describe('interactions', () => {
    it('navigates to quote detail when clicked', () => {
      const notification = createQuoteNotification('quote_received', {
        quote_uuid: 'uuid-1',
        quote_number: 'QT-001'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      const item = screen.getByText(/new quote request/i).closest('div');
      if (item) {
        fireEvent.click(item);
        expect(mockNavigate).toHaveBeenCalledWith('/admin/quotes/uuid-1');
      }
    });

    it('calls onMarkAsRead when mark as read button clicked', () => {
      const handleMarkAsRead = vi.fn();
      const notification = createQuoteNotification('quote_received', {
        quote_number: 'QT-001'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem
            notification={notification}
            onMarkAsRead={handleMarkAsRead}
          />
        </BrowserRouter>
      );

      const markAsReadButton = screen.getByTitle(/mark as read/i);
      fireEvent.click(markAsReadButton);

      expect(handleMarkAsRead).toHaveBeenCalledWith('1');
    });

    it('calls onDelete when delete button clicked', () => {
      const handleDelete = vi.fn();
      const notification = createQuoteNotification('quote_received', {
        quote_number: 'QT-001'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem
            notification={notification}
            onDelete={handleDelete}
          />
        </BrowserRouter>
      );

      const deleteButton = screen.getByTitle(/delete notification/i);
      fireEvent.click(deleteButton);

      expect(handleDelete).toHaveBeenCalledWith('1');
    });

    it('navigates when "View Quote Details" link clicked', () => {
      const notification = createQuoteNotification('quote_received', {
        quote_uuid: 'uuid-1',
        quote_number: 'QT-001'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      const viewLink = screen.getByText(/view quote details/i);
      fireEvent.click(viewLink);

      expect(mockNavigate).toHaveBeenCalledWith('/admin/quotes/uuid-1');
    });
  });

  describe('visual indicators', () => {
    it('highlights unread notifications with blue border', () => {
      const notification = createQuoteNotification('quote_received', {
        quote_number: 'QT-001'
      }, false);

      const { container } = render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      const item = container.querySelector('[class*="border-l-blue-500"]');
      expect(item).toBeInTheDocument();
    });

    it('does not highlight read notifications', () => {
      const notification = createQuoteNotification('quote_received', {
        quote_number: 'QT-001'
      }, true);

      const { container } = render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      const item = container.querySelector('[class*="border-l-blue-500"]');
      expect(item).not.toBeInTheDocument();
    });

    it('does not show mark as read button for read notifications', () => {
      const notification = createQuoteNotification('quote_received', {
        quote_number: 'QT-001'
      }, true);

      render(
        <BrowserRouter>
          <QuoteNotificationItem
            notification={notification}
            onMarkAsRead={vi.fn()}
          />
        </BrowserRouter>
      );

      expect(screen.queryByTitle(/mark as read/i)).not.toBeInTheDocument();
    });
  });

  describe('response notes', () => {
    it('displays response notes when present', () => {
      const notification = createQuoteNotification('quote_response', {
        quote_number: 'QT-001',
        response_type: 'reject',
        response_notes: 'Cannot meet the deadline'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      expect(screen.getByText(/Cannot meet the deadline/i)).toBeInTheDocument();
    });

    it('does not display response notes section when not present', () => {
      const notification = createQuoteNotification('quote_response', {
        quote_number: 'QT-001',
        response_type: 'accept'
      });

      render(
        <BrowserRouter>
          <QuoteNotificationItem notification={notification} />
        </BrowserRouter>
      );

      expect(screen.queryByText(/note:/i)).not.toBeInTheDocument();
    });
  });
});
