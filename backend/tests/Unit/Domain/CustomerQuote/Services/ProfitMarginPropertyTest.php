<?php

declare(strict_types=1);

namespace Tests\Unit\Domain\CustomerQuote\Services;

use App\Domain\CustomerQuote\Services\PricingCalculatorService;
use Tests\TestCase;

/**
 * Property-Based Test: Profit Margins Are Within Valid Ranges
 * 
 * **Feature: customer-quote-workflow, Property 2: Profit Margins Are Within Valid Ranges**
 * **Validates: Requirements 2.5**
 * 
 * For any customer quote pricing, the profit margin should:
 * 1. Always be within business-defined valid ranges (5% - 200%)
 * 2. Never be negative
 * 3. Be calculated consistently from profit amount
 * 4. Maintain accuracy across different vendor costs
 * 5. Validation should catch out-of-range margins
 * 
 * This property test verifies profit margin integrity and validation.
 */
class ProfitMarginPropertyTest extends TestCase
{
    private PricingCalculatorService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PricingCalculatorService();
    }

    /**
     * Property: Profit margin is never negative
     * 
     * @test
     */
    public function property_profit_margin_is_never_negative(): void
    {
        // Run 100 iterations with random valid inputs
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

            // Verify profit percentage is non-negative
            $this->assertGreaterThanOrEqual(
                0,
                $pricing->getBaseProfitPercentage(),
                "Base profit percentage must never be negative"
            );

            $this->assertGreaterThanOrEqual(
                0,
                $pricing->getTotalProfitPercentage(),
                "Total profit percentage must never be negative"
            );

            // Verify profit amounts are non-negative
            $this->assertGreaterThanOrEqual(
                0,
                $pricing->getBaseProfitAmount(),
                "Base profit amount must never be negative"
            );

            $this->assertGreaterThanOrEqual(
                0,
                $pricing->getTotalProfitAmount(),
                "Total profit amount must never be negative"
            );
        }
    }

    /**
     * Property: Profit margin within valid business range (5% - 200%)
     * 
     * @test
     */
    public function property_profit_margin_within_valid_range(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            // Generate profit percentage within valid range
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage
            );

            // Verify base profit percentage is within range (with small tolerance for rounding)
            $this->assertGreaterThanOrEqual(
                4.99, // Allow small rounding error
                $pricing->getBaseProfitPercentage(),
                "Base profit percentage should be at least 5%"
            );

            $this->assertLessThanOrEqual(
                200.5, // Allow larger rounding error for edge cases
                $pricing->getBaseProfitPercentage(),
                "Base profit percentage should not exceed 200%"
            );
        }
    }

    /**
     * Property: Validation catches below-minimum margins
     * 
     * @test
     */
    public function property_validation_catches_below_minimum_margins(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $vendorCost = rand(100000, 10000000);
            // Generate profit percentage below minimum (0% - 4.99%)
            $profitPercentage = rand(0, 499) / 100;

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage
            );

            // Validate pricing
            $errors = $this->service->validatePricing($pricing);

            // Should have validation error for low margin
            $this->assertNotEmpty(
                $errors,
                "Validation should catch profit margins below 5%"
            );

            $this->assertStringContainsString(
                'below minimum',
                implode(' ', $errors),
                "Error message should mention below minimum threshold"
            );
        }
    }

    /**
     * Property: Validation catches above-maximum margins
     * 
     * @test
     */
    public function property_validation_catches_above_maximum_margins(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $vendorCost = rand(100000, 10000000);
            // Generate profit percentage above maximum (200.01% - 300%)
            $profitPercentage = rand(20001, 30000) / 100;

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage
            );

            // Validate pricing
            $errors = $this->service->validatePricing($pricing);

            // Should have validation error for high margin
            $this->assertNotEmpty(
                $errors,
                "Validation should catch profit margins above 200%"
            );

            $this->assertStringContainsString(
                'exceeds maximum',
                implode(' ', $errors),
                "Error message should mention exceeds maximum threshold"
            );
        }
    }

    /**
     * Property: Profit percentage calculation is consistent
     * 
     * @test
     */
    public function property_profit_percentage_calculation_is_consistent(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage
            );

            // Calculate percentage from amount
            $calculatedPercentage = $this->service->calculateProfitPercentage(
                $vendorCost,
                $pricing->getBaseProfitAmount()
            );

            // Should match the input percentage (within rounding tolerance)
            $difference = abs($profitPercentage - $calculatedPercentage);
            $this->assertLessThanOrEqual(
                0.01,
                $difference,
                "Calculated profit percentage should match input percentage"
            );
        }
    }

    /**
     * Property: Total profit includes additional costs (excluding shipping)
     * 
     * @test
     */
    public function property_total_profit_includes_additional_costs(): void
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

            // Total profit = Base profit + Handling + Insurance + Other (NOT shipping)
            $expectedTotalProfit = $pricing->getBaseProfitAmount() + 
                                  $handlingFee + 
                                  $insurance + 
                                  $otherCosts;

            $this->assertEquals(
                $expectedTotalProfit,
                $pricing->getTotalProfitAmount(),
                "Total profit should include base profit + handling + insurance + other costs (excluding shipping)"
            );
        }
    }

    /**
     * Property: Total profit percentage is always >= base profit percentage
     * 
     * @test
     */
    public function property_total_profit_percentage_gte_base_profit_percentage(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);
            
            $additionalCosts = [
                'handling_fee' => rand(0, 100000),
                'insurance' => rand(0, 50000),
                'other_costs' => rand(0, 100000),
            ];

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage,
                $additionalCosts
            );

            // Total profit percentage should be >= base profit percentage
            // (because additional costs add to profit)
            $this->assertGreaterThanOrEqual(
                $pricing->getBaseProfitPercentage(),
                $pricing->getTotalProfitPercentage(),
                "Total profit percentage should be >= base profit percentage when additional costs exist"
            );
        }
    }

    /**
     * Property: Profit margin scales proportionally with vendor cost
     * 
     * @test
     */
    public function property_profit_margin_scales_proportionally(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $vendorCost1 = rand(100000, 5000000);
            $vendorCost2 = $vendorCost1 * 2; // Double the cost
            $profitPercentage = rand(10, 100) + (rand(0, 99) / 100);

            $pricing1 = $this->service->calculateCustomerPricing(
                $vendorCost1,
                $profitPercentage
            );

            $pricing2 = $this->service->calculateCustomerPricing(
                $vendorCost2,
                $profitPercentage
            );

            // Profit amount should approximately double
            $ratio = $pricing2->getBaseProfitAmount() / $pricing1->getBaseProfitAmount();
            $this->assertGreaterThan(1.99, $ratio);
            $this->assertLessThan(2.01, $ratio);

            // Profit percentage should remain the same
            $percentageDifference = abs(
                $pricing1->getBaseProfitPercentage() - 
                $pricing2->getBaseProfitPercentage()
            );
            $this->assertLessThanOrEqual(
                0.01,
                $percentageDifference,
                "Profit percentage should remain constant regardless of vendor cost"
            );
        }
    }

    /**
     * Property: Minimum profit margin ensures profitability
     * 
     * @test
     */
    public function property_minimum_profit_margin_ensures_profitability(): void
    {
        for ($i = 0; $i < 100; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage
            );

            // Grand total should always be greater than vendor cost
            $this->assertGreaterThan(
                $vendorCost,
                $pricing->getGrandTotal(),
                "Grand total must be greater than vendor cost to ensure profitability"
            );

            // Profit amount should be positive
            $this->assertGreaterThan(
                0,
                $pricing->getTotalProfitAmount(),
                "Total profit amount must be positive"
            );
        }
    }

    /**
     * Property: Profit margin calculation handles edge cases
     * 
     * @test
     */
    public function property_profit_margin_handles_edge_cases(): void
    {
        // Test with minimum vendor cost
        $pricing1 = $this->service->calculateCustomerPricing(
            100, // 1 IDR in cents
            10.0
        );
        $this->assertGreaterThanOrEqual(0, $pricing1->getBaseProfitPercentage());

        // Test with maximum reasonable vendor cost
        $pricing2 = $this->service->calculateCustomerPricing(
            100000000, // 1 million IDR in cents
            10.0
        );
        $this->assertGreaterThanOrEqual(0, $pricing2->getBaseProfitPercentage());

        // Test with minimum profit percentage
        $pricing3 = $this->service->calculateCustomerPricing(
            1000000,
            5.0
        );
        $this->assertEquals(5.0, $pricing3->getBaseProfitPercentage());

        // Test with maximum profit percentage
        $pricing4 = $this->service->calculateCustomerPricing(
            1000000,
            200.0
        );
        $this->assertEquals(200.0, $pricing4->getBaseProfitPercentage());
    }

    /**
     * Property: Profit margin validation is consistent
     * 
     * @test
     */
    public function property_profit_margin_validation_is_consistent(): void
    {
        for ($i = 0; $i < 50; $i++) {
            $vendorCost = rand(100000, 10000000);
            $profitPercentage = rand(5, 200) + (rand(0, 99) / 100);

            $pricing = $this->service->calculateCustomerPricing(
                $vendorCost,
                $profitPercentage
            );

            // Validate twice
            $errors1 = $this->service->validatePricing($pricing);
            $errors2 = $this->service->validatePricing($pricing);

            // Results should be identical
            $this->assertEquals(
                $errors1,
                $errors2,
                "Validation should produce consistent results for same pricing"
            );
        }
    }
}
