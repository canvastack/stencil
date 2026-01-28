<?php

namespace App\Domain\Pricing\ValueObjects;

use App\Domain\Shared\ValueObjects\Money;

/**
 * Pricing Structure Value Object
 * 
 * Immutable representation of complete pricing calculation
 * with all components and business intelligence
 */
class PricingStructure
{
    public function __construct(
        private Money $baseCost,
        private Money $materialCost,
        private Money $laborCost,
        private Money $markup,
        private Money $discount,
        private Money $tax,
        private Money $finalPrice,
        private float $profitMargin,
        private array $breakdown,
        private float $complexityMultiplier = 1.0
    ) {}
    
    // Getters
    public function getBaseCost(): Money
    {
        return $this->baseCost;
    }
    
    public function getMaterialCost(): Money
    {
        return $this->materialCost;
    }
    
    public function getLaborCost(): Money
    {
        return $this->laborCost;
    }
    
    public function getMarkup(): Money
    {
        return $this->markup;
    }
    
    public function getDiscount(): Money
    {
        return $this->discount;
    }
    
    public function getTax(): Money
    {
        return $this->tax;
    }
    
    public function getFinalPrice(): Money
    {
        return $this->finalPrice;
    }
    
    public function getProfitMargin(): float
    {
        return $this->profitMargin;
    }
    
    public function getComplexityMultiplier(): float
    {
        return $this->complexityMultiplier;
    }
    
    /**
     * Calculate profit amount in money
     */
    public function getProfitAmount(): Money
    {
        return $this->finalPrice->subtract($this->baseCost)->subtract($this->tax);
    }
    
    /**
     * Calculate customer savings from discounts
     */
    public function getCustomerSavings(): Money
    {
        return $this->discount;
    }
    
    /**
     * Calculate total cost before markup
     */
    public function getTotalCost(): Money
    {
        return $this->baseCost->add($this->tax);
    }
    
    /**
     * Calculate markup percentage
     */
    public function getMarkupPercentage(): float
    {
        if ($this->baseCost->getAmount() === 0) {
            return 0.0;
        }
        
        return $this->markup->getAmount() / $this->baseCost->getAmount();
    }
    
    /**
     * Calculate discount percentage
     */
    public function getDiscountPercentage(): float
    {
        $priceBeforeDiscount = $this->baseCost->add($this->markup);
        
        if ($priceBeforeDiscount->getAmount() === 0) {
            return 0.0;
        }
        
        return $this->discount->getAmount() / $priceBeforeDiscount->getAmount();
    }
    
    /**
     * Check if pricing meets minimum profit margin
     */
    public function meetsMinimumMargin(float $minimumMargin = 0.30): bool
    {
        return $this->profitMargin >= $minimumMargin;
    }
    
    /**
     * Get pricing competitiveness score (1-100)
     */
    public function getCompetitivenessScore(): int
    {
        // Score based on profit margin and customer value
        $marginScore = min($this->profitMargin * 100, 50); // Max 50 points for margin
        $discountScore = min($this->getDiscountPercentage() * 200, 30); // Max 30 points for discount
        $valueScore = 20; // Base value score
        
        return (int) ($marginScore + $discountScore + $valueScore);
    }
    
    /**
     * Convert to array for API responses
     */
    public function toArray(): array
    {
        return [
            'base_cost' => $this->baseCost->toArray(),
            'material_cost' => $this->materialCost->toArray(),
            'labor_cost' => $this->laborCost->toArray(),
            'markup' => $this->markup->toArray(),
            'discount' => $this->discount->toArray(),
            'tax' => $this->tax->toArray(),
            'final_price' => $this->finalPrice->toArray(),
            'profit_margin' => round($this->profitMargin * 100, 2), // As percentage
            'profit_amount' => $this->getProfitAmount()->toArray(),
            'customer_savings' => $this->getCustomerSavings()->toArray(),
            'markup_percentage' => round($this->getMarkupPercentage() * 100, 2),
            'discount_percentage' => round($this->getDiscountPercentage() * 100, 2),
            'complexity_multiplier' => $this->complexityMultiplier,
            'competitiveness_score' => $this->getCompetitivenessScore(),
            'meets_minimum_margin' => $this->meetsMinimumMargin(),
            'breakdown' => $this->breakdown,
            'analysis' => [
                'total_cost' => $this->getTotalCost()->toArray(),
                'value_proposition' => $this->generateValueProposition(),
                'pricing_strategy' => $this->identifyPricingStrategy()
            ]
        ];
    }
    
    /**
     * Generate value proposition text
     */
    private function generateValueProposition(): string
    {
        $discountPercentage = $this->getDiscountPercentage() * 100;
        $profitMarginPercentage = $this->profitMargin * 100;
        
        if ($discountPercentage > 10) {
            return "Exceptional value with {$discountPercentage}% savings while maintaining {$profitMarginPercentage}% profit margin";
        } elseif ($profitMarginPercentage > 40) {
            return "Premium pricing strategy with {$profitMarginPercentage}% margin for superior quality";
        } else {
            return "Competitive pricing with balanced {$profitMarginPercentage}% margin and customer value";
        }
    }
    
    /**
     * Identify pricing strategy based on structure
     */
    private function identifyPricingStrategy(): string
    {
        $markupPercentage = $this->getMarkupPercentage() * 100;
        $discountPercentage = $this->getDiscountPercentage() * 100;
        
        if ($markupPercentage > 50 && $discountPercentage < 5) {
            return 'premium';
        } elseif ($markupPercentage < 30 && $discountPercentage > 10) {
            return 'competitive';
        } elseif ($discountPercentage > 15) {
            return 'promotional';
        } else {
            return 'standard';
        }
    }
    
    /**
     * Compare with another pricing structure
     */
    public function compareWith(PricingStructure $other): array
    {
        return [
            'price_difference' => $this->finalPrice->subtract($other->getFinalPrice())->toArray(),
            'margin_difference' => $this->profitMargin - $other->getProfitMargin(),
            'discount_difference' => $this->getDiscountPercentage() - $other->getDiscountPercentage(),
            'competitiveness_difference' => $this->getCompetitivenessScore() - $other->getCompetitivenessScore(),
            'recommendation' => $this->generateComparisonRecommendation($other)
        ];
    }
    
    /**
     * Generate comparison recommendation
     */
    private function generateComparisonRecommendation(PricingStructure $other): string
    {
        $priceDiff = $this->finalPrice->subtract($other->getFinalPrice());
        $marginDiff = $this->profitMargin - $other->getProfitMargin();
        
        if ($priceDiff->getAmount() > 0 && $marginDiff > 0.05) {
            return 'Current pricing offers better profitability but may impact competitiveness';
        } elseif ($priceDiff->getAmount() < 0 && $marginDiff < -0.05) {
            return 'Alternative pricing is more competitive but reduces profitability';
        } else {
            return 'Pricing structures are well-balanced with minimal trade-offs';
        }
    }
}