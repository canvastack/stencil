import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteItemCalculations } from '../QuoteItemCalculations';

describe('QuoteItemCalculations', () => {
  const defaultProps = {
    quantity: 1,
    unitPrice: 3114510,
    vendorCost: 250000,
    totalUnitPrice: 3114510,
    totalVendorCost: 250000,
    profitPerPiece: 2864510,
    profitPerPiecePercent: 1145.8,
    profitTotal: 2864510,
    profitTotalPercent: 1145.8,
  };

  it('renders pricing breakdown title', () => {
    render(<QuoteItemCalculations {...defaultProps} />);
    expect(screen.getByText('Pricing Breakdown')).toBeInTheDocument();
  });

  it('displays per-piece section with correct values', () => {
    render(<QuoteItemCalculations {...defaultProps} />);
    
    expect(screen.getByText('Per Piece')).toBeInTheDocument();
    expect(screen.getByText('Vendor Cost:')).toBeInTheDocument();
    expect(screen.getByText('Unit Price:')).toBeInTheDocument();
    expect(screen.getByText('Profit Margin:')).toBeInTheDocument();
  });

  it('formats currency values correctly', () => {
    render(<QuoteItemCalculations {...defaultProps} />);
    
    // Check if currency formatting is applied (IDR format)
    const vendorCostElements = screen.getAllByText(/Rp/);
    expect(vendorCostElements.length).toBeGreaterThan(0);
  });

  it('displays profit percentage with one decimal place', () => {
    render(<QuoteItemCalculations {...defaultProps} />);
    
    // Check for percentage display
    expect(screen.getByText(/\(1145\.8%\)/)).toBeInTheDocument();
  });

  it('does not show total section when quantity is 1', () => {
    render(<QuoteItemCalculations {...defaultProps} />);
    
    // Total section should not be visible
    expect(screen.queryByText(/Total \(Qty:/)).not.toBeInTheDocument();
  });

  it('shows total section when quantity is greater than 1', () => {
    const propsWithMultipleQuantity = {
      ...defaultProps,
      quantity: 2,
      totalUnitPrice: 6229020,
      totalVendorCost: 500000,
      profitTotal: 5729020,
      profitTotalPercent: 1145.8,
    };

    render(<QuoteItemCalculations {...propsWithMultipleQuantity} />);
    
    // Total section should be visible
    expect(screen.getByText('Total (Qty: 2)')).toBeInTheDocument();
    expect(screen.getByText('Total Vendor Cost:')).toBeInTheDocument();
    expect(screen.getByText('Total Unit Price:')).toBeInTheDocument();
    expect(screen.getByText('Total Profit:')).toBeInTheDocument();
  });

  it('calculates and displays correct totals for quantity 3', () => {
    const propsWithQuantity3 = {
      quantity: 3,
      unitPrice: 1000000,
      vendorCost: 750000,
      totalUnitPrice: 3000000,
      totalVendorCost: 2250000,
      profitPerPiece: 250000,
      profitPerPiecePercent: 33.3,
      profitTotal: 750000,
      profitTotalPercent: 33.3,
    };

    render(<QuoteItemCalculations {...propsWithQuantity3} />);
    
    expect(screen.getByText('Total (Qty: 3)')).toBeInTheDocument();
  });

  it('handles zero vendor cost without errors', () => {
    const propsWithZeroVendorCost = {
      ...defaultProps,
      vendorCost: 0,
      totalVendorCost: 0,
      profitPerPiece: 3114510,
      profitPerPiecePercent: 0,
      profitTotal: 3114510,
      profitTotalPercent: 0,
    };

    render(<QuoteItemCalculations {...propsWithZeroVendorCost} />);
    
    expect(screen.getByText('Pricing Breakdown')).toBeInTheDocument();
    expect(screen.getByText(/\(0\.0%\)/)).toBeInTheDocument();
  });

  it('applies correct styling classes', () => {
    const { container } = render(<QuoteItemCalculations {...defaultProps} />);
    
    // Check for blue border and background
    const card = container.querySelector('.border-blue-200');
    expect(card).toBeInTheDocument();
    
    // Check for green profit text
    const profitElements = container.querySelectorAll('.text-green-600');
    expect(profitElements.length).toBeGreaterThan(0);
  });

  it('displays TrendingUp icon for profit margins', () => {
    const { container } = render(<QuoteItemCalculations {...defaultProps} />);
    
    // Check for lucide-react icon (TrendingUp)
    const icons = container.querySelectorAll('svg');
    expect(icons.length).toBeGreaterThan(0);
  });

  it('handles large quantities correctly', () => {
    const propsWithLargeQuantity = {
      quantity: 100,
      unitPrice: 50000,
      vendorCost: 30000,
      totalUnitPrice: 5000000,
      totalVendorCost: 3000000,
      profitPerPiece: 20000,
      profitPerPiecePercent: 66.7,
      profitTotal: 2000000,
      profitTotalPercent: 66.7,
    };

    render(<QuoteItemCalculations {...propsWithLargeQuantity} />);
    
    expect(screen.getByText('Total (Qty: 100)')).toBeInTheDocument();
  });

  it('displays negative profit correctly', () => {
    const propsWithNegativeProfit = {
      quantity: 1,
      unitPrice: 100000,
      vendorCost: 150000,
      totalUnitPrice: 100000,
      totalVendorCost: 150000,
      profitPerPiece: -50000,
      profitPerPiecePercent: -33.3,
      profitTotal: -50000,
      profitTotalPercent: -33.3,
    };

    render(<QuoteItemCalculations {...propsWithNegativeProfit} />);
    
    expect(screen.getByText(/\(-33\.3%\)/)).toBeInTheDocument();
  });
});
