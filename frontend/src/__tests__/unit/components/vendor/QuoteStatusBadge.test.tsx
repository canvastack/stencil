/**
 * QuoteStatusBadge Component Tests
 * 
 * Tests for the quote status badge component.
 * 
 * Requirements: 5.8, 10.5
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import QuoteStatusBadge from '@/components/vendor/QuoteStatusBadge';

describe('QuoteStatusBadge', () => {
  it('should render draft status', () => {
    render(<QuoteStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('should render sent status', () => {
    render(<QuoteStatusBadge status="sent" />);
    expect(screen.getByText('Sent')).toBeInTheDocument();
  });

  it('should render pending_response status with formatted text', () => {
    render(<QuoteStatusBadge status="pending_response" />);
    expect(screen.getByText('Pending Response')).toBeInTheDocument();
  });

  it('should render accepted status', () => {
    render(<QuoteStatusBadge status="accepted" />);
    expect(screen.getByText('Accepted')).toBeInTheDocument();
  });

  it('should render rejected status', () => {
    render(<QuoteStatusBadge status="rejected" />);
    expect(screen.getByText('Rejected')).toBeInTheDocument();
  });

  it('should render countered status', () => {
    render(<QuoteStatusBadge status="countered" />);
    expect(screen.getByText('Countered')).toBeInTheDocument();
  });

  it('should render expired status', () => {
    render(<QuoteStatusBadge status="expired" />);
    expect(screen.getByText('Expired')).toBeInTheDocument();
  });

  it('should render cancelled status', () => {
    render(<QuoteStatusBadge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('should show expired indicator when isExpired is true', () => {
    const { container } = render(
      <QuoteStatusBadge status="sent" isExpired={true} />
    );
    
    // Should show "Expired" text instead of "Sent"
    expect(screen.getByText('Expired')).toBeInTheDocument();
    expect(screen.queryByText('Sent')).not.toBeInTheDocument();
    
    // Should show AlertCircle icon
    const svg = container.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('should not show expired indicator when isExpired is false', () => {
    const { container } = render(
      <QuoteStatusBadge status="sent" isExpired={false} />
    );
    
    expect(screen.getByText('Sent')).toBeInTheDocument();
    
    // Should not show AlertCircle icon
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('should not show AlertCircle icon when status is already expired', () => {
    const { container } = render(
      <QuoteStatusBadge status="expired" isExpired={true} />
    );
    
    expect(screen.getByText('Expired')).toBeInTheDocument();
    
    // Should not show AlertCircle icon because status is already expired
    const svg = container.querySelector('svg');
    expect(svg).not.toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(
      <QuoteStatusBadge status="accepted" className="custom-class" />
    );
    
    const wrapper = container.firstChild;
    expect(wrapper).toHaveClass('custom-class');
  });

  it('should apply green colors for accepted status', () => {
    const { container } = render(<QuoteStatusBadge status="accepted" />);
    
    const badge = container.querySelector('.bg-green-100');
    expect(badge).toBeInTheDocument();
  });

  it('should apply red colors for rejected status', () => {
    const { container } = render(<QuoteStatusBadge status="rejected" />);
    
    const badge = container.querySelector('.bg-red-100');
    expect(badge).toBeInTheDocument();
  });

  it('should apply red colors for expired status', () => {
    const { container } = render(<QuoteStatusBadge status="expired" />);
    
    const badge = container.querySelector('.bg-red-100');
    expect(badge).toBeInTheDocument();
  });

  it('should apply orange colors for sent status', () => {
    const { container } = render(<QuoteStatusBadge status="sent" />);
    
    const badge = container.querySelector('.bg-orange-100');
    expect(badge).toBeInTheDocument();
  });

  it('should apply orange colors for pending_response status', () => {
    const { container } = render(<QuoteStatusBadge status="pending_response" />);
    
    const badge = container.querySelector('.bg-orange-100');
    expect(badge).toBeInTheDocument();
  });

  it('should apply blue colors for countered status', () => {
    const { container } = render(<QuoteStatusBadge status="countered" />);
    
    const badge = container.querySelector('.bg-blue-100');
    expect(badge).toBeInTheDocument();
  });

  it('should apply gray colors for draft status', () => {
    const { container } = render(<QuoteStatusBadge status="draft" />);
    
    const badge = container.querySelector('.bg-gray-100');
    expect(badge).toBeInTheDocument();
  });
});
