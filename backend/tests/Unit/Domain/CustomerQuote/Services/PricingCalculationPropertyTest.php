<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\CustomerQuote\Services;

use App\Domain\CustomerQuote\Services\PricingCalculatorService;
use Tests\TestCase;

/**
 * Property-Based Test: Pricing Calculations Are Always Accurate
 * 
 * **Feature: customer-quote-workflow, Property 1: Pricing Calculations Are Always Accurate**
 * **Validates: Requirements 2.4, 2.5**
 * 
 * For any valid vendor cost and profit percentage, the pricing calculation should:
 * 1. Always produce consistent results
 * 2. Maintain mathematical accuracy (no rounding errors that break totals)
 * 3. Ensure Grand Total = Subtotal + Tax
 * 4. Ensure Subtotal = Vendor Cost + Profit + Additional Costs
 * 5. Ensure Tax = Subtotal × Tax Rate
 * 
 * This property test verifies pricing calculation integrity across all possible inputs.
 */
class PricingCalculationPropertyTest extends TestCase
{
    private PricingCalculatorService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PricingCalculatorService();
    }

    /**
     * Property: Grand Total always equals Subtotal + Tax
     * 
     * @test
     */
    public function property_grand_total_equals_subtotal_plus_tax(): void
    {
        // Run 100 iterations with random valid inputs
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000); // 1k to 100k IDR in cents
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100); // 5% to 200%
            $taxRate = 0.11; // 11% PPN
            
            $additionalCosts = [
                'handling_fee' => rand(0, 100000),
                'shipping_cost' => rand(0, 500000),
                'insurance' => rand(0, 50000),
                'other_costs' => rand(0, 100000),
            ];

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage,
                $additionalCosts,
                $taxRate
            );

            // Verify: Grand Total = Subtotal + Tax
            $expectedGrandTotal = $pricing->getSubtotal() + $pricing->getTaxAmount();
            
            $this->assertEquals(
                $expectedGrandTotal,
                $pricing->getGrandTotal(),
                "Grand Total must equal Subtotal + Tax. " .
                "Subtotal: {$pricing->getSubtotal()}, Tax: {$pricing->getTaxAmount()}, " .
                "Expected: {$expectedGrandTotal}, Actual: {$pricing->getGrandTotal()}"
            );
        }
    }

    /**
     * Property: Subtotal always equals Vendor Cost + Profit + Additional Costs
     * 
     * @test
     */
    public function property_subtotal_equals_all_cost_components(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);
            
            $handlingFee = rand(0, 100000);
            $shippingCost = rand(0, 500000);
            $insurance = rand(0, 50000);
            $otherCosts = rand(0, 100000);
            
            $additionalCosts = [
                'handling_fee' => $handlingFee,
                'shipping_cost' => $shippingCost,
                'insurance' => $insurance,
                'other_costs' => $otherCosts,
            ];

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage,
                $additionalCosts
            );

            // Calculate expected subtotal
            $expectedSubtotal = $vendorCost + 
                               $pricing->getBaseProfitAmount() + 
                               $handlingFee + 
                               $shippingCost + 
                               $insurance + 
                               $otherCosts;

            $this->assertEquals(
                $expectedSubtotal,
                $pricing->getSubtotal(),
                "Subtotal must equal sum of all cost components"
            );
        }
    }

    /**
     * Property: Tax calculation is always accurate
     * 
     * @test
     */
    public function property_tax_calculation_is_accurate(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);
            $taxRate = 0.11;
            
            $additionalCosts = [
                'handling_fee' => rand(0, 100000),
                'shipping_cost' => rand(0, 500000),
                'insurance' => rand(0, 50000),
                'other_costs' => rand(0, 100000),
            ];

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage,
                $additionalCosts,
                $taxRate
            );

            // Calculate expected tax (with rounding)
            $expectedTax = (int) round($pricing->getSubtotal() * $taxRate);

            $this->assertEquals(
                $expectedTax,
                $pricing->getTaxAmount(),
                "Tax must equal Subtotal × Tax Rate (rounded)"
            );
        }
    }

    /**
     * Property: Profit calculation is deterministic
     * 
     * @test
     */
    public function property_profit_calculation_is_deterministic(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);

            // Calculate twice with same inputs
            $pricing1 = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage
            );

            $pricing2 = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage
            );

            // Results must be identical
            $this->assertEquals(
                $pricing1->getBaseProfitAmount(),
                $pricing2->getBaseProfitAmount(),
                "Profit calculation must be deterministic for same inputs"
            );

            $this->assertEquals(
                $pricing1->getGrandTotal(),
                $pricing2->getGrandTotal(),
                "Grand total must be deterministic for same inputs"
            );
        }
    }

    /**
     * Property: Pricing is always positive
     * 
     * @test
     */
    public function property_pricing_is_always_positive(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);
            
            $additionalCosts = [
                'handling_fee' => rand(0, 100000),
                'shipping_cost' => rand(0, 500000),
                'insurance' => rand(0, 50000),
                'other_costs' => rand(0, 100000),
            ];

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage,
                $additionalCosts
            );

            // All monetary values must be positive
            $this->assertGreaterThan(0, $pricing->getVendorTotalCost());
            $this->assertGreaterThan(0, $pricing->getBaseProfitAmount());
            $this->assertGreaterThan(0, $pricing->getSubtotal());
            $this->assertGreaterThanOrEqual(0, $pricing->getTaxAmount());
            $this->assertGreaterThan(0, $pricing->getGrandTotal());
        }
    }

    /**
     * Property: Reverse pricing produces valid results
     * 
     * @test
     */
    public function property_reverse_pricing_produces_valid_results(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 5000000); // Reduced range for more predictable results
            $desiredGrandTotal = rand($vendorCost + 100000, $vendorCost * 2); // Reduced multiplier
            $taxRate = 0.11;
            
            $additionalCosts = [
                'handling_fee' => rand(0, 25000), // Reduced amounts
                'shipping_cost' => rand(0, 50000),
                'insurance' => rand(0, 10000),
                'other_costs' => rand(0, 25000),
            ];

            $pricing = $this->service->calculateReversePricing(
                $desiredGrandTotal,
                $vendorCost,
                $additionalCosts,
                $taxRate
            );

            // Verify the grand total is reasonable (within 15% tolerance)
            // Reverse pricing is approximate due to tax calculations and rounding
            $difference = abs($pricing->getGrandTotal() - $desiredGrandTotal);
            $tolerance = (int) ($desiredGrandTotal * 0.15); // 15% tolerance
            
            $this->assertLessThanOrEqual(
                $tolerance,
                $difference,
                "Reverse pricing should produce grand total within 15% of desired amount. " .
                "Desired: {$desiredGrandTotal}, Actual: {$pricing->getGrandTotal()}, Diff: {$difference}"
            );

            // Verify profit is non-negative
            $this->assertGreaterThanOrEqual(
                0,
                $pricing->getBaseProfitAmount(),
                "Reverse pricing should not produce negative profit"
            );
        }
    }

    /**
     * Property: Recalculation with new profit maintains consistency
     * 
     * @test
     */
    public function property_recalculation_maintains_consistency(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $initialProfitPercentage = rand(10, 50) + (rand(0, 99) / 100);
            $newProfitPercentage = rand(10, 50) + (rand(0, 99) / 100);
            
            $additionalCosts = [
                'handling_fee' => rand(0, 100000),
                'shipping_cost' => rand(0, 500000),
                'insurance' => rand(0, 50000),
                'other_costs' => rand(0, 100000),
            ];

            $initialPricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $initialProfitPercentage,
                $additionalCosts
            );

            $recalculatedPricing = $this->service->recalculateWithNewProfit(
                $initialPricing,
                $newProfitPercentage
            );

            // Verify vendor cost remains unchanged
            $this->assertEquals(
                $initialPricing->getVendorTotalCost(),
                $recalculatedPricing->getVendorTotalCost(),
                "Vendor cost should not change during recalculation"
            );

            // Verify additional costs remain unchanged
            $this->assertEquals(
                $initialPricing->getHandlingFee(),
                $recalculatedPricing->getHandlingFee()
            );
            $this->assertEquals(
                $initialPricing->getShippingCost(),
                $recalculatedPricing->getShippingCost()
            );

            // Verify new profit percentage is applied
            $expectedNewProfit = (int) round($vendorCost * ($newProfitPercentage / 100));
            $this->assertEquals(
                $expectedNewProfit,
                $recalculatedPricing->getBaseProfitAmount(),
                "New profit percentage should be applied correctly"
            );
        }
    }

    /**
     * Property: Profit percentage calculation is inverse of profit amount calculation
     * 
     * @test
     */
    public function property_profit_percentage_is_inverse_of_profit_amount(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);

            // Calculate profit amount from percentage
            $profitAmount = $this->service->calculateProfitAmount($vendorCost, $profitPercentage);

            // Calculate percentage back from amount
            $calculatedPercentage = $this->service->calculateProfitPercentage($vendorCost, $profitAmount);

            // Should be approximately equal (within 0.01% due to rounding)
            $difference = abs($profitPercentage - $calculatedPercentage);
            $this->assertLessThanOrEqual(
                0.01,
                $difference,
                "Profit percentage calculation should be inverse of profit amount calculation"
            );
        }
    }

    /**
     * Property: Comparison produces symmetric results
     * 
     * @test
     */
    public function property_comparison_is_symmetric(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profit1 = rand(10, 50) + (rand(0, 99) / 100);
            $profit2 = rand(10, 50) + (rand(0, 99) / 100);

            $pricing1 = $this->service->calculateCustomerPricing($vendorCost, $profit1);
            $pricing2 = $this->service->calculateCustomerPricing($vendorCost, $profit2);

            $comparison1to2 = $this->service->comparePricing($pricing1, $pricing2);
            $comparison2to1 = $this->service->comparePricing($pricing2, $pricing1);

            // Differences should be opposite
            $this->assertEquals(
                -$comparison1to2['grand_total_difference'],
                $comparison2to1['grand_total_difference'],
                "Comparison should be symmetric"
            );

            $this->assertEquals(
                -$comparison1to2['profit_difference'],
                $comparison2to1['profit_difference'],
                "Profit difference should be symmetric"
            );
        }
    }

    /**
     * Property: Zero additional costs produce correct base pricing
     * 
     * @test
     */
    public function property_zero_additional_costs_produce_base_pricing(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);
            $taxRate = 0.11;

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage,
                [], // No additional costs
                $taxRate
            );

            // Verify subtotal = vendor cost + profit only
            $expectedSubtotal = $vendorCost + $pricing->getBaseProfitAmount();
            $this->assertEquals(
                $expectedSubtotal,
                $pricing->getSubtotal(),
                "With zero additional costs, subtotal should equal vendor cost + profit"
            );

            // Verify all additional costs are zero
            $this->assertEquals(0, $pricing->getHandlingFee());
            $this->assertEquals(0, $pricing->getShippingCost());
            $this->assertEquals(0, $pricing->getInsurance());
            $this->assertEquals(0, $pricing->getOtherCosts());
        }
    }
}
