import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import userEvent from '@testing-library/user-event';
import { QuoteItemCalculations } from '../QuoteItemCalculations';
import { QuoteItemSpecificationsDisplay } from '../QuoteItemSpecifications';

expect.extend(toHaveNoViolations);

describe('QuoteItemCalculations - Accessibility', () => {
  const defaultProps = {
    quantity: 2,
    unitPrice: 3114510,
    vendorCost: 250000,
    totalUnitPrice: 6229020,
    totalVendorCost: 500000,
    profitPerPiece: 2864510,
    profitPerPiecePercent: 1145.8,
    profitTotal: 5729020,
    profitTotalPercent: 1145.8,
  };

  it('should have no accessibility violations', async () => {
    const { container } = render(<QuoteItemCalculations {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper ARIA labels for calculated fields', () => {
    render(<QuoteItemCalculations {...defaultProps} />);
    
    // Check for ARIA labels on calculated values
    expect(screen.getByLabelText(/vendor cost per piece/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/unit price per piece/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/profit margin per piece/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total vendor cost for 2 items/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total unit price for 2 items/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/total profit for 2 items/i)).toBeInTheDocument();
  });

  it('should have proper region role and label', () => {
    render(<QuoteItemCalculations {...defaultProps} />);
    
    const region = screen.getByRole('region', { name: /pricing breakdown and profit calculations/i });
    expect(region).toBeInTheDocument();
  });

  it('should have proper group roles for sections', () => {
    render(<QuoteItemCalculations {...defaultProps} />);
    
    const groups = screen.getAllByRole('group');
    expect(groups.length).toBeGreaterThanOrEqual(2); // Per-piece and Total sections
  });

  it('should hide decorative icons from screen readers', () => {
    const { container } = render(<QuoteItemCalculations {...defaultProps} />);
    
    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have proper heading hierarchy', () => {
    render(<QuoteItemCalculations {...defaultProps} />);
    
    expect(screen.getByRole('heading', { level: 4, name: /per piece/i })).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 4, name: /total \(qty: 2\)/i })).toBeInTheDocument();
  });
});

describe('QuoteItemSpecificationsDisplay - Accessibility', () => {
  const specifications = {
    jenis_plakat: 'Plakat Logam',
    jenis_logam: 'Stainless Steel 304',
    ketebalan_plat: '2mm',
    ukuran_plakat: '30x40cm',
  };

  const formSchema = {
    fields: [
      { name: 'jenis_plakat', label: 'Jenis Plakat', type: 'select' as const },
      { name: 'jenis_logam', label: 'Jenis Logam', type: 'radio' as const },
      { name: 'ketebalan_plat', label: 'Ketebalan Plat', type: 'select' as const },
      { name: 'ukuran_plakat', label: 'Ukuran Plakat', type: 'text' as const },
    ],
  };

  it('should have no accessibility violations when collapsed', async () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have no accessibility violations when expanded', async () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />
    );
    
    const button = screen.getByRole('button', { name: /product specifications/i });
    await userEvent.click(button);
    
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have proper button role and ARIA attributes', () => {
    render(<QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveAttribute('aria-controls', 'specifications-content');
    expect(button).toHaveAttribute('tabIndex', '0');
  });

  it('should update aria-expanded when toggled', async () => {
    render(<QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />);
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
  });

  it('should be keyboard navigable with Enter key', async () => {
    render(<QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />);
    
    const button = screen.getByRole('button');
    button.focus();
    
    await userEvent.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    await userEvent.keyboard('{Enter}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should be keyboard navigable with Space key', async () => {
    render(<QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />);
    
    const button = screen.getByRole('button');
    button.focus();
    
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'true');
    
    await userEvent.keyboard(' ');
    expect(button).toHaveAttribute('aria-expanded', 'false');
  });

  it('should have proper region role and label', () => {
    render(<QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />);
    
    const region = screen.getByRole('region', { name: /product specifications/i });
    expect(region).toBeInTheDocument();
  });

  it('should have proper ARIA labels for specification count', () => {
    render(<QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />);
    
    expect(screen.getByLabelText(/4 specification fields/i)).toBeInTheDocument();
  });

  it('should hide decorative icons from screen readers', () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />
    );
    
    const icons = container.querySelectorAll('[aria-hidden="true"]');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('should have proper group role for expanded content', async () => {
    render(<QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    const group = screen.getByRole('group', { name: /specification details/i });
    expect(group).toBeInTheDocument();
  });

  it('should have proper label associations for specification fields', async () => {
    render(<QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />);
    
    const button = screen.getByRole('button');
    await userEvent.click(button);
    
    // Check that each specification has proper label association
    const labels = screen.getAllByRole('term');
    expect(labels.length).toBe(4);
    
    labels.forEach((label) => {
      expect(label).toHaveAttribute('id');
    });
  });

  it('should maintain focus management', async () => {
    render(<QuoteItemSpecificationsDisplay specifications={specifications} formSchema={formSchema} />);
    
    const button = screen.getByRole('button');
    button.focus();
    
    expect(document.activeElement).toBe(button);
    
    await userEvent.keyboard('{Enter}');
    // Button should still be focusable after expansion
    expect(button).toHaveAttribute('tabIndex', '0');
  });
});

describe('Color Contrast - Accessibility', () => {
  it('should use sufficient color contrast for profit indicators', () => {
    const { container } = render(
      <QuoteItemCalculations
        quantity={1}
        unitPrice={100000}
        vendorCost={50000}
        totalUnitPrice={100000}
        totalVendorCost={50000}
        profitPerPiece={50000}
        profitPerPiecePercent={100}
        profitTotal={50000}
        profitTotalPercent={100}
      />
    );
    
    // Check that profit values have proper color classes
    const profitElements = container.querySelectorAll('.text-green-600, .dark\\:text-green-400');
    expect(profitElements.length).toBeGreaterThan(0);
  });
});

describe('Tab Order - Accessibility', () => {
  it('should have proper tab order for specifications button', () => {
    render(
      <QuoteItemSpecificationsDisplay
        specifications={{ field1: 'value1' }}
        formSchema={{ fields: [{ name: 'field1', label: 'Field 1', type: 'text' }] }}
      />
    );
    
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('tabIndex', '0');
  });

  it('should maintain logical tab order in calculations component', () => {
    const { container } = render(
      <QuoteItemCalculations
        quantity={2}
        unitPrice={100000}
        vendorCost={50000}
        totalUnitPrice={200000}
        totalVendorCost={100000}
        profitPerPiece={50000}
        profitPerPiecePercent={100}
        profitTotal={100000}
        profitTotalPercent={100}
      />
    );
    
    // Calculations component should not have interactive elements that need tab order
    const interactiveElements = container.querySelectorAll('button, a, input, select, textarea');
    expect(interactiveElements.length).toBe(0);
  });
});
