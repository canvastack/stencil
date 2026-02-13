/**
 * QuoteCard Component Tests
 * 
 * Tests for the quote card component.
 * 
 * Requirements: 4.5, 13.9
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QuoteCard from '@/components/vendor/QuoteCard';

describe('QuoteCard', () => {
  const mockQuote = {
    uuid: 'quote-123',
    quoteNumber: 'Q-2024-001',
    orderNumber: 'ORD-2024-001',
    customerName: 'John Doe',
    status: 'pending_response' as const,
    createdAt: new Date('2024-01-15T10:00:00Z'),
    expiresAt: new Date('2024-02-15T10:00:00Z'),
    unreadMessageCount: 3,
  };

  it('should render quote number', () => {
    render(<QuoteCard {...mockQuote} />);
    expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
  });

  it('should render order number when provided', () => {
    render(<QuoteCard {...mockQuote} />);
    expect(screen.getByText(/ORD-2024-001/)).toBeInTheDocument();
  });

  it('should not render order number when not provided', () => {
    render(<QuoteCard {...mockQuote} orderNumber={undefined} />);
    expect(screen.queryByText(/Order:/)).not.toBeInTheDocument();
  });

  it('should render customer name when provided', () => {
    render(<QuoteCard {...mockQuote} />);
    expect(screen.getByText(/John Doe/)).toBeInTheDocument();
  });

  it('should not render customer name when not provided', () => {
    render(<QuoteCard {...mockQuote} customerName={undefined} />);
    expect(screen.queryByText(/Customer:/)).not.toBeInTheDocument();
  });

  it('should render status badge', () => {
    const { container } = render(<QuoteCard {...mockQuote} />);
    // Check for badge component by looking for the badge wrapper
    const badgeWrapper = container.querySelector('.inline-flex.items-center.gap-1');
    expect(badgeWrapper).toBeTruthy();
  });

  it('should render created date', () => {
    const { container } = render(<QuoteCard {...mockQuote} />);
    // Check for calendar icons (should have at least one for created date)
    const calendarIcons = container.querySelectorAll('.lucide-calendar');
    expect(calendarIcons.length).toBeGreaterThan(0);
  });

  it('should render expiration date when provided', () => {
    const { container } = render(<QuoteCard {...mockQuote} />);
    // Check for expiration date by looking for the calendar icon and date text
    const dateElements = container.querySelectorAll('.lucide-calendar');
    expect(dateElements.length).toBeGreaterThan(1); // Should have created date + expiration date
  });

  it('should not render expiration date when not provided', () => {
    const { container } = render(<QuoteCard {...mockQuote} expiresAt={null} />);
    // Should only have one calendar icon (created date)
    const dateElements = container.querySelectorAll('.lucide-calendar');
    expect(dateElements.length).toBe(1);
  });

  it('should show expired indicator when quote is expired', () => {
    const expiredQuote = {
      ...mockQuote,
      expiresAt: new Date('2020-01-01T10:00:00Z'), // Past date
    };
    
    const { container } = render(<QuoteCard {...expiredQuote} />);
    // Check for expired badge
    const expiredBadge = container.querySelector('.bg-red-100');
    expect(expiredBadge).toBeInTheDocument();
    
    // Check for AlertCircle icon
    const alertIcon = container.querySelector('.lucide-circle-alert');
    expect(alertIcon).toBeInTheDocument();
  });

  it('should render unread message count when greater than 0', () => {
    render(<QuoteCard {...mockQuote} unreadMessageCount={3} />);
    expect(screen.getByText('3 new')).toBeInTheDocument();
  });

  it('should not render unread message count when 0', () => {
    render(<QuoteCard {...mockQuote} unreadMessageCount={0} />);
    expect(screen.queryByText(/new/)).not.toBeInTheDocument();
  });

  it('should show unread indicator dot when unreadMessageCount > 0', () => {
    const { container } = render(<QuoteCard {...mockQuote} unreadMessageCount={3} />);
    const dot = container.querySelector('.bg-blue-500');
    expect(dot).toBeInTheDocument();
  });

  it('should not show unread indicator dot when unreadMessageCount is 0', () => {
    const { container } = render(<QuoteCard {...mockQuote} unreadMessageCount={0} />);
    const dot = container.querySelector('.bg-blue-500');
    expect(dot).not.toBeInTheDocument();
  });

  it('should call onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<QuoteCard {...mockQuote} onClick={handleClick} />);
    
    const card = screen.getByText('Q-2024-001').closest('.cursor-pointer');
    fireEvent.click(card!);
    
    expect(handleClick).toHaveBeenCalledWith('quote-123');
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should not call onClick when not provided', () => {
    render(<QuoteCard {...mockQuote} />);
    
    const card = screen.getByText('Q-2024-001').closest('.cursor-pointer');
    // Should not throw error
    fireEvent.click(card!);
  });

  it('should apply custom className', () => {
    const { container } = render(<QuoteCard {...mockQuote} className="custom-class" />);
    
    const card = container.querySelector('.custom-class');
    expect(card).toBeInTheDocument();
  });

  it('should have hover effects', () => {
    const { container } = render(<QuoteCard {...mockQuote} />);
    
    const card = container.querySelector('.hover\\:shadow-md');
    expect(card).toBeInTheDocument();
  });

  it('should handle string dates', () => {
    const quoteWithStringDates = {
      ...mockQuote,
      createdAt: '2024-01-15T10:00:00Z',
      expiresAt: '2024-02-15T10:00:00Z',
    };
    
    render(<QuoteCard {...quoteWithStringDates} />);
    expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
  });

  it('should render all status types correctly', () => {
    const statuses = ['draft', 'sent', 'pending_response', 'accepted', 'rejected', 'countered', 'expired'] as const;
    
    statuses.forEach((status) => {
      const { unmount } = render(<QuoteCard {...mockQuote} status={status} />);
      // Should render without errors
      expect(screen.getByText('Q-2024-001')).toBeInTheDocument();
      unmount();
    });
  });

  it('should render icons for order and customer', () => {
    const { container } = render(<QuoteCard {...mockQuote} />);
    
    // Should have multiple icons (FileText, User, Calendar, etc.)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });
});
