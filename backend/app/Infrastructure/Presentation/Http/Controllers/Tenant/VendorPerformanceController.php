<?php

namespace App\Infrastructure\Presentation\Http\Controllers\Tenant;

use App\Http\Controllers\Controller;
use App\Infrastructure\Persistence\Eloquent\Models\Vendor;
use App\Infrastructure\Persistence\Eloquent\Models\Order;
use App\Infrastructure\Persistence\Eloquent\Models\VendorOrder;
use App\Domain\Vendor\Services\VendorEvaluationService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class VendorPerformanceController extends Controller
{
    public function __construct(
        private VendorEvaluationService $vendorEvaluationService
    ) {}

    /**
     * Get vendor performance metrics
     */
    public function getMetrics(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'period' => 'nullable|string|in:1m,3m,6m,1y,all',
                'vendor' => 'nullable|string',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
            ]);

            $period = $validated['period'] ?? '6m';
            $vendorFilter = $validated['vendor'] ?? 'all';
            $vendorId = $validated['vendor_id'] ?? null;

            // Calculate date range based on period
            $dateRange = $this->getDateRange($period);

            $query = VendorOrder::with(['vendor', 'order'])
                ->whereHas('order', function ($q) use ($dateRange) {
                    $q->whereBetween('created_at', $dateRange);
                });

            if ($vendorId) {
                $query->where('vendor_id', $vendorId);
            } elseif ($vendorFilter !== 'all') {
                // Try to determine if filter is UUID or ID
                if (is_numeric($vendorFilter)) {
                    $query->where('vendor_id', (int)$vendorFilter);
                } else {
                    $query->whereHas('vendor', function ($q) use ($vendorFilter) {
                        $q->where('uuid', $vendorFilter);
                    });
                }
            }

            $vendorOrders = $query->get();

            // Group by month for trend analysis
            $monthlyData = $vendorOrders->groupBy(function ($vendorOrder) {
                return $vendorOrder->order->created_at->format('M');
            })->map(function ($orders, $month) {
                $totalOrders = $orders->count();
                $onTimeOrders = $orders->where('delivery_status', 'on_time')->count();
                $qualitySum = $orders->where('quality_rating', '>', 0)->sum('quality_rating');
                $qualityCount = $orders->where('quality_rating', '>', 0)->count();

                return [
                    'month' => $month,
                    'onTime' => $totalOrders > 0 ? round(($onTimeOrders / $totalOrders) * 100, 1) : 0,
                    'quality' => $qualityCount > 0 ? round($qualitySum / $qualityCount, 1) : 0,
                    'orders' => $totalOrders,
                ];
            })->values();

            return response()->json([
                'success' => true,
                'message' => 'Performance metrics retrieved successfully',
                'data' => $monthlyData,
                'meta' => [
                    'period' => $period,
                    'vendor_filter' => $vendorFilter,
                    'total_records' => $vendorOrders->count(),
                    'generated_at' => now()->toIso8601String(),
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch performance metrics',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get vendor rankings
     */
    public function getRankings(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'period' => 'nullable|string|in:1m,3m,6m,1y,all',
                'limit' => 'nullable|integer|min:1|max:50',
            ]);

            $period = $validated['period'] ?? '6m';
            $limit = $validated['limit'] ?? 10;

            $dateRange = $this->getDateRange($period);

            $vendors = Vendor::with(['orders' => function ($query) use ($dateRange) {
                $query->whereBetween('created_at', $dateRange);
            }])
                ->where('status', 'active')
                ->get();

            $rankings = $vendors->map(function ($vendor) {
                $evaluation = $this->vendorEvaluationService->evaluateVendor($vendor);
                
                return [
                    'id' => $vendor->id,
                    'uuid' => $vendor->uuid,
                    'name' => $vendor->name,
                    'score' => $evaluation['overall_score'],
                    'change' => $this->calculateScoreChange($vendor),
                    'trend' => $this->determineTrend($vendor),
                    'total_orders' => $vendor->orders->count(),
                    'performance_rating' => $evaluation['performance_rating'],
                ];
            })
                ->sortByDesc('score')
                ->take($limit)
                ->values();

            return response()->json([
                'success' => true,
                'message' => 'Vendor rankings retrieved successfully',
                'data' => $rankings,
                'meta' => [
                    'period' => $period,
                    'limit' => $limit,
                    'total_vendors' => $vendors->count(),
                    'generated_at' => now()->toIso8601String(),
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch vendor rankings',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get advanced vendor performance metrics
     */
    public function getAdvancedMetrics(Request $request, string $vendorId): JsonResponse
    {
        try {
            $vendor = Vendor::with(['orders'])->findOrFail((int) $vendorId);
            
            $validated = $request->validate([
                'period' => 'nullable|string|in:1m,3m,6m,1y,all',
            ]);

            $period = $validated['period'] ?? '6m';
            $dateRange = $this->getDateRange($period);

            $evaluation = $this->vendorEvaluationService->evaluateVendor($vendor);
            
            // Calculate additional metrics
            $orders = $vendor->orders()->whereBetween('created_at', $dateRange)->get();
            
            $metrics = [
                'overall_score' => $evaluation['overall_score'],
                'quality_score' => $evaluation['metrics']['quality_score']['overall'] ?? 0,
                'delivery_score' => $evaluation['metrics']['delivery_performance']['score'] ?? 0,
                'communication_score' => $this->calculateCommunicationScore($vendor),
                'cost_efficiency_score' => $this->calculateCostEfficiencyScore($vendor),
            ];

            $trends = [
                'score_change' => $this->calculateScoreChange($vendor),
                'performance_direction' => $this->determineTrend($vendor),
                'risk_level' => $this->assessRiskLevel($vendor, $evaluation),
            ];

            $benchmarks = [
                'industry_average' => 75.0, // This would come from industry data
                'top_performer_threshold' => 90.0,
                'performance_percentile' => $this->calculatePerformancePercentile($evaluation['overall_score']),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Advanced vendor metrics retrieved successfully',
                'data' => [
                    'vendor_id' => $vendorId,
                    'performance_period' => $period,
                    'metrics' => $metrics,
                    'trends' => $trends,
                    'benchmarks' => $benchmarks,
                    'recommendations' => $this->generateRecommendations($vendor, $evaluation),
                ],
                'meta' => [
                    'generated_at' => now()->toIso8601String(),
                    'orders_analyzed' => $orders->count(),
                ]
            ], 200);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Vendor not found',
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch advanced metrics',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get trend analysis for vendor
     */
    public function getTrendAnalysis(Request $request, string $vendorId): JsonResponse
    {
        try {
            $vendor = Vendor::findOrFail((int) $vendorId);
            
            $validated = $request->validate([
                'period' => 'nullable|string|in:1m,3m,6m,1y',
            ]);

            $period = $validated['period'] ?? '6m';
            $dateRange = $this->getDateRange($period);

            // Get monthly performance data
            $monthlyPerformance = $this->getMonthlyPerformanceData($vendor, $dateRange);
            
            // Calculate trends
            $trends = [
                'performance_trend' => $this->calculatePerformanceTrend($monthlyPerformance),
                'order_volume_trend' => $this->calculateOrderVolumeTrend($monthlyPerformance),
                'quality_trend' => $this->calculateQualityTrend($monthlyPerformance),
                'delivery_trend' => $this->calculateDeliveryTrend($monthlyPerformance),
            ];

            return response()->json([
                'success' => true,
                'message' => 'Trend analysis retrieved successfully',
                'data' => [
                    'vendor_id' => $vendorId,
                    'period' => $period,
                    'monthly_data' => $monthlyPerformance,
                    'trends' => $trends,
                ],
                'meta' => [
                    'generated_at' => now()->toIso8601String(),
                ]
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch trend analysis',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Calculate date range based on period
     */
    private function getDateRange(string $period): array
    {
        $endDate = now();
        
        $startDate = match ($period) {
            '1m' => $endDate->copy()->subMonth(),
            '3m' => $endDate->copy()->subMonths(3),
            '6m' => $endDate->copy()->subMonths(6),
            '1y' => $endDate->copy()->subYear(),
            default => $endDate->copy()->subMonths(6),
        };

        return [$startDate, $endDate];
    }

    /**
     * Calculate score change for vendor
     */
    private function calculateScoreChange(Vendor $vendor): float
    {
        // This would compare current score with previous period
        // For now, return a mock calculation
        return round(rand(-50, 50) / 10, 1);
    }

    /**
     * Determine performance trend
     */
    private function determineTrend(Vendor $vendor): string
    {
        $change = $this->calculateScoreChange($vendor);
        
        if ($change > 1) return 'up';
        if ($change < -1) return 'down';
        return 'stable';
    }

    /**
     * Calculate communication score
     */
    private function calculateCommunicationScore(Vendor $vendor): float
    {
        // This would analyze response times, message frequency, etc.
        return round(rand(70, 95), 1);
    }

    /**
     * Calculate cost efficiency score
     */
    private function calculateCostEfficiencyScore(Vendor $vendor): float
    {
        // This would analyze price competitiveness
        return round(rand(70, 90), 1);
    }

    /**
     * Assess risk level
     */
    private function assessRiskLevel(Vendor $vendor, array $evaluation): string
    {
        $score = $evaluation['overall_score'];
        
        if ($score >= 80) return 'low';
        if ($score >= 60) return 'medium';
        return 'high';
    }

    /**
     * Calculate performance percentile
     */
    private function calculatePerformancePercentile(float $score): int
    {
        // This would compare against all vendors
        if ($score >= 90) return 95;
        if ($score >= 80) return 80;
        if ($score >= 70) return 65;
        if ($score >= 60) return 45;
        return 25;
    }

    /**
     * Generate performance recommendations
     */
    private function generateRecommendations(Vendor $vendor, array $evaluation): array
    {
        $recommendations = [];
        
        if ($evaluation['overall_score'] < 70) {
            $recommendations[] = [
                'type' => 'improvement',
                'priority' => 'high',
                'title' => 'Performance Improvement Required',
                'description' => 'Overall performance below acceptable threshold. Consider performance review meeting.',
            ];
        }

        if ($evaluation['metrics']['delivery_performance']['on_time_rate'] ?? 0 < 80) {
            $recommendations[] = [
                'type' => 'delivery',
                'priority' => 'medium',
                'title' => 'Delivery Performance',
                'description' => 'On-time delivery rate needs improvement. Discuss delivery scheduling.',
            ];
        }

        return $recommendations;
    }

    /**
     * Get delivery metrics (previously mocked on frontend)
     * Endpoint: GET /vendor-performance/delivery-metrics
     */
    public function getDeliveryMetrics(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'period' => 'nullable|string|in:1m,3m,6m,1y,all',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
            ]);

            $period = $validated['period'] ?? '6m';
            $vendorId = $validated['vendor_id'] ?? null;
            $dateRange = $this->getDateRange($period);

            $query = VendorOrder::with(['vendor', 'order'])
                ->whereHas('order', function ($q) use ($dateRange) {
                    $q->whereBetween('created_at', $dateRange);
                });

            if ($vendorId) {
                $query->where('vendor_id', $vendorId);
            }

            $vendorOrders = $query->get();
            $totalOrders = $vendorOrders->count();

            if ($totalOrders === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'No delivery data available for the selected period',
                    'data' => [
                        ['name' => 'On Time', 'value' => 0, 'color' => '#10B981'],
                        ['name' => 'Early', 'value' => 0, 'color' => '#3B82F6'],
                        ['name' => 'Late', 'value' => 0, 'color' => '#EF4444'],
                    ],
                    'meta' => [
                        'period' => $period,
                        'total_orders' => 0,
                        'generated_at' => now()->toIso8601String(),
                    ]
                ], 200);
            }

            // Calculate delivery performance
            $onTimeOrders = $vendorOrders->where('delivery_status', 'on_time')->count();
            $earlyOrders = $vendorOrders->where('delivery_status', 'early')->count();
            $lateOrders = $vendorOrders->where('delivery_status', 'late')->count();

            $deliveryMetrics = [
                [
                    'name' => 'On Time',
                    'value' => round(($onTimeOrders / $totalOrders) * 100, 1),
                    'color' => '#10B981'
                ],
                [
                    'name' => 'Early',
                    'value' => round(($earlyOrders / $totalOrders) * 100, 1),
                    'color' => '#3B82F6'
                ],
                [
                    'name' => 'Late',
                    'value' => round(($lateOrders / $totalOrders) * 100, 1),
                    'color' => '#EF4444'
                ],
            ];

            return response()->json([
                'success' => true,
                'message' => 'Delivery metrics retrieved successfully',
                'data' => $deliveryMetrics,
                'meta' => [
                    'period' => $period,
                    'total_orders' => $totalOrders,
                    'on_time_count' => $onTimeOrders,
                    'early_count' => $earlyOrders,
                    'late_count' => $lateOrders,
                    'generated_at' => now()->toIso8601String(),
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch delivery metrics',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get quality metrics (previously mocked on frontend)
     * Endpoint: GET /vendor-performance/quality-metrics
     */
    public function getQualityMetrics(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'period' => 'nullable|string|in:1m,3m,6m,1y,all',
                'vendor_id' => 'nullable|integer|exists:vendors,id',
            ]);

            $period = $validated['period'] ?? '6m';
            $vendorId = $validated['vendor_id'] ?? null;
            $dateRange = $this->getDateRange($period);

            $query = VendorOrder::with(['vendor', 'order'])
                ->whereHas('order', function ($q) use ($dateRange) {
                    $q->whereBetween('created_at', $dateRange);
                })
                ->whereNotNull('quality_rating')
                ->where('quality_rating', '>', 0);

            if ($vendorId) {
                $query->where('vendor_id', $vendorId);
            }

            $vendorOrders = $query->get();
            $totalOrders = $vendorOrders->count();

            if ($totalOrders === 0) {
                return response()->json([
                    'success' => true,
                    'message' => 'No quality rating data available for the selected period',
                    'data' => [
                        ['category' => 'Excellent (4.5+)', 'count' => 0, 'percentage' => 0],
                        ['category' => 'Good (4.0-4.4)', 'count' => 0, 'percentage' => 0],
                        ['category' => 'Average (3.5-3.9)', 'count' => 0, 'percentage' => 0],
                        ['category' => 'Poor (<3.5)', 'count' => 0, 'percentage' => 0],
                    ],
                    'meta' => [
                        'period' => $period,
                        'total_orders' => 0,
                        'generated_at' => now()->toIso8601String(),
                    ]
                ], 200);
            }

            // Calculate quality distribution
            $excellentCount = $vendorOrders->where('quality_rating', '>=', 4.5)->count();
            $goodCount = $vendorOrders->where('quality_rating', '>=', 4.0)
                ->where('quality_rating', '<', 4.5)->count();
            $averageCount = $vendorOrders->where('quality_rating', '>=', 3.5)
                ->where('quality_rating', '<', 4.0)->count();
            $poorCount = $vendorOrders->where('quality_rating', '<', 3.5)->count();

            $qualityMetrics = [
                [
                    'category' => 'Excellent (4.5+)',
                    'count' => $excellentCount,
                    'percentage' => round(($excellentCount / $totalOrders) * 100)
                ],
                [
                    'category' => 'Good (4.0-4.4)',
                    'count' => $goodCount,
                    'percentage' => round(($goodCount / $totalOrders) * 100)
                ],
                [
                    'category' => 'Average (3.5-3.9)',
                    'count' => $averageCount,
                    'percentage' => round(($averageCount / $totalOrders) * 100)
                ],
                [
                    'category' => 'Poor (<3.5)',
                    'count' => $poorCount,
                    'percentage' => round(($poorCount / $totalOrders) * 100)
                ],
            ];

            $averageRating = round($vendorOrders->avg('quality_rating'), 2);

            return response()->json([
                'success' => true,
                'message' => 'Quality metrics retrieved successfully',
                'data' => $qualityMetrics,
                'meta' => [
                    'period' => $period,
                    'total_orders' => $totalOrders,
                    'average_rating' => $averageRating,
                    'excellent_count' => $excellentCount,
                    'good_count' => $goodCount,
                    'average_count' => $averageCount,
                    'poor_count' => $poorCount,
                    'generated_at' => now()->toIso8601String(),
                ]
            ], 200);

        } catch (\Illuminate\Validation\ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->validator->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch quality metrics',
                'error' => config('app.debug') ? $e->getMessage() : 'An unexpected error occurred',
            ], 500);
        }
    }

    /**
     * Get monthly performance data for trend analysis
     */
    private function getMonthlyPerformanceData(Vendor $vendor, array $dateRange): array
    {
        // This would aggregate monthly data
        // For now, return mock data structure
        return [];
    }

    /**
     * Calculate various trend metrics
     */
    private function calculatePerformanceTrend(array $monthlyData): array
    {
        return ['direction' => 'stable', 'rate' => 0];
    }

    private function calculateOrderVolumeTrend(array $monthlyData): array
    {
        return ['direction' => 'up', 'rate' => 5.2];
    }

    private function calculateQualityTrend(array $monthlyData): array
    {
        return ['direction' => 'up', 'rate' => 2.1];
    }

    private function calculateDeliveryTrend(array $monthlyData): array
    {
        return ['direction' => 'stable', 'rate' => 0.5];
    }
}