<?php

declare(strict_types=1);

namespace App\Domain\CustomerQuote\ValueObjects;

use InvalidArgumentException;

/**
 * PricingBreakdown Value Object
 * 
 * Immutable value object representing complete pricing calculation breakdown.
 */
final class PricingBreakdown
{
    private function __construct(
        private readonly int $vendorTotalCost,
        private readonly int $baseProfitAmount,
        private readonly float $baseProfitPercentage,
        private readonly int $handlingFee,
        private readonly int $shippingCost,
        private readonly int $insurance,
        private readonly int $otherCosts,
        private readonly int $subtotal,
        private readonly float $taxRate,
        private readonly int $taxAmount,
        private readonly int $grandTotal,
        private readonly int $totalProfitAmount,
        private readonly float $totalProfitPercentage,
        private readonly string $currency
    ) {
        $this->validate();
    }

    /**
     * Calculate pricing from vendor cost and additional costs
     */
    public static function calculate(
        int $vendorTotalCost,
        int $baseProfitAmount,
        array $additionalCosts = [],
        float $taxRate = 0.11,
        string $currency = 'IDR'
    ): self {
        // Extract additional costs
        $handlingFee = $additionalCosts['handling_fee'] ?? 0;
        $shippingCost = $additionalCosts['shipping_cost'] ?? 0;
        $insurance = $additionalCosts['insurance'] ?? 0;
        $otherCosts = $additionalCosts['other_costs'] ?? 0;

        // Calculate base profit percentage
        $baseProfitPercentage = $vendorTotalCost > 0 
            ? ($baseProfitAmount / $vendorTotalCost) * 100 
            : 0.0;

        // Calculate subtotal (before tax)
        $subtotal = $vendorTotalCost + $baseProfitAmount + $handlingFee + $shippingCost + $insurance + $otherCosts;

        // Calculate tax
        $taxAmount = (int) round($subtotal * $taxRate);

        // Calculate grand total
        $grandTotal = $subtotal + $taxAmount;

        // Calculate total profit (base profit + additional costs)
        $totalProfitAmount = $baseProfitAmount + $handlingFee + $insurance + $otherCosts;
        
        // Calculate total profit percentage
        $totalProfitPercentage = $vendorTotalCost > 0 
            ? ($totalProfitAmount / $vendorTotalCost) * 100 
            : 0.0;

        return new self(
            vendorTotalCost: $vendorTotalCost,
            baseProfitAmount: $baseProfitAmount,
            baseProfitPercentage: $baseProfitPercentage,
            handlingFee: $handlingFee,
            shippingCost: $shippingCost,
            insurance: $insurance,
            otherCosts: $otherCosts,
            subtotal: $subtotal,
            taxRate: $taxRate,
            taxAmount: $taxAmount,
            grandTotal: $grandTotal,
            totalProfitAmount: $totalProfitAmount,
            totalProfitPercentage: $totalProfitPercentage,
            currency: $currency
        );
    }

    /**
     * Create from array
     */
    public static function fromArray(array $data): self
    {
        return new self(
            vendorTotalCost: $data['vendor_total_cost'],
            baseProfitAmount: $data['base_profit_amount'],
            baseProfitPercentage: $data['base_profit_percentage'],
            handlingFee: $data['handling_fee'] ?? 0,
            shippingCost: $data['shipping_cost'] ?? 0,
            insurance: $data['insurance'] ?? 0,
            otherCosts: $data['other_costs'] ?? 0,
            subtotal: $data['subtotal'],
            taxRate: $data['tax_rate'],
            taxAmount: $data['tax_amount'],
            grandTotal: $data['grand_total'],
            totalProfitAmount: $data['total_profit_amount'],
            totalProfitPercentage: $data['total_profit_percentage'],
            currency: $data['currency'] ?? 'IDR'
        );
    }

    /**
     * Validate pricing values
     */
    private function validate(): void
    {
        if ($this->vendorTotalCost < 0) {
            throw new InvalidArgumentException('Vendor total cost cannot be negative');
        }

        if ($this->baseProfitAmount < 0) {
            throw new InvalidArgumentException('Base profit amount cannot be negative');
        }

        if ($this->handlingFee < 0) {
            throw new InvalidArgumentException('Handling fee cannot be negative');
        }

        if ($this->shippingCost < 0) {
            throw new InvalidArgumentException('Shipping cost cannot be negative');
        }

        if ($this->insurance < 0) {
            throw new InvalidArgumentException('Insurance cannot be negative');
        }

        if ($this->otherCosts < 0) {
            throw new InvalidArgumentException('Other costs cannot be negative');
        }

        if ($this->taxRate < 0 || $this->taxRate > 1) {
            throw new InvalidArgumentException('Tax rate must be between 0 and 1');
        }

        if ($this->grandTotal < 0) {
            throw new InvalidArgumentException('Grand total cannot be negative');
        }
    }

    /**
     * Get total additional costs
     */
    public function getTotalAdditionalCosts(): int
    {
        return $this->handlingFee + $this->shippingCost + $this->insurance + $this->otherCosts;
    }

    /**
     * Get profit margin percentage
     */
    public function getProfitMarginPercentage(): float
    {
        return $this->grandTotal > 0 
            ? ($this->totalProfitAmount / $this->grandTotal) * 100 
            : 0.0;
    }

    /**
     * Format money value
     */
    public function formatMoney(int $cents): string
    {
        $amount = $cents / 100;
        
        return match($this->currency) {
            'IDR' => 'Rp ' . number_format($amount, 0, ',', '.'),
            'USD' => '$' . number_format($amount, 2, '.', ','),
            default => $this->currency . ' ' . number_format($amount, 2, '.', ','),
        };
    }

    // Getters

    public function getVendorTotalCost(): int
    {
        return $this->vendorTotalCost;
    }

    public function getBaseProfitAmount(): int
    {
        return $this->baseProfitAmount;
    }

    public function getBaseProfitPercentage(): float
    {
        return $this->baseProfitPercentage;
    }

    public function getHandlingFee(): int
    {
        return $this->handlingFee;
    }

    public function getShippingCost(): int
    {
        return $this->shippingCost;
    }

    public function getInsurance(): int
    {
        return $this->insurance;
    }

    public function getOtherCosts(): int
    {
        return $this->otherCosts;
    }

    public function getSubtotal(): int
    {
        return $this->subtotal;
    }

    public function getTaxRate(): float
    {
        return $this->taxRate;
    }

    public function getTaxAmount(): int
    {
        return $this->taxAmount;
    }

    public function getGrandTotal(): int
    {
        return $this->grandTotal;
    }

    public function getTotalProfitAmount(): int
    {
        return $this->totalProfitAmount;
    }

    public function getTotalProfitPercentage(): float
    {
        return $this->totalProfitPercentage;
    }

    public function getCurrency(): string
    {
        return $this->currency;
    }

    /**
     * Convert to array
     */
    public function toArray(): array
    {
        return [
            'vendor_total_cost' => $this->vendorTotalCost,
            'base_profit_amount' => $this->baseProfitAmount,
            'base_profit_percentage' => $this->baseProfitPercentage,
            'handling_fee' => $this->handlingFee,
            'shipping_cost' => $this->shippingCost,
            'insurance' => $this->insurance,
            'other_costs' => $this->otherCosts,
            'subtotal' => $this->subtotal,
            'tax_rate' => $this->taxRate,
            'tax_amount' => $this->taxAmount,
            'grand_total' => $this->grandTotal,
            'total_profit_amount' => $this->totalProfitAmount,
            'total_profit_percentage' => $this->totalProfitPercentage,
            'currency' => $this->currency,
        ];
    }

    /**
     * Check equality
     */
    public function equals(self $other): bool
    {
        return $this->toArray() === $other->toArray();
    }
}
