<?php

namespace App\Domain\Pricing\Strategies;

use App\Domain\Customer\Entities\Customer;

/**
 * Markup Strategy Factory
 * 
 * Creates appropriate markup strategy based on customer characteristics
 */
class MarkupStrategyFactory
{
    /**
     * Create markup strategy for customer
     */
    public function createForCustomer(Customer $customer): MarkupStrategy
    {
        $tier = $customer->getTier();
        
        return match($tier) {
            'vip', 'premium' => new PremiumMarkupStrategy(),
            'corporate' => new CorporateMarkupStrategy(),
            'standard' => new StandardMarkupStrategy(),
            default => new DefaultMarkupStrategy()
        };
    }
    
    /**
     * Create markup strategy by name
     */
    public function createByName(string $strategyName): MarkupStrategy
    {
        return match(strtolower($strategyName)) {
            'premium' => new PremiumMarkupStrategy(),
            'corporate' => new CorporateMarkupStrategy(),
            'standard' => new StandardMarkupStrategy(),
            'default' => new DefaultMarkupStrategy(),
            default => throw new \InvalidArgumentException("Unknown markup strategy: {$strategyName}")
        };
    }
    
    /**
     * Get available strategies
     */
    public function getAvailableStrategies(): array
    {
        return [
            'premium' => [
                'name' => 'Premium Strategy',
                'description' => 'Lower markup for premium customers (35-45%)',
                'target_customers' => ['VIP', 'Premium tier customers'],
                'markup_range' => '35-45%'
            ],
            'corporate' => [
                'name' => 'Corporate Strategy',
                'description' => 'Competitive markup for corporate clients (40-50%)',
                'target_customers' => ['Corporate accounts', 'Bulk orders'],
                'markup_range' => '40-50%'
            ],
            'standard' => [
                'name' => 'Standard Strategy',
                'description' => 'Standard markup for regular customers (45-55%)',
                'target_customers' => ['Standard tier customers'],
                'markup_range' => '45-55%'
            ],
            'default' => [
                'name' => 'Default Strategy',
                'description' => 'Default markup for new customers (50-65%)',
                'target_customers' => ['New customers', 'Unclassified customers'],
                'markup_range' => '50-65%'
            ]
        ];
    }
}