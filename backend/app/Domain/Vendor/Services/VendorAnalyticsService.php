<?php

namespace App\Domain\Vendor\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Infrastructure\Persistence\Eloquent\Models\OrderVendorNegotiation;
use App\Domain\Vendor\Services\VendorMatchingService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class VendorAnalyticsService
{
    public function __construct(
        private VendorMatchingService $vendorMatchingService
    ) {}

    /**
     * Get comprehensive dashboard data
     */
    public function getDashboardData(
        Carbon $dateFrom, 
        Carbon $dateTo, 
        ?array $vendorIds = null, 
        bool $includeTrends = true, 
        bool $includePredictions = false
    ): array {
        $cacheKey = "vendor_dashboard_{$dateFrom->format('Y-m-d')}_{$dateTo->format('Y-m-d')}_" . md5(serialize($vendorIds));
        
        return Cache::remember($cacheKey, 300, function () use ($dateFrom, $dateTo, $vendorIds, $includeTrends, $includePredictions) {
            // Get base vendor data
            $vendorsQuery = Vendor::where('status', 'active');
            if ($vendorIds) {
                $vendorsQuery->whereIn('id', $vendorIds);
            }
            $vendors = $vendorsQuery->get();

            // Calculate KPIs
            $kpis = $this->calculateDashboardKPIs($vendors, $dateFrom, $dateTo);
            
            // Get performance matrix
            $performanceMatrix = $this->getPerformanceMatrix($vendors, $dateFrom, $dateTo);
            
            // Risk analysis
            $riskAnalysis = $this->calculateRiskDistribution($vendors);
            
            // Top performers
            $topPerformers = $this->getTopPerformers($vendors, 5);
            
            $dashboard = [
                'summary_kpis' => $kpis,
                'performance_matrix' => $performanceMatrix,
                'risk_analysis' => $riskAnalysis,
                'top_performers' => $topPerformers,
            ];

            if ($includeTrends) {
                $dashboard['trends'] = $this->calculateTrends($vendors, $dateFrom, $dateTo);
            }

            if ($includePredictions) {
                $dashboard['predictions'] = $this->generatePredictions($vendors, $dateFrom, $dateTo);
            }

            return $dashboard;
        });
    }

    /**
     * Calculate comprehensive dashboard KPIs
     */
    private function calculateDashboardKPIs($vendors, Carbon $dateFrom, Carbon $dateTo): array
    {
        $vendorIds = $vendors->pluck('id');
        
        // Get orders within date range
        $orders = VendorOrder::whereIn('vendor_id', $vendorIds)
            ->whereBetween('created_at', [$dateFrom, $dateTo])
            ->get();

        $completedOrders = $orders->where('status', 'completed');
        $activeOrders = $orders->whereIn('status', ['pending', 'accepted', 'in_progress']);

        // Calculate metrics
        $totalOrders = $orders->count();
        $onTimeOrders = $completedOrders->where('delivery_status', 'on_time')->count();
        $onTimeRate = $completedOrders->count() > 0 ? ($onTimeOrders / $completedOrders->count()) * 100 : 0;

        $avgQuality = $completedOrders->where('quality_rating', '>', 0)->avg('quality_rating') ?? 0;
        $avgResponseTime = $this->calculateAverageResponseTime($vendorIds);

        $topPerformer = $vendors->sortByDesc('performance_score')->first();

        // Calculate trends
        $previousPeriod = $this->getPreviousPeriodData($vendorIds, $dateFrom, $dateTo);

        return [
            'top_performer' => [
                'name' => $topPerformer?->name,
                'score' => round($topPerformer?->performance_score ?? 0, 1),
                'trend' => $this->calculateTrendDirection($topPerformer?->performance_score ?? 0, $previousPeriod['top_score'] ?? 0),
            ],
            'average_response_time' => round($avgResponseTime, 1),
            'response_time_trend' => $this->calculateTrendDirection($avgResponseTime, $previousPeriod['avg_response_time'] ?? $avgResponseTime),
            'overall_on_time_rate' => round($onTimeRate, 1),
            'on_time_rate_trend' => $this->calculateTrendDirection($onTimeRate, $previousPeriod['on_time_rate'] ?? $onTimeRate),
            'active_vendors' => $vendors->count(),
            'new_this_month' => $this->getNewVendorsThisMonth(),
            'active_vendors_trend' => $this->calculateTrendDirection($vendors->count(), $previousPeriod['vendor_count'] ?? $vendors->count()),
            'average_profit_margin' => $this->calculateAverageProfitMargin($orders),
            'profit_margin_trend' => $this->calculateTrendDirection($this->calculateAverageProfitMargin($orders), $previousPeriod['profit_margin'] ?? 0),
            'total_active_orders' => $activeOrders->count(),
            'completed_orders' => $completedOrders->count(),
            'average_order_value' => $orders->avg('final_price') ?? $orders->avg('estimated_price') ?? 0,
        ];
    }

    /**
     * Get performance heatmap data
     */
    public function getPerformanceHeatmap(string $period, array $metrics, ?array $vendorIds = null): array
    {
        $vendorsQuery = Vendor::where('status', 'active');
        if ($vendorIds) {
            $vendorsQuery->whereIn('id', $vendorIds);
        }
        $vendors = $vendorsQuery->get();

        $heatmapData = [];

        foreach ($vendors as $vendor) {
            $orders = VendorOrder::where('vendor_id', $vendor->id)
                ->where('status', 'completed')
                ->where('created_at', '>=', $this->getDateFromPeriod($period))
                ->get();

            if ($orders->isEmpty()) continue;

            $vendorData = [
                'vendor_id' => $vendor->id,
                'vendor_name' => $vendor->name,
                'vendor_code' => $vendor->code,
                'quality_tier' => $vendor->quality_tier,
                'metrics' => [],
            ];

            foreach ($metrics as $metric) {
                $vendorData['metrics'][$metric] = $this->calculateMetricValue($metric, $orders, $vendor);
            }

            // Calculate overall score
            $vendorData['overall_score'] = array_sum($vendorData['metrics']) / count($vendorData['metrics']);
            
            $heatmapData[] = $vendorData;
        }

        // Sort by overall score
        usort($heatmapData, function ($a, $b) {
            return $b['overall_score'] <=> $a['overall_score'];
        });

        return $heatmapData;
    }

    /**
     * Get comprehensive risk analysis
     */
    public function getRiskAnalysis(?string $riskLevel = null, string $sortBy = 'risk_score', string $sortOrder = 'desc', int $limit = 50): array
    {
        $vendors = Vendor::where('status', 'active')->get();
        $riskData = [];

        foreach ($vendors as $vendor) {
            $risk = $this->calculateVendorRisk($vendor);
            
            if ($riskLevel && $risk['level'] !== $riskLevel) {
                continue;
            }

            $riskData[] = [
                'vendor_id' => $vendor->id,
                'vendor_name' => $vendor->name,
                'vendor_code' => $vendor->code,
                'quality_tier' => $vendor->quality_tier,
                'risk_score' => $risk['score'],
                'risk_level' => $risk['level'],
                'risk_factors' => $risk['factors'],
                'performance_score' => $vendor->performance_score ?? 0,
                'total_orders' => $vendor->total_orders ?? 0,
                'last_order_date' => $this->getLastOrderDate($vendor->id),
                'mitigation_actions' => $this->getMitigationActions($risk),
            ];
        }

        // Sort data
        usort($riskData, function ($a, $b) use ($sortBy, $sortOrder) {
            $comparison = $a[$sortBy] <=> $b[$sortBy];
            return $sortOrder === 'desc' ? -$comparison : $comparison;
        });

        $riskData = array_slice($riskData, 0, $limit);

        // Calculate risk distribution
        $riskDistribution = [
            'low' => 0,
            'medium' => 0,
            'high' => 0,
            'critical' => 0,
        ];

        foreach ($riskData as $risk) {
            $riskDistribution[$risk['risk_level']]++;
        }

        return [
            'vendors' => $riskData,
            'risk_distribution' => $riskDistribution,
            'total_vendors_analyzed' => count($riskData),
            'high_risk_percentage' => count($riskData) > 0 ? (($riskDistribution['high'] + $riskDistribution['critical']) / count($riskData)) * 100 : 0,
        ];
    }

    /**
     * Get AI-powered vendor recommendations
     */
    public function getVendorRecommendations(array $orderRequirements, int $limit = 10, bool $includeRiskAssessment = true): array
    {
        $vendors = Vendor::where('status', 'active')->get();
        $recommendations = [];

        foreach ($vendors as $vendor) {
            $score = $this->calculateRecommendationScore($vendor, $orderRequirements);
            
            $recommendation = [
                'vendor_id' => $vendor->id,
                'vendor_name' => $vendor->name,
                'vendor_code' => $vendor->code,
                'quality_tier' => $vendor->quality_tier,
                'overall_score' => $score['overall_score'],
                'sub_scores' => $score['sub_scores'],
                'estimated_price' => $score['estimated_price'],
                'estimated_lead_time' => $score['estimated_lead_time'],
                'confidence_level' => $score['confidence_level'],
                'match_explanation' => $score['explanation'],
            ];

            if ($includeRiskAssessment) {
                $risk = $this->calculateVendorRisk($vendor);
                $recommendation['risk_assessment'] = [
                    'level' => $risk['level'],
                    'score' => $risk['score'],
                    'factors' => $risk['factors'],
                ];
            }

            $recommendations[] = $recommendation;
        }

        // Sort by overall score
        usort($recommendations, function ($a, $b) {
            return $b['overall_score'] <=> $a['overall_score'];
        });

        $recommendations = array_slice($recommendations, 0, $limit);

        return [
            'vendors' => $recommendations,
            'algorithm_version' => '2.1.0',
            'total_candidates_evaluated' => $vendors->count(),
            'recommendation_criteria' => $orderRequirements,
            'generated_at' => now()->toIso8601String(),
        ];
    }

    /**
     * Get performance trends over time
     */
    public function getPerformanceTrends(?int $vendorId, Carbon $dateFrom, Carbon $dateTo, string $period, array $metrics): array
    {
        $periods = $this->generatePeriods($dateFrom, $dateTo, $period);
        $trends = [];

        $vendorsQuery = Vendor::where('status', 'active');
        if ($vendorId) {
            $vendorsQuery->where('id', $vendorId);
        }
        $vendors = $vendorsQuery->get();

        foreach ($periods as $periodStart => $periodEnd) {
            $periodData = [
                'period' => $periodStart,
                'period_end' => $periodEnd,
                'vendors' => [],
            ];

            foreach ($vendors as $vendor) {
                $orders = VendorOrder::where('vendor_id', $vendor->id)
                    ->where('status', 'completed')
                    ->whereBetween('created_at', [$periodStart, $periodEnd])
                    ->get();

                if ($orders->isEmpty()) continue;

                $vendorMetrics = [];
                foreach ($metrics as $metric) {
                    $vendorMetrics[$metric] = $this->calculateMetricValue($metric, $orders, $vendor);
                }

                $periodData['vendors'][] = [
                    'vendor_id' => $vendor->id,
                    'vendor_name' => $vendor->name,
                    'metrics' => $vendorMetrics,
                ];
            }

            $trends[] = $periodData;
        }

        return [
            'trends' => $trends,
            'period_type' => $period,
            'metrics_tracked' => $metrics,
            'date_range' => [
                'from' => $dateFrom->toDateString(),
                'to' => $dateTo->toDateString(),
            ],
        ];
    }

    /**
     * Compare multiple vendors
     */
    public function compareVendors(array $vendorIds, array $metrics, string $period): array
    {
        $vendors = Vendor::whereIn('id', $vendorIds)->get();
        $comparison = [];

        $dateFrom = $this->getDateFromPeriod($period);

        foreach ($vendors as $vendor) {
            $orders = VendorOrder::where('vendor_id', $vendor->id)
                ->where('status', 'completed')
                ->where('created_at', '>=', $dateFrom)
                ->get();

            $vendorData = [
                'vendor_id' => $vendor->id,
                'vendor_name' => $vendor->name,
                'vendor_code' => $vendor->code,
                'quality_tier' => $vendor->quality_tier,
                'metrics' => [],
                'total_orders' => $orders->count(),
            ];

            foreach ($metrics as $metric) {
                $vendorData['metrics'][$metric] = $this->calculateMetricValue($metric, $orders, $vendor);
            }

            $comparison[] = $vendorData;
        }

        // Calculate rankings for each metric
        $rankings = [];
        foreach ($metrics as $metric) {
            $sorted = collect($comparison)->sortByDesc("metrics.$metric")->values();
            $rankings[$metric] = $sorted->pluck('vendor_id')->toArray();
        }

        return [
            'vendors' => $comparison,
            'rankings' => $rankings,
            'period' => $period,
            'metrics' => $metrics,
            'best_overall' => $this->findBestOverallVendor($comparison, $metrics),
        ];
    }

    /**
     * Get real-time KPIs with alerts
     */
    public function getRealTimeKPIs(bool $includeAlerts = true): array
    {
        $cacheKey = 'realtime_vendor_kpis';
        
        return Cache::remember($cacheKey, 60, function () use ($includeAlerts) {
            $activeVendors = Vendor::where('status', 'active')->count();
            $activeOrders = VendorOrder::whereIn('status', ['pending', 'accepted', 'in_progress'])->count();
            $overdueOrders = VendorOrder::where('status', 'in_progress')
                ->whereNotNull('estimated_lead_time_days')
                ->whereRaw('DATE_ADD(created_at, INTERVAL estimated_lead_time_days DAY) < NOW()')
                ->count();

            $recentNegotiations = OrderVendorNegotiation::where('created_at', '>=', now()->subHours(24))->count();

            $kpis = [
                'active_vendors' => $activeVendors,
                'active_orders' => $activeOrders,
                'overdue_orders' => $overdueOrders,
                'recent_negotiations' => $recentNegotiations,
                'system_health' => $this->calculateSystemHealth(),
                'last_updated' => now()->toIso8601String(),
            ];

            if ($includeAlerts) {
                $kpis['alerts'] = $this->generateAlerts();
            }

            return $kpis;
        });
    }

    // Helper methods

    private function calculateMetricValue(string $metric, $orders, Vendor $vendor): float
    {
        switch ($metric) {
            case 'on_time_delivery':
                $onTimeOrders = $orders->where('delivery_status', 'on_time')->count();
                return $orders->count() > 0 ? ($onTimeOrders / $orders->count()) : 0;

            case 'quality_rating':
                $avgRating = $orders->where('quality_rating', '>', 0)->avg('quality_rating');
                return $avgRating ? $avgRating / 5 : 0; // Normalize to 0-1

            case 'completion_rate':
                $totalAssigned = VendorOrder::where('vendor_id', $vendor->id)
                    ->where('created_at', '>=', now()->subMonths(6))
                    ->count();
                return $totalAssigned > 0 ? ($orders->count() / $totalAssigned) : 0;

            case 'cost_efficiency':
                $ordersWithCosts = $orders->filter(function ($order) {
                    return $order->estimated_price && $order->final_price && $order->estimated_price > 0;
                });
                if ($ordersWithCosts->isEmpty()) return 0.8;
                
                $avgEfficiency = $ordersWithCosts->map(function ($order) {
                    $ratio = $order->final_price / $order->estimated_price;
                    return $ratio <= 1 ? 1 : max(0.1, 1 / $ratio);
                })->avg();
                
                return $avgEfficiency;

            case 'overall_score':
                return ($vendor->performance_score ?? 0) / 100;

            default:
                return 0;
        }
    }

    private function calculateVendorRisk(Vendor $vendor): array
    {
        $riskScore = 0;
        $riskFactors = [];

        // Performance-based risk
        if (($vendor->performance_score ?? 0) < 70) {
            $riskScore += 30;
            $riskFactors[] = 'Low overall performance score';
        }

        // Order volume risk
        if (($vendor->total_orders ?? 0) < 5) {
            $riskScore += 20;
            $riskFactors[] = 'Limited order history';
        }

        // Recent activity risk
        $lastOrder = VendorOrder::where('vendor_id', $vendor->id)->latest()->first();
        if (!$lastOrder || $lastOrder->created_at < now()->subMonths(3)) {
            $riskScore += 25;
            $riskFactors[] = 'No recent activity';
        }

        // Quality tier vs performance mismatch
        if ($vendor->quality_tier === 'exclusive' && ($vendor->performance_score ?? 0) < 80) {
            $riskScore += 15;
            $riskFactors[] = 'Performance doesn\'t match quality tier';
        }

        // Determine risk level
        if ($riskScore >= 70) $level = 'critical';
        elseif ($riskScore >= 50) $level = 'high';
        elseif ($riskScore >= 30) $level = 'medium';
        else $level = 'low';

        return [
            'score' => min($riskScore, 100),
            'level' => $level,
            'factors' => $riskFactors,
        ];
    }

    private function calculateRecommendationScore(Vendor $vendor, array $requirements): array
    {
        $scores = [
            'specialization' => $this->calculateSpecializationMatch($vendor, $requirements),
            'performance' => ($vendor->performance_score ?? 0) / 100,
            'capacity' => $this->estimateCapacity($vendor),
            'cost_efficiency' => $this->estimateCostEfficiency($vendor, $requirements),
            'reliability' => $this->calculateReliability($vendor),
        ];

        $overallScore = array_sum($scores) / count($scores);
        
        $estimatedPrice = $this->estimateOrderPrice($vendor, $requirements);
        $estimatedLeadTime = $vendor->average_lead_time_days ?? 14;
        
        $confidence = $this->calculateConfidence($vendor, $requirements);

        return [
            'overall_score' => $overallScore * 100,
            'sub_scores' => array_map(fn($score) => $score * 100, $scores),
            'estimated_price' => $estimatedPrice,
            'estimated_lead_time' => $estimatedLeadTime,
            'confidence_level' => $confidence,
            'explanation' => $this->generateExplanation($scores, $requirements),
        ];
    }

    private function calculateSpecializationMatch(Vendor $vendor, array $requirements): float
    {
        $vendorSpecs = $vendor->specializations ?? [];
        $requiredSpecs = [
            $requirements['material'] ?? '',
            $requirements['process'] ?? '',
        ];

        $matches = array_intersect($vendorSpecs, array_filter($requiredSpecs));
        return count($requiredSpecs) > 0 ? count($matches) / count(array_filter($requiredSpecs)) : 0;
    }

    private function estimateCapacity(Vendor $vendor): float
    {
        $activeOrders = VendorOrder::where('vendor_id', $vendor->id)
            ->whereIn('status', ['pending', 'accepted', 'in_progress'])
            ->count();

        $maxCapacity = 10; // Simplified assumption
        return max(0, (($maxCapacity - $activeOrders) / $maxCapacity));
    }

    private function estimateCostEfficiency(Vendor $vendor, array $requirements): float
    {
        // Simplified cost efficiency estimation
        $qualityMultipliers = ['standard' => 1.0, 'premium' => 1.2, 'exclusive' => 1.5];
        $tierMultiplier = $qualityMultipliers[$vendor->quality_tier ?? 'standard'] ?? 1.0;
        
        return 1 / $tierMultiplier; // Inverse relationship for cost efficiency
    }

    private function calculateReliability(Vendor $vendor): float
    {
        $onTimeRate = $this->getVendorOnTimeRate($vendor->id);
        $completionRate = $this->getVendorCompletionRate($vendor->id);
        
        return ($onTimeRate + $completionRate) / 2;
    }

    private function calculateTrendDirection($current, $previous): array
    {
        if ($previous == 0) return ['direction' => 'stable', 'percentage' => 0];
        
        $change = (($current - $previous) / $previous) * 100;
        
        return [
            'direction' => $change > 2 ? 'up' : ($change < -2 ? 'down' : 'stable'),
            'percentage' => abs($change),
        ];
    }

    private function getDateFromPeriod(string $period): Carbon
    {
        return match($period) {
            'daily' => now()->subDays(30),
            'weekly' => now()->subWeeks(12),
            'monthly' => now()->subMonths(12),
            'quarterly' => now()->subQuarters(4),
            '1m' => now()->subMonth(),
            '3m' => now()->subMonths(3),
            '6m' => now()->subMonths(6),
            '1y' => now()->subYear(),
            default => now()->subMonths(6),
        };
    }

    private function generateAlerts(): array
    {
        $alerts = [];

        // Check for vendors with declining performance
        $decliningVendors = Vendor::where('performance_score', '<', 70)->count();
        if ($decliningVendors > 0) {
            $alerts[] = [
                'type' => 'warning',
                'message' => "{$decliningVendors} vendors have performance scores below 70%",
                'action' => 'Review vendor performance',
                'severity' => 'medium',
            ];
        }

        // Check for overdue orders
        $overdueCount = VendorOrder::where('status', 'in_progress')
            ->whereNotNull('estimated_lead_time_days')
            ->whereRaw('DATE_ADD(created_at, INTERVAL estimated_lead_time_days DAY) < NOW()')
            ->count();

        if ($overdueCount > 0) {
            $alerts[] = [
                'type' => 'error',
                'message' => "{$overdueCount} orders are overdue",
                'action' => 'Contact vendors immediately',
                'severity' => 'high',
            ];
        }

        return $alerts;
    }

    private function calculateSystemHealth(): array
    {
        $activeVendors = Vendor::where('status', 'active')->count();
        $totalVendors = Vendor::count();
        $healthScore = $totalVendors > 0 ? ($activeVendors / $totalVendors) * 100 : 0;

        return [
            'score' => $healthScore,
            'status' => $healthScore >= 90 ? 'excellent' : ($healthScore >= 70 ? 'good' : 'needs_attention'),
            'active_vendors' => $activeVendors,
            'total_vendors' => $totalVendors,
        ];
    }

    // Additional helper methods would be implemented here...
    private function getPreviousPeriodData($vendorIds, $dateFrom, $dateTo) { return []; }
    private function getNewVendorsThisMonth() { return 0; }
    private function calculateAverageProfitMargin($orders) { return 0; }
    private function calculateAverageResponseTime($vendorIds) { return 0; }
    private function getPerformanceMatrix($vendors, $dateFrom, $dateTo) { return []; }
    private function calculateRiskDistribution($vendors) { return []; }
    private function getTopPerformers($vendors, $limit) { return []; }
    private function calculateTrends($vendors, $dateFrom, $dateTo) { return []; }
    private function generatePredictions($vendors, $dateFrom, $dateTo) { return []; }
    private function getLastOrderDate($vendorId) { return null; }
    private function getMitigationActions($risk) { return []; }
    private function generatePeriods($dateFrom, $dateTo, $period) { return []; }
    private function findBestOverallVendor($comparison, $metrics) { return []; }
    private function estimateOrderPrice($vendor, $requirements) { return 0; }
    private function calculateConfidence($vendor, $requirements) { return 'medium'; }
    private function generateExplanation($scores, $requirements) { return 'Vendor match based on performance metrics'; }
    private function getVendorOnTimeRate($vendorId) { return 0.8; }
    private function getVendorCompletionRate($vendorId) { return 0.9; }
}