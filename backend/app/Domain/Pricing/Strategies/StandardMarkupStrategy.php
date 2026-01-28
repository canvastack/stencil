<?php

namespace App\Domain\Pricing\Strategies;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Pricing\ValueObjects\OrderComplexity;

/**
 * Standard Markup Strategy
 * 
 * For regular customers with moderate order frequency
 * Standard markup rates with basic volume considerations
 */
class StandardMarkupStrategy extends MarkupStrategy
{
    public function calculateMarkup(Money $baseCost, OrderComplexity $complexity): Money
    {
        // Standard customers: 45-55% markup based on complexity
        $baseMarkupRate = $this->getBaseMarkupRate();
        $complexityBonus = $this->calculateComplexityBonus($complexity);
        
        // Apply volume discount
        $adjustedMarkupRate = $this->applyVolumeDiscount($baseCost, $baseMarkupRate);
        
        // Final markup rate with complexity bonus
        $finalMarkupRate = min($adjustedMarkupRate + $complexityBonus, 0.55);
        
        return $baseCost->multiply($finalMarkupRate);
    }
    
    public function getStrategyName(): string
    {
        return 'standard';
    }
    
    public function getDescription(): string
    {
        return 'Standard customer strategy with competitive market rates';
    }
    
    protected function getBaseMarkupRate(): float
    {
        return 0.45; // 45% base markup for standard customers
    }
    
    protected function getComplexityBonusRate(): float
    {
        return 0.05; // Standard complexity bonus (5% per point)
    }
    
    /**
     * Standard customers get basic volume discounts
     */
    protected function applyVolumeDiscount(Money $baseCost, float $markupRate): float
    {
        $amount = $baseCost->getAmount();
        
        // Basic volume discounts for standard customers
        if ($amount > 10000000000) { // > 100M IDR
            return $markupRate * 0.90; // 10% reduction
        } elseif ($amount > 5000000000) { // > 50M IDR
            return $markupRate * 0.95; // 5% reduction
        }
        
        return $markupRate;
    }
    
    /**
     * Get standard customer benefits
     */
    public function getStandardBenefits(): array
    {
        return [
            'quality_guarantee' => true,
            'standard_support' => true,
            'progress_updates' => true,
            'basic_customization' => true,
            'standard_delivery' => true
        ];
    }
    
    /**
     * Calculate loyalty discount for repeat customers
     */
    public function calculateLoyaltyDiscount(int $previousOrders): float
    {
        return match(true) {
            $previousOrders >= 10 => 0.05, // 5% loyalty discount
            $previousOrders >= 5 => 0.03,  // 3% loyalty discount
            $previousOrders >= 3 => 0.02,  // 2% loyalty discount
            default => 0.0
        };
    }
}