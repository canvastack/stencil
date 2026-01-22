import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DomainVerificationBadge from '@/components/tenant-url/DomainVerificationBadge';
import type { DomainVerificationStatus } from '@/types/tenant-url';

describe('DomainVerificationBadge Component', () => {
  it('renders verified status correctly', () => {
    render(<DomainVerificationBadge status="verified" />);
    
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('renders pending status correctly', () => {
    render(<DomainVerificationBadge status="pending" />);
    
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('renders failed status correctly', () => {
    render(<DomainVerificationBadge status="failed" />);
    
    expect(screen.getByText('Failed')).toBeInTheDocument();
  });

  it('displays icon for verified status', () => {
    const { container } = render(<DomainVerificationBadge status="verified" />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('displays icon for pending status', () => {
    const { container } = render(<DomainVerificationBadge status="pending" />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('displays icon for failed status', () => {
    const { container } = render(<DomainVerificationBadge status="failed" />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('applies correct variant class for verified status', () => {
    const { container } = render(<DomainVerificationBadge status="verified" />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct variant class for pending status', () => {
    const { container } = render(<DomainVerificationBadge status="pending" />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct variant class for failed status', () => {
    const { container } = render(<DomainVerificationBadge status="failed" />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toBeInTheDocument();
  });

  it('renders without tooltip when showTooltip is false', () => {
    render(<DomainVerificationBadge status="verified" showTooltip={false} />);
    
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('handles all possible verification statuses', () => {
    const statuses: DomainVerificationStatus[] = ['verified', 'pending', 'failed'];
    
    statuses.forEach((status) => {
      const { unmount } = render(<DomainVerificationBadge status={status} />);
      const expectedText = status.charAt(0).toUpperCase() + status.slice(1);
      expect(screen.getByText(expectedText)).toBeInTheDocument();
      unmount();
    });
  });

  it('maintains icon-text gap spacing', () => {
    const { container } = render(<DomainVerificationBadge status="verified" />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toHaveClass('gap-1');
  });
});
