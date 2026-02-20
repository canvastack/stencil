<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\Services;

use App\Domain\CustomerQuote\ValueObjects\PricingBreakdown;

/**
 * PricingCalculatorService Domain Service
 * 
 * Stateless domain service for calculating customer pricing from vendor quotes.
 * Implements business logic: vendor cost + profit + additional costs + tax
 */
class PricingCalculatorService
{
    /**
     * Calculate customer pricing from vendor quote
     * 
     * Formula:
     * 1. Base Profit = Vendor Cost × Profit Percentage
     * 2. Subtotal = Vendor Cost + Base Profit + Handling + Shipping + Insurance + Other Costs
     * 3. Tax = Subtotal × Tax Rate
     * 4. Grand Total = Subtotal + Tax
     * 5. Total Profit = Base Profit + Handling + Insurance + Other Costs (shipping excluded)
     */
    public function calculateCustomerPricing(
        int $vendorTotalCost,
        float $profitPercentage,
        array $additionalCosts = [],
        float $taxRate = 0.11,
        string $currency = 'IDR'
    ): PricingBreakdown {
        // Calculate base profit amount
        $baseProfitAmount = (int) round($vendorTotalCost * ($profitPercentage / 100));

        // Use PricingBreakdown value object to calculate complete breakdown
        return PricingBreakdown::calculate(
            vendorTotalCost: $vendorTotalCost,
            baseProfitAmount: $baseProfitAmount,
            additionalCosts: $additionalCosts,
            taxRate: $taxRate,
            currency: $currency
        );
    }

    /**
     * Calculate pricing from vendor quote entity
     * 
     * @param object $vendorQuote Vendor quote entity with total_amount
     * @param array $additionalCosts Additional costs breakdown
     * @param float $profitPercentage Profit percentage (default 20%)
     * @param float $taxRate Tax rate (default 11% PPN)
     * @return PricingBreakdown
     */
    public function calculateFromVendorQuote(
        object $vendorQuote,
        array $additionalCosts = [],
        float $profitPercentage = 20.0,
        float $taxRate = 0.11
    ): PricingBreakdown {
        // Extract vendor total cost from vendor quote
        $vendorTotalCost = $vendorQuote->total_amount ?? 0;
        $currency = $vendorQuote->currency ?? 'IDR';

        return $this->calculateCustomerPricing(
            vendorTotalCost: $vendorTotalCost,
            profitPercentage: $profitPercentage,
            additionalCosts: $additionalCosts,
            taxRate: $taxRate,
            currency: $currency
        );
    }

    /**
     * Calculate profit amount from percentage
     */
    public function calculateProfitAmount(int $vendorCost, float $profitPercentage): int
    {
        return (int) round($vendorCost * ($profitPercentage / 100));
    }

    /**
     * Calculate profit percentage from amount
     */
    public function calculateProfitPercentage(int $vendorCost, int $profitAmount): float
    {
        if ($vendorCost === 0) {
            return 0.0;
        }

        return round(($profitAmount / $vendorCost) * 100, 2);
    }

    /**
     * Calculate tax amount
     */
    public function calculateTaxAmount(int $subtotal, float $taxRate): int
    {
        return (int) round($subtotal * $taxRate);
    }

    /**
     * Calculate grand total
     */
    public function calculateGrandTotal(int $subtotal, int $taxAmount): int
    {
        return $subtotal + $taxAmount;
    }

    /**
     * Calculate subtotal from components
     */
    public function calculateSubtotal(
        int $vendorCost,
        int $profitAmount,
        int $handlingFee = 0,
        int $shippingCost = 0,
        int $insurance = 0,
        int $otherCosts = 0
    ): int {
        return $vendorCost + $profitAmount + $handlingFee + $shippingCost + $insurance + $otherCosts;
    }

    /**
     * Recalculate pricing with new profit percentage
     */
    public function recalculateWithNewProfit(
        PricingBreakdown $currentPricing,
        float $newProfitPercentage
    ): PricingBreakdown {
        $newBaseProfitAmount = $this->calculateProfitAmount(
            $currentPricing->getVendorTotalCost(),
            $newProfitPercentage
        );

        return PricingBreakdown::calculate(
            vendorTotalCost: $currentPricing->getVendorTotalCost(),
            baseProfitAmount: $newBaseProfitAmount,
            additionalCosts: [
                'handling_fee' => $currentPricing->getHandlingFee(),
                'shipping_cost' => $currentPricing->getShippingCost(),
                'insurance' => $currentPricing->getInsurance(),
                'other_costs' => $currentPricing->getOtherCosts(),
            ],
            taxRate: $currentPricing->getTaxRate(),
            currency: $currentPricing->getCurrency()
        );
    }

    /**
     * Recalculate pricing with new additional costs
     */
    public function recalculateWithNewCosts(
        PricingBreakdown $currentPricing,
        array $newAdditionalCosts
    ): PricingBreakdown {
        return PricingBreakdown::calculate(
            vendorTotalCost: $currentPricing->getVendorTotalCost(),
            baseProfitAmount: $currentPricing->getBaseProfitAmount(),
            additionalCosts: $newAdditionalCosts,
            taxRate: $currentPricing->getTaxRate(),
            currency: $currentPricing->getCurrency()
        );
    }

    /**
     * Calculate reverse pricing (from desired grand total)
     * 
     * Given a desired grand total, calculate what the base profit should be
     */
    public function calculateReversePricing(
        int $desiredGrandTotal,
        int $vendorTotalCost,
        array $additionalCosts = [],
        float $taxRate = 0.11
    ): PricingBreakdown {
        // Extract additional costs
        $handlingFee = $additionalCosts['handling_fee'] ?? 0;
        $shippingCost = $additionalCosts['shipping_cost'] ?? 0;
        $insurance = $additionalCosts['insurance'] ?? 0;
        $otherCosts = $additionalCosts['other_costs'] ?? 0;

        // Calculate subtotal from grand total
        // Grand Total = Subtotal + (Subtotal × Tax Rate)
        // Grand Total = Subtotal × (1 + Tax Rate)
        // Subtotal = Grand Total / (1 + Tax Rate)
        $subtotal = (int) round($desiredGrandTotal / (1 + $taxRate));

        // Calculate required profit
        // Subtotal = Vendor Cost + Profit + Additional Costs
        // Profit = Subtotal - Vendor Cost - Additional Costs
        $totalAdditionalCosts = $handlingFee + $shippingCost + $insurance + $otherCosts;
        $baseProfitAmount = $subtotal - $vendorTotalCost - $totalAdditionalCosts;

        // Ensure profit is not negative
        if ($baseProfitAmount < 0) {
            $baseProfitAmount = 0;
        }

        return PricingBreakdown::calculate(
            vendorTotalCost: $vendorTotalCost,
            baseProfitAmount: $baseProfitAmount,
            additionalCosts: $additionalCosts,
            taxRate: $taxRate,
            currency: 'IDR'
        );
    }

    /**
     * Validate pricing breakdown
     * 
     * @return array Array of validation errors (empty if valid)
     */
    public function validatePricing(PricingBreakdown $pricing): array
    {
        $errors = [];

        // Check minimum profit margin (e.g., 5%)
        if ($pricing->getTotalProfitPercentage() < 5.0) {
            $errors[] = 'Profit margin is below minimum threshold (5%)';
        }

        // Check maximum profit margin (e.g., 200%)
        if ($pricing->getTotalProfitPercentage() > 200.0) {
            $errors[] = 'Profit margin exceeds maximum threshold (200%)';
        }

        // Check if grand total is reasonable
        if ($pricing->getGrandTotal() <= 0) {
            $errors[] = 'Grand total must be positive';
        }

        // Check if vendor cost is covered
        if ($pricing->getGrandTotal() < $pricing->getVendorTotalCost()) {
            $errors[] = 'Grand total is less than vendor cost';
        }

        return $errors;
    }

    /**
     * Compare two pricing breakdowns
     * 
     * @return array Comparison details
     */
    public function comparePricing(PricingBreakdown $pricing1, PricingBreakdown $pricing2): array
    {
        return [
            'grand_total_difference' => $pricing2->getGrandTotal() - $pricing1->getGrandTotal(),
            'profit_difference' => $pricing2->getTotalProfitAmount() - $pricing1->getTotalProfitAmount(),
            'profit_percentage_difference' => $pricing2->getTotalProfitPercentage() - $pricing1->getTotalProfitPercentage(),
            'percentage_change' => $pricing1->getGrandTotal() > 0 
                ? (($pricing2->getGrandTotal() - $pricing1->getGrandTotal()) / $pricing1->getGrandTotal()) * 100 
                : 0,
        ];
    }
}
