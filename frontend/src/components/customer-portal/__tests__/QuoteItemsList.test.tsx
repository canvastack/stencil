/**
 * QuoteItemsList Component Tests
 * 
 * Tests for the QuoteItemsList component that displays order items in customer quotes.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuoteItemsList } from '../QuoteItemsList';

describe('QuoteItemsList', () => {
  const mockItems = [
    {
      product_name: 'Custom Etching Plate',
      quantity: 2,
      unit_price: 150000,
      subtotal: 300000,
      specifications: {
        material: 'stainless_steel',
        dimensions: '10x15cm',
        text_content: 'Company Logo',
      },
    },
    {
      productName: 'Award Plaque',
      quantity: 1,
      price: 250000,
      customization: {
        engraving: 'Best Employee 2024',
        finish: 'gold',
      },
    },
  ];

  it('renders items list with correct count', () => {
    render(<QuoteItemsList items={mockItems} />);
    
    expect(screen.getByText(/Order Items \(2\)/i)).toBeInTheDocument();
  });

  it('displays product names correctly', () => {
    render(<QuoteItemsList items={mockItems} />);
    
    expect(screen.getByText('Custom Etching Plate')).toBeInTheDocument();
    expect(screen.getByText('Award Plaque')).toBeInTheDocument();
  });

  it('displays quantities correctly', () => {
    render(<QuoteItemsList items={mockItems} />);
    
    expect(screen.getByText('Quantity: 2')).toBeInTheDocument();
    expect(screen.getByText('Quantity: 1')).toBeInTheDocument();
  });

  it('displays specifications when available', () => {
    render(<QuoteItemsList items={mockItems} />);
    
    // Both items have specifications, so we should find multiple
    const specificationsLabels = screen.getAllByText(/Specifications:/i);
    expect(specificationsLabels.length).toBeGreaterThan(0);
    
    expect(screen.getByText('stainless_steel')).toBeInTheDocument();
    expect(screen.getByText('Best Employee 2024')).toBeInTheDocument();
  });

  it('handles empty items array', () => {
    render(<QuoteItemsList items={[]} />);
    
    expect(screen.getByText(/No items found in this quote/i)).toBeInTheDocument();
  });

  it('handles different field name variations', () => {
    const itemsWithVariations = [
      {
        name: 'Product A',
        quantity: 1,
        price: 100000,
      },
      {
        product_name: 'Product B',
        quantity: 2,
        unit_price: 200000,
      },
      {
        productName: 'Product C',
        quantity: 3,
        pricing: {
          unit_price: 300000,
          total_price: 900000,
        },
      },
    ];

    render(<QuoteItemsList items={itemsWithVariations} />);
    
    expect(screen.getByText('Product A')).toBeInTheDocument();
    expect(screen.getByText('Product B')).toBeInTheDocument();
    expect(screen.getByText('Product C')).toBeInTheDocument();
  });

  it('calculates and displays items subtotal', () => {
    render(<QuoteItemsList items={mockItems} />);
    
    expect(screen.getByText(/Items Subtotal:/i)).toBeInTheDocument();
  });

  it('displays currency with correct formatting', () => {
    render(<QuoteItemsList items={mockItems} currency="IDR" />);
    
    // Check that currency formatting is applied (IDR format)
    const priceElements = screen.getAllByText(/Rp/i);
    expect(priceElements.length).toBeGreaterThan(0);
  });
});
