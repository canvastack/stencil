import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NotificationBell } from '../NotificationBell';

describe('NotificationBell', () => {
  it('renders bell icon', () => {
    render(<NotificationBell unreadCount={0} />);
    const button = screen.getByRole('button', { name: /notifications/i });
    expect(button).toBeInTheDocument();
  });

  it('displays unread count badge when count > 0', () => {
    render(<NotificationBell unreadCount={5} />);
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('does not display badge when count is 0', () => {
    render(<NotificationBell unreadCount={0} />);
    expect(screen.queryByText('0')).not.toBeInTheDocument();
  });

  it('displays "99+" for counts over 99', () => {
    render(<NotificationBell unreadCount={150} />);
    expect(screen.getByText('99+')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', () => {
    const handleClick = vi.fn();
    render(<NotificationBell unreadCount={5} onClick={handleClick} />);
    
    const button = screen.getByRole('button');
    fireEvent.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('includes unread count in aria-label', () => {
    render(<NotificationBell unreadCount={3} />);
    const button = screen.getByRole('button', { name: /notifications \(3 unread\)/i });
    expect(button).toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <NotificationBell unreadCount={0} className="custom-class" />
    );
    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('renders with different sizes', () => {
    const { rerender } = render(<NotificationBell unreadCount={0} size="sm" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    rerender(<NotificationBell unreadCount={0} size="md" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    rerender(<NotificationBell unreadCount={0} size="lg" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('renders with different variants', () => {
    const { rerender } = render(<NotificationBell unreadCount={0} variant="ghost" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    rerender(<NotificationBell unreadCount={0} variant="outline" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    
    rerender(<NotificationBell unreadCount={0} variant="default" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('badge has animation classes', () => {
    const { container } = render(<NotificationBell unreadCount={5} />);
    const badge = container.querySelector('.animate-in');
    expect(badge).toBeInTheDocument();
  });
});
