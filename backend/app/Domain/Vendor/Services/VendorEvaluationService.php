<?php

namespace App\Domain\Vendor\Services;

use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class VendorEvaluationService
{
    public function evaluateVendor(Vendor $vendor): array
    {
        $deliveryPerformance = $this->calculateDeliveryPerformance($vendor);
        $qualityScore = $this->calculateQualityScore($vendor);
        $responseTime = $this->calculateResponseTime($vendor);
        $priceCompetitiveness = $this->calculatePriceCompetitiveness($vendor);
        $reliabilityScore = $this->calculateReliabilityScore($vendor);

        $overallScore = $this->calculateOverallScore([
            'delivery' => $deliveryPerformance['score'],
            'quality' => $qualityScore['score'],
            'response' => $responseTime['score'],
            'price' => $priceCompetitiveness['score'],
            'reliability' => $reliabilityScore['score'],
        ]);

        $performance = $this->getPerformanceRating($overallScore);

        return [
            'vendor_id' => $vendor->id,
            'vendor_name' => $vendor->name,
            'vendor_code' => $vendor->code,
            'evaluation_date' => Carbon::now()->format('Y-m-d'),
            'overall_score' => round($overallScore, 2),
            'performance_rating' => $performance['rating'],
            'performance_label' => $performance['label'],
            'metrics' => [
                'delivery_performance' => $deliveryPerformance,
                'quality_score' => $qualityScore,
                'response_time' => $responseTime,
                'price_competitiveness' => $priceCompetitiveness,
                'reliability' => $reliabilityScore,
            ],
            'recommendations' => $this->generateRecommendations($overallScore, [
                'delivery' => $deliveryPerformance['score'],
                'quality' => $qualityScore['score'],
                'response' => $responseTime['score'],
                'price' => $priceCompetitiveness['score'],
                'reliability' => $reliabilityScore['score'],
            ]),
        ];
    }

    public function evaluateAllVendors(): Collection
    {
        $vendors = Vendor::with('orders')->get();
        
        $evaluated = $vendors->map(function ($vendor) {
            $evaluation = $this->evaluateVendor($vendor);
            return (object) $evaluation;
        });

        return $evaluated->sortBy(function ($item) {
            return -$item->overall_score;
        })->values();
    }

    public function getTopPerformingVendors(int $limit = 10): Collection
    {
        return $this->evaluateAllVendors()->take($limit)->values();
    }

    public function getUnderperformingVendors(float $threshold = 60.0): Collection
    {
        return $this->evaluateAllVendors()
            ->filter(function ($evaluation) use ($threshold) {
                return $evaluation->overall_score < $threshold;
            });
    }

    public function trackSLA(Vendor $vendor, array $slaConfig = []): array
    {
        $defaultSLA = [
            'max_lead_time_days' => 14,
            'min_on_time_delivery_rate' => 90,
            'min_quality_acceptance_rate' => 95,
            'max_response_time_hours' => 24,
        ];

        $sla = array_merge($defaultSLA, $slaConfig);

        $orders = $vendor->orders()
            ->whereNotNull('delivered_at')
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->get();

        $metrics = [
            'average_lead_time' => $this->calculateAverageLeadTime($orders),
            'on_time_delivery_rate' => $this->calculateOnTimeDeliveryRate($orders),
            'quality_acceptance_rate' => $this->calculateQualityAcceptanceRate($orders),
            'average_response_time' => $this->calculateAverageResponseTime($vendor),
        ];

        $compliance = [
            'lead_time_compliant' => $metrics['average_lead_time'] <= $sla['max_lead_time_days'],
            'delivery_compliant' => $metrics['on_time_delivery_rate'] >= $sla['min_on_time_delivery_rate'],
            'quality_compliant' => $metrics['quality_acceptance_rate'] >= $sla['min_quality_acceptance_rate'],
            'response_compliant' => $metrics['average_response_time'] <= $sla['max_response_time_hours'],
        ];

        $complianceRate = (array_sum($compliance) / count($compliance)) * 100;
        $slaStatus = $this->getSLAStatus($complianceRate);

        return [
            'vendor_id' => $vendor->id,
            'vendor_name' => $vendor->name,
            'period' => '3 bulan terakhir',
            'sla_config' => $sla,
            'metrics' => $metrics,
            'compliance' => $compliance,
            'compliance_rate' => round($complianceRate, 2),
            'sla_status' => $slaStatus['status'],
            'sla_status_label' => $slaStatus['label'],
            'violations' => $this->identifySLAViolations($metrics, $sla),
            'recommendations' => $this->generateSLARecommendations($compliance),
        ];
    }

    public function compareVendors(array $vendorIds): Collection
    {
        $vendors = Vendor::whereIn('id', $vendorIds)->get();
        
        return $vendors->map(function ($vendor) {
            $evaluation = $this->evaluateVendor($vendor);
            return (object) $evaluation;
        })->sortByDesc('overall_score')->values();
    }

    public function getVendorTrend(Vendor $vendor, int $months = 6): array
    {
        $trends = [];
        
        for ($i = $months - 1; $i >= 0; $i--) {
            $startDate = Carbon::now()->subMonths($i + 1)->startOfMonth();
            $endDate = Carbon::now()->subMonths($i)->endOfMonth();
            
            $monthOrders = $vendor->orders()
                ->whereBetween('created_at', [$startDate, $endDate])
                ->get();

            if ($monthOrders->isNotEmpty()) {
                $trends[] = [
                    'month' => $endDate->format('Y-m'),
                    'order_count' => $monthOrders->count(),
                    'total_value' => $monthOrders->sum('total_amount'),
                    'avg_lead_time' => $this->calculateAverageLeadTime($monthOrders),
                    'on_time_rate' => $this->calculateOnTimeDeliveryRate($monthOrders),
                ];
            }
        }

        return [
            'vendor_id' => $vendor->id,
            'vendor_name' => $vendor->name,
            'period_months' => $months,
            'trends' => $trends,
            'summary' => [
                'total_orders' => array_sum(array_column($trends, 'order_count')),
                'total_value' => array_sum(array_column($trends, 'total_value')),
                'avg_monthly_orders' => count($trends) > 0 
                    ? array_sum(array_column($trends, 'order_count')) / count($trends) 
                    : 0,
                'performance_trend' => $this->calculatePerformanceTrend($trends),
            ],
        ];
    }

    protected function calculateDeliveryPerformance(Vendor $vendor): array
    {
        $orders = $vendor->orders()
            ->whereNotNull('delivered_at')
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->get();

        if ($orders->isEmpty()) {
            return [
                'score' => 0,
                'on_time_count' => 0,
                'late_count' => 0,
                'on_time_rate' => 0,
                'avg_lead_time_days' => 0,
            ];
        }

        $onTimeCount = 0;
        $totalLeadTime = 0;

        foreach ($orders as $order) {
            $expectedDelivery = $order->estimated_delivery 
                ? Carbon::parse($order->estimated_delivery) 
                : Carbon::parse($order->created_at)->addDays($vendor->lead_time ?? 14);
            
            $actualDelivery = Carbon::parse($order->delivered_at);
            
            if ($actualDelivery->lte($expectedDelivery)) {
                $onTimeCount++;
            }

            $totalLeadTime += Carbon::parse($order->created_at)->diffInDays($actualDelivery);
        }

        $onTimeRate = ($onTimeCount / $orders->count()) * 100;
        $avgLeadTime = $totalLeadTime / $orders->count();

        $score = $this->calculateDeliveryScore($onTimeRate, $avgLeadTime);

        return [
            'score' => round($score, 2),
            'on_time_count' => $onTimeCount,
            'late_count' => $orders->count() - $onTimeCount,
            'on_time_rate' => round($onTimeRate, 2),
            'avg_lead_time_days' => round($avgLeadTime, 1),
        ];
    }

    protected function calculateQualityScore(Vendor $vendor): array
    {
        $orders = $vendor->orders()
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->get();

        if ($orders->isEmpty()) {
            return [
                'score' => 0,
                'total_orders' => 0,
                'quality_passed' => 0,
                'quality_failed' => 0,
                'acceptance_rate' => 0,
            ];
        }

        $qualityPassed = $orders->filter(function ($order) {
            $metadata = $order->metadata ?? [];
            return !isset($metadata['quality_issues']) || $metadata['quality_issues'] === false;
        })->count();

        $acceptanceRate = ($qualityPassed / $orders->count()) * 100;

        $score = match (true) {
            $acceptanceRate >= 98 => 100,
            $acceptanceRate >= 95 => 90,
            $acceptanceRate >= 90 => 80,
            $acceptanceRate >= 85 => 70,
            $acceptanceRate >= 80 => 60,
            default => 50,
        };

        return [
            'score' => round($score, 2),
            'total_orders' => $orders->count(),
            'quality_passed' => $qualityPassed,
            'quality_failed' => $orders->count() - $qualityPassed,
            'acceptance_rate' => round($acceptanceRate, 2),
        ];
    }

    protected function calculateResponseTime(Vendor $vendor): array
    {
        $orders = $vendor->orders()
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->get();

        if ($orders->isEmpty()) {
            return [
                'score' => 0,
                'avg_response_hours' => 0,
                'fast_responses' => 0,
                'slow_responses' => 0,
            ];
        }

        $totalResponseTime = 0;
        $fastResponses = 0;

        foreach ($orders as $order) {
            $metadata = $order->metadata ?? [];
            $responseTime = $metadata['vendor_response_time_hours'] ?? 24;
            
            $totalResponseTime += $responseTime;
            
            if ($responseTime <= 12) {
                $fastResponses++;
            }
        }

        $avgResponseTime = $totalResponseTime / $orders->count();

        $score = match (true) {
            $avgResponseTime <= 4 => 100,
            $avgResponseTime <= 8 => 90,
            $avgResponseTime <= 12 => 80,
            $avgResponseTime <= 24 => 70,
            $avgResponseTime <= 48 => 60,
            default => 50,
        };

        return [
            'score' => round($score, 2),
            'avg_response_hours' => round($avgResponseTime, 1),
            'fast_responses' => $fastResponses,
            'slow_responses' => $orders->count() - $fastResponses,
        ];
    }

    protected function calculatePriceCompetitiveness(Vendor $vendor): array
    {
        $orders = $vendor->orders()
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->get();

        if ($orders->isEmpty()) {
            return [
                'score' => 0,
                'avg_order_value' => 0,
                'total_value' => 0,
                'competitiveness_level' => 'unknown',
            ];
        }

        $avgOrderValue = $orders->avg('total_amount');
        $totalValue = $orders->sum('total_amount');

        $allVendorsAvg = Vendor::with('orders')
            ->active()
            ->get()
            ->flatMap(function ($v) {
                return $v->orders()
                    ->where('created_at', '>=', Carbon::now()->subMonths(3))
                    ->get();
            })
            ->avg('total_amount');

        if ($allVendorsAvg > 0) {
            $priceRatio = $avgOrderValue / $allVendorsAvg;
            
            $score = match (true) {
                $priceRatio <= 0.85 => 100,
                $priceRatio <= 0.95 => 90,
                $priceRatio <= 1.05 => 80,
                $priceRatio <= 1.15 => 70,
                $priceRatio <= 1.25 => 60,
                default => 50,
            };

            $competitiveness = match (true) {
                $priceRatio <= 0.90 => 'sangat_kompetitif',
                $priceRatio <= 1.00 => 'kompetitif',
                $priceRatio <= 1.10 => 'rata-rata',
                default => 'mahal',
            };
        } else {
            $score = 75;
            $competitiveness = 'tidak_ada_data_pembanding';
        }

        return [
            'score' => round($score, 2),
            'avg_order_value' => round($avgOrderValue, 2),
            'total_value' => $totalValue,
            'competitiveness_level' => $competitiveness,
        ];
    }

    protected function calculateReliabilityScore(Vendor $vendor): array
    {
        $totalOrders = $vendor->orders()->count();
        $completedOrders = $vendor->orders()->where('status', 'completed')->count();
        $cancelledOrders = $vendor->orders()->where('status', 'cancelled')->count();

        if ($totalOrders === 0) {
            return [
                'score' => 0,
                'completion_rate' => 0,
                'cancellation_rate' => 0,
                'total_orders' => 0,
            ];
        }

        $completionRate = ($completedOrders / $totalOrders) * 100;
        $cancellationRate = ($cancelledOrders / $totalOrders) * 100;

        $score = match (true) {
            $completionRate >= 98 && $cancellationRate <= 2 => 100,
            $completionRate >= 95 && $cancellationRate <= 5 => 90,
            $completionRate >= 90 && $cancellationRate <= 10 => 80,
            $completionRate >= 85 && $cancellationRate <= 15 => 70,
            $completionRate >= 80 && $cancellationRate <= 20 => 60,
            default => 50,
        };

        return [
            'score' => round($score, 2),
            'completion_rate' => round($completionRate, 2),
            'cancellation_rate' => round($cancellationRate, 2),
            'total_orders' => $totalOrders,
            'completed_orders' => $completedOrders,
            'cancelled_orders' => $cancelledOrders,
        ];
    }

    protected function calculateOverallScore(array $scores): float
    {
        $weights = [
            'delivery' => 0.25,
            'quality' => 0.30,
            'response' => 0.15,
            'price' => 0.15,
            'reliability' => 0.15,
        ];

        $totalScore = 0;
        foreach ($scores as $metric => $score) {
            $totalScore += $score * ($weights[$metric] ?? 0);
        }

        return $totalScore;
    }

    protected function calculateDeliveryScore(float $onTimeRate, float $avgLeadTime): float
    {
        $onTimeScore = match (true) {
            $onTimeRate >= 98 => 50,
            $onTimeRate >= 95 => 45,
            $onTimeRate >= 90 => 40,
            $onTimeRate >= 85 => 35,
            $onTimeRate >= 80 => 30,
            default => 25,
        };

        $leadTimeScore = match (true) {
            $avgLeadTime <= 7 => 50,
            $avgLeadTime <= 10 => 45,
            $avgLeadTime <= 14 => 40,
            $avgLeadTime <= 21 => 35,
            $avgLeadTime <= 30 => 30,
            default => 25,
        };

        return $onTimeScore + $leadTimeScore;
    }

    protected function getPerformanceRating(float $score): array
    {
        return match (true) {
            $score >= 90 => ['rating' => 'A', 'label' => 'Excellent'],
            $score >= 80 => ['rating' => 'B', 'label' => 'Good'],
            $score >= 70 => ['rating' => 'C', 'label' => 'Satisfactory'],
            $score >= 60 => ['rating' => 'D', 'label' => 'Needs Improvement'],
            default => ['rating' => 'F', 'label' => 'Poor'],
        };
    }

    protected function generateRecommendations(float $overallScore, array $metrics): array
    {
        $recommendations = [];

        if ($overallScore >= 90) {
            $recommendations[] = 'Vendor berkinerja sangat baik. Pertimbangkan untuk memberikan lebih banyak order.';
        } elseif ($overallScore >= 80) {
            $recommendations[] = 'Vendor berkinerja baik. Lanjutkan kolaborasi dengan monitoring rutin.';
        } elseif ($overallScore >= 70) {
            $recommendations[] = 'Vendor berkinerja cukup. Identifikasi area yang perlu ditingkatkan.';
        } else {
            $recommendations[] = 'Vendor berkinerja kurang. Pertimbangkan untuk mencari alternatif.';
        }

        if ($metrics['delivery'] < 70) {
            $recommendations[] = 'Performa pengiriman perlu ditingkatkan. Diskusikan lead time yang lebih realistis.';
        }

        if ($metrics['quality'] < 70) {
            $recommendations[] = 'Kualitas produk perlu perhatian. Lakukan quality audit dan diskusikan standar kualitas.';
        }

        if ($metrics['response'] < 70) {
            $recommendations[] = 'Response time terlalu lambat. Tetapkan SLA komunikasi yang jelas.';
        }

        if ($metrics['price'] < 70) {
            $recommendations[] = 'Harga kurang kompetitif. Lakukan negosiasi atau cari vendor alternatif.';
        }

        if ($metrics['reliability'] < 70) {
            $recommendations[] = 'Reliabilitas vendor rendah. Monitor closely atau pertimbangkan pergantian.';
        }

        return $recommendations;
    }

    protected function calculateAverageLeadTime(Collection $orders): float
    {
        if ($orders->isEmpty()) {
            return 0;
        }

        $totalDays = $orders->sum(function ($order) {
            if (!$order->delivered_at) {
                return 0;
            }
            return Carbon::parse($order->created_at)->diffInDays(Carbon::parse($order->delivered_at));
        });

        return $totalDays / $orders->count();
    }

    protected function calculateOnTimeDeliveryRate(Collection $orders): float
    {
        if ($orders->isEmpty()) {
            return 0;
        }

        $onTimeCount = $orders->filter(function ($order) {
            if (!$order->delivered_at || !$order->estimated_delivery) {
                return false;
            }
            
            return Carbon::parse($order->delivered_at)->lte(Carbon::parse($order->estimated_delivery));
        })->count();

        return ($onTimeCount / $orders->count()) * 100;
    }

    protected function calculateQualityAcceptanceRate(Collection $orders): float
    {
        if ($orders->isEmpty()) {
            return 0;
        }

        $acceptedCount = $orders->filter(function ($order) {
            $metadata = $order->metadata ?? [];
            return !isset($metadata['quality_issues']) || $metadata['quality_issues'] === false;
        })->count();

        return ($acceptedCount / $orders->count()) * 100;
    }

    protected function calculateAverageResponseTime(Vendor $vendor): float
    {
        $orders = $vendor->orders()
            ->where('created_at', '>=', Carbon::now()->subMonths(3))
            ->get();

        if ($orders->isEmpty()) {
            return 0;
        }

        $totalResponseTime = $orders->sum(function ($order) {
            $metadata = $order->metadata ?? [];
            return $metadata['vendor_response_time_hours'] ?? 24;
        });

        return $totalResponseTime / $orders->count();
    }

    protected function getSLAStatus(float $complianceRate): array
    {
        return match (true) {
            $complianceRate === 100 => ['status' => 'full_compliance', 'label' => 'Fully Compliant'],
            $complianceRate >= 75 => ['status' => 'mostly_compliant', 'label' => 'Mostly Compliant'],
            $complianceRate >= 50 => ['status' => 'partial_compliance', 'label' => 'Partial Compliance'],
            default => ['status' => 'non_compliant', 'label' => 'Non-Compliant'],
        };
    }

    protected function identifySLAViolations(array $metrics, array $sla): array
    {
        $violations = [];

        if ($metrics['average_lead_time'] > $sla['max_lead_time_days']) {
            $violations[] = [
                'metric' => 'Lead Time',
                'expected' => $sla['max_lead_time_days'] . ' hari',
                'actual' => round($metrics['average_lead_time'], 1) . ' hari',
                'severity' => 'high',
            ];
        }

        if ($metrics['on_time_delivery_rate'] < $sla['min_on_time_delivery_rate']) {
            $violations[] = [
                'metric' => 'On-Time Delivery',
                'expected' => $sla['min_on_time_delivery_rate'] . '%',
                'actual' => round($metrics['on_time_delivery_rate'], 1) . '%',
                'severity' => 'high',
            ];
        }

        if ($metrics['quality_acceptance_rate'] < $sla['min_quality_acceptance_rate']) {
            $violations[] = [
                'metric' => 'Quality Acceptance',
                'expected' => $sla['min_quality_acceptance_rate'] . '%',
                'actual' => round($metrics['quality_acceptance_rate'], 1) . '%',
                'severity' => 'critical',
            ];
        }

        if ($metrics['average_response_time'] > $sla['max_response_time_hours']) {
            $violations[] = [
                'metric' => 'Response Time',
                'expected' => $sla['max_response_time_hours'] . ' jam',
                'actual' => round($metrics['average_response_time'], 1) . ' jam',
                'severity' => 'medium',
            ];
        }

        return $violations;
    }

    protected function generateSLARecommendations(array $compliance): array
    {
        $recommendations = [];

        if (!$compliance['lead_time_compliant']) {
            $recommendations[] = 'Tinjau ulang lead time dengan vendor atau pertimbangkan backup vendor.';
        }

        if (!$compliance['delivery_compliant']) {
            $recommendations[] = 'Implementasikan penalty untuk keterlambatan atau cari vendor alternatif.';
        }

        if (!$compliance['quality_compliant']) {
            $recommendations[] = 'URGENT: Lakukan quality audit dan diskusikan perbaikan prosedur QC.';
        }

        if (!$compliance['response_compliant']) {
            $recommendations[] = 'Tetapkan escalation procedure dan komunikasi SLA yang lebih ketat.';
        }

        if (empty($recommendations)) {
            $recommendations[] = 'Vendor memenuhi semua SLA requirements. Lanjutkan monitoring.';
        }

        return $recommendations;
    }

    protected function calculatePerformanceTrend(array $trends): string
    {
        if (count($trends) < 2) {
            return 'insufficient_data';
        }

        $recentOnTimeRates = array_slice(array_column($trends, 'on_time_rate'), -3);
        $avgRecent = array_sum($recentOnTimeRates) / count($recentOnTimeRates);

        $oldOnTimeRates = array_slice(array_column($trends, 'on_time_rate'), 0, min(3, count($trends) - 1));
        $avgOld = array_sum($oldOnTimeRates) / count($oldOnTimeRates);

        $difference = $avgRecent - $avgOld;

        return match (true) {
            $difference > 5 => 'improving',
            $difference < -5 => 'declining',
            default => 'stable',
        };
    }
}
