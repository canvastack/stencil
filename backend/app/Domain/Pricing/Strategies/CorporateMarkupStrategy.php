<?php

namespace App\Domain\Pricing\Strategies;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Pricing\ValueObjects\OrderComplexity;

/**
 * Corporate Markup Strategy
 * 
 * For corporate customers with regular orders and established relationships
 * Balanced markup rates with moderate volume discounts
 */
class CorporateMarkupStrategy extends MarkupStrategy
{
    public function calculateMarkup(Money $baseCost, OrderComplexity $complexity): Money
    {
        // Corporate customers: 40-50% markup based on complexity
        $baseMarkupRate = $this->getBaseMarkupRate();
        $complexityBonus = $this->calculateComplexityBonus($complexity);
        
        // Apply volume discount
        $adjustedMarkupRate = $this->applyVolumeDiscount($baseCost, $baseMarkupRate);
        
        // Final markup rate with complexity bonus
        $finalMarkupRate = min($adjustedMarkupRate + $complexityBonus, 0.50);
        
        return $baseCost->multiply($finalMarkupRate);
    }
    
    public function getStrategyName(): string
    {
        return 'corporate';
    }
    
    public function getDescription(): string
    {
        return 'Corporate customer strategy with balanced pricing and reliable service';
    }
    
    protected function getBaseMarkupRate(): float
    {
        return 0.40; // 40% base markup for corporate customers
    }
    
    protected function getComplexityBonusRate(): float
    {
        return 0.04; // Standard complexity bonus for corporate customers (4% per point)
    }
    
    /**
     * Corporate customers get standard volume discounts
     */
    protected function applyVolumeDiscount(Money $baseCost, float $markupRate): float
    {
        $amount = $baseCost->getAmount();
        
        // Standard volume discounts for corporate customers
        if ($amount > 15000000000) { // > 150M IDR
            return $markupRate * 0.85; // 15% reduction
        } elseif ($amount > 7500000000) { // > 75M IDR
            return $markupRate * 0.90; // 10% reduction
        } elseif ($amount > 3000000000) { // > 30M IDR
            return $markupRate * 0.95; // 5% reduction
        }
        
        return $markupRate;
    }
    
    /**
     * Get corporate-specific benefits
     */
    public function getCorporateBenefits(): array
    {
        return [
            'bulk_order_discounts' => true,
            'extended_payment_terms' => true,
            'dedicated_support' => true,
            'quality_assurance' => true,
            'progress_reporting' => true,
            'contract_pricing' => true
        ];
    }
    
    /**
     * Calculate contract pricing for long-term agreements
     */
    public function calculateContractPricing(Money $baseCost, int $contractMonths): Money
    {
        $baseMarkup = $this->calculateMarkup($baseCost, new \App\Domain\Pricing\ValueObjects\OrderComplexity('medium'));
        
        // Contract discounts based on duration
        $contractDiscount = match(true) {
            $contractMonths >= 24 => 0.15, // 15% discount for 2+ year contracts
            $contractMonths >= 12 => 0.10, // 10% discount for 1+ year contracts
            $contractMonths >= 6 => 0.05,  // 5% discount for 6+ month contracts
            default => 0.0
        };
        
        return $baseMarkup->multiply(1 - $contractDiscount);
    }
}