<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Domain\Production\Services\ProductionPlanningService;
use App\Domain\Production\Services\ProgressTrackingSystem;
use App\Domain\Production\ValueObjects\ProgressUpdate;
use App\Domain\Order\Repositories\OrderRepositoryInterface;
use App\Domain\Shared\ValueObjects\UuidValueObject;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

/**
 * Production API Controller
 * 
 * Handles production planning, progress tracking, and monitoring endpoints.
 * Integrates with orders table for production data management.
 */
class ProductionController extends Controller
{
    public function __construct(
        private ProductionPlanningService $productionPlanningService,
        private ProgressTrackingSystem $progressTrackingSystem,
        private OrderRepositoryInterface $orderRepository
    ) {}

    /**
     * Create production plan for order
     */
    public function createProductionPlan(Request $request, string $orderId): JsonResponse
    {
        try {
            $orderUuid = new UuidValueObject($orderId);
            $order = $this->orderRepository->findById($orderUuid);
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }
            
            // Create production plan
            $productionPlan = $this->productionPlanningService->createProductionPlan($order);
            
            return response()->json([
                'success' => true,
                'message' => 'Production plan created successfully',
                'data' => [
                    'production_plan' => $productionPlan->toArray()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create production plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get production plan for order
     */
    public function getProductionPlan(string $orderId): JsonResponse
    {
        try {
            $orderUuid = new UuidValueObject($orderId);
            $order = $this->orderRepository->findById($orderUuid);
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }
            
            // Get production plan from order metadata
            $metadata = $order->getMetadata();
            
            if (!isset($metadata['production_plan'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Production plan not found for this order'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'production_plan' => $metadata['production_plan']
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve production plan',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update production progress
     */
    public function updateProgress(Request $request, string $orderId): JsonResponse
    {
        try {
            $request->validate([
                'phase' => 'nullable|string',
                'phase_progress' => 'nullable|numeric|min:0|max:1',
                'completed_milestone' => 'nullable|string',
                'quality_checkpoint_update' => 'nullable|array',
                'notes' => 'nullable|string',
                'updated_by' => 'nullable|string'
            ]);
            
            $orderUuid = new UuidValueObject($orderId);
            $order = $this->orderRepository->findById($orderUuid);
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }
            
            // Get production plan
            $metadata = $order->getMetadata();
            if (!isset($metadata['production_plan'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Production plan not found for this order'
                ], 404);
            }
            
            $productionPlan = \App\Domain\Production\ValueObjects\ProductionPlan::fromArray($metadata['production_plan']);
            
            // Create progress update
            $progressUpdate = ProgressUpdate::combined(
                phase: $request->input('phase'),
                phaseProgress: $request->input('phase_progress'),
                completedMilestone: $request->input('completed_milestone'),
                qualityCheckpointUpdate: $request->input('quality_checkpoint_update'),
                notes: $request->input('notes'),
                updatedBy: $request->input('updated_by')
            );
            
            // Update progress
            $updatedProgress = $this->progressTrackingSystem->updateProgress($productionPlan, $progressUpdate);
            
            return response()->json([
                'success' => true,
                'message' => 'Production progress updated successfully',
                'data' => [
                    'progress' => $updatedProgress->toArray()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update production progress',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get production progress
     */
    public function getProgress(string $orderId): JsonResponse
    {
        try {
            $orderUuid = new UuidValueObject($orderId);
            $order = $this->orderRepository->findById($orderUuid);
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }
            
            // Get production progress from order metadata
            $metadata = $order->getMetadata();
            
            if (!isset($metadata['production_progress'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Production progress not found for this order'
                ], 404);
            }
            
            return response()->json([
                'success' => true,
                'data' => [
                    'progress' => $metadata['production_progress']
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve production progress',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Generate progress report
     */
    public function generateProgressReport(string $orderId): JsonResponse
    {
        try {
            $orderUuid = new UuidValueObject($orderId);
            $order = $this->orderRepository->findById($orderUuid);
            
            if (!$order) {
                return response()->json([
                    'success' => false,
                    'message' => 'Order not found'
                ], 404);
            }
            
            // Get production plan
            $metadata = $order->getMetadata();
            if (!isset($metadata['production_plan'])) {
                return response()->json([
                    'success' => false,
                    'message' => 'Production plan not found for this order'
                ], 404);
            }
            
            $productionPlan = \App\Domain\Production\ValueObjects\ProductionPlan::fromArray($metadata['production_plan']);
            
            // Generate progress report
            $progressReport = $this->progressTrackingSystem->generateProgressReport($productionPlan);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'progress_report' => $progressReport->toArray()
                ]
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to generate progress report',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get production dashboard data
     */
    public function getDashboard(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->user()->tenant_id;
            
            // Get active production orders
            $activeOrders = $this->orderRepository->findByTenantAndStatus(
                new UuidValueObject($tenantId),
                ['in_production', 'processing']
            );
            
            $dashboardData = [
                'active_productions' => count($activeOrders),
                'production_summary' => [],
                'recent_milestones' => [],
                'critical_issues' => [],
                'resource_utilization' => [
                    'overall' => 0.85,
                    'equipment' => 0.78,
                    'labor' => 0.82,
                    'materials' => 0.90
                ],
                'quality_metrics' => [
                    'overall_score' => 0.92,
                    'defect_rate' => 0.03,
                    'on_time_delivery' => 0.95
                ]
            ];
            
            // Process each active order
            foreach ($activeOrders as $order) {
                $metadata = $order->getMetadata();
                
                if (isset($metadata['production_progress'])) {
                    $progress = $metadata['production_progress'];
                    
                    $dashboardData['production_summary'][] = [
                        'order_id' => $order->getId()->getValue(),
                        'customer_name' => $order->getCustomer()?->getName() ?? 'Unknown',
                        'progress_percentage' => (int) round($progress['overall_progress'] * 100),
                        'current_phase' => $progress['current_phase'],
                        'status' => $progress['status_label'] ?? 'in_progress',
                        'estimated_completion' => $order->getEstimatedDelivery()->format('Y-m-d')
                    ];
                }
            }
            
            return response()->json([
                'success' => true,
                'data' => $dashboardData
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve production dashboard',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get production analytics
     */
    public function getAnalytics(Request $request): JsonResponse
    {
        try {
            $tenantId = $request->user()->tenant_id;
            $period = $request->input('period', '30'); // Default 30 days
            
            $startDate = now()->subDays((int) $period);
            $endDate = now();
            
            // Get orders for the period
            $orders = $this->orderRepository->findByTenantAndDateRange(
                new UuidValueObject($tenantId),
                $startDate,
                $endDate
            );
            
            $analytics = [
                'period' => [
                    'start' => $startDate->format('Y-m-d'),
                    'end' => $endDate->format('Y-m-d'),
                    'days' => $period
                ],
                'production_metrics' => [
                    'total_orders' => count($orders),
                    'completed_orders' => count(array_filter($orders, fn($o) => $o->getStatus()->getValue() === 'completed')),
                    'average_completion_time' => $this->calculateAverageCompletionTime($orders),
                    'on_time_delivery_rate' => $this->calculateOnTimeDeliveryRate($orders)
                ],
                'efficiency_metrics' => [
                    'production_efficiency' => 0.85,
                    'resource_utilization' => 0.78,
                    'quality_score' => 0.92,
                    'cost_efficiency' => 0.88
                ],
                'trends' => [
                    'order_volume_trend' => $this->calculateOrderVolumeTrend($orders),
                    'completion_time_trend' => $this->calculateCompletionTimeTrend($orders),
                    'quality_trend' => $this->calculateQualityTrend($orders)
                ]
            ];
            
            return response()->json([
                'success' => true,
                'data' => $analytics
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve production analytics',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    // Helper methods for analytics calculations
    private function calculateAverageCompletionTime(array $orders): float
    {
        $completedOrders = array_filter($orders, fn($o) => $o->getStatus()->getValue() === 'completed');
        
        if (empty($completedOrders)) {
            return 0;
        }
        
        $totalTime = 0;
        foreach ($completedOrders as $order) {
            if ($order->getCompletedAt()) {
                $totalTime += $order->getCreatedAt()->diff($order->getCompletedAt())->days;
            }
        }
        
        return $totalTime / count($completedOrders);
    }

    private function calculateOnTimeDeliveryRate(array $orders): float
    {
        $completedOrders = array_filter($orders, fn($o) => $o->getStatus()->getValue() === 'completed');
        
        if (empty($completedOrders)) {
            return 0;
        }
        
        $onTimeDeliveries = 0;
        foreach ($completedOrders as $order) {
            if ($order->getCompletedAt() && $order->getCompletedAt() <= $order->getEstimatedDelivery()) {
                $onTimeDeliveries++;
            }
        }
        
        return $onTimeDeliveries / count($completedOrders);
    }

    private function calculateOrderVolumeTrend(array $orders): array
    {
        // Group orders by week and calculate trend
        $weeklyOrders = [];
        foreach ($orders as $order) {
            $week = $order->getCreatedAt()->format('Y-W');
            $weeklyOrders[$week] = ($weeklyOrders[$week] ?? 0) + 1;
        }
        
        return $weeklyOrders;
    }

    private function calculateCompletionTimeTrend(array $orders): array
    {
        // Calculate weekly average completion times
        $weeklyCompletionTimes = [];
        $completedOrders = array_filter($orders, fn($o) => $o->getStatus()->getValue() === 'completed');
        
        foreach ($completedOrders as $order) {
            if ($order->getCompletedAt()) {
                $week = $order->getCompletedAt()->format('Y-W');
                $completionTime = $order->getCreatedAt()->diff($order->getCompletedAt())->days;
                
                if (!isset($weeklyCompletionTimes[$week])) {
                    $weeklyCompletionTimes[$week] = [];
                }
                $weeklyCompletionTimes[$week][] = $completionTime;
            }
        }
        
        // Calculate averages
        $averages = [];
        foreach ($weeklyCompletionTimes as $week => $times) {
            $averages[$week] = array_sum($times) / count($times);
        }
        
        return $averages;
    }

    private function calculateQualityTrend(array $orders): array
    {
        // Simulate quality trend based on order completion and metadata
        $weeklyQuality = [];
        $completedOrders = array_filter($orders, fn($o) => $o->getStatus()->getValue() === 'completed');
        
        foreach ($completedOrders as $order) {
            if ($order->getCompletedAt()) {
                $week = $order->getCompletedAt()->format('Y-W');
                $metadata = $order->getMetadata();
                
                // Simulate quality score based on order characteristics
                $qualityScore = 0.9; // Base quality score
                
                if (isset($metadata['quality_issues']) && $metadata['quality_issues'] > 0) {
                    $qualityScore -= 0.1;
                }
                
                if (!isset($weeklyQuality[$week])) {
                    $weeklyQuality[$week] = [];
                }
                $weeklyQuality[$week][] = $qualityScore;
            }
        }
        
        // Calculate averages
        $averages = [];
        foreach ($weeklyQuality as $week => $scores) {
            $averages[$week] = array_sum($scores) / count($scores);
        }
        
        return $averages;
    }
}