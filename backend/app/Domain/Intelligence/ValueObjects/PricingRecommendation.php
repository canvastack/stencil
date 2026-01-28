<?php

namespace App\Domain\Intelligence\ValueObjects;

/**
 * Pricing Recommendation Value Object
 * 
 * Represents an AI-generated pricing strategy recommendation with
 * business impact analysis and risk assessment.
 */
class PricingRecommendation
{
    public function __construct(
        private string $strategy,
        private string $reason,
        private float $suggestedMarkup,
        private float $confidence,
        private string $expectedImpact,
        private string $riskLevel
    ) {
        $this->validateRecommendation();
    }

    public function getStrategy(): string
    {
        return $this->strategy;
    }

    public function getReason(): string
    {
        return $this->reason;
    }

    public function getSuggestedMarkup(): float
    {
        return $this->suggestedMarkup;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getExpectedImpact(): string
    {
        return $this->expectedImpact;
    }

    public function getRiskLevel(): string
    {
        return $this->riskLevel;
    }

    /**
     * Check if this is a high-confidence recommendation
     */
    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    /**
     * Check if this is a low-risk strategy
     */
    public function isLowRisk(): bool
    {
        return $this->riskLevel === 'low';
    }

    /**
     * Get markup percentage for display
     */
    public function getMarkupPercentage(): float
    {
        return $this->suggestedMarkup * 100;
    }

    /**
     * Get strategy category
     */
    public function getStrategyCategory(): string
    {
        return match($this->strategy) {
            'premium_pricing' => 'Premium Strategy',
            'competitive_pricing' => 'Competitive Strategy',
            'value_based_pricing' => 'Value-Based Strategy',
            'volume_discount' => 'Volume Strategy',
            'penetration_pricing' => 'Market Penetration',
            'skimming_pricing' => 'Price Skimming',
            default => 'Custom Strategy'
        };
    }

    /**
     * Get risk level color for UI
     */
    public function getRiskLevelColor(): string
    {
        return match($this->riskLevel) {
            'low' => 'green',
            'medium' => 'yellow',
            'high' => 'orange',
            'very_high' => 'red',
            default => 'gray'
        };
    }

    /**
     * Get implementation timeline
     */
    public function getImplementationTimeline(): array
    {
        return match($this->strategy) {
            'premium_pricing' => [
                'immediate' => 'Analyze current positioning',
                'week_1' => 'Develop premium value proposition',
                'week_2' => 'Test with select customers',
                'week_3' => 'Full implementation'
            ],
            'competitive_pricing' => [
                'immediate' => 'Conduct competitor analysis',
                'week_1' => 'Adjust pricing structure',
                'week_2' => 'Monitor market response',
                'week_3' => 'Optimize based on feedback'
            ],
            'value_based_pricing' => [
                'immediate' => 'Define value metrics',
                'week_1' => 'Calculate value-price ratio',
                'week_2' => 'Communicate value to customers',
                'week_3' => 'Implement new pricing'
            ],
            'volume_discount' => [
                'immediate' => 'Analyze volume patterns',
                'week_1' => 'Design discount structure',
                'week_2' => 'Communicate to customers',
                'week_3' => 'Launch volume program'
            ],
            default => [
                'immediate' => 'Strategy analysis',
                'week_1' => 'Implementation planning',
                'week_2' => 'Pilot testing',
                'week_3' => 'Full rollout'
            ]
        };
    }

    /**
     * Get success metrics to track
     */
    public function getSuccessMetrics(): array
    {
        return match($this->strategy) {
            'premium_pricing' => [
                'profit_margin_increase',
                'customer_retention_rate',
                'average_order_value',
                'brand_perception_score'
            ],
            'competitive_pricing' => [
                'market_share_growth',
                'conversion_rate',
                'customer_acquisition_cost',
                'competitive_win_rate'
            ],
            'value_based_pricing' => [
                'customer_satisfaction',
                'price_acceptance_rate',
                'value_perception_score',
                'repeat_purchase_rate'
            ],
            'volume_discount' => [
                'average_order_size',
                'customer_lifetime_value',
                'order_frequency',
                'bulk_order_percentage'
            ],
            default => [
                'revenue_growth',
                'profit_margin',
                'customer_satisfaction',
                'market_position'
            ]
        };
    }

    /**
     * Get potential challenges and mitigation strategies
     */
    public function getChallengesAndMitigation(): array
    {
        return match($this->strategy) {
            'premium_pricing' => [
                'challenges' => [
                    'Customer price sensitivity',
                    'Competitor underpricing',
                    'Value justification difficulty'
                ],
                'mitigation' => [
                    'Enhance value proposition communication',
                    'Focus on quality differentiation',
                    'Provide exceptional customer service'
                ]
            ],
            'competitive_pricing' => [
                'challenges' => [
                    'Margin pressure',
                    'Price wars',
                    'Sustainability concerns'
                ],
                'mitigation' => [
                    'Focus on operational efficiency',
                    'Differentiate on non-price factors',
                    'Monitor competitor responses closely'
                ]
            ],
            'value_based_pricing' => [
                'challenges' => [
                    'Value quantification complexity',
                    'Customer education needs',
                    'Implementation complexity'
                ],
                'mitigation' => [
                    'Develop clear value metrics',
                    'Invest in customer education',
                    'Gradual implementation approach'
                ]
            ],
            default => [
                'challenges' => ['Market acceptance', 'Implementation complexity'],
                'mitigation' => ['Gradual rollout', 'Customer communication']
            ]
        ];
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'strategy' => $this->strategy,
            'strategy_category' => $this->getStrategyCategory(),
            'reason' => $this->reason,
            'suggested_markup' => $this->suggestedMarkup,
            'markup_percentage' => $this->getMarkupPercentage(),
            'confidence' => $this->confidence,
            'expected_impact' => $this->expectedImpact,
            'risk_level' => $this->riskLevel,
            'risk_level_color' => $this->getRiskLevelColor(),
            'is_high_confidence' => $this->isHighConfidence(),
            'is_low_risk' => $this->isLowRisk(),
            'implementation_timeline' => $this->getImplementationTimeline(),
            'success_metrics' => $this->getSuccessMetrics(),
            'challenges_and_mitigation' => $this->getChallengesAndMitigation()
        ];
    }

    private function validateRecommendation(): void
    {
        $validStrategies = [
            'premium_pricing',
            'competitive_pricing',
            'value_based_pricing',
            'volume_discount',
            'penetration_pricing',
            'skimming_pricing'
        ];

        if (!in_array($this->strategy, $validStrategies)) {
            throw new \InvalidArgumentException('Invalid pricing strategy');
        }

        if ($this->suggestedMarkup < 0 || $this->suggestedMarkup > 2) {
            throw new \InvalidArgumentException('Suggested markup must be between 0 and 2 (200%)');
        }

        if ($this->confidence < 0 || $this->confidence > 1) {
            throw new \InvalidArgumentException('Confidence must be between 0 and 1');
        }

        $validRiskLevels = ['low', 'medium', 'high', 'very_high'];
        if (!in_array($this->riskLevel, $validRiskLevels)) {
            throw new \InvalidArgumentException('Invalid risk level');
        }

        if (empty(trim($this->reason))) {
            throw new \InvalidArgumentException('Reason cannot be empty');
        }

        if (empty(trim($this->expectedImpact))) {
            throw new \InvalidArgumentException('Expected impact cannot be empty');
        }
    }
}