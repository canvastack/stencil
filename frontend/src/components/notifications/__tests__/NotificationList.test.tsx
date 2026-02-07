import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { NotificationList } from '../NotificationList';
import type { Notification } from '@/services/notificationService';

// Wrapper component for tests that need Router
const RouterWrapper = ({ children }: { children: React.ReactNode }) => (
  <BrowserRouter>{children}</BrowserRouter>
);

const mockNotifications: Notification[] = [
  {
    id: '1',
    type: 'order_status_changed',
    data: {
      message: 'Order status changed to shipped',
      order_number: 'ORD-001',
      order_uuid: 'uuid-1',
      old_status: 'processing',
      new_status: 'shipped'
    },
    read_at: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: '2',
    type: 'quote_received',
    data: {
      message: 'New quote request received',
      quote_number: 'QT-001',
      quote_uuid: 'quote-uuid-1',
      customer_name: 'John Doe',
      product_name: 'Custom Plate',
      quantity: 10
    },
    read_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

describe('NotificationList', () => {
  it('renders loading state', () => {
    render(<NotificationList notifications={[]} isLoading={true} />, { wrapper: RouterWrapper });
    // Loading state shows skeleton, not the "Notifications" header text
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders empty state when no notifications', () => {
    render(<NotificationList notifications={[]} isLoading={false} />, { wrapper: RouterWrapper });
    expect(screen.getByText(/no notifications/i)).toBeInTheDocument();
  });

  it('renders list of notifications', () => {
    render(<NotificationList notifications={mockNotifications} />, { wrapper: RouterWrapper });
    expect(screen.getByText(/order status changed to shipped/i)).toBeInTheDocument();
    expect(screen.getByText(/new quote request received/i)).toBeInTheDocument();
  });

  it('displays unread count and mark all button when unreadCount > 0', () => {
    const handleMarkAllAsRead = vi.fn();
    render(
      <NotificationList
        notifications={mockNotifications}
        unreadCount={1}
        onMarkAllAsRead={handleMarkAllAsRead}
      />,
      { wrapper: RouterWrapper }
    );
    
    const markAllButton = screen.getByRole('button', { name: /mark all read/i });
    expect(markAllButton).toBeInTheDocument();
    
    fireEvent.click(markAllButton);
    expect(handleMarkAllAsRead).toHaveBeenCalledTimes(1);
  });

  it('does not show mark all button when unreadCount is 0', () => {
    render(
      <NotificationList
        notifications={mockNotifications}
        unreadCount={0}
        onMarkAllAsRead={vi.fn()}
      />,
      { wrapper: RouterWrapper }
    );
    
    expect(screen.queryByRole('button', { name: /mark all read/i })).not.toBeInTheDocument();
  });

  it('calls onMarkAsRead when mark as read button clicked', () => {
    const handleMarkAsRead = vi.fn();
    render(
      <NotificationList
        notifications={mockNotifications}
        onMarkAsRead={handleMarkAsRead}
      />,
      { wrapper: RouterWrapper }
    );
    
    // Find the first unread notification's mark as read button
    const markAsReadButtons = screen.getAllByTitle(/mark as read/i);
    fireEvent.click(markAsReadButtons[0]);
    
    expect(handleMarkAsRead).toHaveBeenCalledWith('1');
  });

  it('calls onDelete when delete button clicked', () => {
    const handleDelete = vi.fn();
    render(
      <NotificationList
        notifications={mockNotifications}
        onDelete={handleDelete}
      />,
      { wrapper: RouterWrapper }
    );
    
    const deleteButtons = screen.getAllByTitle(/delete notification/i);
    fireEvent.click(deleteButtons[0]);
    
    expect(handleDelete).toHaveBeenCalledWith('1');
  });

  it('calls onClose when close button clicked', () => {
    const handleClose = vi.fn();
    render(
      <NotificationList
        notifications={mockNotifications}
        onClose={handleClose}
      />,
      { wrapper: RouterWrapper }
    );
    
    const closeButton = screen.getByRole('button', { name: '' }); // X button
    fireEvent.click(closeButton);
    
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it('calls onViewAll when view all button clicked', () => {
    const handleViewAll = vi.fn();
    render(
      <NotificationList
        notifications={mockNotifications}
        onViewAll={handleViewAll}
      />,
      { wrapper: RouterWrapper }
    );
    
    const viewAllButton = screen.getByRole('button', { name: /view all notifications/i });
    fireEvent.click(viewAllButton);
    
    expect(handleViewAll).toHaveBeenCalledTimes(1);
  });

  it('highlights unread notifications', () => {
    const { container } = render(
      <NotificationList notifications={mockNotifications} />,
      { wrapper: RouterWrapper }
    );
    
    // First notification is unread, should have blue background
    const notifications = container.querySelectorAll('[class*="bg-blue-50"]');
    expect(notifications.length).toBeGreaterThan(0);
  });

  it('uses QuoteNotificationItem for quote notifications', () => {
    render(<NotificationList notifications={mockNotifications} />, { wrapper: RouterWrapper });
    
    // Quote notification should display quote-specific information
    expect(screen.getByText(/QT-001/i)).toBeInTheDocument();
    expect(screen.getByText(/John Doe/i)).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <NotificationList
        notifications={mockNotifications}
        className="custom-class"
      />,
      { wrapper: RouterWrapper }
    );
    
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with custom maxHeight', () => {
    const { container } = render(
      <NotificationList
        notifications={mockNotifications}
        maxHeight="48"
      />,
      { wrapper: RouterWrapper }
    );
    
    const scrollArea = container.querySelector('[class*="h-48"]');
    expect(scrollArea).toBeInTheDocument();
  });
});
