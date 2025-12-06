<?php

namespace App\Application\Vendor\Services;

use App\Models\Vendor;
use App\Models\Order;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

/**
 * Vendor Performance Calculation Service for PT CEX
 * 
 * Calculates and manages vendor performance metrics:
 * - Delivery performance (on-time delivery rate)
 * - Quality scores (based on reviews/feedback)
 * - Cost competitiveness
 * - Overall vendor rating
 * - Communication responsiveness
 */
class VendorPerformanceService
{
    /**
     * Calculate comprehensive vendor performance metrics
     */
    public function calculateVendorPerformance(int $vendorId, ?string $dateRange = null): array
    {
        $vendor = Vendor::findOrFail($vendorId);
        
        // Get completed orders for this vendor
        $ordersQuery = Order::where('vendor_id', $vendorId)
                           ->where('tenant_id', $vendor->tenant_id)
                           ->where('status', 'completed');
                           
        if ($dateRange) {
            $ordersQuery->where('created_at', '>=', Carbon::parse($dateRange));
        }
        
        $completedOrders = $ordersQuery->get();
        
        if ($completedOrders->isEmpty()) {
            return $this->getDefaultMetrics();
        }

        // Calculate individual metrics
        $deliveryMetrics = $this->calculateDeliveryPerformance($completedOrders);
        $qualityMetrics = $this->calculateQualityMetrics($vendorId);
        $costMetrics = $this->calculateCostCompetitiveness($completedOrders);
        $communicationMetrics = $this->calculateCommunicationMetrics($vendorId);
        $reliabilityMetrics = $this->calculateReliabilityMetrics($completedOrders);

        // Calculate overall score
        $overallScore = $this->calculateOverallScore([
            'delivery' => $deliveryMetrics,
            'quality' => $qualityMetrics,
            'cost' => $costMetrics,
            'communication' => $communicationMetrics,
            'reliability' => $reliabilityMetrics
        ]);

        // Update vendor rating
        $this->updateVendorRating($vendor, $overallScore);

        return [
            'vendor_id' => $vendorId,
            'vendor_name' => $vendor->name,
            'overall_score' => $overallScore,
            'overall_rating' => $overallScore / 20, // Convert to 5-star rating
            'metrics' => [
                'delivery' => $deliveryMetrics,
                'quality' => $qualityMetrics,
                'cost' => $costMetrics,
                'communication' => $communicationMetrics,
                'reliability' => $reliabilityMetrics
            ],
            'orders_analyzed' => $completedOrders->count(),
            'last_calculated' => now()->toISOString()
        ];
    }

    /**
     * Calculate delivery performance metrics
     */
    private function calculateDeliveryPerformance($orders): array
    {
        $deliveryData = [];
        
        foreach ($orders as $order) {
            if ($order->estimated_delivery && $order->delivered_at) {
                $estimated = Carbon::parse($order->estimated_delivery);
                $actual = Carbon::parse($order->delivered_at);
                $delayDays = $actual->diffInDays($estimated, false);
                
                $deliveryData[] = [
                    'delay_days' => $delayDays,
                    'on_time' => $delayDays <= 0,
                    'early' => $delayDays < 0,
                    'late' => $delayDays > 0
                ];
            }
        }

        if (empty($deliveryData)) {
            return [
                'on_time_rate' => 0,
                'average_delay_days' => 0,
                'early_delivery_rate' => 0,
                'score' => 0
            ];
        }

        $onTimeCount = collect($deliveryData)->where('on_time', true)->count();
        $earlyCount = collect($deliveryData)->where('early', true)->count();
        $totalDeliveries = count($deliveryData);
        $averageDelay = collect($deliveryData)->avg('delay_days');

        $onTimeRate = ($onTimeCount / $totalDeliveries) * 100;
        $earlyRate = ($earlyCount / $totalDeliveries) * 100;

        // Score calculation (0-100)
        $score = min(100, max(0, 100 - ($averageDelay * 2))); // Penalize each day late by 2 points

        return [
            'on_time_rate' => round($onTimeRate, 2),
            'early_delivery_rate' => round($earlyRate, 2),
            'average_delay_days' => round($averageDelay, 2),
            'total_deliveries' => $totalDeliveries,
            'score' => round($score, 2)
        ];
    }

    /**
     * Calculate quality metrics based on reviews and defects
     */
    private function calculateQualityMetrics(int $vendorId): array
    {
        // Get vendor reviews/feedback (assuming you have a reviews table)
        $reviews = DB::table('vendor_reviews')
                    ->where('vendor_id', $vendorId)
                    ->whereNotNull('quality_rating')
                    ->get();

        if ($reviews->isEmpty()) {
            return [
                'average_rating' => 0,
                'total_reviews' => 0,
                'score' => 50 // Default neutral score
            ];
        }

        $averageRating = $reviews->avg('quality_rating');
        $totalReviews = $reviews->count();

        // Convert 5-star rating to 100-point score
        $score = ($averageRating / 5) * 100;

        return [
            'average_rating' => round($averageRating, 2),
            'total_reviews' => $totalReviews,
            'score' => round($score, 2)
        ];
    }

    /**
     * Calculate cost competitiveness
     */
    private function calculateCostCompetitiveness($orders): array
    {
        $vendorCosts = $orders->pluck('vendor_cost')->filter();
        
        if ($vendorCosts->isEmpty()) {
            return [
                'average_cost' => 0,
                'cost_trend' => 'stable',
                'score' => 50 // Neutral score
            ];
        }

        $averageCost = $vendorCosts->avg();
        
        // Get market average (you can implement this based on your business logic)
        $marketAverage = $this->getMarketAverageCost();
        
        // Calculate competitiveness (lower cost = higher score)
        $competitivenessRatio = $marketAverage > 0 ? ($marketAverage - $averageCost) / $marketAverage : 0;
        $score = min(100, max(0, 50 + ($competitivenessRatio * 50))); // 50 is neutral

        // Calculate cost trend
        $recentCosts = $vendorCosts->take(-5); // Last 5 orders
        $olderCosts = $vendorCosts->slice(-10, 5); // 5 orders before that
        
        $costTrend = 'stable';
        if ($recentCosts->avg() > $olderCosts->avg() * 1.1) {
            $costTrend = 'increasing';
        } elseif ($recentCosts->avg() < $olderCosts->avg() * 0.9) {
            $costTrend = 'decreasing';
        }

        return [
            'average_cost' => round($averageCost, 2),
            'market_comparison' => $competitivenessRatio > 0 ? 'below_market' : 'above_market',
            'cost_trend' => $costTrend,
            'score' => round($score, 2)
        ];
    }

    /**
     * Calculate communication responsiveness
     */
    private function calculateCommunicationMetrics(int $vendorId): array
    {
        // Get vendor negotiations data
        $negotiations = DB::table('vendor_negotiations')
                         ->where('vendor_id', $vendorId)
                         ->whereNotNull('responded_at')
                         ->get();

        if ($negotiations->isEmpty()) {
            return [
                'average_response_time' => 0,
                'response_rate' => 0,
                'score' => 50 // Neutral score
            ];
        }

        $responseTimes = [];
        foreach ($negotiations as $negotiation) {
            $sent = Carbon::parse($negotiation->sent_at);
            $responded = Carbon::parse($negotiation->responded_at);
            $responseTimes[] = $sent->diffInHours($responded);
        }

        $averageResponseTime = collect($responseTimes)->avg();
        $responseRate = 100; // Since we only have negotiations with responses

        // Score calculation (faster response = higher score)
        $score = min(100, max(0, 100 - ($averageResponseTime * 2))); // Penalize each hour by 2 points

        return [
            'average_response_time' => round($averageResponseTime, 2),
            'response_rate' => $responseRate,
            'total_negotiations' => $negotiations->count(),
            'score' => round($score, 2)
        ];
    }

    /**
     * Calculate reliability metrics
     */
    private function calculateReliabilityMetrics($orders): array
    {
        $totalOrders = $orders->count();
        $completedOrders = $orders->where('status', 'completed')->count();
        $cancelledOrders = $orders->where('status', 'cancelled')->count();
        
        $completionRate = $totalOrders > 0 ? ($completedOrders / $totalOrders) * 100 : 0;
        $cancellationRate = $totalOrders > 0 ? ($cancelledOrders / $totalOrders) * 100 : 0;

        // Score based on completion rate
        $score = $completionRate;

        return [
            'completion_rate' => round($completionRate, 2),
            'cancellation_rate' => round($cancellationRate, 2),
            'total_orders' => $totalOrders,
            'score' => round($score, 2)
        ];
    }

    /**
     * Calculate overall performance score (weighted average)
     */
    private function calculateOverallScore(array $metrics): float
    {
        $weights = [
            'delivery' => 0.30,      // 30% weight
            'quality' => 0.25,       // 25% weight
            'cost' => 0.20,          // 20% weight
            'communication' => 0.15,  // 15% weight
            'reliability' => 0.10     // 10% weight
        ];

        $weightedScore = 0;
        foreach ($weights as $metric => $weight) {
            $weightedScore += $metrics[$metric]['score'] * $weight;
        }

        return round($weightedScore, 2);
    }

    /**
     * Update vendor rating in database
     */
    private function updateVendorRating(Vendor $vendor, float $overallScore): void
    {
        $rating = $overallScore / 20; // Convert to 5-star rating
        
        $vendor->update([
            'rating' => round($rating, 2),
            'performance_score' => $overallScore,
            'last_performance_update' => now()
        ]);

        Log::info('Vendor performance updated', [
            'vendor_id' => $vendor->id,
            'rating' => $rating,
            'performance_score' => $overallScore
        ]);
    }

    /**
     * Get default metrics for vendors with no orders
     */
    private function getDefaultMetrics(): array
    {
        return [
            'overall_score' => 50,
            'overall_rating' => 2.5,
            'metrics' => [
                'delivery' => ['score' => 50],
                'quality' => ['score' => 50],
                'cost' => ['score' => 50],
                'communication' => ['score' => 50],
                'reliability' => ['score' => 50]
            ],
            'orders_analyzed' => 0,
            'note' => 'No completed orders to analyze'
        ];
    }

    /**
     * Get market average cost (implement based on your business logic)
     */
    private function getMarketAverageCost(): float
    {
        // This is a placeholder - implement your market research logic
        return DB::table('orders')
                ->whereNotNull('vendor_cost')
                ->avg('vendor_cost') ?? 0;
    }

    /**
     * Bulk calculate performance for multiple vendors
     */
    public function bulkCalculatePerformance(array $vendorIds): array
    {
        $results = [];
        
        foreach ($vendorIds as $vendorId) {
            try {
                $results[$vendorId] = $this->calculateVendorPerformance($vendorId);
            } catch (\Exception $e) {
                Log::error('Failed to calculate vendor performance', [
                    'vendor_id' => $vendorId,
                    'error' => $e->getMessage()
                ]);
                
                $results[$vendorId] = [
                    'error' => 'Failed to calculate performance',
                    'message' => $e->getMessage()
                ];
            }
        }

        return $results;
    }
}