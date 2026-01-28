<?php

namespace App\Domain\Pricing\Strategies;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Pricing\ValueObjects\OrderComplexity;

/**
 * Abstract Markup Strategy
 * 
 * Base class for all markup calculation strategies
 */
abstract class MarkupStrategy
{
    /**
     * Calculate markup amount based on base cost and complexity
     */
    abstract public function calculateMarkup(Money $baseCost, OrderComplexity $complexity): Money;
    
    /**
     * Get strategy name for identification
     */
    abstract public function getStrategyName(): string;
    
    /**
     * Get strategy description
     */
    abstract public function getDescription(): string;
    
    /**
     * Get base markup rate for this strategy
     */
    abstract protected function getBaseMarkupRate(): float;
    
    /**
     * Get complexity bonus rate
     */
    protected function getComplexityBonusRate(): float
    {
        return 0.05; // Default 5% bonus per complexity point
    }
    
    /**
     * Calculate complexity bonus
     */
    protected function calculateComplexityBonus(OrderComplexity $complexity): float
    {
        $complexityScore = $complexity->getComplexityScore();
        $bonusRate = $this->getComplexityBonusRate();
        
        // Apply diminishing returns for very high complexity
        if ($complexityScore > 8) {
            $bonusRate *= 0.8; // Reduce bonus rate for extreme complexity
        }
        
        return min($complexityScore * $bonusRate, 0.50); // Cap at 50% bonus
    }
    
    /**
     * Apply volume discount to markup
     */
    protected function applyVolumeDiscount(Money $baseCost, float $markupRate): float
    {
        $amount = $baseCost->getAmount();
        
        // Volume discounts on markup rate
        if ($amount > 10000000000) { // > 100M IDR
            return $markupRate * 0.90; // 10% reduction
        } elseif ($amount > 5000000000) { // > 50M IDR
            return $markupRate * 0.95; // 5% reduction
        }
        
        return $markupRate;
    }
    
    /**
     * Get strategy metadata
     */
    public function getMetadata(): array
    {
        return [
            'name' => $this->getStrategyName(),
            'description' => $this->getDescription(),
            'base_markup_rate' => $this->getBaseMarkupRate(),
            'complexity_bonus_rate' => $this->getComplexityBonusRate(),
            'supports_volume_discount' => true
        ];
    }
}