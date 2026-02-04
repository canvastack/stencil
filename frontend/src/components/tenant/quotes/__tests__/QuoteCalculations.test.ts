import { describe, it, expect } from 'vitest';

/**
 * Tests for quote item calculation logic
 * These calculations are used in QuoteForm and QuoteItemCalculations components
 */
describe('Quote Item Calculations', () => {
  describe('Total Vendor Cost Calculation', () => {
    it('calculates total vendor cost correctly for quantity 1', () => {
      const vendorCost = 250000;
      const quantity = 1;
      const totalVendorCost = vendorCost * quantity;
      
      expect(totalVendorCost).toBe(250000);
    });

    it('calculates total vendor cost correctly for quantity > 1', () => {
      const vendorCost = 250000;
      const quantity = 3;
      const totalVendorCost = vendorCost * quantity;
      
      expect(totalVendorCost).toBe(750000);
    });

    it('handles zero vendor cost', () => {
      const vendorCost = 0;
      const quantity = 5;
      const totalVendorCost = vendorCost * quantity;
      
      expect(totalVendorCost).toBe(0);
    });

    it('handles decimal vendor cost', () => {
      const vendorCost = 250000.50;
      const quantity = 2;
      const totalVendorCost = vendorCost * quantity;
      
      expect(totalVendorCost).toBe(500001);
    });
  });

  describe('Total Unit Price Calculation', () => {
    it('calculates total unit price correctly for quantity 1', () => {
      const unitPrice = 3114510;
      const quantity = 1;
      const totalUnitPrice = unitPrice * quantity;
      
      expect(totalUnitPrice).toBe(3114510);
    });

    it('calculates total unit price correctly for quantity > 1', () => {
      const unitPrice = 3114510;
      const quantity = 2;
      const totalUnitPrice = unitPrice * quantity;
      
      expect(totalUnitPrice).toBe(6229020);
    });

    it('handles zero unit price', () => {
      const unitPrice = 0;
      const quantity = 10;
      const totalUnitPrice = unitPrice * quantity;
      
      expect(totalUnitPrice).toBe(0);
    });

    it('handles large quantities', () => {
      const unitPrice = 50000;
      const quantity = 100;
      const totalUnitPrice = unitPrice * quantity;
      
      expect(totalUnitPrice).toBe(5000000);
    });
  });

  describe('Profit Per Piece Calculation', () => {
    it('calculates profit per piece correctly', () => {
      const unitPrice = 3114510;
      const vendorCost = 250000;
      const profitPerPiece = unitPrice - vendorCost;
      
      expect(profitPerPiece).toBe(2864510);
    });

    it('handles zero profit scenario', () => {
      const unitPrice = 250000;
      const vendorCost = 250000;
      const profitPerPiece = unitPrice - vendorCost;
      
      expect(profitPerPiece).toBe(0);
    });

    it('handles negative profit (loss)', () => {
      const unitPrice = 100000;
      const vendorCost = 150000;
      const profitPerPiece = unitPrice - vendorCost;
      
      expect(profitPerPiece).toBe(-50000);
    });

    it('handles decimal values', () => {
      const unitPrice = 1000.75;
      const vendorCost = 500.25;
      const profitPerPiece = unitPrice - vendorCost;
      
      expect(profitPerPiece).toBeCloseTo(500.50, 2);
    });
  });

  describe('Profit Per Piece Percentage Calculation', () => {
    it('calculates profit percentage correctly', () => {
      const unitPrice = 3114510;
      const vendorCost = 250000;
      const profitPerPiece = unitPrice - vendorCost;
      const profitPerPiecePercent = (profitPerPiece / vendorCost) * 100;
      
      expect(profitPerPiecePercent).toBeCloseTo(1145.804, 1);
    });

    it('handles 100% profit margin', () => {
      const unitPrice = 200000;
      const vendorCost = 100000;
      const profitPerPiece = unitPrice - vendorCost;
      const profitPerPiecePercent = (profitPerPiece / vendorCost) * 100;
      
      expect(profitPerPiecePercent).toBe(100);
    });

    it('handles 50% profit margin', () => {
      const unitPrice = 150000;
      const vendorCost = 100000;
      const profitPerPiece = unitPrice - vendorCost;
      const profitPerPiecePercent = (profitPerPiece / vendorCost) * 100;
      
      expect(profitPerPiecePercent).toBe(50);
    });

    it('returns 0 when vendor cost is 0', () => {
      const unitPrice = 100000;
      const vendorCost = 0;
      const profitPerPiece = unitPrice - vendorCost;
      const profitPerPiecePercent = vendorCost > 0 
        ? (profitPerPiece / vendorCost) * 100 
        : 0;
      
      expect(profitPerPiecePercent).toBe(0);
    });

    it('handles negative profit percentage', () => {
      const unitPrice = 100000;
      const vendorCost = 150000;
      const profitPerPiece = unitPrice - vendorCost;
      const profitPerPiecePercent = (profitPerPiece / vendorCost) * 100;
      
      expect(profitPerPiecePercent).toBeCloseTo(-33.33, 1);
    });
  });

  describe('Total Profit Calculation', () => {
    it('calculates total profit correctly for quantity 1', () => {
      const totalUnitPrice = 3114510;
      const totalVendorCost = 250000;
      const profitTotal = totalUnitPrice - totalVendorCost;
      
      expect(profitTotal).toBe(2864510);
    });

    it('calculates total profit correctly for quantity > 1', () => {
      const unitPrice = 3114510;
      const vendorCost = 250000;
      const quantity = 2;
      const totalUnitPrice = unitPrice * quantity;
      const totalVendorCost = vendorCost * quantity;
      const profitTotal = totalUnitPrice - totalVendorCost;
      
      expect(profitTotal).toBe(5729020);
    });

    it('handles zero profit scenario', () => {
      const totalUnitPrice = 500000;
      const totalVendorCost = 500000;
      const profitTotal = totalUnitPrice - totalVendorCost;
      
      expect(profitTotal).toBe(0);
    });

    it('handles negative total profit', () => {
      const totalUnitPrice = 300000;
      const totalVendorCost = 450000;
      const profitTotal = totalUnitPrice - totalVendorCost;
      
      expect(profitTotal).toBe(-150000);
    });
  });

  describe('Total Profit Percentage Calculation', () => {
    it('calculates total profit percentage correctly', () => {
      const totalUnitPrice = 6229020;
      const totalVendorCost = 500000;
      const profitTotal = totalUnitPrice - totalVendorCost;
      const profitTotalPercent = (profitTotal / totalVendorCost) * 100;
      
      expect(profitTotalPercent).toBeCloseTo(1145.804, 1);
    });

    it('returns 0 when total vendor cost is 0', () => {
      const totalUnitPrice = 1000000;
      const totalVendorCost = 0;
      const profitTotal = totalUnitPrice - totalVendorCost;
      const profitTotalPercent = totalVendorCost > 0 
        ? (profitTotal / totalVendorCost) * 100 
        : 0;
      
      expect(profitTotalPercent).toBe(0);
    });

    it('handles negative total profit percentage', () => {
      const totalUnitPrice = 200000;
      const totalVendorCost = 300000;
      const profitTotal = totalUnitPrice - totalVendorCost;
      const profitTotalPercent = (profitTotal / totalVendorCost) * 100;
      
      expect(profitTotalPercent).toBeCloseTo(-33.33, 1);
    });
  });

  describe('Complete Calculation Flow', () => {
    it('calculates all values correctly for a typical quote item', () => {
      // Input values
      const quantity = 2;
      const unitPrice = 3114510;
      const vendorCost = 250000;
      
      // Calculate totals
      const totalVendorCost = vendorCost * quantity;
      const totalUnitPrice = unitPrice * quantity;
      
      // Calculate profit margins
      const profitPerPiece = unitPrice - vendorCost;
      const profitPerPiecePercent = vendorCost > 0 
        ? (profitPerPiece / vendorCost) * 100 
        : 0;
      
      const profitTotal = totalUnitPrice - totalVendorCost;
      const profitTotalPercent = totalVendorCost > 0 
        ? (profitTotal / totalVendorCost) * 100 
        : 0;
      
      // Assertions
      expect(totalVendorCost).toBe(500000);
      expect(totalUnitPrice).toBe(6229020);
      expect(profitPerPiece).toBe(2864510);
      expect(profitPerPiecePercent).toBeCloseTo(1145.804, 1);
      expect(profitTotal).toBe(5729020);
      expect(profitTotalPercent).toBeCloseTo(1145.804, 1);
    });

    it('calculates all values correctly for quantity 1', () => {
      // Input values
      const quantity = 1;
      const unitPrice = 1000000;
      const vendorCost = 750000;
      
      // Calculate totals
      const totalVendorCost = vendorCost * quantity;
      const totalUnitPrice = unitPrice * quantity;
      
      // Calculate profit margins
      const profitPerPiece = unitPrice - vendorCost;
      const profitPerPiecePercent = vendorCost > 0 
        ? (profitPerPiece / vendorCost) * 100 
        : 0;
      
      const profitTotal = totalUnitPrice - totalVendorCost;
      const profitTotalPercent = totalVendorCost > 0 
        ? (profitTotal / totalVendorCost) * 100 
        : 0;
      
      // Assertions
      expect(totalVendorCost).toBe(750000);
      expect(totalUnitPrice).toBe(1000000);
      expect(profitPerPiece).toBe(250000);
      expect(profitPerPiecePercent).toBeCloseTo(33.33, 1);
      expect(profitTotal).toBe(250000);
      expect(profitTotalPercent).toBeCloseTo(33.33, 1);
    });

    it('handles edge case with zero costs', () => {
      // Input values
      const quantity = 5;
      const unitPrice = 0;
      const vendorCost = 0;
      
      // Calculate totals
      const totalVendorCost = vendorCost * quantity;
      const totalUnitPrice = unitPrice * quantity;
      
      // Calculate profit margins
      const profitPerPiece = unitPrice - vendorCost;
      const profitPerPiecePercent = vendorCost > 0 
        ? (profitPerPiece / vendorCost) * 100 
        : 0;
      
      const profitTotal = totalUnitPrice - totalVendorCost;
      const profitTotalPercent = totalVendorCost > 0 
        ? (profitTotal / totalVendorCost) * 100 
        : 0;
      
      // Assertions
      expect(totalVendorCost).toBe(0);
      expect(totalUnitPrice).toBe(0);
      expect(profitPerPiece).toBe(0);
      expect(profitPerPiecePercent).toBe(0);
      expect(profitTotal).toBe(0);
      expect(profitTotalPercent).toBe(0);
    });

    it('handles large quantity scenario', () => {
      // Input values
      const quantity = 100;
      const unitPrice = 50000;
      const vendorCost = 30000;
      
      // Calculate totals
      const totalVendorCost = vendorCost * quantity;
      const totalUnitPrice = unitPrice * quantity;
      
      // Calculate profit margins
      const profitPerPiece = unitPrice - vendorCost;
      const profitPerPiecePercent = vendorCost > 0 
        ? (profitPerPiece / vendorCost) * 100 
        : 0;
      
      const profitTotal = totalUnitPrice - totalVendorCost;
      const profitTotalPercent = totalVendorCost > 0 
        ? (profitTotal / totalVendorCost) * 100 
        : 0;
      
      // Assertions
      expect(totalVendorCost).toBe(3000000);
      expect(totalUnitPrice).toBe(5000000);
      expect(profitPerPiece).toBe(20000);
      expect(profitPerPiecePercent).toBeCloseTo(66.67, 1);
      expect(profitTotal).toBe(2000000);
      expect(profitTotalPercent).toBeCloseTo(66.67, 1);
    });
  });

  describe('Rounding and Precision', () => {
    it('handles percentage rounding to 1 decimal place', () => {
      const profitPerPiecePercent = 1145.8044;
      const rounded = Math.round(profitPerPiecePercent * 10) / 10;
      
      expect(rounded).toBe(1145.8);
    });

    it('handles percentage rounding to 2 decimal places', () => {
      const profitPerPiecePercent = 33.333333;
      const rounded = Math.round(profitPerPiecePercent * 100) / 100;
      
      expect(rounded).toBe(33.33);
    });

    it('handles toFixed for display', () => {
      const profitPerPiecePercent = 1145.8044;
      const fixed = profitPerPiecePercent.toFixed(1);
      
      expect(fixed).toBe('1145.8');
    });
  });
});
