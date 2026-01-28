<?php

namespace App\Domain\Intelligence\ValueObjects;

use App\Domain\Shared\ValueObjects\UuidValueObject;
use Carbon\Carbon;

/**
 * Market Trend Prediction Value Object
 * 
 * Contains comprehensive market trend predictions including demand, pricing,
 * material trends, and competitive landscape analysis.
 */
class MarketTrendPrediction
{
    public function __construct(
        private UuidValueObject $tenantId,
        private array $demandTrends,
        private array $pricingTrends,
        private array $materialTrends,
        private array $competitorTrends,
        private array $recommendations,
        private float $confidence,
        private \DateInterval $timeframe,
        private Carbon $generatedAt
    ) {
        $this->validatePrediction();
    }

    public function getTenantId(): UuidValueObject
    {
        return $this->tenantId;
    }

    public function getDemandTrends(): array
    {
        return $this->demandTrends;
    }

    public function getPricingTrends(): array
    {
        return $this->pricingTrends;
    }

    public function getMaterialTrends(): array
    {
        return $this->materialTrends;
    }

    public function getCompetitorTrends(): array
    {
        return $this->competitorTrends;
    }

    public function getRecommendations(): array
    {
        return $this->recommendations;
    }

    public function getConfidence(): float
    {
        return $this->confidence;
    }

    public function getTimeframe(): \DateInterval
    {
        return $this->timeframe;
    }

    public function getGeneratedAt(): Carbon
    {
        return $this->generatedAt;
    }

    /**
     * Check if prediction is high confidence
     */
    public function isHighConfidence(): bool
    {
        return $this->confidence >= 0.8;
    }

    /**
     * Get overall market outlook
     */
    public function getMarketOutlook(): string
    {
        $demandGrowth = $this->getAverageDemandGrowth();
        $priceStability = $this->getPriceStability();
        
        if ($demandGrowth > 0.1 && $priceStability > 0.8) {
            return 'very_positive';
        } elseif ($demandGrowth > 0.05 && $priceStability > 0.6) {
            return 'positive';
        } elseif ($demandGrowth > -0.05 && $priceStability > 0.4) {
            return 'stable';
        } elseif ($demandGrowth > -0.1) {
            return 'challenging';
        } else {
            return 'difficult';
        }
    }

    /**
     * Get key opportunities identified
     */
    public function getKeyOpportunities(): array
    {
        $opportunities = [];
        
        // Analyze demand trends for opportunities
        foreach ($this->demandTrends as $trend) {
            if (isset($trend['demand_change']) && $trend['demand_change'] > 0.1) {
                $opportunities[] = "High demand growth expected in month {$trend['month']}";
            }
        }
        
        // Analyze pricing trends for opportunities
        foreach ($this->pricingTrends as $trend) {
            if (isset($trend['price_change']) && $trend['price_change'] > 0.05) {
                $opportunities[] = "Pricing power opportunity in month {$trend['month']}";
            }
        }
        
        return $opportunities;
    }

    /**
     * Get key risks identified
     */
    public function getKeyRisks(): array
    {
        $risks = [];
        
        // Analyze demand trends for risks
        foreach ($this->demandTrends as $trend) {
            if (isset($trend['demand_change']) && $trend['demand_change'] < -0.1) {
                $risks[] = "Demand decline risk in month {$trend['month']}";
            }
        }
        
        // Analyze pricing trends for risks
        foreach ($this->pricingTrends as $trend) {
            if (isset($trend['price_change']) && $trend['price_change'] < -0.05) {
                $risks[] = "Price pressure risk in month {$trend['month']}";
            }
        }
        
        return $risks;
    }

    /**
     * Get strategic recommendations by priority
     */
    public function getStrategicRecommendations(): array
    {
        $strategic = [];
        
        $outlook = $this->getMarketOutlook();
        
        switch ($outlook) {
            case 'very_positive':
                $strategic[] = 'Expand capacity to capture growth opportunities';
                $strategic[] = 'Consider premium positioning strategy';
                $strategic[] = 'Invest in market share expansion';
                break;
                
            case 'positive':
                $strategic[] = 'Optimize operations for efficiency gains';
                $strategic[] = 'Selective market expansion';
                $strategic[] = 'Strengthen customer relationships';
                break;
                
            case 'stable':
                $strategic[] = 'Focus on operational excellence';
                $strategic[] = 'Maintain competitive positioning';
                $strategic[] = 'Explore new market segments';
                break;
                
            case 'challenging':
                $strategic[] = 'Implement cost optimization measures';
                $strategic[] = 'Strengthen value proposition';
                $strategic[] = 'Focus on customer retention';
                break;
                
            case 'difficult':
                $strategic[] = 'Aggressive cost reduction required';
                $strategic[] = 'Consider market repositioning';
                $strategic[] = 'Evaluate strategic partnerships';
                break;
        }
        
        return $strategic;
    }

    /**
     * Get monthly trend summary
     */
    public function getMonthlySummary(): array
    {
        $summary = [];
        
        $maxMonths = max(
            count($this->demandTrends),
            count($this->pricingTrends)
        );
        
        for ($month = 1; $month <= $maxMonths; $month++) {
            $demandTrend = $this->demandTrends[$month - 1] ?? null;
            $pricingTrend = $this->pricingTrends[$month - 1] ?? null;
            
            $summary[] = [
                'month' => $month,
                'demand_outlook' => $this->categorizeTrend($demandTrend['demand_change'] ?? 0),
                'pricing_outlook' => $this->categorizeTrend($pricingTrend['price_change'] ?? 0),
                'overall_outlook' => $this->calculateMonthlyOutlook($demandTrend, $pricingTrend),
                'confidence' => min(
                    $demandTrend['confidence'] ?? 0.5,
                    $pricingTrend['confidence'] ?? 0.5
                )
            ];
        }
        
        return $summary;
    }

    /**
     * Convert to array for API response
     */
    public function toArray(): array
    {
        return [
            'tenant_id' => $this->tenantId->getValue(),
            'demand_trends' => $this->demandTrends,
            'pricing_trends' => $this->pricingTrends,
            'material_trends' => $this->materialTrends,
            'competitor_trends' => $this->competitorTrends,
            'recommendations' => $this->recommendations,
            'confidence' => $this->confidence,
            'timeframe_months' => $this->getTimeframeInMonths(),
            'generated_at' => $this->generatedAt->toISOString(),
            'market_outlook' => $this->getMarketOutlook(),
            'key_opportunities' => $this->getKeyOpportunities(),
            'key_risks' => $this->getKeyRisks(),
            'strategic_recommendations' => $this->getStrategicRecommendations(),
            'monthly_summary' => $this->getMonthlySummary(),
            'indicators' => [
                'high_confidence' => $this->isHighConfidence(),
                'positive_outlook' => in_array($this->getMarketOutlook(), ['positive', 'very_positive']),
                'growth_expected' => $this->getAverageDemandGrowth() > 0,
                'price_stability' => $this->getPriceStability() > 0.7
            ]
        ];
    }

    private function validatePrediction(): void
    {
        if ($this->confidence < 0 || $this->confidence > 1) {
            throw new \InvalidArgumentException('Confidence must be between 0 and 1');
        }

        if (!is_array($this->demandTrends)) {
            throw new \InvalidArgumentException('Demand trends must be an array');
        }

        if (!is_array($this->pricingTrends)) {
            throw new \InvalidArgumentException('Pricing trends must be an array');
        }

        if (!is_array($this->materialTrends)) {
            throw new \InvalidArgumentException('Material trends must be an array');
        }

        if (!is_array($this->competitorTrends)) {
            throw new \InvalidArgumentException('Competitor trends must be an array');
        }

        if (!is_array($this->recommendations)) {
            throw new \InvalidArgumentException('Recommendations must be an array');
        }
    }

    private function getAverageDemandGrowth(): float
    {
        if (empty($this->demandTrends)) {
            return 0;
        }
        
        $totalGrowth = array_sum(array_column($this->demandTrends, 'demand_change'));
        return $totalGrowth / count($this->demandTrends);
    }

    private function getPriceStability(): float
    {
        if (empty($this->pricingTrends)) {
            return 0.5;
        }
        
        $priceChanges = array_column($this->pricingTrends, 'price_change');
        $variance = $this->calculateVariance($priceChanges);
        
        // Lower variance = higher stability
        return max(0, 1 - ($variance * 10));
    }

    private function calculateVariance(array $values): float
    {
        if (count($values) < 2) {
            return 0;
        }
        
        $mean = array_sum($values) / count($values);
        $squaredDifferences = array_map(fn($x) => pow($x - $mean, 2), $values);
        
        return array_sum($squaredDifferences) / count($values);
    }

    private function categorizeTrend(float $change): string
    {
        return match(true) {
            $change > 0.15 => 'strong_growth',
            $change > 0.05 => 'growth',
            $change > -0.05 => 'stable',
            $change > -0.15 => 'decline',
            default => 'strong_decline'
        };
    }

    private function calculateMonthlyOutlook(?array $demandTrend, ?array $pricingTrend): string
    {
        $demandChange = $demandTrend['demand_change'] ?? 0;
        $priceChange = $pricingTrend['price_change'] ?? 0;
        
        $score = $demandChange + ($priceChange * 0.5); // Weight demand more heavily
        
        return match(true) {
            $score > 0.1 => 'excellent',
            $score > 0.05 => 'good',
            $score > -0.05 => 'neutral',
            $score > -0.1 => 'challenging',
            default => 'difficult'
        };
    }

    private function getTimeframeInMonths(): int
    {
        // Convert DateInterval to months (approximate)
        return $this->timeframe->m + ($this->timeframe->y * 12);
    }
}