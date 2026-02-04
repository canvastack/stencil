import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QuoteItemSpecificationsDisplay } from '../QuoteItemSpecifications';
import type { QuoteItemSpecifications, QuoteItemFormSchema } from '@/services/tenant/quoteService';

describe('QuoteItemSpecificationsDisplay', () => {
  const sampleSpecifications: QuoteItemSpecifications = {
    jenis_plakat: 'Plakat Logam',
    jenis_logam: 'Stainless Steel 304 (Anti Karat)',
    ketebalan_plat: '2mm',
    ukuran_plakat: '30x40cm',
    text_engraving: '30 Years Beyond Partnership',
    finishing: 'Polished',
  };

  const sampleFormSchema: QuoteItemFormSchema = {
    fields: [
      {
        name: 'jenis_plakat',
        label: 'Jenis Plakat',
        type: 'select',
        options: ['Plakat Logam', 'Plakat Akrilik', 'Plakat Kayu'],
      },
      {
        name: 'jenis_logam',
        label: 'Jenis Logam',
        type: 'radio',
        options: [
          'Stainless Steel 304 (Anti Karat)',
          'Stainless Steel 316 (Marine Grade)',
          'Kuningan Emas (Brass Gold)',
          'Kuningan Antik (Brass Antique)',
        ],
      },
      {
        name: 'ketebalan_plat',
        label: 'Ketebalan Plat',
        type: 'select',
        options: ['1mm', '2mm', '3mm', '5mm'],
      },
      {
        name: 'ukuran_plakat',
        label: 'Ukuran Plakat',
        type: 'text',
      },
      {
        name: 'text_engraving',
        label: 'Text untuk Engraving',
        type: 'textarea',
      },
      {
        name: 'finishing',
        label: 'Finishing',
        type: 'select',
        options: ['Polished', 'Brushed', 'Matte'],
      },
    ],
  };

  it('renders nothing when specifications are empty', () => {
    const { container } = render(
      <QuoteItemSpecificationsDisplay specifications={{}} />
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders collapsed by default', () => {
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={sampleSpecifications}
        formSchema={sampleFormSchema}
      />
    );
    
    expect(screen.getByText('Product Specifications')).toBeInTheDocument();
    expect(screen.getByText('(6 fields)')).toBeInTheDocument();
    
    // Content should not be visible when collapsed
    expect(screen.queryByText('Plakat Logam')).not.toBeInTheDocument();
  });

  it('expands when header is clicked', () => {
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={sampleSpecifications}
        formSchema={sampleFormSchema}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    expect(header).toBeInTheDocument();
    
    if (header) {
      fireEvent.click(header);
    }
    
    // Content should now be visible
    expect(screen.getByText('Plakat Logam')).toBeInTheDocument();
    expect(screen.getByText('Stainless Steel 304 (Anti Karat)')).toBeInTheDocument();
    expect(screen.getByText('2mm')).toBeInTheDocument();
    expect(screen.getByText('30x40cm')).toBeInTheDocument();
    expect(screen.getByText('30 Years Beyond Partnership')).toBeInTheDocument();
    expect(screen.getByText('Polished')).toBeInTheDocument();
  });

  it('uses form schema labels when available', () => {
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={sampleSpecifications}
        formSchema={sampleFormSchema}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    if (header) {
      fireEvent.click(header);
    }
    
    // Check that labels from form schema are used
    expect(screen.getByText('Jenis Plakat')).toBeInTheDocument();
    expect(screen.getByText('Jenis Logam')).toBeInTheDocument();
    expect(screen.getByText('Ketebalan Plat')).toBeInTheDocument();
    expect(screen.getByText('Ukuran Plakat')).toBeInTheDocument();
    expect(screen.getByText('Text untuk Engraving')).toBeInTheDocument();
    expect(screen.getByText('Finishing')).toBeInTheDocument();
  });

  it('uses field name as label when form schema is not provided', () => {
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={sampleSpecifications}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    if (header) {
      fireEvent.click(header);
    }
    
    // Check that field names are used as labels
    expect(screen.getByText('jenis_plakat')).toBeInTheDocument();
    expect(screen.getByText('jenis_logam')).toBeInTheDocument();
    expect(screen.getByText('ketebalan_plat')).toBeInTheDocument();
  });

  it('formats boolean values correctly', () => {
    const specsWithBoolean: QuoteItemSpecifications = {
      is_urgent: true,
      requires_approval: false,
    };
    
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={specsWithBoolean}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    if (header) {
      fireEvent.click(header);
    }
    
    expect(screen.getByText('Yes')).toBeInTheDocument();
    expect(screen.getByText('No')).toBeInTheDocument();
  });

  it('formats null/undefined values correctly', () => {
    const specsWithNull: QuoteItemSpecifications = {
      optional_field: null as any,
      another_field: undefined as any,
    };
    
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={specsWithNull}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    if (header) {
      fireEvent.click(header);
    }
    
    const notSpecifiedElements = screen.getAllByText('Not specified');
    expect(notSpecifiedElements).toHaveLength(2);
  });

  it('toggles between expanded and collapsed states', () => {
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={sampleSpecifications}
        formSchema={sampleFormSchema}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    expect(header).toBeInTheDocument();
    
    if (header) {
      // Initially collapsed
      expect(screen.queryByText('Plakat Logam')).not.toBeInTheDocument();
      
      // Click to expand
      fireEvent.click(header);
      expect(screen.getByText('Plakat Logam')).toBeInTheDocument();
      
      // Click to collapse
      fireEvent.click(header);
      expect(screen.queryByText('Plakat Logam')).not.toBeInTheDocument();
    }
  });

  it('displays correct field count', () => {
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={sampleSpecifications}
        formSchema={sampleFormSchema}
      />
    );
    
    expect(screen.getByText('(6 fields)')).toBeInTheDocument();
  });

  it('handles numeric values correctly', () => {
    const specsWithNumbers: QuoteItemSpecifications = {
      quantity: 10,
      weight: 2.5,
    };
    
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={specsWithNumbers}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    if (header) {
      fireEvent.click(header);
    }
    
    expect(screen.getByText('10')).toBeInTheDocument();
    expect(screen.getByText('2.5')).toBeInTheDocument();
  });

  it('expands when Enter key is pressed', () => {
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={sampleSpecifications}
        formSchema={sampleFormSchema}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    expect(header).toBeInTheDocument();
    
    if (header) {
      // Initially collapsed
      expect(screen.queryByText('Plakat Logam')).not.toBeInTheDocument();
      
      // Press Enter to expand
      fireEvent.keyDown(header, { key: 'Enter', code: 'Enter' });
      expect(screen.getByText('Plakat Logam')).toBeInTheDocument();
    }
  });

  it('expands when Space key is pressed', () => {
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={sampleSpecifications}
        formSchema={sampleFormSchema}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    expect(header).toBeInTheDocument();
    
    if (header) {
      // Initially collapsed
      expect(screen.queryByText('Plakat Logam')).not.toBeInTheDocument();
      
      // Press Space to expand
      fireEvent.keyDown(header, { key: ' ', code: 'Space' });
      expect(screen.getByText('Plakat Logam')).toBeInTheDocument();
    }
  });

  it('has correct ARIA attributes', () => {
    render(
      <QuoteItemSpecificationsDisplay 
        specifications={sampleSpecifications}
        formSchema={sampleFormSchema}
      />
    );
    
    const header = screen.getByText('Product Specifications').closest('div')?.parentElement;
    expect(header).toBeInTheDocument();
    
    if (header) {
      // Check ARIA attributes
      expect(header).toHaveAttribute('role', 'button');
      expect(header).toHaveAttribute('aria-expanded', 'false');
      expect(header).toHaveAttribute('tabIndex', '0');
      
      // Expand and check again
      fireEvent.click(header);
      expect(header).toHaveAttribute('aria-expanded', 'true');
    }
  });
});
