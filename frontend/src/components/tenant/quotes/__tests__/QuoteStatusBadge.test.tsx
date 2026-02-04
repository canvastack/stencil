import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteStatusBadge, isQuoteReadOnly, isQuoteActive, getQuoteStatusConfig } from '../QuoteStatusBadge';

describe('QuoteStatusBadge', () => {
  it('renders draft status correctly', () => {
    render(<QuoteStatusBadge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders open status correctly', () => {
    render(<QuoteStatusBadge status="open" />);
    expect(screen.getByText('Open')).toBeInTheDocument();
  });

  it('shows read-only indicator for accepted status', () => {
    render(<QuoteStatusBadge status="accepted" showIndicator={true} />);
    expect(screen.getByText('Read-Only')).toBeInTheDocument();
  });

  it('shows active indicator for open status', () => {
    render(<QuoteStatusBadge status="open" showIndicator={true} />);
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('isQuoteReadOnly returns true for accepted status', () => {
    expect(isQuoteReadOnly('accepted')).toBe(true);
  });

  it('isQuoteActive returns true for open status', () => {
    expect(isQuoteActive('open')).toBe(true);
  });

  it('getQuoteStatusConfig returns correct config', () => {
    const config = getQuoteStatusConfig('draft');
    expect(config.label).toBe('Draft');
    expect(config.color).toBe('secondary');
  });
});
