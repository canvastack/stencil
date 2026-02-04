import { QuoteItemCalculations } from '../QuoteItemCalculations';

/**
 * Visual Test Cases for QuoteItemCalculations Component
 * 
 * This file provides visual test scenarios for the QuoteItemCalculations component.
 * Run with Storybook or visual regression testing tools.
 */

// Test Case 1: Single Quantity (No Total Section)
export const SingleQuantity = () => (
  <div className="p-8 max-w-2xl">
    <h2 className="text-lg font-bold mb-4">Single Quantity (Qty: 1)</h2>
    <QuoteItemCalculations
      quantity={1}
      unitPrice={3114510}
      vendorCost={250000}
      totalUnitPrice={3114510}
      totalVendorCost={250000}
      profitPerPiece={2864510}
      profitPerPiecePercent={1145.8}
      profitTotal={2864510}
      profitTotalPercent={1145.8}
    />
  </div>
);

// Test Case 2: Multiple Quantity (With Total Section)
export const MultipleQuantity = () => (
  <div className="p-8 max-w-2xl">
    <h2 className="text-lg font-bold mb-4">Multiple Quantity (Qty: 2)</h2>
    <QuoteItemCalculations
      quantity={2}
      unitPrice={3114510}
      vendorCost={250000}
      totalUnitPrice={6229020}
      totalVendorCost={500000}
      profitPerPiece={2864510}
      profitPerPiecePercent={1145.8}
      profitTotal={5729020}
      profitTotalPercent={1145.8}
    />
  </div>
);

// Test Case 3: Large Quantity
export const LargeQuantity = () => (
  <div className="p-8 max-w-2xl">
    <h2 className="text-lg font-bold mb-4">Large Quantity (Qty: 100)</h2>
    <QuoteItemCalculations
      quantity={100}
      unitPrice={50000}
      vendorCost={30000}
      totalUnitPrice={5000000}
      totalVendorCost={3000000}
      profitPerPiece={20000}
      profitPerPiecePercent={66.7}
      profitTotal={2000000}
      profitTotalPercent={66.7}
    />
  </div>
);

// Test Case 4: Zero Vendor Cost
export const ZeroVendorCost = () => (
  <div className="p-8 max-w-2xl">
    <h2 className="text-lg font-bold mb-4">Zero Vendor Cost</h2>
    <QuoteItemCalculations
      quantity={1}
      unitPrice={1000000}
      vendorCost={0}
      totalUnitPrice={1000000}
      totalVendorCost={0}
      profitPerPiece={1000000}
      profitPerPiecePercent={0}
      profitTotal={1000000}
      profitTotalPercent={0}
    />
  </div>
);

// Test Case 5: Negative Profit (Loss)
export const NegativeProfit = () => (
  <div className="p-8 max-w-2xl">
    <h2 className="text-lg font-bold mb-4">Negative Profit (Loss)</h2>
    <QuoteItemCalculations
      quantity={1}
      unitPrice={100000}
      vendorCost={150000}
      totalUnitPrice={100000}
      totalVendorCost={150000}
      profitPerPiece={-50000}
      profitPerPiecePercent={-33.3}
      profitTotal={-50000}
      profitTotalPercent={-33.3}
    />
  </div>
);

// Test Case 6: Small Profit Margin
export const SmallProfitMargin = () => (
  <div className="p-8 max-w-2xl">
    <h2 className="text-lg font-bold mb-4">Small Profit Margin (5%)</h2>
    <QuoteItemCalculations
      quantity={3}
      unitPrice={105000}
      vendorCost={100000}
      totalUnitPrice={315000}
      totalVendorCost={300000}
      profitPerPiece={5000}
      profitPerPiecePercent={5.0}
      profitTotal={15000}
      profitTotalPercent={5.0}
    />
  </div>
);

// Test Case 7: High Profit Margin
export const HighProfitMargin = () => (
  <div className="p-8 max-w-2xl">
    <h2 className="text-lg font-bold mb-4">High Profit Margin (200%)</h2>
    <QuoteItemCalculations
      quantity={5}
      unitPrice={300000}
      vendorCost={100000}
      totalUnitPrice={1500000}
      totalVendorCost={500000}
      profitPerPiece={200000}
      profitPerPiecePercent={200.0}
      profitTotal={1000000}
      profitTotalPercent={200.0}
    />
  </div>
);

// Test Case 8: Dark Mode
export const DarkMode = () => (
  <div className="dark p-8 max-w-2xl bg-slate-900">
    <h2 className="text-lg font-bold mb-4 text-white">Dark Mode (Qty: 2)</h2>
    <QuoteItemCalculations
      quantity={2}
      unitPrice={3114510}
      vendorCost={250000}
      totalUnitPrice={6229020}
      totalVendorCost={500000}
      profitPerPiece={2864510}
      profitPerPiecePercent={1145.8}
      profitTotal={5729020}
      profitTotalPercent={1145.8}
    />
  </div>
);

// Test Case 9: All Cases Combined
export const AllCases = () => (
  <div className="space-y-8">
    <SingleQuantity />
    <MultipleQuantity />
    <LargeQuantity />
    <ZeroVendorCost />
    <NegativeProfit />
    <SmallProfitMargin />
    <HighProfitMargin />
    <DarkMode />
  </div>
);

export default {
  SingleQuantity,
  MultipleQuantity,
  LargeQuantity,
  ZeroVendorCost,
  NegativeProfit,
  SmallProfitMargin,
  HighProfitMargin,
  DarkMode,
  AllCases,
};
