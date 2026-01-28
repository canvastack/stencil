<?php

namespace App\Domain\Analytics\ValueObjects;

use DatePeriod;
use DateTimeImmutable;

/**
 * Executive Dashboard Value Object
 * 
 * Represents a comprehensive executive dashboard with all key business metrics,
 * trends, and insights for strategic decision making.
 */
final class ExecutiveDashboard
{
    public function __construct(
        private DatePeriod $period,
        private OrderMetrics $orderMetrics,
        private RevenueMetrics $revenueMetrics,
        private ProfitabilityMetrics $profitabilityMetrics,
        private VendorMetrics $vendorMetrics,
        private CustomerMetrics $customerMetrics,
        private OperationalMetrics $operationalMetrics,
        private QualityMetrics $qualityMetrics,
        private TrendAnalysis $trends,
        private BusinessForecasts $forecasts,
        private DateTimeImmutable $generatedAt
    ) {}

    public function getPeriod(): DatePeriod
    {
        return $this->period;
    }

    public function getOrderMetrics(): OrderMetrics
    {
        return $this->orderMetrics;
    }

    public function getRevenueMetrics(): RevenueMetrics
    {
        return $this->revenueMetrics;
    }

    public function getProfitabilityMetrics(): ProfitabilityMetrics
    {
        return $this->profitabilityMetrics;
    }

    public function getVendorMetrics(): VendorMetrics
    {
        return $this->vendorMetrics;
    }

    public function getCustomerMetrics(): CustomerMetrics
    {
        return $this->customerMetrics;
    }

    public function getOperationalMetrics(): OperationalMetrics
    {
        return $this->operationalMetrics;
    }

    public function getQualityMetrics(): QualityMetrics
    {
        return $this->qualityMetrics;
    }

    public function getTrends(): TrendAnalysis
    {
        return $this->trends;
    }

    public function getForecasts(): BusinessForecasts
    {
        return $this->forecasts;
    }

    public function getGeneratedAt(): DateTimeImmutable
    {
        return $this->generatedAt;
    }

    /**
     * Get overall business health score (0-100)
     */
    public function getBusinessHealthScore(): int
    {
        $revenueScore = min(25, $this->revenueMetrics->getRevenueGrowthRate() * 100);
        $profitScore = min(25, $this->profitabilityMetrics->getGrossProfitMargin() * 100);
        $operationalScore = min(25, $this->operationalMetrics->getProductionEfficiency() * 100);
        $qualityScore = min(25, $this->qualityMetrics->getQualityScore() * 100);
        
        return (int) round($revenueScore + $profitScore + $operationalScore + $qualityScore);
    }

    /**
     * Get business health status
     */
    public function getBusinessHealthStatus(): string
    {
        $score = $this->getBusinessHealthScore();
        
        return match(true) {
            $score >= 90 => 'excellent',
            $score >= 80 => 'good',
            $score >= 70 => 'fair',
            $score >= 60 => 'poor',
            default => 'critical'
        };
    }

    /**
     * Get key performance indicators summary
     */
    public function getKPISummary(): array
    {
        return [
            'total_orders' => $this->orderMetrics->getTotalOrders(),
            'total_revenue' => $this->revenueMetrics->getTotalRevenue()->getAmount(),
            'gross_profit_margin' => $this->profitabilityMetrics->getGrossProfitMargin(),
            'order_completion_rate' => $this->orderMetrics->getOrderCompletionRate(),
            'customer_satisfaction' => $this->qualityMetrics->getCustomerSatisfactionScore(),
            'vendor_performance' => $this->vendorMetrics->getAverageOnTimeDelivery(),
            'production_efficiency' => $this->operationalMetrics->getProductionEfficiency(),
            'quality_score' => $this->qualityMetrics->getQualityScore()
        ];
    }

    /**
     * Get critical alerts
     */
    public function getCriticalAlerts(): array
    {
        $alerts = [];
        
        // Revenue alerts
        if ($this->revenueMetrics->getRevenueGrowthRate() < -0.1) {
            $alerts[] = [
                'type' => 'revenue_decline',
                'severity' => 'high',
                'message' => 'Revenue declined by ' . abs($this->revenueMetrics->getRevenueGrowthRate() * 100) . '%'
            ];
        }
        
        // Profitability alerts
        if ($this->profitabilityMetrics->getGrossProfitMargin() < 0.2) {
            $alerts[] = [
                'type' => 'low_profitability',
                'severity' => 'high',
                'message' => 'Gross profit margin below 20%'
            ];
        }
        
        // Quality alerts
        if ($this->qualityMetrics->getDefectRate() > 0.05) {
            $alerts[] = [
                'type' => 'quality_issues',
                'severity' => 'medium',
                'message' => 'Defect rate above 5%'
            ];
        }
        
        // Operational alerts
        if ($this->operationalMetrics->getProductionEfficiency() < 0.7) {
            $alerts[] = [
                'type' => 'low_efficiency',
                'severity' => 'medium',
                'message' => 'Production efficiency below 70%'
            ];
        }
        
        return $alerts;
    }

    /**
     * Get top opportunities
     */
    public function getTopOpportunities(): array
    {
        $opportunities = [];
        
        // Revenue opportunities
        if ($this->customerMetrics->getCustomerRetentionRate() < 0.9) {
            $opportunities[] = [
                'category' => 'customer_retention',
                'impact' => 'high',
                'description' => 'Improve customer retention to increase recurring revenue'
            ];
        }
        
        // Operational opportunities
        if ($this->operationalMetrics->getCapacityUtilization() < 0.8) {
            $opportunities[] = [
                'category' => 'capacity_optimization',
                'impact' => 'medium',
                'description' => 'Optimize capacity utilization to reduce costs'
            ];
        }
        
        // Vendor opportunities
        if ($this->vendorMetrics->getAverageOnTimeDelivery() < 0.9) {
            $opportunities[] = [
                'category' => 'vendor_performance',
                'impact' => 'medium',
                'description' => 'Improve vendor performance to reduce delays'
            ];
        }
        
        return $opportunities;
    }

    /**
     * Get executive summary
     */
    public function getExecutiveSummary(): array
    {
        return [
            'period' => [
                'start' => $this->period->getStartDate()->format('Y-m-d'),
                'end' => $this->period->getEndDate()->format('Y-m-d')
            ],
            'business_health_score' => $this->getBusinessHealthScore(),
            'business_health_status' => $this->getBusinessHealthStatus(),
            'key_metrics' => $this->getKPISummary(),
            'critical_alerts' => $this->getCriticalAlerts(),
            'top_opportunities' => $this->getTopOpportunities(),
            'generated_at' => $this->generatedAt->format('Y-m-d H:i:s')
        ];
    }

    public function toArray(): array
    {
        return [
            'period' => [
                'start' => $this->period->getStartDate()->format('Y-m-d'),
                'end' => $this->period->getEndDate()->format('Y-m-d')
            ],
            'order_metrics' => $this->orderMetrics->toArray(),
            'revenue_metrics' => $this->revenueMetrics->toArray(),
            'profitability_metrics' => $this->profitabilityMetrics->toArray(),
            'vendor_metrics' => $this->vendorMetrics->toArray(),
            'customer_metrics' => $this->customerMetrics->toArray(),
            'operational_metrics' => $this->operationalMetrics->toArray(),
            'quality_metrics' => $this->qualityMetrics->toArray(),
            'trends' => $this->trends->toArray(),
            'forecasts' => $this->forecasts->toArray(),
            'business_health_score' => $this->getBusinessHealthScore(),
            'business_health_status' => $this->getBusinessHealthStatus(),
            'kpi_summary' => $this->getKPISummary(),
            'critical_alerts' => $this->getCriticalAlerts(),
            'top_opportunities' => $this->getTopOpportunities(),
            'executive_summary' => $this->getExecutiveSummary(),
            'generated_at' => $this->generatedAt->format('Y-m-d H:i:s')
        ];
    }
}