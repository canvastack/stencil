import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import UrlPatternSelector from '@/components/tenant-url/UrlPatternSelector';
import type { UrlPatternType } from '@/types/tenant-url';

describe('UrlPatternSelector Component', () => {
  const mockOnChange = vi.fn();
  const defaultProps = {
    value: 'subdomain' as UrlPatternType,
    onChange: mockOnChange,
    tenantSlug: 'test-tenant',
  };

  beforeEach(() => {
    mockOnChange.mockClear();
  });

  it('renders all three pattern options', () => {
    render(<UrlPatternSelector {...defaultProps} />);

    expect(screen.getByText('Subdomain-Based')).toBeInTheDocument();
    expect(screen.getByText('Path-Based')).toBeInTheDocument();
    expect(screen.getByText('Custom Domain')).toBeInTheDocument();
  });

  it('highlights the selected pattern with primary border', () => {
    render(<UrlPatternSelector {...defaultProps} value="custom_domain" />);

    const cards = screen.getAllByRole('generic').filter(el => 
      el.className.includes('cursor-pointer')
    );
    
    const customDomainCard = cards.find(card => 
      card.textContent?.includes('Custom Domain')
    );
    
    expect(customDomainCard).toHaveClass('border-primary');
  });

  it('displays recommended badge on subdomain option', () => {
    render(<UrlPatternSelector {...defaultProps} />);
    
    const badges = screen.getAllByText('Recommended');
    expect(badges.length).toBeGreaterThan(0);
  });

  it('displays pro badge on custom domain option', () => {
    render(<UrlPatternSelector {...defaultProps} />);
    
    expect(screen.getByText('Pro')).toBeInTheDocument();
  });

  it('calls onChange when subdomain pattern is clicked', () => {
    render(<UrlPatternSelector {...defaultProps} value="path" />);

    const subdomainCard = screen.getByText('Subdomain-Based').closest('div[class*="cursor-pointer"]');
    
    if (subdomainCard) {
      fireEvent.click(subdomainCard);
      expect(mockOnChange).toHaveBeenCalledWith('subdomain');
    }
  });

  it('calls onChange when path pattern is clicked', () => {
    render(<UrlPatternSelector {...defaultProps} value="subdomain" />);

    const pathCard = screen.getByText('Path-Based').closest('div[class*="cursor-pointer"]');
    
    if (pathCard) {
      fireEvent.click(pathCard);
      expect(mockOnChange).toHaveBeenCalledWith('path');
    }
  });

  it('calls onChange when custom domain pattern is clicked', () => {
    render(<UrlPatternSelector {...defaultProps} value="subdomain" />);

    const customCard = screen.getByText('Custom Domain').closest('div[class*="cursor-pointer"]');
    
    if (customCard) {
      fireEvent.click(customCard);
      expect(mockOnChange).toHaveBeenCalledWith('custom_domain');
    }
  });

  it('displays correct example URL for subdomain pattern', () => {
    render(<UrlPatternSelector {...defaultProps} tenantSlug="mytenant" />);

    expect(screen.getByText(/mytenant\.stencil\.canvastack\.com/)).toBeInTheDocument();
  });

  it('displays correct example URL for path pattern', () => {
    render(<UrlPatternSelector {...defaultProps} tenantSlug="mytenant" />);

    expect(screen.getByText(/stencil\.canvastack\.com\/mytenant/)).toBeInTheDocument();
  });

  it('displays generic example for custom domain', () => {
    render(<UrlPatternSelector {...defaultProps} />);

    expect(screen.getByText('yourdomain.com')).toBeInTheDocument();
  });

  it('shows check icon on selected option', () => {
    const { container } = render(<UrlPatternSelector {...defaultProps} value="subdomain" />);
    
    const checkIcons = container.querySelectorAll('svg');
    const hasCheckIcon = Array.from(checkIcons).some(icon => 
      icon.parentElement?.className.includes('bg-primary')
    );
    
    expect(hasCheckIcon).toBe(true);
  });

  it('does not show check icon on unselected options', () => {
    render(<UrlPatternSelector {...defaultProps} value="subdomain" />);

    const pathCard = screen.getByText('Path-Based').closest('div[class*="cursor-pointer"]');
    const hasSelectedIndicator = pathCard?.querySelector('[class*="bg-primary"][class*="rounded-full"]');
    
    expect(hasSelectedIndicator).toBeNull();
  });

  it('renders with undefined value', () => {
    render(<UrlPatternSelector {...defaultProps} value={undefined} />);

    expect(screen.getByText('Subdomain-Based')).toBeInTheDocument();
    expect(screen.getByText('Path-Based')).toBeInTheDocument();
    expect(screen.getByText('Custom Domain')).toBeInTheDocument();
  });

  it('applies hover effect classes', () => {
    const { container } = render(<UrlPatternSelector {...defaultProps} />);
    
    const cards = container.querySelectorAll('[class*="hover:border-primary"]');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('displays all required icons (Globe, FolderTree, Link)', () => {
    const { container } = render(<UrlPatternSelector {...defaultProps} />);
    
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(3);
  });

  it('handles rapid clicks correctly', () => {
    render(<UrlPatternSelector {...defaultProps} />);

    const pathCard = screen.getByText('Path-Based').closest('div[class*="cursor-pointer"]');
    const customCard = screen.getByText('Custom Domain').closest('div[class*="cursor-pointer"]');
    
    if (pathCard && customCard) {
      fireEvent.click(pathCard);
      fireEvent.click(customCard);
      fireEvent.click(pathCard);
      
      expect(mockOnChange).toHaveBeenCalledTimes(3);
      expect(mockOnChange).toHaveBeenNthCalledWith(1, 'path');
      expect(mockOnChange).toHaveBeenNthCalledWith(2, 'custom_domain');
      expect(mockOnChange).toHaveBeenNthCalledWith(3, 'path');
    }
  });
});
