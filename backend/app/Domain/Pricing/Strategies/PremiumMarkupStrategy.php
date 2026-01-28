<?php

namespace App\Domain\Pricing\Strategies;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Pricing\ValueObjects\OrderComplexity;

/**
 * Premium Markup Strategy
 * 
 * For premium customers with high loyalty and large order volumes
 * Lower markup rates but higher volume, focusing on relationship building
 */
class PremiumMarkupStrategy extends MarkupStrategy
{
    public function calculateMarkup(Money $baseCost, OrderComplexity $complexity): Money
    {
        // Premium customers: 35-45% markup based on complexity
        $baseMarkupRate = $this->getBaseMarkupRate();
        $complexityBonus = $this->calculateComplexityBonus($complexity);
        
        // Apply volume discount for premium customers
        $adjustedMarkupRate = $this->applyVolumeDiscount($baseCost, $baseMarkupRate);
        
        // Final markup rate with complexity bonus
        $finalMarkupRate = min($adjustedMarkupRate + $complexityBonus, 0.45);
        
        return $baseCost->multiply($finalMarkupRate);
    }
    
    public function getStrategyName(): string
    {
        return 'premium';
    }
    
    public function getDescription(): string
    {
        return 'Premium customer strategy with competitive rates and volume discounts';
    }
    
    protected function getBaseMarkupRate(): float
    {
        return 0.35; // 35% base markup for premium customers
    }
    
    protected function getComplexityBonusRate(): float
    {
        return 0.03; // Lower complexity bonus for premium customers (3% per point)
    }
    
    /**
     * Premium customers get better volume discounts
     */
    protected function applyVolumeDiscount(Money $baseCost, float $markupRate): float
    {
        $amount = $baseCost->getAmount();
        
        // Enhanced volume discounts for premium customers
        if ($amount > 20000000000) { // > 200M IDR
            return $markupRate * 0.80; // 20% reduction
        } elseif ($amount > 10000000000) { // > 100M IDR
            return $markupRate * 0.85; // 15% reduction
        } elseif ($amount > 5000000000) { // > 50M IDR
            return $markupRate * 0.90; // 10% reduction
        }
        
        return $markupRate;
    }
    
    /**
     * Get premium-specific benefits
     */
    public function getPremiumBenefits(): array
    {
        return [
            'priority_processing' => true,
            'dedicated_account_manager' => true,
            'enhanced_volume_discounts' => true,
            'flexible_payment_terms' => true,
            'quality_guarantee' => true,
            'expedited_shipping' => true
        ];
    }
}