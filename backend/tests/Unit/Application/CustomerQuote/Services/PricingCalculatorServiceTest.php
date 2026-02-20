<?php

namespace Tests\Unit\Application\CustomerQuote\Services;

use App\Domain\CustomerQuote\Services\PricingCalculatorService;
use App\Domain\CustomerQuote\ValueObjects\PricingBreakdown;
use InvalidArgumentException;
use Tests\TestCase;

class PricingCalculatorServiceTest extends TestCase
{
    private PricingCalculatorService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->service = new PricingCalculatorService();
    }

    /** @test */
    public function it_calculates_customer_pricing_with_basic_profit(): void
    {
        // Arrange
        $vendorCost = 10000000; // Rp 100,000 in cents
        $profitPercentage = 20.0; // 20%

        // Act
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: $vendorCost,
            profitPercentage: $profitPercentage
        );

        // Assert
        $this->assertInstanceOf(PricingBreakdown::class, $pricing);
        $this->assertEquals(10000000, $pricing->getVendorTotalCost());
        $this->assertEquals(2000000, $pricing->getBaseProfitAmount()); // 20% of 10M
        $this->assertEquals(20.0, $pricing->getBaseProfitPercentage());
        $this->assertEquals(12000000, $pricing->getSubtotal()); // 10M + 2M
        $this->assertEquals(0.11, $pricing->getTaxRate());
        $this->assertEquals(1320000, $pricing->getTaxAmount()); // 11% of 12M
        $this->assertEquals(13320000, $pricing->getGrandTotal()); // 12M + 1.32M
        $this->assertEquals('IDR', $pricing->getCurrency());
    }

    /** @test */
    public function it_calculates_customer_pricing_with_additional_costs(): void
    {
        // Arrange
        $vendorCost = 10000000;
        $profitPercentage = 20.0;
        $additionalCosts = [
            'handling_fee' => 500000,
            'shipping_cost' => 300000,
            'insurance' => 200000,
            'other_costs' => 100000,
        ];

        // Act
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: $vendorCost,
            profitPercentage: $profitPercentage,
            additionalCosts: $additionalCosts
        );

        // Assert
        $this->assertEquals(2000000, $pricing->getBaseProfitAmount());
        $this->assertEquals(500000, $pricing->getHandlingFee());
        $this->assertEquals(300000, $pricing->getShippingCost());
        $this->assertEquals(200000, $pricing->getInsurance());
        $this->assertEquals(100000, $pricing->getOtherCosts());
        
        // Subtotal = vendor cost + base profit + all additional costs
        $expectedSubtotal = 10000000 + 2000000 + 500000 + 300000 + 200000 + 100000;
        $this->assertEquals($expectedSubtotal, $pricing->getSubtotal());
        
        // Total profit = base profit + handling + insurance + other (shipping excluded)
        $expectedTotalProfit = 2000000 + 500000 + 200000 + 100000;
        $this->assertEquals($expectedTotalProfit, $pricing->getTotalProfitAmount());
    }

    /** @test */
    public function it_calculates_tax_correctly(): void
    {
        // Arrange
        $vendorCost = 10000000;
        $profitPercentage = 20.0;
        $taxRate = 0.11; // 11% PPN

        // Act
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: $vendorCost,
            profitPercentage: $profitPercentage,
            taxRate: $taxRate
        );

        // Assert
        $subtotal = 12000000;
        $expectedTax = (int) round($subtotal * 0.11);
        $this->assertEquals($expectedTax, $pricing->getTaxAmount());
        $this->assertEquals($subtotal + $expectedTax, $pricing->getGrandTotal());
    }

    /** @test */
    public function it_calculates_with_custom_tax_rate(): void
    {
        // Arrange
        $vendorCost = 10000000;
        $profitPercentage = 20.0;
        $customTaxRate = 0.15; // 15% tax

        // Act
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: $vendorCost,
            profitPercentage: $profitPercentage,
            taxRate: $customTaxRate
        );

        // Assert
        $this->assertEquals(0.15, $pricing->getTaxRate());
        $expectedTax = (int) round(12000000 * 0.15);
        $this->assertEquals($expectedTax, $pricing->getTaxAmount());
    }

    /** @test */
    public function it_handles_zero_vendor_cost(): void
    {
        // Arrange
        $vendorCost = 0;
        $profitPercentage = 20.0;

        // Act
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: $vendorCost,
            profitPercentage: $profitPercentage
        );

        // Assert
        $this->assertEquals(0, $pricing->getVendorTotalCost());
        $this->assertEquals(0, $pricing->getBaseProfitAmount());
        $this->assertEquals(0, $pricing->getSubtotal());
        $this->assertEquals(0, $pricing->getTaxAmount());
        $this->assertEquals(0, $pricing->getGrandTotal());
    }

    /** @test */
    public function it_throws_exception_for_negative_vendor_cost(): void
    {
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Vendor total cost cannot be negative');

        // Act
        $this->service->calculateCustomerPricing(
            vendorTotalCost: -1000000,
            profitPercentage: 20.0
        );
    }

    /** @test */
    public function it_throws_exception_for_negative_additional_costs(): void
    {
        // Assert
        $this->expectException(InvalidArgumentException::class);
        $this->expectExceptionMessage('Handling fee cannot be negative');

        // Act
        $this->service->calculateCustomerPricing(
            vendorTotalCost: 10000000,
            profitPercentage: 20.0,
            additionalCosts: ['handling_fee' => -500000]
        );
    }

    /** @test */
    public function it_calculates_profit_amount_from_percentage(): void
    {
        // Arrange
        $vendorCost = 10000000;
        $profitPercentage = 25.0;

        // Act
        $profitAmount = $this->service->calculateProfitAmount($vendorCost, $profitPercentage);

        // Assert
        $this->assertEquals(2500000, $profitAmount); // 25% of 10M
    }

    /** @test */
    public function it_calculates_profit_percentage_from_amount(): void
    {
        // Arrange
        $vendorCost = 10000000;
        $profitAmount = 3000000;

        // Act
        $profitPercentage = $this->service->calculateProfitPercentage($vendorCost, $profitAmount);

        // Assert
        $this->assertEquals(30.0, $profitPercentage);
    }

    /** @test */
    public function it_returns_zero_percentage_for_zero_vendor_cost(): void
    {
        // Act
        $profitPercentage = $this->service->calculateProfitPercentage(0, 1000000);

        // Assert
        $this->assertEquals(0.0, $profitPercentage);
    }

    /** @test */
    public function it_calculates_tax_amount(): void
    {
        // Arrange
        $subtotal = 12000000;
        $taxRate = 0.11;

        // Act
        $taxAmount = $this->service->calculateTaxAmount($subtotal, $taxRate);

        // Assert
        $this->assertEquals(1320000, $taxAmount);
    }

    /** @test */
    public function it_calculates_grand_total(): void
    {
        // Arrange
        $subtotal = 12000000;
        $taxAmount = 1320000;

        // Act
        $grandTotal = $this->service->calculateGrandTotal($subtotal, $taxAmount);

        // Assert
        $this->assertEquals(13320000, $grandTotal);
    }

    /** @test */
    public function it_calculates_subtotal_from_components(): void
    {
        // Arrange
        $vendorCost = 10000000;
        $profitAmount = 2000000;
        $handlingFee = 500000;
        $shippingCost = 300000;
        $insurance = 200000;
        $otherCosts = 100000;

        // Act
        $subtotal = $this->service->calculateSubtotal(
            $vendorCost,
            $profitAmount,
            $handlingFee,
            $shippingCost,
            $insurance,
            $otherCosts
        );

        // Assert
        $expected = 10000000 + 2000000 + 500000 + 300000 + 200000 + 100000;
        $this->assertEquals($expected, $subtotal);
    }

    /** @test */
    public function it_recalculates_with_new_profit_percentage(): void
    {
        // Arrange
        $originalPricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: 10000000,
            profitPercentage: 20.0,
            additionalCosts: ['handling_fee' => 500000]
        );

        // Act
        $newPricing = $this->service->recalculateWithNewProfit($originalPricing, 30.0);

        // Assert
        $this->assertEquals(10000000, $newPricing->getVendorTotalCost());
        $this->assertEquals(3000000, $newPricing->getBaseProfitAmount()); // 30% of 10M
        $this->assertEquals(500000, $newPricing->getHandlingFee()); // Preserved
        $this->assertNotEquals($originalPricing->getGrandTotal(), $newPricing->getGrandTotal());
    }

    /** @test */
    public function it_recalculates_with_new_additional_costs(): void
    {
        // Arrange
        $originalPricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: 10000000,
            profitPercentage: 20.0,
            additionalCosts: ['handling_fee' => 500000]
        );

        $newAdditionalCosts = [
            'handling_fee' => 700000,
            'shipping_cost' => 400000,
        ];

        // Act
        $newPricing = $this->service->recalculateWithNewCosts($originalPricing, $newAdditionalCosts);

        // Assert
        $this->assertEquals(2000000, $newPricing->getBaseProfitAmount()); // Preserved
        $this->assertEquals(700000, $newPricing->getHandlingFee()); // Updated
        $this->assertEquals(400000, $newPricing->getShippingCost()); // Added
        $this->assertNotEquals($originalPricing->getGrandTotal(), $newPricing->getGrandTotal());
    }

    /** @test */
    public function it_calculates_reverse_pricing_from_desired_grand_total(): void
    {
        // Arrange
        $desiredGrandTotal = 13320000;
        $vendorCost = 10000000;
        $taxRate = 0.11;

        // Act
        $pricing = $this->service->calculateReversePricing(
            desiredGrandTotal: $desiredGrandTotal,
            vendorTotalCost: $vendorCost,
            taxRate: $taxRate
        );

        // Assert
        $this->assertEquals($desiredGrandTotal, $pricing->getGrandTotal());
        $this->assertEquals($vendorCost, $pricing->getVendorTotalCost());
        
        // Verify the calculation is correct
        $expectedSubtotal = (int) round($desiredGrandTotal / 1.11);
        $this->assertEquals($expectedSubtotal, $pricing->getSubtotal());
    }

    /** @test */
    public function it_ensures_non_negative_profit_in_reverse_pricing(): void
    {
        // Arrange - desired total is less than vendor cost
        $desiredGrandTotal = 5000000;
        $vendorCost = 10000000;

        // Act
        $pricing = $this->service->calculateReversePricing(
            desiredGrandTotal: $desiredGrandTotal,
            vendorTotalCost: $vendorCost
        );

        // Assert - profit should be 0, not negative
        $this->assertEquals(0, $pricing->getBaseProfitAmount());
        $this->assertGreaterThanOrEqual(0, $pricing->getBaseProfitAmount());
    }

    /** @test */
    public function it_validates_pricing_with_minimum_profit_margin(): void
    {
        // Arrange - 3% profit margin (below 5% minimum)
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: 10000000,
            profitPercentage: 3.0
        );

        // Act
        $errors = $this->service->validatePricing($pricing);

        // Assert
        $this->assertNotEmpty($errors);
        $this->assertContains('Profit margin is below minimum threshold (5%)', $errors);
    }

    /** @test */
    public function it_validates_pricing_with_maximum_profit_margin(): void
    {
        // Arrange - 250% profit margin (above 200% maximum)
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: 10000000,
            profitPercentage: 250.0
        );

        // Act
        $errors = $this->service->validatePricing($pricing);

        // Assert
        $this->assertNotEmpty($errors);
        $this->assertContains('Profit margin exceeds maximum threshold (200%)', $errors);
    }

    /** @test */
    public function it_validates_pricing_successfully_within_thresholds(): void
    {
        // Arrange - 20% profit margin (within 5-200% range)
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: 10000000,
            profitPercentage: 20.0
        );

        // Act
        $errors = $this->service->validatePricing($pricing);

        // Assert
        $this->assertEmpty($errors);
    }

    /** @test */
    public function it_compares_two_pricing_breakdowns(): void
    {
        // Arrange
        $pricing1 = $this->service->calculateCustomerPricing(
            vendorTotalCost: 10000000,
            profitPercentage: 20.0
        );

        $pricing2 = $this->service->calculateCustomerPricing(
            vendorTotalCost: 10000000,
            profitPercentage: 30.0
        );

        // Act
        $comparison = $this->service->comparePricing($pricing1, $pricing2);

        // Assert
        $this->assertArrayHasKey('grand_total_difference', $comparison);
        $this->assertArrayHasKey('profit_difference', $comparison);
        $this->assertArrayHasKey('profit_percentage_difference', $comparison);
        $this->assertArrayHasKey('percentage_change', $comparison);
        
        $this->assertGreaterThan(0, $comparison['grand_total_difference']);
        $this->assertEquals(1000000, $comparison['profit_difference']); // 30% - 20% of 10M
        $this->assertEquals(10.0, $comparison['profit_percentage_difference']);
    }

    /** @test */
    public function it_calculates_from_vendor_quote_object(): void
    {
        // Arrange
        $vendorQuote = (object) [
            'total_amount' => 10000000,
            'currency' => 'IDR',
        ];

        $additionalCosts = ['handling_fee' => 500000];

        // Act
        $pricing = $this->service->calculateFromVendorQuote(
            vendorQuote: $vendorQuote,
            additionalCosts: $additionalCosts,
            profitPercentage: 20.0
        );

        // Assert
        $this->assertEquals(10000000, $pricing->getVendorTotalCost());
        $this->assertEquals(2000000, $pricing->getBaseProfitAmount());
        $this->assertEquals(500000, $pricing->getHandlingFee());
        $this->assertEquals('IDR', $pricing->getCurrency());
    }

    /** @test */
    public function it_handles_usd_currency(): void
    {
        // Arrange
        $vendorCost = 100000; // $1,000 in cents
        $profitPercentage = 20.0;

        // Act
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: $vendorCost,
            profitPercentage: $profitPercentage,
            currency: 'USD'
        );

        // Assert
        $this->assertEquals('USD', $pricing->getCurrency());
        $this->assertEquals(100000, $pricing->getVendorTotalCost());
        $this->assertEquals(20000, $pricing->getBaseProfitAmount());
    }

    /** @test */
    public function it_calculates_complex_scenario_with_all_costs(): void
    {
        // Arrange - Real-world scenario
        $vendorCost = 15000000; // Rp 150,000
        $profitPercentage = 25.0; // 25% profit
        $additionalCosts = [
            'handling_fee' => 750000,    // Rp 7,500
            'shipping_cost' => 500000,   // Rp 5,000
            'insurance' => 250000,       // Rp 2,500
            'other_costs' => 300000,     // Rp 3,000
        ];
        $taxRate = 0.11; // 11% PPN

        // Act
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: $vendorCost,
            profitPercentage: $profitPercentage,
            additionalCosts: $additionalCosts,
            taxRate: $taxRate
        );

        // Assert
        $expectedBaseProfit = 3750000; // 25% of 15M
        $expectedSubtotal = 15000000 + 3750000 + 750000 + 500000 + 250000 + 300000; // 20,550,000
        $expectedTax = (int) round($expectedSubtotal * 0.11); // 2,260,500
        $expectedGrandTotal = $expectedSubtotal + $expectedTax; // 22,810,500
        $expectedTotalProfit = 3750000 + 750000 + 250000 + 300000; // 5,050,000 (shipping excluded)

        $this->assertEquals($expectedBaseProfit, $pricing->getBaseProfitAmount());
        $this->assertEquals($expectedSubtotal, $pricing->getSubtotal());
        $this->assertEquals($expectedTax, $pricing->getTaxAmount());
        $this->assertEquals($expectedGrandTotal, $pricing->getGrandTotal());
        $this->assertEquals($expectedTotalProfit, $pricing->getTotalProfitAmount());
    }

    /** @test */
    public function it_maintains_precision_with_rounding(): void
    {
        // Arrange - Test rounding behavior
        $vendorCost = 10000001; // Odd number to test rounding
        $profitPercentage = 33.33; // Decimal percentage

        // Act
        $pricing = $this->service->calculateCustomerPricing(
            vendorTotalCost: $vendorCost,
            profitPercentage: $profitPercentage
        );

        // Assert - All values should be integers (cents)
        $this->assertIsInt($pricing->getBaseProfitAmount());
        $this->assertIsInt($pricing->getSubtotal());
        $this->assertIsInt($pricing->getTaxAmount());
        $this->assertIsInt($pricing->getGrandTotal());
    }
}

