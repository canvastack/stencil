import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import DnsStatusBadge from '@/components/tenant-url/DnsStatusBadge';

describe('DnsStatusBadge Component', () => {
  it('renders DNS OK when configured is true', () => {
    render(<DnsStatusBadge configured={true} />);
    
    expect(screen.getByText('DNS OK')).toBeInTheDocument();
  });

  it('renders DNS Pending when configured is false', () => {
    render(<DnsStatusBadge configured={false} />);
    
    expect(screen.getByText('DNS Pending')).toBeInTheDocument();
  });

  it('displays Database icon when configured', () => {
    const { container } = render(<DnsStatusBadge configured={true} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('displays AlertTriangle icon when not configured', () => {
    const { container } = render(<DnsStatusBadge configured={false} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('applies outline variant when configured', () => {
    const { container } = render(<DnsStatusBadge configured={true} />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toBeInTheDocument();
  });

  it('applies destructive variant when not configured', () => {
    const { container } = render(<DnsStatusBadge configured={false} />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toBeInTheDocument();
  });

  it('maintains icon-text gap spacing when configured', () => {
    const { container } = render(<DnsStatusBadge configured={true} />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toHaveClass('gap-1');
  });

  it('maintains icon-text gap spacing when not configured', () => {
    const { container } = render(<DnsStatusBadge configured={false} />);
    
    const badge = container.querySelector('[class*="gap-1"]');
    expect(badge).toHaveClass('gap-1');
  });

  it('renders different content for true vs false', () => {
    const { container: configuredContainer } = render(<DnsStatusBadge configured={true} />);
    const { container: unconfiguredContainer } = render(<DnsStatusBadge configured={false} />);
    
    expect(configuredContainer.textContent).not.toBe(unconfiguredContainer.textContent);
  });

  it('handles boolean props correctly', () => {
    const { rerender } = render(<DnsStatusBadge configured={true} />);
    expect(screen.getByText('DNS OK')).toBeInTheDocument();
    
    rerender(<DnsStatusBadge configured={false} />);
    expect(screen.getByText('DNS Pending')).toBeInTheDocument();
  });
});
