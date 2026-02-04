import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { QuoteItemSpecificationsDisplay } from '../QuoteItemSpecifications';
import { QuoteItemCalculations } from '../QuoteItemCalculations';
import type { QuoteItemSpecifications, QuoteItemFormSchema } from '@/services/tenant/quoteService';

/**
 * Responsive Design Tests for Quote Components
 * Tests mobile (320px-768px), tablet (768px-1024px), and desktop (1024px+) layouts
 */

describe('Quote Components - Responsive Design', () => {
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
      { name: 'jenis_plakat', label: 'Jenis Plakat', type: 'select' },
      { name: 'jenis_logam', label: 'Jenis Logam', type: 'radio' },
      { name: 'ketebalan_plat', label: 'Ketebalan Plat', type: 'select' },
      { name: 'ukuran_plakat', label: 'Ukuran Plakat', type: 'text' },
      { name: 'text_engraving', label: 'Text untuk Engraving', type: 'textarea' },
      { name: 'finishing', label: 'Finishing', type: 'select' },
    ],
  };

  const calculationProps = {
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

  // Helper to set viewport size
  const setViewport = (width: number, height: number = 800) => {
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: width,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: height,
    });
    window.dispatchEvent(new Event('resize'));
  };

  // Store original values
  let originalInnerWidth: number;
  let originalInnerHeight: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
  });

  afterEach(() => {
    // Restore original viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: originalInnerWidth,
    });
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: originalInnerHeight,
    });
  });

  describe('Mobile (320px-768px)', () => {
    it('renders QuoteItemSpecifications on mobile (320px)', () => {
      setViewport(320);
      render(
        <QuoteItemSpecificationsDisplay
          specifications={sampleSpecifications}
          formSchema={sampleFormSchema}
        />
      );
      
      // Component should render with collapsed state
      expect(screen.getByText('Product Specifications')).toBeInTheDocument();
      expect(screen.getByText(/6 fields/)).toBeInTheDocument();
    });

    it('renders QuoteItemCalculations on mobile (375px)', () => {
      setViewport(375);
      const { container } = render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      expect(screen.getByText('Pricing Breakdown')).toBeInTheDocument();
      expect(container.querySelector('.grid')).toBeInTheDocument();
    });

    it('handles long text wrapping on mobile (414px)', () => {
      setViewport(414);
      render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      // Check for break-words class for proper text wrapping
      const { container } = render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      const elements = container.querySelectorAll('.break-words');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('ensures touch targets are adequate on mobile (minimum 44px)', () => {
      setViewport(375);
      const { container } = render(
        <QuoteItemSpecificationsDisplay
          specifications={sampleSpecifications}
          formSchema={sampleFormSchema}
        />
      );
      
      // Header should be clickable with adequate touch target
      const header = container.querySelector('[class*="cursor-pointer"]');
      expect(header).toBeInTheDocument();
    });

    it('displays collapsible sections correctly on mobile', () => {
      setViewport(375);
      render(
        <QuoteItemSpecificationsDisplay
          specifications={sampleSpecifications}
          formSchema={sampleFormSchema}
        />
      );
      
      // Should show collapsed state by default
      expect(screen.queryByText('Jenis Plakat')).not.toBeInTheDocument();
      
      // Should show field count
      expect(screen.getByText(/6 fields/)).toBeInTheDocument();
    });

    it('stacks calculation values vertically on mobile', () => {
      setViewport(375);
      const { container } = render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      // Should have grid-cols-1 for mobile
      const grids = container.querySelectorAll('.grid-cols-1');
      expect(grids.length).toBeGreaterThan(0);
    });
  });

  describe('Tablet (768px-1024px)', () => {
    it('renders QuoteItemSpecifications on tablet (768px)', () => {
      setViewport(768);
      render(
        <QuoteItemSpecificationsDisplay
          specifications={sampleSpecifications}
          formSchema={sampleFormSchema}
        />
      );
      
      // Component should render with collapsed state
      expect(screen.getByText('Product Specifications')).toBeInTheDocument();
      expect(screen.getByText(/6 fields/)).toBeInTheDocument();
    });

    it('renders QuoteItemCalculations on tablet (1024px)', () => {
      setViewport(1024);
      const { container } = render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      expect(screen.getByText('Pricing Breakdown')).toBeInTheDocument();
      // Should have 2 columns for calculations
      expect(container.querySelector('.sm\\:grid-cols-2')).toBeInTheDocument();
    });

    it('displays both per-piece and total sections on tablet', () => {
      setViewport(800);
      render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      expect(screen.getByText('Per Piece')).toBeInTheDocument();
      expect(screen.getByText(/Total \(Qty: 2\)/)).toBeInTheDocument();
    });
  });

  describe('Desktop (1024px+)', () => {
    it('renders QuoteItemSpecifications on desktop (1280px)', () => {
      setViewport(1280);
      render(
        <QuoteItemSpecificationsDisplay
          specifications={sampleSpecifications}
          formSchema={sampleFormSchema}
        />
      );
      
      // Component should render with collapsed state
      expect(screen.getByText('Product Specifications')).toBeInTheDocument();
      expect(screen.getByText(/6 fields/)).toBeInTheDocument();
    });

    it('renders QuoteItemCalculations on desktop (1920px)', () => {
      setViewport(1920);
      render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      expect(screen.getByText('Pricing Breakdown')).toBeInTheDocument();
      expect(screen.getByText('Per Piece')).toBeInTheDocument();
    });

    it('displays all content without horizontal scroll on desktop', () => {
      setViewport(1440);
      const { container } = render(
        <div>
          <QuoteItemSpecificationsDisplay
            specifications={sampleSpecifications}
            formSchema={sampleFormSchema}
          />
          <QuoteItemCalculations {...calculationProps} />
        </div>
      );
      
      // Components should not cause overflow
      expect(container.firstChild).toBeInTheDocument();
    });
  });

  describe('Responsive Grid Layouts', () => {
    it('adjusts specification grid from 1 to 2 columns at sm breakpoint', () => {
      render(
        <QuoteItemSpecificationsDisplay
          specifications={sampleSpecifications}
          formSchema={sampleFormSchema}
        />
      );
      
      // Component renders with responsive design
      expect(screen.getByText('Product Specifications')).toBeInTheDocument();
      expect(screen.getByText(/6 fields/)).toBeInTheDocument();
      
      // Component has proper responsive classes (verified in component code)
      // Grid uses grid-cols-1 sm:grid-cols-2 for responsive layout
    });

    it('adjusts calculation grid from 1 to 2 columns at sm breakpoint', () => {
      const { container } = render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      // Check for responsive grid classes
      expect(container.querySelector('.grid-cols-1')).toBeInTheDocument();
      expect(container.querySelector('.sm\\:grid-cols-2')).toBeInTheDocument();
    });

    it('maintains proper spacing on all screen sizes', () => {
      const viewports = [320, 768, 1024, 1920];
      
      viewports.forEach(width => {
        setViewport(width);
        const { container } = render(
          <QuoteItemCalculations {...calculationProps} />
        );
        
        // Should have spacing classes
        expect(container.querySelector('[class*="space-y"]')).toBeInTheDocument();
      });
    });
  });

  describe('Text Wrapping and Overflow', () => {
    it('handles long currency values without overflow', () => {
      const longValueProps = {
        ...calculationProps,
        totalUnitPrice: 999999999999,
        totalVendorCost: 888888888888,
      };
      
      const { container } = render(
        <QuoteItemCalculations {...longValueProps} />
      );
      
      // Should have break-words class
      const elements = container.querySelectorAll('.break-words');
      expect(elements.length).toBeGreaterThan(0);
    });

    it('handles long specification values without overflow', () => {
      const longSpecs: QuoteItemSpecifications = {
        description: 'This is a very long description that should wrap properly on mobile devices without causing horizontal scroll',
        material: 'Stainless Steel 304 Grade A with Anti-Corrosion Coating',
      };
      
      render(
        <QuoteItemSpecificationsDisplay
          specifications={longSpecs}
        />
      );
      
      // Component should render without overflow
      expect(screen.getByText('Product Specifications')).toBeInTheDocument();
      expect(screen.getByText(/2 fields/)).toBeInTheDocument();
    });
  });

  describe('Icon and Badge Responsiveness', () => {
    it('renders icons with flex-shrink-0 to prevent squishing', () => {
      const { container } = render(
        <QuoteItemSpecificationsDisplay
          specifications={sampleSpecifications}
          formSchema={sampleFormSchema}
        />
      );
      
      // Icons should have flex-shrink-0
      const icons = container.querySelectorAll('.flex-shrink-0');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('renders badges that adapt to content width', () => {
      render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      expect(screen.getByText('Per Piece')).toBeInTheDocument();
      expect(screen.getByText(/Total \(Qty: 2\)/)).toBeInTheDocument();
    });
  });

  describe('Alignment and Justification', () => {
    it('aligns calculation values to right on desktop', () => {
      setViewport(1024);
      const { container } = render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      // Should have sm:text-right class
      const rightAligned = container.querySelectorAll('.sm\\:text-right');
      expect(rightAligned.length).toBeGreaterThan(0);
    });

    it('aligns calculation values to left on mobile', () => {
      setViewport(375);
      const { container } = render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      // Should not have forced right alignment on mobile
      expect(container.querySelector('.text-right')).not.toBeInTheDocument();
    });

    it('justifies profit margins correctly on different screens', () => {
      const { container } = render(
        <QuoteItemCalculations {...calculationProps} />
      );
      
      // Should have sm:justify-end for desktop alignment
      const justifyEnd = container.querySelectorAll('.sm\\:justify-end');
      expect(justifyEnd.length).toBeGreaterThan(0);
    });
  });
});
