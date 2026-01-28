<?php

namespace App\Domain\Pricing\Services;

use App\Domain\Shared\ValueObjects\Money;
use App\Domain\Customer\Entities\Customer;
use App\Domain\Pricing\ValueObjects\DiscountStructure;

/**
 * Discount Engine
 * 
 * Calculates comprehensive discounts based on multiple factors:
 * - Volume discounts (5-15% based on order size)
 * - Loyalty discounts (2-10% based on customer history)
 * - Seasonal discounts (0-5% based on current season/promotions)
 * - Customer tier discounts
 * - Special promotional discounts
 */
class DiscountEngine
{
    private array $discountRules;
    private array $activePromotions;
    
    public function __construct()
    {
        $this->initializeDiscountRules();
        $this->loadActivePromotions();
    }
    
    /**
     * Calculate total discount for customer and order value
     */
    public function calculateDiscount(Customer $customer, Money $orderValue): Money
    {
        $discounts = [];
        
        // 1. Volume discount (5-15% based on order size)
        $volumeDiscount = $this->calculateVolumeDiscount($orderValue);
        $discounts['volume'] = $volumeDiscount;
        
        // 2. Loyalty discount (2-10% based on customer history)
        $loyaltyDiscount = $this->calculateLoyaltyDiscount($customer, $orderValue);
        $discounts['loyalty'] = $loyaltyDiscount;
        
        // 3. Seasonal discount (0-5% based on current season/promotions)
        $seasonalDiscount = $this->calculateSeasonalDiscount($orderValue);
        $discounts['seasonal'] = $seasonalDiscount;
        
        // 4. Customer tier discount
        $tierDiscount = $this->calculateTierDiscount($customer, $orderValue);
        $discounts['tier'] = $tierDiscount;
        
        // 5. Promotional discount
        $promotionalDiscount = $this->calculatePromotionalDiscount($customer, $orderValue);
        $discounts['promotional'] = $promotionalDiscount;
        
        // 6. First-time customer discount
        $firstTimeDiscount = $this->calculateFirstTimeDiscount($customer, $orderValue);
        $discounts['first_time'] = $firstTimeDiscount;
        
        // Calculate total discount with stacking rules
        return $this->applyStackingRules($discounts, $orderValue);
    }
    
    /**
     * Calculate volume discount based on order size
     */
    private function calculateVolumeDiscount(Money $orderValue): Money
    {
        $amount = $orderValue->getAmount();
        
        // Volume discount tiers (IDR amounts in cents)
        if ($amount >= 50000000000) { // >= 500M IDR
            return $orderValue->multiply(0.15); // 15% discount
        } elseif ($amount >= 20000000000) { // >= 200M IDR
            return $orderValue->multiply(0.12); // 12% discount
        } elseif ($amount >= 10000000000) { // >= 100M IDR
            return $orderValue->multiply(0.10); // 10% discount
        } elseif ($amount >= 5000000000) { // >= 50M IDR
            return $orderValue->multiply(0.08); // 8% discount
        } elseif ($amount >= 2000000000) { // >= 20M IDR
            return $orderValue->multiply(0.05); // 5% discount
        }
        
        return new Money(0, $orderValue->getCurrency());
    }
    
    /**
     * Calculate loyalty discount based on customer history
     */
    private function calculateLoyaltyDiscount(Customer $customer, Money $orderValue): Money
    {
        $totalOrders = $customer->getTotalOrders();
        $totalSpent = $customer->getTotalSpent();
        $customerAge = $customer->getCustomerAgeInMonths();
        
        $loyaltyScore = $this->calculateLoyaltyScore($totalOrders, $totalSpent, $customerAge);
        
        // Loyalty discount based on score
        $discountRate = match(true) {
            $loyaltyScore >= 90 => 0.10, // 10% for VIP customers
            $loyaltyScore >= 75 => 0.08, // 8% for highly loyal customers
            $loyaltyScore >= 60 => 0.06, // 6% for loyal customers
            $loyaltyScore >= 45 => 0.04, // 4% for regular customers
            $loyaltyScore >= 30 => 0.02, // 2% for occasional customers
            default => 0.0
        };
        
        return $orderValue->multiply($discountRate);
    }
    
    /**
     * Calculate seasonal discount
     */
    private function calculateSeasonalDiscount(Money $orderValue): Money
    {
        $currentMonth = (int) date('n');
        $discountRate = 0.0;
        
        // Seasonal discount rates
        $seasonalRates = [
            1 => 0.03,  // January - New Year promotion
            2 => 0.02,  // February - Valentine's promotion
            3 => 0.01,  // March - Spring promotion
            4 => 0.01,  // April
            5 => 0.02,  // May - Labor Day promotion
            6 => 0.01,  // June
            7 => 0.01,  // July
            8 => 0.05,  // August - Independence Day promotion
            9 => 0.01,  // September
            10 => 0.02, // October
            11 => 0.04, // November - Pre-holiday promotion
            12 => 0.05  // December - Year-end promotion
        ];
        
        $discountRate = $seasonalRates[$currentMonth] ?? 0.0;
        
        return $orderValue->multiply($discountRate);
    }
    
    /**
     * Calculate tier-based discount
     */
    private function calculateTierDiscount(Customer $customer, Money $orderValue): Money
    {
        $tier = $customer->getTier();
        
        $tierDiscounts = [
            'vip' => 0.08,      // 8% for VIP customers
            'premium' => 0.05,   // 5% for premium customers
            'corporate' => 0.03, // 3% for corporate customers
            'standard' => 0.01,  // 1% for standard customers
            'default' => 0.0     // No tier discount for new customers
        ];
        
        $discountRate = $tierDiscounts[$tier] ?? 0.0;
        
        return $orderValue->multiply($discountRate);
    }
    
    /**
     * Calculate promotional discount
     */
    private function calculatePromotionalDiscount(Customer $customer, Money $orderValue): Money
    {
        $totalDiscount = new Money(0, $orderValue->getCurrency());
        
        foreach ($this->activePromotions as $promotion) {
            if ($this->customerQualifiesForPromotion($customer, $promotion)) {
                $promoDiscount = $this->calculatePromotionDiscount($orderValue, $promotion);
                $totalDiscount = $totalDiscount->add($promoDiscount);
            }
        }
        
        return $totalDiscount;
    }
    
    /**
     * Calculate first-time customer discount
     */
    private function calculateFirstTimeDiscount(Customer $customer, Money $orderValue): Money
    {
        if ($customer->getTotalOrders() === 0) {
            // 3% discount for first-time customers
            return $orderValue->multiply(0.03);
        }
        
        return new Money(0, $orderValue->getCurrency());
    }
    
    /**
     * Apply stacking rules to prevent over-discounting
     */
    private function applyStackingRules(array $discounts, Money $orderValue): Money
    {
        $totalDiscount = new Money(0, $orderValue->getCurrency());
        
        // Add all discounts
        foreach ($discounts as $type => $discount) {
            $totalDiscount = $totalDiscount->add($discount);
        }
        
        // Apply maximum discount cap (25% of order value)
        $maxDiscount = $orderValue->multiply(0.25);
        
        if ($totalDiscount->isGreaterThan($maxDiscount)) {
            return $maxDiscount;
        }
        
        return $totalDiscount;
    }
    
    /**
     * Calculate loyalty score (0-100)
     */
    private function calculateLoyaltyScore(int $totalOrders, Money $totalSpent, int $customerAgeMonths): int
    {
        $score = 0;
        
        // Order frequency score (0-40 points)
        $score += min($totalOrders * 4, 40);
        
        // Spending score (0-30 points)
        $spentInMillions = $totalSpent->getAmount() / 100000000; // Convert to millions IDR
        $score += min($spentInMillions * 2, 30);
        
        // Customer age score (0-20 points)
        $score += min($customerAgeMonths * 2, 20);
        
        // Recent activity bonus (0-10 points)
        // This would need to be implemented based on recent order data
        $score += 5; // Placeholder
        
        return min($score, 100);
    }
    
    /**
     * Check if customer qualifies for promotion
     */
    private function customerQualifiesForPromotion(Customer $customer, array $promotion): bool
    {
        // Check customer tier requirements
        if (isset($promotion['required_tier'])) {
            $customerTier = $customer->getTier();
            if (!in_array($customerTier, $promotion['required_tier'])) {
                return false;
            }
        }
        
        // Check minimum order count
        if (isset($promotion['min_orders'])) {
            if ($customer->getTotalOrders() < $promotion['min_orders']) {
                return false;
            }
        }
        
        // Check minimum spending
        if (isset($promotion['min_spent'])) {
            if ($customer->getTotalSpent()->getAmount() < $promotion['min_spent']) {
                return false;
            }
        }
        
        return true;
    }
    
    /**
     * Calculate promotion discount
     */
    private function calculatePromotionDiscount(Money $orderValue, array $promotion): Money
    {
        $discountType = $promotion['type'] ?? 'percentage';
        
        return match($discountType) {
            'percentage' => $orderValue->multiply($promotion['value'] ?? 0.0),
            'fixed' => new Money($promotion['value'] ?? 0, $orderValue->getCurrency()),
            default => new Money(0, $orderValue->getCurrency())
        };
    }
    
    /**
     * Initialize discount rules
     */
    private function initializeDiscountRules(): void
    {
        $this->discountRules = [
            'volume' => [
                'enabled' => true,
                'max_rate' => 0.15,
                'tiers' => [
                    500000000 => 0.15, // 500M IDR
                    200000000 => 0.12, // 200M IDR
                    100000000 => 0.10, // 100M IDR
                    50000000 => 0.08,  // 50M IDR
                    20000000 => 0.05   // 20M IDR
                ]
            ],
            'loyalty' => [
                'enabled' => true,
                'max_rate' => 0.10,
                'score_thresholds' => [
                    90 => 0.10,
                    75 => 0.08,
                    60 => 0.06,
                    45 => 0.04,
                    30 => 0.02
                ]
            ],
            'stacking' => [
                'max_total_discount' => 0.25, // 25% maximum total discount
                'allow_promotional_stacking' => true
            ]
        ];
    }
    
    /**
     * Load active promotions
     */
    private function loadActivePromotions(): void
    {
        // This would typically load from database
        $this->activePromotions = [
            [
                'id' => 'new_year_2024',
                'name' => 'New Year Special',
                'type' => 'percentage',
                'value' => 0.05,
                'start_date' => '2024-01-01',
                'end_date' => '2024-01-31',
                'required_tier' => ['standard', 'premium', 'corporate', 'vip']
            ],
            [
                'id' => 'bulk_order_bonus',
                'name' => 'Bulk Order Bonus',
                'type' => 'percentage',
                'value' => 0.03,
                'min_orders' => 5,
                'start_date' => '2024-01-01',
                'end_date' => '2024-12-31'
            ]
        ];
    }
    
    /**
     * Get discount breakdown for transparency
     */
    public function getDiscountBreakdown(Customer $customer, Money $orderValue): array
    {
        return [
            'volume' => $this->calculateVolumeDiscount($orderValue)->toArray(),
            'loyalty' => $this->calculateLoyaltyDiscount($customer, $orderValue)->toArray(),
            'seasonal' => $this->calculateSeasonalDiscount($orderValue)->toArray(),
            'tier' => $this->calculateTierDiscount($customer, $orderValue)->toArray(),
            'promotional' => $this->calculatePromotionalDiscount($customer, $orderValue)->toArray(),
            'first_time' => $this->calculateFirstTimeDiscount($customer, $orderValue)->toArray(),
            'total' => $this->calculateDiscount($customer, $orderValue)->toArray()
        ];
    }
}