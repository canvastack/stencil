<?php

namespace App\Domain\Pricing\Services;

use App\Domain\Pricing\ValueObjects\PricingStructure;
use App\Domain\Pricing\ValueObjects\OrderComplexity;
use App\Domain\Pricing\Strategies\MarkupStrategyFactory;
use App\Domain\Pricing\Services\DiscountEngine;
use App\Domain\Pricing\Services\TaxCalculatorService;
use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Vendor\ValueObjects\VendorQuote;

/**
 * Dynamic Pricing Calculator Service
 * 
 * Implements sophisticated 7-factor pricing calculation:
 * 1. Base vendor cost (from orders.vendor_price)
 * 2. Material and labor cost breakdown
 * 3. Complexity multipliers
 * 4. Customer-specific markup strategies
 * 5. Dynamic discount calculations
 * 6. Tax calculations
 * 7. Minimum profit margin enforcement (30%)
 */
class PricingCalculatorService
{
    private array $pricingFactors;
    
    public function __construct(
        private TaxCalculatorService $taxCalculator,
        private DiscountEngine $discountEngine,
        private MarkupStrategyFactory $markupStrategyFactory
    ) {
        $this->initializePricingFactors();
    }
    
    /**
     * Calculate comprehensive customer pricing structure
     */
    public function calculateCustomerPricing(
        VendorQuote $vendorQuote,
        Customer $customer,
        OrderComplexity $complexity
    ): PricingStructure {
        
        // 1. Base vendor cost (from orders.vendor_price in cents)
        $baseCost = $vendorQuote->getTotalPrice();
        
        // 2. Apply markup strategy based on complexity and customer tier
        $markupStrategy = $this->markupStrategyFactory->createForCustomer($customer);
        $markup = $markupStrategy->calculateMarkup($baseCost, $complexity);
        
        // 3. Calculate material and labor costs separately
        $materialCost = $this->calculateMaterialCost($vendorQuote);
        $laborCost = $this->calculateLaborCost($vendorQuote, $complexity);
        
        // 4. Apply complexity multipliers
        $complexityMultiplier = $this->calculateComplexityMultiplier($complexity);
        $adjustedCost = $baseCost->multiply($complexityMultiplier);
        
        // 5. Calculate customer-specific discounts (stored in orders.discount in cents)
        $discount = $this->discountEngine->calculateDiscount($customer, $adjustedCost);
        
        // 6. Apply taxes (stored in orders.tax in cents)
        $tax = $this->taxCalculator->calculateTax($adjustedCost, $customer);
        
        // 7. Ensure minimum profit margin (30%) - final price stored in orders.total_amount in cents
        $finalPrice = $this->ensureMinimumProfitMargin(
            $adjustedCost, $markup, $discount, $tax
        );
        
        return new PricingStructure(
            baseCost: $baseCost,
            materialCost: $materialCost,
            laborCost: $laborCost,
            markup: $markup,
            discount: $discount,
            tax: $tax,
            finalPrice: $finalPrice,
            profitMargin: $this->calculateProfitMargin($baseCost, $finalPrice),
            breakdown: $this->generatePricingBreakdown($baseCost, $markup, $discount, $tax),
            complexityMultiplier: $complexityMultiplier
        );
    }
    
    /**
     * Calculate material cost component
     */
    private function calculateMaterialCost(VendorQuote $vendorQuote): Money
    {
        // Material cost is typically 60-70% of vendor quote for etching business
        $materialRatio = 0.65;
        return $vendorQuote->getTotalPrice()->multiply($materialRatio);
    }
    
    /**
     * Calculate labor cost component
     */
    private function calculateLaborCost(VendorQuote $vendorQuote, OrderComplexity $complexity): Money
    {
        // Labor cost varies by complexity: Simple 20%, Medium 25%, High 35%
        $laborRatio = match($complexity->getLevel()) {
            'simple' => 0.20,
            'medium' => 0.25,
            'high' => 0.35,
            'custom' => 0.40,
            default => 0.25
        };
        
        return $vendorQuote->getTotalPrice()->multiply($laborRatio);
    }
    
    /**
     * Calculate complexity multiplier for pricing adjustment
     */
    private function calculateComplexityMultiplier(OrderComplexity $complexity): float
    {
        $baseMultiplier = 1.0;
        $complexityScore = $complexity->getComplexityScore();
        
        // Complexity scoring: 1-10 scale
        // 1-3: Simple (1.0x), 4-6: Medium (1.1x), 7-8: High (1.25x), 9-10: Custom (1.5x)
        return match(true) {
            $complexityScore <= 3 => 1.0,
            $complexityScore <= 6 => 1.1,
            $complexityScore <= 8 => 1.25,
            $complexityScore <= 10 => 1.5,
            default => 1.0
        };
    }
    
    /**
     * Ensure minimum profit margin is maintained
     */
    private function ensureMinimumProfitMargin(
        Money $adjustedCost,
        Money $markup,
        Money $discount,
        Money $tax
    ): Money {
        $minimumMargin = 0.30; // 30% minimum profit margin
        
        // Calculate price before margin check
        $preliminaryPrice = $adjustedCost->add($markup)->subtract($discount)->add($tax);
        
        // Calculate required price for minimum margin
        $requiredPrice = $adjustedCost->divide(1 - $minimumMargin);
        
        // Return the higher of preliminary price or required price
        return $preliminaryPrice->isGreaterThan($requiredPrice) 
            ? $preliminaryPrice 
            : $requiredPrice;
    }
    
    /**
     * Calculate profit margin percentage
     */
    private function calculateProfitMargin(Money $baseCost, Money $finalPrice): float
    {
        if ($finalPrice->getAmount() === 0) {
            return 0.0;
        }
        
        $profit = $finalPrice->subtract($baseCost);
        return $profit->getAmount() / $finalPrice->getAmount();
    }
    
    /**
     * Generate detailed pricing breakdown
     */
    private function generatePricingBreakdown(
        Money $baseCost,
        Money $markup,
        Money $discount,
        Money $tax
    ): array {
        return [
            'base_cost' => [
                'amount' => $baseCost->getAmount(),
                'currency' => $baseCost->getCurrency(),
                'formatted' => $baseCost->format()
            ],
            'markup' => [
                'amount' => $markup->getAmount(),
                'currency' => $markup->getCurrency(),
                'formatted' => $markup->format()
            ],
            'discount' => [
                'amount' => $discount->getAmount(),
                'currency' => $discount->getCurrency(),
                'formatted' => $discount->format()
            ],
            'tax' => [
                'amount' => $tax->getAmount(),
                'currency' => $tax->getCurrency(),
                'formatted' => $tax->format()
            ]
        ];
    }
    
    /**
     * Initialize pricing factors configuration
     */
    private function initializePricingFactors(): void
    {
        $this->pricingFactors = [
            'material_cost_ratio' => 0.65,
            'labor_cost_base_ratio' => 0.25,
            'minimum_profit_margin' => 0.30,
            'complexity_multipliers' => [
                'simple' => 1.0,
                'medium' => 1.1,
                'high' => 1.25,
                'custom' => 1.5
            ],
            'customer_tier_multipliers' => [
                'standard' => 1.0,
                'premium' => 0.95,
                'corporate' => 0.90,
                'vip' => 0.85
            ]
        ];
    }
}