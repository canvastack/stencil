<?php

namespace App\Domain\Pricing\Strategies;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Pricing\ValueObjects\OrderComplexity;

/**
 * Default Markup Strategy
 * 
 * For new customers and one-time orders
 * Higher markup rates to account for higher risk and setup costs
 */
class DefaultMarkupStrategy extends MarkupStrategy
{
    public function calculateMarkup(Money $baseCost, OrderComplexity $complexity): Money
    {
        // New customers: 50-65% markup based on complexity
        $baseMarkupRate = $this->getBaseMarkupRate();
        $complexityBonus = $this->calculateComplexityBonus($complexity);
        
        // Apply minimal volume discount for new customers
        $adjustedMarkupRate = $this->applyVolumeDiscount($baseCost, $baseMarkupRate);
        
        // Final markup rate with complexity bonus
        $finalMarkupRate = min($adjustedMarkupRate + $complexityBonus, 0.65);
        
        return $baseCost->multiply($finalMarkupRate);
    }
    
    public function getStrategyName(): string
    {
        return 'default';
    }
    
    public function getDescription(): string
    {
        return 'Default strategy for new customers with standard market rates';
    }
    
    protected function getBaseMarkupRate(): float
    {
        return 0.50; // 50% base markup for new customers
    }
    
    protected function getComplexityBonusRate(): float
    {
        return 0.06; // Higher complexity bonus for new customers (6% per point)
    }
    
    /**
     * New customers get minimal volume discounts
     */
    protected function applyVolumeDiscount(Money $baseCost, float $markupRate): float
    {
        $amount = $baseCost->getAmount();
        
        // Minimal volume discounts for new customers
        if ($amount > 20000000000) { // > 200M IDR (very large orders)
            return $markupRate * 0.95; // 5% reduction only for very large orders
        }
        
        return $markupRate; // No discount for smaller orders
    }
    
    /**
     * Get new customer benefits
     */
    public function getNewCustomerBenefits(): array
    {
        return [
            'welcome_consultation' => true,
            'sample_approval' => true,
            'quality_guarantee' => true,
            'standard_support' => true,
            'progress_updates' => true
        ];
    }
    
    /**
     * Calculate new customer incentive
     */
    public function calculateNewCustomerIncentive(): float
    {
        // 2% incentive for first-time customers to encourage repeat business
        return 0.02;
    }
    
    /**
     * Check if customer qualifies for upgrade to standard tier
     */
    public function qualifiesForUpgrade(int $orderCount, Money $totalSpent): bool
    {
        return $orderCount >= 2 || $totalSpent->getAmount() > 500000000; // 2+ orders or 5M+ IDR spent
    }
    
    /**
     * Get upgrade recommendation
     */
    public function getUpgradeRecommendation(int $orderCount, Money $totalSpent): ?string
    {
        if ($this->qualifiesForUpgrade($orderCount, $totalSpent)) {
            return 'Customer qualifies for Standard tier upgrade with better pricing and benefits';
        }
        
        $remainingOrders = max(0, 2 - $orderCount);
        $remainingSpend = max(0, 500000000 - $totalSpent->getAmount());
        
        if ($remainingOrders > 0 && $remainingSpend > 0) {
            return "Customer needs {$remainingOrders} more orders or " . 
                   number_format($remainingSpend / 100) . " IDR more spending for Standard tier";
        }
        
        return null;
    }
}