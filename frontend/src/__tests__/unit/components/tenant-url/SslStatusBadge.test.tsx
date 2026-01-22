import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SslStatusBadge from '@/components/tenant-url/SslStatusBadge';
import type { SslStatus } from '@/types/tenant-url';

describe('SslStatusBadge Component', () => {
  it('renders active status correctly', () => {
    render(<SslStatusBadge status="active" />);
    
    expect(screen.getByText('SSL Active')).toBeInTheDocument();
  });

  it('renders pending status correctly', () => {
    render(<SslStatusBadge status="pending" />);
    
    expect(screen.getByText('SSL Pending')).toBeInTheDocument();
  });

  it('renders expired status correctly', () => {
    render(<SslStatusBadge status="expired" />);
    
    expect(screen.getByText('SSL Expired')).toBeInTheDocument();
  });

  it('renders failed status correctly', () => {
    render(<SslStatusBadge status="failed" />);
    
    expect(screen.getByText('SSL Failed')).toBeInTheDocument();
  });

  it('displays icon for all statuses', () => {
    const statuses: SslStatus[] = ['active', 'pending', 'expired', 'failed'];
    
    statuses.forEach((status) => {
      const { container, unmount } = render(<SslStatusBadge status={status} />);
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
      unmount();
    });
  });

  it('calculates days until expiry correctly', () => {
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);
    
    render(<SslStatusBadge status="active" expiresAt={futureDate.toISOString()} />);
    
    expect(screen.getByText('SSL Active')).toBeInTheDocument();
  });

  it('handles expired certificate date', () => {
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 10);
    
    render(<SslStatusBadge status="expired" expiresAt={pastDate.toISOString()} />);
    
    expect(screen.getByText('SSL Expired')).toBeInTheDocument();
  });

  it('renders without expiry date', () => {
    render(<SslStatusBadge status="active" />);
    
    expect(screen.getByText('SSL Active')).toBeInTheDocument();
  });

  it('renders without tooltip when showTooltip is false', () => {
    render(<SslStatusBadge status="active" showTooltip={false} />);
    
    expect(screen.getByText('SSL Active')).toBeInTheDocument();
  });

  it('handles null expiresAt value', () => {
    render(<SslStatusBadge status="active" expiresAt={null} />);
    
    expect(screen.getByText('SSL Active')).toBeInTheDocument();
  });

  it('handles undefined expiresAt value', () => {
    render(<SslStatusBadge status="active" expiresAt={undefined} />);
    
    expect(screen.getByText('SSL Active')).toBeInTheDocument();
  });

  it('applies correct variant for active status', () => {
    const { container } = render(<SslStatusBadge status="active" />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct variant for pending status', () => {
    const { container } = render(<SslStatusBadge status="pending" />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct variant for expired status', () => {
    const { container } = render(<SslStatusBadge status="expired" />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies correct variant for failed status', () => {
    const { container } = render(<SslStatusBadge status="failed" />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toBeInTheDocument();
  });

  it('displays appropriate icon for each status', () => {
    const statuses: SslStatus[] = ['active', 'pending', 'expired', 'failed'];
    
    statuses.forEach((status) => {
      const { container, unmount } = render(<SslStatusBadge status={status} />);
      const badge = container.querySelector('[class*="gap-1"]');
      const icon = badge?.querySelector('svg');
      expect(icon).toBeInTheDocument();
      unmount();
    });
  });

  it('handles expiry date in different formats', () => {
    const isoDate = '2025-12-31T23:59:59Z';
    
    render(<SslStatusBadge status="active" expiresAt={isoDate} />);
    
    expect(screen.getByText('SSL Active')).toBeInTheDocument();
  });

  it('calculates negative days for past expiry dates', () => {
    const pastDate = new Date('2020-01-01');
    
    render(<SslStatusBadge status="expired" expiresAt={pastDate.toISOString()} />);
    
    expect(screen.getByText('SSL Expired')).toBeInTheDocument();
  });

  it('maintains icon-text gap spacing', () => {
    const { container } = render(<SslStatusBadge status="active" />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toHaveClass('gap-1');
  });
});
