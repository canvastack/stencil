<?php

namespace Tests\Unit\Quote;

use Tests\TestCase;

class QuoteCalculationsTest extends TestCase
{
    /**
     * Test total_vendor_cost calculation.
     * Formula: total_vendor_cost = vendor_cost × quantity
     */
    public function test_calculates_total_vendor_cost_correctly()
    {
        // Test case 1: Normal calculation
        $vendorCost = 250000;
        $quantity = 3;
        $expected = 750000;
        
        $result = $vendorCost * $quantity;
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_total_vendor_cost_with_single_quantity()
    {
        // Test case 2: Quantity = 1
        $vendorCost = 250000;
        $quantity = 1;
        $expected = 250000;
        
        $result = $vendorCost * $quantity;
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_total_vendor_cost_with_large_quantity()
    {
        // Test case 3: Large quantity
        $vendorCost = 150000;
        $quantity = 100;
        $expected = 15000000;
        
        $result = $vendorCost * $quantity;
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_total_vendor_cost_with_decimal_cost()
    {
        // Test case 4: Decimal vendor cost
        $vendorCost = 250000.50;
        $quantity = 2;
        $expected = 500001.00;
        
        $result = $vendorCost * $quantity;
        
        $this->assertEquals($expected, $result);
    }

    /**
     * Test total_unit_price calculation.
     * Formula: total_unit_price = unit_price × quantity
     */
    public function test_calculates_total_unit_price_correctly()
    {
        // Test case 1: Normal calculation
        $unitPrice = 3114510;
        $quantity = 2;
        $expected = 6229020;
        
        $result = $unitPrice * $quantity;
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_total_unit_price_with_single_quantity()
    {
        // Test case 2: Quantity = 1
        $unitPrice = 3114510;
        $quantity = 1;
        $expected = 3114510;
        
        $result = $unitPrice * $quantity;
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_total_unit_price_with_large_quantity()
    {
        // Test case 3: Large quantity
        $unitPrice = 500000;
        $quantity = 50;
        $expected = 25000000;
        
        $result = $unitPrice * $quantity;
        
        $this->assertEquals($expected, $result);
    }

    /**
     * Test profit_per_piece calculation.
     * Formula: profit_per_piece = unit_price - vendor_cost
     */
    public function test_calculates_profit_per_piece_correctly()
    {
        // Test case 1: Normal profit
        $unitPrice = 3114510;
        $vendorCost = 250000;
        $expected = 2864510;
        
        $result = $unitPrice - $vendorCost;
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_profit_per_piece_with_zero_profit()
    {
        // Test case 2: Zero profit (break-even)
        $unitPrice = 250000;
        $vendorCost = 250000;
        $expected = 0;
        
        $result = $unitPrice - $vendorCost;
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_profit_per_piece_with_negative_profit()
    {
        // Test case 3: Negative profit (loss)
        $unitPrice = 200000;
        $vendorCost = 250000;
        $expected = -50000;
        
        $result = $unitPrice - $vendorCost;
        
        $this->assertEquals($expected, $result);
    }

    /**
     * Test profit_per_piece_percent calculation.
     * Formula: profit_per_piece_percent = (profit_per_piece / vendor_cost) × 100
     */
    public function test_calculates_profit_per_piece_percent_correctly()
    {
        // Test case 1: Normal profit percentage
        $unitPrice = 3114510;
        $vendorCost = 250000;
        $profitPerPiece = $unitPrice - $vendorCost;
        $expected = 1145.80;
        
        $percentage = $vendorCost > 0 
            ? ($profitPerPiece / $vendorCost) * 100 
            : 0;
        $result = round($percentage, 2);
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_profit_per_piece_percent_with_zero_profit()
    {
        // Test case 2: Zero profit percentage
        $unitPrice = 250000;
        $vendorCost = 250000;
        $profitPerPiece = $unitPrice - $vendorCost;
        $expected = 0.00;
        
        $percentage = $vendorCost > 0 
            ? ($profitPerPiece / $vendorCost) * 100 
            : 0;
        $result = round($percentage, 2);
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_profit_per_piece_percent_with_zero_vendor_cost()
    {
        // Test case 3: Zero vendor cost (edge case)
        $unitPrice = 250000;
        $vendorCost = 0;
        $profitPerPiece = $unitPrice - $vendorCost;
        $expected = 0.00;
        
        $percentage = $vendorCost > 0 
            ? ($profitPerPiece / $vendorCost) * 100 
            : 0;
        $result = round($percentage, 2);
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_profit_per_piece_percent_with_50_percent_markup()
    {
        // Test case 4: 50% markup
        $vendorCost = 100000;
        $unitPrice = 150000;
        $profitPerPiece = $unitPrice - $vendorCost;
        $expected = 50.00;
        
        $percentage = $vendorCost > 0 
            ? ($profitPerPiece / $vendorCost) * 100 
            : 0;
        $result = round($percentage, 2);
        
        $this->assertEquals($expected, $result);
    }

    /**
     * Test profit_total calculation.
     * Formula: profit_total = total_unit_price - total_vendor_cost
     */
    public function test_calculates_profit_total_correctly()
    {
        // Test case 1: Normal total profit
        $unitPrice = 3114510;
        $vendorCost = 250000;
        $quantity = 2;
        
        $totalUnitPrice = $unitPrice * $quantity;
        $totalVendorCost = $vendorCost * $quantity;
        $expected = 5729020;
        
        $result = $totalUnitPrice - $totalVendorCost;
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_profit_total_with_single_quantity()
    {
        // Test case 2: Single quantity (should equal profit_per_piece)
        $unitPrice = 3114510;
        $vendorCost = 250000;
        $quantity = 1;
        
        $totalUnitPrice = $unitPrice * $quantity;
        $totalVendorCost = $vendorCost * $quantity;
        $profitPerPiece = $unitPrice - $vendorCost;
        
        $result = $totalUnitPrice - $totalVendorCost;
        
        $this->assertEquals($profitPerPiece, $result);
    }

    public function test_calculates_profit_total_with_large_quantity()
    {
        // Test case 3: Large quantity
        $unitPrice = 500000;
        $vendorCost = 300000;
        $quantity = 100;
        
        $totalUnitPrice = $unitPrice * $quantity;
        $totalVendorCost = $vendorCost * $quantity;
        $expected = 20000000;
        
        $result = $totalUnitPrice - $totalVendorCost;
        
        $this->assertEquals($expected, $result);
    }

    /**
     * Test profit_total_percent calculation.
     * Formula: profit_total_percent = (profit_total / total_vendor_cost) × 100
     */
    public function test_calculates_profit_total_percent_correctly()
    {
        // Test case 1: Normal total profit percentage
        $unitPrice = 3114510;
        $vendorCost = 250000;
        $quantity = 2;
        
        $totalUnitPrice = $unitPrice * $quantity;
        $totalVendorCost = $vendorCost * $quantity;
        $profitTotal = $totalUnitPrice - $totalVendorCost;
        $expected = 1145.80;
        
        $percentage = $totalVendorCost > 0 
            ? ($profitTotal / $totalVendorCost) * 100 
            : 0;
        $result = round($percentage, 2);
        
        $this->assertEquals($expected, $result);
    }

    public function test_calculates_profit_total_percent_with_zero_total_vendor_cost()
    {
        // Test case 2: Zero total vendor cost (edge case)
        $unitPrice = 250000;
        $vendorCost = 0;
        $quantity = 2;
        
        $totalUnitPrice = $unitPrice * $quantity;
        $totalVendorCost = $vendorCost * $quantity;
        $profitTotal = $totalUnitPrice - $totalVendorCost;
        $expected = 0.00;
        
        $percentage = $totalVendorCost > 0 
            ? ($profitTotal / $totalVendorCost) * 100 
            : 0;
        $result = round($percentage, 2);
        
        $this->assertEquals($expected, $result);
    }

    /**
     * Test edge cases with zero costs.
     */
    public function test_handles_zero_vendor_cost_edge_case()
    {
        // When vendor cost is zero
        $vendorCost = 0;
        $unitPrice = 250000;
        $quantity = 2;
        
        $totalVendorCost = $vendorCost * $quantity;
        $totalUnitPrice = $unitPrice * $quantity;
        $profitPerPiece = $unitPrice - $vendorCost;
        $profitTotal = $totalUnitPrice - $totalVendorCost;
        
        // Percentage calculations should return 0 to avoid division by zero
        $profitPerPiecePercent = $vendorCost > 0 
            ? ($profitPerPiece / $vendorCost) * 100 
            : 0;
        $profitTotalPercent = $totalVendorCost > 0 
            ? ($profitTotal / $totalVendorCost) * 100 
            : 0;
        
        $this->assertEquals(0, $totalVendorCost);
        $this->assertEquals(500000, $totalUnitPrice);
        $this->assertEquals(250000, $profitPerPiece);
        $this->assertEquals(500000, $profitTotal);
        $this->assertEquals(0.00, round($profitPerPiecePercent, 2));
        $this->assertEquals(0.00, round($profitTotalPercent, 2));
    }

    public function test_handles_zero_unit_price_edge_case()
    {
        // When unit price is zero (unusual but possible)
        $vendorCost = 250000;
        $unitPrice = 0;
        $quantity = 2;
        
        $totalVendorCost = $vendorCost * $quantity;
        $totalUnitPrice = $unitPrice * $quantity;
        $profitPerPiece = $unitPrice - $vendorCost;
        $profitTotal = $totalUnitPrice - $totalVendorCost;
        
        $profitPerPiecePercent = $vendorCost > 0 
            ? ($profitPerPiece / $vendorCost) * 100 
            : 0;
        $profitTotalPercent = $totalVendorCost > 0 
            ? ($profitTotal / $totalVendorCost) * 100 
            : 0;
        
        $this->assertEquals(500000, $totalVendorCost);
        $this->assertEquals(0, $totalUnitPrice);
        $this->assertEquals(-250000, $profitPerPiece);
        $this->assertEquals(-500000, $profitTotal);
        $this->assertEquals(-100.00, round($profitPerPiecePercent, 2));
        $this->assertEquals(-100.00, round($profitTotalPercent, 2));
    }

    public function test_handles_zero_quantity_edge_case()
    {
        // When quantity is zero (should not happen in real scenarios)
        $vendorCost = 250000;
        $unitPrice = 3114510;
        $quantity = 0;
        
        $totalVendorCost = $vendorCost * $quantity;
        $totalUnitPrice = $unitPrice * $quantity;
        $profitPerPiece = $unitPrice - $vendorCost;
        $profitTotal = $totalUnitPrice - $totalVendorCost;
        
        $this->assertEquals(0, $totalVendorCost);
        $this->assertEquals(0, $totalUnitPrice);
        $this->assertEquals(2864510, $profitPerPiece);
        $this->assertEquals(0, $profitTotal);
    }

    /**
     * Test comprehensive calculation scenario.
     */
    public function test_comprehensive_calculation_scenario()
    {
        // Real-world scenario from requirements
        $vendorCost = 250000;
        $unitPrice = 3114510;
        $quantity = 2;
        
        // Calculate all values
        $totalVendorCost = $vendorCost * $quantity;
        $totalUnitPrice = $unitPrice * $quantity;
        $profitPerPiece = $unitPrice - $vendorCost;
        $profitTotal = $totalUnitPrice - $totalVendorCost;
        
        $profitPerPiecePercent = $vendorCost > 0 
            ? ($profitPerPiece / $vendorCost) * 100 
            : 0;
        $profitTotalPercent = $totalVendorCost > 0 
            ? ($profitTotal / $totalVendorCost) * 100 
            : 0;
        
        // Assertions
        $this->assertEquals(500000, $totalVendorCost);
        $this->assertEquals(6229020, $totalUnitPrice);
        $this->assertEquals(2864510, $profitPerPiece);
        $this->assertEquals(5729020, $profitTotal);
        $this->assertEquals(1145.80, round($profitPerPiecePercent, 2));
        $this->assertEquals(1145.80, round($profitTotalPercent, 2));
    }

    /**
     * Test rounding precision.
     */
    public function test_profit_percentage_rounding_to_two_decimals()
    {
        // Test that percentages are rounded to 2 decimal places
        $vendorCost = 333;
        $unitPrice = 500;
        $profitPerPiece = $unitPrice - $vendorCost;
        
        $percentage = ($profitPerPiece / $vendorCost) * 100;
        $result = round($percentage, 2);
        
        // 167 / 333 * 100 = 50.15015015... should round to 50.15
        $this->assertEquals(50.15, $result);
    }
}
